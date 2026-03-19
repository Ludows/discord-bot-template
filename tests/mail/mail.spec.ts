import { beforeEach, describe, expect, it, vi } from "vitest";
import { Mail } from "../../src/mail/Mail";
import { LogTransport } from "../../src/mail/transports/LogTransport";
import { TestMail } from "./TestMail";

// Mock LogTransport to verify calls
vi.mock("../../src/mail/transports/LogTransport", () => {
  return {
    LogTransport: vi.fn().mockImplementation(() => {
      return {
        send: vi.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

describe("Mail System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send a mailable correctly", async () => {
    const mailable = new TestMail("John");
    await Mail.to("recipient@example.com").send(mailable);

    const logTransportInstance = vi.mocked(LogTransport).mock.results[0].value;
    expect(logTransportInstance.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.arrayContaining([
          "recipient@example.com",
          "test@example.com",
        ]),
        subject: "Hello from TrumpBot",
        html: "<h1>Hello John</h1><p>This is a test email.</p>",
        attachments: expect.arrayContaining([
          expect.objectContaining({ filename: "test.txt" }),
        ]),
      }),
    );
  });

  it("should respect mailable-specific from address", async () => {
    class CustomFromMail extends TestMail {
      public build(): void {
        super.build();
        this.from("custom@example.com", "Custom Sender");
      }
    }

    const mailable = new CustomFromMail("John");
    await Mail.send(mailable);

    const logTransportInstance = vi.mocked(LogTransport).mock.results[0].value;
    expect(logTransportInstance.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: { address: "custom@example.com", name: "Custom Sender" },
      }),
    );
  });
});
