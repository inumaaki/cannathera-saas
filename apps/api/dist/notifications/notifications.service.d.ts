import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
export type NotificationEvent = {
    target: {
        userId?: string;
        orgId?: string;
    };
    kind: 'red_flag' | 'log_submitted' | 'review_due' | 'stock_low' | 'appointment' | 'report_ready';
    severity: 'info' | 'warning' | 'critical';
    title: string;
    text: string;
    href: string;
    at: string;
};
type Frame = {
    data: NotificationEvent | {
        type: 'ping';
    };
};
export declare class NotificationsService {
    private readonly prisma;
    private readonly logger;
    private readonly events$;
    constructor(prisma: PrismaService);
    publish(event: Omit<NotificationEvent, 'at'>): void;
    stream(userId: string): Promise<Observable<Frame>>;
}
export {};
