import { Module, Logger } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TemplateMailerService } from './template-mailer.service';

@Module({
  imports: [
    ConfigModule,
  ],
  providers: [
    {
      provide: 'MAIL_CONFIG_WARNING',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('SMTP_HOST');
        const user = configService.get<string>('SMTP_USER');
        const pass = configService.get<string>('SMTP_PASSWORD');

        if (!host || !user || !pass) {
          Logger.warn(
            'SMTP configuration incomplete. Email sending will fail! ' +
              'Login and password reset (apply) are unaffected, but ' +
              'forgot-password requests will return an error and invite/notification ' +
              'emails will be dropped or queued to failed_emails. ' +
              'See README.md > "Comportamento de e-mail (SMTP) em desenvolvimento" ' +
              'to set up Ethereal for local testing.',
            'MailModule',
          );
        }
      },
    },
    TemplateMailerService,
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
