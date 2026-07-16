"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsService = exports.WEBHOOK_EVENTS = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const access_1 = require("./access");
exports.WEBHOOK_EVENTS = [
    'patient.created',
    'report.finalized',
    'alert.triggered',
    'session.updated',
];
const SCOPES = ['READ', 'WRITE', 'ALL_ACCESS'];
let IntegrationsService = class IntegrationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async orgOf(userId) {
        return (await (0, access_1.membershipOf)(this.prisma, userId)).org;
    }
    async orgOfAdmin(userId, permission) {
        return (await (0, access_1.requirePermission)(this.prisma, userId, permission)).org;
    }
    hash(key) {
        return (0, crypto_1.createHash)('sha256').update(key).digest('hex');
    }
    async listKeys(userId) {
        const org = await this.orgOf(userId);
        const keys = await this.prisma.apiKey.findMany({
            where: { orgId: org.id },
            orderBy: { createdAt: 'desc' },
        });
        return keys.map((k) => ({
            id: k.id,
            name: k.name,
            masked: `${k.prefix}····${k.last4}`,
            scopes: k.scopes,
            createdAt: k.createdAt,
            lastUsedAt: k.lastUsedAt,
            revoked: !!k.revokedAt,
        }));
    }
    async createKey(userId, name, scopes, live = true) {
        const org = await this.orgOfAdmin(userId, 'keys:manage');
        const valid = scopes.filter((s) => SCOPES.includes(s));
        if (valid.length === 0)
            throw new common_1.ConflictException('INVALID_SCOPES');
        const prefix = live ? 'sk_live_' : 'sk_test_';
        const secret = (0, crypto_1.randomBytes)(24).toString('base64url');
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
    async revokeKey(userId, keyId) {
        const org = await this.orgOfAdmin(userId, 'keys:manage');
        const key = await this.prisma.apiKey.findFirst({
            where: { id: keyId, orgId: org.id },
        });
        if (!key)
            throw new common_1.NotFoundException('KEY_NOT_FOUND');
        if (key.revokedAt)
            throw new common_1.ConflictException('ALREADY_REVOKED');
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
    async verifyKey(plaintext) {
        const hash = this.hash(plaintext);
        const key = await this.prisma.apiKey.findFirst({
            where: { keyHash: hash, revokedAt: null },
            include: { org: true },
        });
        if (!key)
            return null;
        const a = Buffer.from(key.keyHash);
        const b = Buffer.from(hash);
        if (a.length !== b.length || !(0, crypto_1.timingSafeEqual)(a, b))
            return null;
        await this.prisma.apiKey.update({
            where: { id: key.id },
            data: { lastUsedAt: new Date() },
        });
        return { orgId: key.orgId, scopes: key.scopes };
    }
    async listWebhooks(userId) {
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
    async createWebhook(userId, url, events) {
        const org = await this.orgOfAdmin(userId, 'webhooks:manage');
        const valid = events.filter((e) => exports.WEBHOOK_EVENTS.includes(e));
        if (valid.length === 0)
            throw new common_1.ConflictException('INVALID_EVENTS');
        const hook = await this.prisma.webhookEndpoint.create({
            data: {
                orgId: org.id,
                url,
                events: valid,
                secret: `whsec_${(0, crypto_1.randomBytes)(16).toString('base64url')}`,
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
        return { id: hook.id, url: hook.url, events: hook.events, secret: hook.secret };
    }
    async toggleWebhook(userId, id, active) {
        const org = await this.orgOfAdmin(userId, 'webhooks:manage');
        const hook = await this.prisma.webhookEndpoint.findFirst({
            where: { id, orgId: org.id },
        });
        if (!hook)
            throw new common_1.NotFoundException('WEBHOOK_NOT_FOUND');
        return this.prisma.webhookEndpoint.update({
            where: { id },
            data: { active },
        });
    }
    async deleteWebhook(userId, id) {
        const org = await this.orgOfAdmin(userId, 'webhooks:manage');
        const hook = await this.prisma.webhookEndpoint.findFirst({
            where: { id, orgId: org.id },
        });
        if (!hook)
            throw new common_1.NotFoundException('WEBHOOK_NOT_FOUND');
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
    async deliveries(userId, limit = 25) {
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
    async retry(userId, deliveryId) {
        const org = await this.orgOfAdmin(userId, 'webhooks:manage');
        const delivery = await this.prisma.webhookDelivery.findFirst({
            where: { id: deliveryId, endpoint: { orgId: org.id } },
            include: { endpoint: true },
        });
        if (!delivery)
            throw new common_1.NotFoundException('DELIVERY_NOT_FOUND');
        const result = await this.send(delivery.endpoint.url, delivery.endpoint.secret, delivery.event, delivery.payload);
        return this.prisma.webhookDelivery.update({
            where: { id: deliveryId },
            data: {
                ...result,
                attempts: { increment: 1 },
                deliveredAt: result.ok ? new Date() : null,
            },
        });
    }
    async send(url, secret, event, payload) {
        const body = JSON.stringify({ event, data: payload, sentAt: new Date() });
        const signature = (0, crypto_1.createHash)('sha256').update(`${secret}.${body}`).digest('hex');
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
        }
        catch (e) {
            return {
                ok: false,
                statusCode: null,
                error: e instanceof Error ? e.message : 'REQUEST_FAILED',
            };
        }
    }
    async dispatch(orgIds, event, payload) {
        const ids = [...new Set(orgIds.filter(Boolean))];
        if (ids.length === 0)
            return;
        const orgs = await this.prisma.organization.findMany({
            where: { id: { in: ids } },
            select: { id: true, parentOrgId: true },
        });
        const targets = [
            ...new Set([
                ...ids,
                ...orgs.map((o) => o.parentOrgId).filter((x) => !!x),
            ]),
        ];
        const hooks = await this.prisma.webhookEndpoint.findMany({
            where: { orgId: { in: targets }, active: true, events: { has: event } },
        });
        await Promise.all(hooks.map(async (h) => {
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
        }));
    }
    async status(userId) {
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
            ? Math.round((deliveries.filter((d) => d.ok).length / deliveries.length) * 1000) / 10
            : null;
        const teleSessions = await this.prisma.telemedicineSession.count({
            where: {
                patient: org.type === client_1.OrgType.ENTERPRISE
                    ? { OR: [{ org: { parentOrgId: org.id } }, { pharmacy: { parentOrgId: org.id } }] }
                    : { OR: [{ orgId: org.id }, { pharmacyId: org.id }] },
            },
        });
        return {
            zoom: { status: 'planned', sessions: teleSessions },
            zapier: { status: hooks > 0 ? 'connected' : 'inactive', hooks },
            webhooks: { status: hooks > 0 ? 'active' : 'inactive', active: hooks, successRate },
            restApi: { status: 'operational', version: 'v1', activeKeys: keys },
        };
    }
};
exports.IntegrationsService = IntegrationsService;
exports.IntegrationsService = IntegrationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IntegrationsService);
//# sourceMappingURL=integrations.service.js.map