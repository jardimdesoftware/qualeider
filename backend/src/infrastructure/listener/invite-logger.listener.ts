
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InviteCreatedEvent } from '@/events/invite-created.event';
import { InviteAcceptedEvent } from '@/events/invite-accepted.event';
import { InviteDeclinedEvent } from '@/events/invite-declined.event';

@Injectable()
export class InviteLoggerListener {
  private readonly logger = new Logger(InviteLoggerListener.name);

  @OnEvent('invite.created')
  handleInviteCreatedEvent(event: InviteCreatedEvent) {
    this.logger.log(`[Event: invite.created] Invite ID: ${event.inviteId} - Association ${event.associationName} invited User ${event.userName} (${event.userEmail})`);
    // Here we could also persist to a specialized log table if needed, but console log is requested.
  }

  @OnEvent('invite.accepted')
  handleInviteAcceptedEvent(event: InviteAcceptedEvent) {
    this.logger.log(`[Event: invite.accepted] Invite ID: ${event.inviteId} - User ${event.userName} ACCEPTED invitation from ${event.associationName}`);
  }

  @OnEvent('invite.declined')
  handleInviteDeclinedEvent(event: InviteDeclinedEvent) {
    this.logger.log(`[Event: invite.declined] Invite ID: ${event.inviteId} - User ${event.userName} DECLINED invitation from ${event.associationName}`);
  }
}
