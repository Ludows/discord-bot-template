import { config } from "../config";
import { Mailable } from "./Mailable";
import { LogTransport } from "./transports/LogTransport";
import { SmtpTransport } from "./transports/SmtpTransport";
import { MailDetails, Transport } from "./transports/Transport";

export class Mailer {
  private transport: Transport;
  private toAddresses: string[] = [];

  constructor() {
    this.transport = this.resolveTransport();
  }

  private resolveTransport(): Transport {
    const defaultMailer = config.mail.default;
    const mailerConfig = (config.mail.mailers as any)[defaultMailer];

    if (defaultMailer === "smtp") {
      return new SmtpTransport(mailerConfig);
    }

    return new LogTransport();
  }

  /**
   * Set the recipients of the message.
   */
  public to(address: string | string[]): this {
    if (Array.isArray(address)) {
      this.toAddresses.push(...address);
    } else {
      this.toAddresses.push(address);
    }
    return this;
  }

  /**
   * Send the given mailable.
   */
  public async send(mailable: Mailable): Promise<void> {
    mailable.build();

    // Merge global "to" with mailable "to"
    const recipients = [
      ...new Set([...this.toAddresses, ...mailable.toAddresses]),
    ];

    if (recipients.length === 0) {
      throw new Error("No recipients defined for email.");
    }

    const details: MailDetails = {
      from: mailable.fromAddress || {
        address: config.mail.from.address,
        name: config.mail.from.name,
      },
      to: recipients,
      subject: mailable.subjectLine,
      html: mailable.htmlContent,
      text: mailable.textContent,
      attachments: mailable.attachmentsList,
    };

    await this.transport.send(details);
  }
}

// Export a static-friendly Mail facade
export const Mail = {
  to(address: string | string[]): Mailer {
    return new Mailer().to(address);
  },

  async send(mailable: Mailable): Promise<void> {
    return new Mailer().send(mailable);
  },
};
