import { Controller, Sse, UseGuards } from '@nestjs/common';
import { CurrentUser, SessionGuard } from '../auth/auth.guard';
import type { SessionPayload } from '../auth/auth.service';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(SessionGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** Live notification stream (Server-Sent Events). Auth via the session cookie. */
  @Sse('stream')
  stream(@CurrentUser() user: SessionPayload) {
    return this.notifications.stream(user.sub);
  }
}
