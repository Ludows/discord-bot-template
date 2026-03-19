import { MailDetails, Transport } from "./Transport";

export class LogTransport implements Transport {
  async send(details: MailDetails): Promise<void> {
    console.log("------------------------------------------");
    console.log("MAIL LOG TRANSPORT");
    console.log(`From: ${details.from.name} <${details.from.address}>`);
    console.log(`To: ${details.to.join(", ")}`);
    console.log(`Subject: ${details.subject}`);
    console.log(`Body (HTML): ${details.html?.substring(0, 100)}...`);
    console.log(`Body (Text): ${details.text?.substring(0, 100)}...`);
    if (details.attachments && details.attachments.length > 0) {
      console.log(
        `Attachments: ${details.attachments.map((a) => a.filename).join(", ")}`,
      );
    }
    console.log("------------------------------------------");
  }
}
