import { Module, Logger } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('SMTP_HOST');
        const port = configService.get<number>('SMTP_PORT', 587);
        const user = configService.get<string>('SMTP_USER');
        const pass = configService.get<string>('SMTP_PASSWORD');
        const from = configService.get<string>('SMTP_FROM') || user;

        if (!host || !user || !pass) {
          Logger.warn(
            'SMTP configuration incomplete. Email sending will fail!',
            'MailModule',
          );
        }

        return {
          transport: {
            host,
            port,
            secure: false,
            auth: {
              user,
              pass,
            },
          },
          defaults: {
            from: `"Equipe de Suporte - QualeiDer" <${from}>`,
          },
          template: {
            dir: join(process.cwd(), 'src', 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
