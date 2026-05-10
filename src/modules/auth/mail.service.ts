import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  async sendVerificationEmail(
    to: string,
    token: string,
  ) {
    const transporter =
      nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

    const verifyLink =
      `http://localhost:3000/auth/verify-email/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Verify your email',
      html: `
        <h2>Xác thực email</h2>
        <a href="${verifyLink}">
          Click để xác thực
        </a>
      `,
    });
  }
}