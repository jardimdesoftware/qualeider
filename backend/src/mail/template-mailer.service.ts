import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import { join } from 'path';
import { Transporter } from 'nodemailer';

export interface TemplateMailOptions {
  to: string;
  subject: string;
  template: string;
  context?: Record<string, any>;
}

@Injectable()
export class TemplateMailerService {
  private readonly transporter: Transporter;
  private readonly defaultFrom: string;
  private readonly templates = new Map<string, handlebars.TemplateDelegate>();

  constructor(configService: ConfigService) {
    const host = configService.get<string>('SMTP_HOST');
    const port = configService.get<number>('SMTP_PORT', 587);
    const user = configService.get<string>('SMTP_USER');
    const pass = configService.get<string>('SMTP_PASSWORD');
    const from = configService.get<string>('SMTP_FROM') || user || 'noreply@qualeider.test';

    this.defaultFrom = `"Equipe de Suporte - QualeiDer" <${from}>`;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendMail(options: TemplateMailOptions): Promise<unknown> {
    const html = await this.renderTemplate(options.template, options.context || {});

    return this.transporter.sendMail({
      to: options.to,
      subject: options.subject,
      from: this.defaultFrom,
      html,
    });
  }

  private async renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ): Promise<string> {
    const template = await this.getTemplate(templateName);
    return template(context);
  }

  private async getTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
    const cached = this.templates.get(templateName);
    if (cached) return cached;

    const filePath = join(process.cwd(), 'src', 'templates', `${templateName}.hbs`);
    const source = await fs.readFile(filePath, 'utf8');
    const compiled = handlebars.compile(source, { strict: true });
    this.templates.set(templateName, compiled);
    return compiled;
  }
}
