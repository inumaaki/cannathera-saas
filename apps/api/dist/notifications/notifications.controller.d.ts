import type { SessionPayload } from '../auth/auth.service';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    stream(user: SessionPayload): Promise<import("rxjs").Observable<{
        data: import("./notifications.service").NotificationEvent | {
            type: "ping";
        };
    }>>;
}
