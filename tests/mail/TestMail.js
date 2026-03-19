"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestMail = void 0;
const Mailable_1 = require("../src/mail/Mailable");
class TestMail extends Mailable_1.Mailable {
    name;
    constructor(name) {
        super();
        this.name = name;
    }
    build() {
        this.subject("Hello from TrumpBot")
            .to("test@example.com")
            .html(`<h1>Hello ${this.name}</h1><p>This is a test email.</p>`)
            .text(`Hello ${this.name}, this is a test email.`)
            .attach("test.txt", Buffer.from("Hello World"), "text/plain");
    }
}
exports.TestMail = TestMail;
