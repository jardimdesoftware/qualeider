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
            'SMTP configuration incomplete. Email sending will fail! ' +
              'Login and password reset (apply) are unaffected, but ' +
              'forgot-password requests will return an error and invite/notification ' +
              'emails will be dropped or queued to failed_emails. ' +
              'See README.md > "Comportamento de e-mail (SMTP) em desenvolvimento" ' +
              'to set up Ethereal for local testing.',
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
            // Relativo ao arquivo compilado (dist/src/mail/mail.module.js —
            // o tsconfig preserva o prefixo src/ dentro de dist/), nao ao cwd:
            // o nest-cli copia src/templates para dist/templates (sem o
            // prefixo src/) no build (nest-cli.json > compilerOptions.assets),
            // mas a imagem Docker de producao so contem dist/ —
            // process.cwd() + 'src/templates' nunca existe la, apenas em dev
            // via ts-node a partir da raiz do repo.
            dir: join(__dirname, '..', '..', 'templates'),
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
