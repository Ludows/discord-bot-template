import { Attachment } from "./transports/Transport";

export abstract class Mailable {
  public subjectLine: string = "";
  public toAddresses: string[] = [];
  public fromAddress?: { address: string; name: string };
  public htmlContent?: string;
  public textContent?: string;
  public attachmentsList: Attachment[] = [];

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
   * Set the subject of the message.
   */
  public subject(subject: string): this {
    this.subjectLine = subject;
    return this;
  }

  /**
   * Set the sender of the message.
   */
  public from(address: string, name: string): this {
    this.fromAddress = { address, name };
    return this;
  }

  /**
   * Set the HTML content of the message.
   */
  public html(html: string): this {
    this.htmlContent = html;
    return this;
  }

  /**
   * Set the plain text content of the message.
   */
  public text(text: string): this {
    this.textContent = text;
    return this;
  }

  /**
   * Attach a file to the message.
   */
  public attach(
    filename: string,
    content: string | Buffer,
    contentType?: string,
  ): this {
    this.attachmentsList.push({ filename, content, contentType });
    return this;
  }

  /**
   * Build the mailable. This method should be overridden by subclasses
   * to define the email's content using the fluent methods.
   */
  public abstract build(): void;
}
