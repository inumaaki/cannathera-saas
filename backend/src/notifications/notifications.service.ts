import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

export type NotificationEvent = {
  /** Who should receive it: one user, or every member of an organisation. */
  target: { userId?: string; orgId?: string };
  kind:
    | 'red_flag'
    | 'log_submitted'
    | 'review_due'
    | 'stock_low'
    | 'appointment'
    | 'report_ready';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  text: string;
  href: string;
  at: string;
};

/** What the browser receives (Nest wraps this into an SSE `data:` frame). */
type Frame = { data: NotificationEvent | { type: 'ping' } };

const HEARTBEAT_MS = 25_000;

/**
 * In-process event bus for live notifications (SSE).
 *
 * Single-instance only: an event published on API node A is not seen by a client
 * connected to node B. Fine for the pilot; when the API scales past one instance
 * on AWS, swap this Subject for Redis pub/sub — `publish()` and `stream()` keep
 * the same shape, so nothing else changes.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly events$ = new Subject<NotificationEvent>();

  constructor(private readonly prisma: PrismaService) {}

  publish(event: Omit<NotificationEvent, 'at'>) {
    this.events$.next({ ...event, at: new Date().toISOString() });
  }

  /**
   * Live stream for one connected user. Delivers ONLY events addressed to them
   * personally or to their organisation — a doctor must never receive another
   * practice's alerts over the stream.
   */
  async stream(userId: string): Promise<Observable<Frame>> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    const orgId = membership?.orgId ?? null;

    const isForMe = (e: NotificationEvent) =>
      (!!e.target.userId && e.target.userId === userId) ||
      (!!e.target.orgId && !!orgId && e.target.orgId === orgId);

    return new Observable<Frame>((subscriber) => {
      // A heartbeat stops proxies closing an idle connection and lets the client
      // tell "connected" apart from "silently dead".
      const beat = setInterval(
        () => subscriber.next({ data: { type: 'ping' } }),
        HEARTBEAT_MS,
      );

      const sub = this.events$.subscribe((event) => {
        if (isForMe(event)) subscriber.next({ data: event });
      });

      return () => {
        clearInterval(beat);
        sub.unsubscribe();
        this.logger.debug(`SSE closed for ${userId}`);
      };
    });
  }
}
