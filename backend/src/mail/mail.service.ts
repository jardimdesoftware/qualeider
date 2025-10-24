import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
  }

  async sendResetPasswordEmail(
    to: string,
    resetToken: string,
    userName: string,
    metadata?: {
      expiryDate?: Date;
      location?: string;
      device?: string;
      browser?: string;
      ipAddress?: string;
    },
  ) {
    const expiryDateStr = metadata?.expiryDate
      ? metadata.expiryDate.toLocaleString('pt-BR', {
          timeZone: 'UTC',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        })
      : 'não disponível';

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject: 'Seu código de redefinição de senha',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c5f2d;">Seu código de redefinição de senha</h2>
          
          <p>Prezado(a) <strong>${userName}</strong>,</p>
          
          <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
          
          <p>Insira o código abaixo para definir uma nova senha:</p>
          
          <div style="background-color: #f5f5f5; border-left: 4px solid #2c5f2d; padding: 15px; margin: 20px 0; text-align: center;">
            <h1 style="color: #2c5f2d; margin: 0; font-size: 32px; letter-spacing: 5px;">${resetToken}</h1>
          </div>
          
          <p style="color: #d9534f;"><strong>Este código é válido por 15 minutos.</strong></p>
          
          <p>Se você não solicitou esta alteração, por favor, ignore este e-mail. Para sua segurança, nunca compartilhe este código.</p>
          
          ${
            metadata
              ? `
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666;">
            <strong>Informações de Segurança:</strong><br>
            ${metadata.expiryDate ? `Este código expira em: <strong>${expiryDateStr}</strong><br>` : ''}
            ${metadata.location ? `Localização: ${metadata.location}<br>` : ''}
            ${metadata.device ? `Dispositivo: ${metadata.device}<br>` : ''}
            ${metadata.browser ? `Navegador: ${metadata.browser}<br>` : ''}
            ${metadata.ipAddress ? `Endereço IP: ${metadata.ipAddress}<br>` : ''}
          </p>
          `
              : ''
          }
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p>Atenciosamente,<br>
          <strong>Equipe de Suporte</strong></p>
          
          <p style="font-size: 11px; color: #999; margin-top: 30px;">
            <em>(Este e-mail é enviado automaticamente, por favor não responda.)</em>
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('E-mail de redefinição de senha enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar e-mail de redefinição de senha:', error);
    }
  }
}
