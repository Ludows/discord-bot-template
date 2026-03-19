export interface Attachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface MailDetails {
  from: { address: string; name: string };
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Attachment[];
}

export interface Transport {
  send(details: MailDetails): Promise<void>;
}
