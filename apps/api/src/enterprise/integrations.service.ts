import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrgType, Prisma } from '@prisma/client';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { membershipOf, requirePermission } from './access';

export const WEBHOOK_EVENTS = [
  'patient.created',
  'report.finalized',
  'alert.triggered',
  'session.updated',
] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

const SCOPES = ['READ', 'WRITE', 'ALL_ACCESS'] as const;

/* Figma 8.4 — Platform Connectivity: API keys, webhooks, delivery log. */
@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async orgOf(userId: string) {
    return (await membershipOf(this.prisma, userId)).org;
  }

  /** API keys and webhooks are credentials — SUPER_ADMIN only. */
  private async orgOfAdmin(userId: string, permission: string) {
    return (await requirePermission(this.prisma, userId, permission)).org;
  }

  /** Keys are stored hashed — the same way passwords are. */
  private hash(key: string) {
    return createHash('sha256').update(key).digest('hex');
  }

  // ------------------------------------------------------------- API keys ---
  async listKeys(userId: string) {
    const org = await this.orgOf(userId);
    const keys = await this.prisma.apiKey.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: 'desc' },
    });
    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      // Never the key itself — only enough to recognise it.
      masked: `${k.prefix}····${k.last4}`,
      scopes: k.scopes,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      revoked: !!k.revokedAt,
    }));
  }

  /**
   * Creates a key and returns the plaintext EXACTLY ONCE. It is never stored and
   * can never be shown again — the UI must tell the user to copy it now.
   */
  async createKey(userId: string, name: string, scopes: string[], live = true) {
    const org = await this.orgOfAdmin(userId, 'keys:manage');
    const valid = scopes.filter((s) => SCOPES.includes(s as (typeof SCOPES)[number]));
    if (valid.length === 0) throw new ConflictException('INVALID_SCOPES');

    const prefix = live ? 'sk_live_' : 'sk_test_';
    const secret = randomBytes(24).toString('base64url');
    const plaintext = `${prefix}${secret}`;

    const key = await this.prisma.apiKey.create({
      data: {
        orgId: org.id,
        name,
        prefix,
        last4: secret.slice(-4),
        keyHash: this.hash(plaintext),
        scopes: valid,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'API_KEY_CREATED',
        entityType: 'ApiKey',
        entityId: key.id,
        metadata: { name, scopes: valid },
      },
    });

    return { id: key.id, name: key.name, scopes: key.scopes, key: plaintext };
  }

  async revokeKey(userId: string, keyId: string) {
    const org = await this.orgOfAdmin(userId, 'keys:manage');
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, orgId: org.id },
    });
    if (!key) throw new NotFoundException('KEY_NOT_FOUND');
    if (key.revokedAt) throw new ConflictException('ALREADY_REVOKED');

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'API_KEY_REVOKED',
        entityType: 'ApiKey',
        entityId: keyId,
        metadata: { name: key.name },
      },
    });
    return { ok: true };
  }

  /** Resolves an incoming `Authorization: Bearer sk_...` to its organisation. */
  async verifyKey(plaintext: string) {
    const hash = this.hash(plaintext);
    const key = await this.prisma.apiKey.findFirst({
      where: { keyHash: hash, revokedAt: null },
      include: { org: true },
    });
    if (!key) return null;
    // Constant-time compare so a timing side-channel can't confirm a hash.
    const a = Buffer.from(key.keyHash);
    const b = Buffer.from(hash);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    await this.prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });
    return { orgId: key.orgId, scopes: key.scopes };
  }

  // ------------------------------------------------------------- webhooks ---
  async listWebhooks(userId: string) {
    const org = await this.orgOf(userId);
    const hooks = await this.prisma.webhookEndpoint.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: 'desc' },
      include: {
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { ok: true },
        },
      },
    });
    return hooks.map((h) => {
      const recent = h.deliveries;
      const okCount = recent.filter((d) => d.ok).length;
      return {
        id: h.id,
        url: h.url,
        events: h.events,
        active: h.active,
        createdAt: h.createdAt,
        successRate: recent.length
          ? Math.round((okCount / recent.length) * 1000) / 10
          : null,
      };
    });
  }

  async createWebhook(userId: string, url: string, events: string[]) {
    const org = await this.orgOfAdmin(userId, 'webhooks:manage');
    const valid = events.filter((e) =>
      WEBHOOK_EVENTS.includes(e as WebhookEvent),
    );
    if (valid.length === 0) throw new ConflictException('INVALID_EVENTS');

    const hook = await this.prisma.webhookEndpoint.create({
      data: {
        orgId: org.id,
        url,
        events: valid,
        secret: `whsec_${randomBytes(16).toString('base64url')}`,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'WEBHOOK_CREATED',
        entityType: 'WebhookEndpoint',
        entityId: hook.id,
        metadata: { url, events: valid },
      },
    });
    // The signing secret is shown once so the receiver can verify our signature.
    return { id: hook.id, url: hook.url, events: hook.events, secret: hook.secret };
  }

  async toggleWebhook(userId: string, id: string, active: boolean) {
    const org = await this.orgOfAdmin(userId, 'webhooks:manage');
    const hook = await this.prisma.webhookEndpoint.findFirst({
      where: { id, orgId: org.id },
    });
    if (!hook) throw new NotFoundException('WEBHOOK_NOT_FOUND');
    return this.prisma.webhookEndpoint.update({
      where: { id },
      data: { active },
    });
  }

  async deleteWebhook(userId: string, id: string) {
    const org = await this.orgOfAdmin(userId, 'webhooks:manage');
    const hook = await this.prisma.webhookEndpoint.findFirst({
      where: { id, orgId: org.id },
    });
    if (!hook) throw new NotFoundException('WEBHOOK_NOT_FOUND');
    await this.prisma.webhookEndpoint.delete({ where: { id } });
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'WEBHOOK_DELETED',
        entityType: 'WebhookEndpoint',
        entityId: id,
        metadata: { url: hook.url },
      },
    });
    return { ok: true };
  }

  /** Event Delivery Log panel. */
  async deliveries(userId: string, limit = 25) {
    const org = await this.orgOf(userId);
    const rows = await this.prisma.webhookDelivery.findMany({
      where: { endpoint: { orgId: org.id } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { endpoint: { select: { url: true } } },
    });
    return rows.map((d) => ({
      id: d.id,
      event: d.event,
      url: d.endpoint.url,
      statusCode: d.statusCode,
      ok: d.ok,
      error: d.error,
      attempts: d.attempts,
      createdAt: d.createdAt,
    }));
  }

  /** Re-send a failed delivery (the "RETRY" action in the log). */
  async retry(userId: string, deliveryId: string) {
    const org = await this.orgOfAdmin(userId, 'webhooks:manage');
    const delivery = await this.prisma.webhookDelivery.findFirst({
      where: { id: deliveryId, endpoint: { orgId: org.id } },
      include: { endpoint: true },
    });
    if (!delivery) throw new NotFoundException('DELIVERY_NOT_FOUND');

    const result = await this.send(
      delivery.endpoint.url,
      delivery.endpoint.secret,
      delivery.event,
      delivery.payload as Prisma.JsonObject,
    );
    return this.prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        ...result,
        attempts: { increment: 1 },
        deliveredAt: result.ok ? new Date() : null,
      },
    });
  }

  /** Signed POST to the receiver. Never throws — a dead endpoint must not break
      the clinical action that produced the event. */
  private async send(
    url: string,
    secret: string,
    event: string,
    payload: Prisma.JsonObject,
  ): Promise<{ ok: boolean; statusCode: number | null; error: string | null }> {
    const body = JSON.stringify({ event, data: payload, sentAt: new Date() });
    const signature = createHash('sha256').update(`${secret}.${body}`).digest('hex');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cannathera-Event': event,
          'X-Cannathera-Signature': signature,
        },
        body,
        signal: AbortSignal.timeout(8000),
      });
      return {
        ok: res.ok,
        statusCode: res.status,
        error: res.ok ? null : `HTTP ${res.status}`,
      };
    } catch (e) {
      return {
        ok: false,
        statusCode: null,
        error: e instanceof Error ? e.message : 'REQUEST_FAILED',
      };
    }
  }

  /**
   * Fan-out for a domain event. Called from clinical code (a new patient, a
   * finalised report, a red flag). Delivers to the patient's own org AND to the
   * enterprise umbrella above it, then records every attempt.
   */
  async dispatch(orgIds: string[], event: WebhookEvent, payload: Prisma.JsonObject) {
    const ids = [...new Set(orgIds.filter(Boolean))];
    if (ids.length === 0) return;

    // Include the enterprise parent of each org, so the network sees it too.
    const orgs = await this.prisma.organization.findMany({
      where: { id: { in: ids } },
      select: { id: true, parentOrgId: true },
    });
    const targets = [
      ...new Set([
        ...ids,
        ...orgs.map((o) => o.parentOrgId).filter((x): x is string => !!x),
      ]),
    ];

    const hooks = await this.prisma.webhookEndpoint.findMany({
      where: { orgId: { in: targets }, active: true, events: { has: event } },
    });

    await Promise.all(
      hooks.map(async (h) => {
        const result = await this.send(h.url, h.secret, event, payload);
        await this.prisma.webhookDelivery.create({
          data: {
            endpointId: h.id,
            event,
            payload,
            ...result,
            deliveredAt: result.ok ? new Date() : null,
          },
        });
      }),
    );
  }

  /** Integration status cards (Zoom / Zapier / Webhooks / REST API). */
  async status(userId: string) {
    const org = await this.orgOf(userId);
    const [hooks, deliveries, keys] = await Promise.all([
      this.prisma.webhookEndpoint.count({ where: { orgId: org.id, active: true } }),
      this.prisma.webhookDelivery.findMany({
        where: { endpoint: { orgId: org.id } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { ok: true },
      }),
      this.prisma.apiKey.count({ where: { orgId: org.id, revokedAt: null } }),
    ]);
    const successRate = deliveries.length
      ? Math.round(
          (deliveries.filter((d) => d.ok).length / deliveries.length) * 1000,
        ) / 10
      : null;

    const teleSessions = await this.prisma.telemedicineSession.count({
      where: {
        patient:
          org.type === OrgType.ENTERPRISE
            ? { OR: [{ org: { parentOrgId: org.id } }, { pharmacy: { parentOrgId: org.id } }] }
            : { OR: [{ orgId: org.id }, { pharmacyId: org.id }] },
      },
    });

    return {
      // Honest states — Zoom is not connected until M9 delivers real credentials.
      zoom: { status: 'planned', sessions: teleSessions },
      zapier: { status: hooks > 0 ? 'connected' : 'inactive', hooks },
      webhooks: { status: hooks > 0 ? 'active' : 'inactive', active: hooks, successRate },
      restApi: { status: 'operational', version: 'v1', activeKeys: keys },
    };
  }
}
