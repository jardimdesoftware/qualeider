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
        const user = configService.get<string>('GMAIL_USER');
        const pass = configService.get<string>('GMAIL_PASS');

        if (!user || !pass) {
          Logger.error(
            'GMAIL_USER or GMAIL_PASS not found in environment variables. Email sending will fail!',
            'MailModule',
          );
        }

        return {
          transport: {
            service: 'Gmail',
            auth: {
              user,
              pass,
            },
          },
          defaults: {
            from: `"Equipe de Suporte - QualeiDer" <${user}>`,
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
