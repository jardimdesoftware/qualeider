import { Test, TestingModule } from '@nestjs/testing';
import { InviteEmailListener } from '@/listener/invite-email.listener';
import { MailService } from '@/mail/mail.service';
import { IAssociationRepository } from '@/domain/repositories/association.repository';
import { InviteCreatedEvent } from '@/events/invite-created.event';
import { InviteAcceptedEvent } from '@/events/invite-accepted.event';
import { InviteDeclinedEvent } from '@/events/invite-declined.event';
import { AssociationEntity } from '@/domain/entities/association.entity';

describe('InviteEmailListener', () => {
  let listener: InviteEmailListener;
  let mailService: MailService;
  let associationRepository: IAssociationRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InviteEmailListener,
        {
          provide: MailService,
          useValue: {
            sendInviteEmail: jest.fn(),
            sendInviteAcceptedNotification: jest.fn(),
            sendInviteDeclinedNotification: jest.fn(),
          },
        },
        {
          provide: IAssociationRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    listener = module.get<InviteEmailListener>(InviteEmailListener);
    mailService = module.get<MailService>(MailService);
    associationRepository = module.get<IAssociationRepository>(IAssociationRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  describe('handleInviteCreated', () => {
    it('should send invite email', async () => {
      const event = new InviteCreatedEvent({
        token: 'token',
        userEmail: 'test@example.com',
        userName: 'User',
        associationName: 'Assoc',
        message: 'Msg',
        expiresAt: new Date(),
      });

      await listener.handleInviteCreated(event);

      expect(mailService.sendInviteEmail).toHaveBeenCalledWith(
        event.userEmail,
        event.userName,
        event.associationName,
        event.message,
        expect.stringContaining('accept'),
        expect.stringContaining('decline'),
        event.expiresAt,
      );
    });
  });

  describe('handleInviteAccepted', () => {
    it('should notify association on invite accepted', async () => {
      const event = new InviteAcceptedEvent({
        inviteId: 1,
        userId: 1,
        userName: 'User',
        associationId: 1,
        associationName: 'Assoc',
      });

      const association = {
        id: 1,
        email: 'assoc@example.com',
        name: 'Assoc',
      } as AssociationEntity;

      (associationRepository.findById as jest.Mock).mockResolvedValue(association);

      await listener.handleInviteAccepted(event);

      expect(associationRepository.findById).toHaveBeenCalledWith(event.associationId);
      expect(mailService.sendInviteAcceptedNotification).toHaveBeenCalledWith(
        association.email,
        association.name,
        event.userName,
        event.userId,
      );
    });
  });

  describe('handleInviteDeclined', () => {
    it('should notify association on invite declined', async () => {
      const event = new InviteDeclinedEvent({
        inviteId: 1,
        userId: 1,
        userName: 'User',
        associationId: 1,
        associationName: 'Assoc',
      });

      const association = {
        id: 1,
        email: 'assoc@example.com',
        name: 'Assoc',
      } as AssociationEntity;

      (associationRepository.findById as jest.Mock).mockResolvedValue(association);

      await listener.handleInviteDeclined(event);

      expect(associationRepository.findById).toHaveBeenCalledWith(event.associationId);
      expect(mailService.sendInviteDeclinedNotification).toHaveBeenCalledWith(
        association.email,
        association.name,
        event.userName,
      );
    });
  });
});
