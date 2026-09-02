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
    | 'report_ready'
    | 'prescription_received'
    | 'prescription_status_update'
    | 'intake_reminder';
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

  constructor(private readonly prisma: PrismaService) {
    // Start background worker for intake reminders
    setInterval(() => {
      void this.checkIntakeReminders();
    }, 60_000);
  }

  async checkIntakeReminders() {
    const now = new Date();
    // Format HH:MM in German local time, as users are mostly in Germany
    const hhmm = now.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Berlin',
    });

    try {
      // Find all patients whose reminderTimes array contains this specific HH:MM
      const patients = await this.prisma.patientProfile.findMany({
        where: { reminderTimes: { has: hhmm } },
        select: { userId: true },
      });

      for (const p of patients) {
        this.publish({
          target: { userId: p.userId },
          kind: 'intake_reminder',
          severity: 'info',
          title: 'Time for your documentation',
          text: 'It is time for your scheduled intake / documentation log.',
          href: '/patient/therapy/log',
        });
      }
    } catch (err) {
      this.logger.error('Failed to process intake reminders: ' + err);
    }
  }

  publish(event: Omit<NotificationEvent, 'at'>) {
    this.events$.next({ ...event, at: new Date().toISOString() });
  }

  notifyPharmacyNewPrescription(pharmacyId: string, prescriptionId: string) {
    this.publish({
      target: { orgId: pharmacyId },
      kind: 'prescription_received',
      severity: 'info',
      title: 'New Prescription Received',
      text: 'A patient has routed a new prescription to your pharmacy.',
      href: `/pharmacy/prescriptions?highlight=${prescriptionId}`,
    });
  }

  notifyPatientPrescriptionStatusUpdate(
    patientUserId: string,
    pharmacyName: string,
    status: string,
  ) {
    this.publish({
      target: { userId: patientUserId },
      kind: 'prescription_status_update',
      severity: 'info',
      title: 'Prescription Status Update',
      text: `Your prescription at ${pharmacyName} is now: ${status}.`,
      href: '/patient/prescriptions',
    });
  }

  /**
   * Live stream for one connected user. Delivers ONLY events addressed to them
   * personally or to their organisation — a doctor must never receive another
   * practice's alerts over the stream.
   */
  async stream(userId: string): Promise<Observable<Frame>> {
    const [membership, user] = await Promise.all([
      this.prisma.membership.findFirst({
        where: { userId },
        select: { orgId: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      }),
    ]);
    const orgId = membership?.orgId ?? null;
    const isSystemAdmin = user?.role === 'ADMIN';

    const isForMe = (e: NotificationEvent) =>
      (isSystemAdmin && e.kind === 'red_flag') ||
      (!isSystemAdmin &&
        e.kind !== 'red_flag' &&
        ((!!e.target.userId && e.target.userId === userId) ||
          (!!e.target.orgId && !!orgId && e.target.orgId === orgId)));

    return new Observable<Frame>((subscriber) => {
      // A heartbeat stops proxies closing an idle connection and lets the client
      // tell "connected" apart from "silently dead".
      const beat = setInterval(
        () => subscriber.next({ data: { type: 'ping' } }),
        HEARTBEAT_MS,
      );

      const sub = this.events$.subscribe((event) => {
        if (isForMe(event)) {
          subscriber.next({
            data:
              isSystemAdmin && event.kind === 'red_flag'
                ? { ...event, href: '/admin?tab=redflags' }
                : event,
          });
        }
      });

      return () => {
        clearInterval(beat);
        sub.unsubscribe();
        this.logger.debug(`SSE closed for ${userId}`);
      };
    });
  }
}
