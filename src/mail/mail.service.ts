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

  async sendResetPasswordEmail(to: string, resetToken: string) {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject: 'Recuperação de Senha',
      html: `
        <p>Prezado(a)! Esse e-mail é enviado automaticamente, por favor não responda.</p>

        <p>Esqueceu a senha? Utilize esse Token: 👉<strong>${resetToken}</strong>👈</p>

        <h3>Dicas</h3>
        <ul>
          <li>O token tem um prazo de quinze (15) minutos para ser utilizado. Sendo ultrapassado, será necessário fazer uma nova solicitação 🕑</li>
          <li>Para alterar a senha, insira o token recebido no campo código no formulário 📜</li>
          <li>Sua senha é pessoal e não pode ser compartilhada 🤫</li>
        </ul>

        <p>Atenciosamente,</p>
        <p>Equipe de suporte 💻</p>
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