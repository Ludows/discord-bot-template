import { Mailable } from "../src/mail/Mailable";

export class TestMail extends Mailable {
  constructor(private name: string) {
    super();
  }

  public build(): void {
    this.subject("Hello from TrumpBot")
      .to("test@example.com")
      .html(`<h1>Hello ${this.name}</h1><p>This is a test email.</p>`)
      .text(`Hello ${this.name}, this is a test email.`)
      .attach("test.txt", Buffer.from("Hello World"), "text/plain");
  }
}
