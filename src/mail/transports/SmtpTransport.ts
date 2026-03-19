import nodemailer from "nodemailer";
import { MailDetails, Transport } from "./Transport";

export class SmtpTransport implements Transport {
  private transporter: nodemailer.Transporter;

  constructor(config: {
    host: string;
    port: number;
    user: string;
    pass: string;
  }) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  async send(details: MailDetails): Promise<void> {
    await this.transporter.sendMail({
      from: `"${details.from.name}" <${details.from.address}>`,
      to: details.to.join(", "),
      subject: details.subject,
      text: details.text,
      html: details.html,
      attachments: details.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });
  }
}
