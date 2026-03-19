import cron from "node-cron";
import { Process } from "../utils/Process";
import { logger } from "../utils/logger";

export class Event {
  private cronExpression: string = "* * * * *";
  private commandSignature: string;
  private commandArgs: string[];

  constructor(signature: string, args: string[] = []) {
    this.commandSignature = signature;
    this.commandArgs = args;
  }

  public cron(expression: string): this {
    this.cronExpression = expression;
    return this;
  }

  public everyMinute(): this {
    return this.cron("* * * * *");
  }

  public everyFiveMinutes(): this {
    return this.cron("*/5 * * * *");
  }

  public hourly(): this {
    return this.cron("0 * * * *");
  }

  public daily(): this {
    return this.cron("0 0 * * *");
  }

  public weekly(): this {
    return this.cron("0 0 * * 0");
  }

  public monthly(): this {
    return this.cron("0 0 1 * *");
  }

  public run() {
    return cron.schedule(this.cronExpression, async () => {
      logger.info(
        `[SCHEDULER] Running command: ${this.commandSignature} ${this.commandArgs.join(" ")}`,
      );
      try {
        await Process.run(
          `npm run command ${this.commandSignature} ${this.commandArgs.join(" ")}`,
        );
      } catch (error: any) {
        logger.error(
          `[SCHEDULER] Error running command ${this.commandSignature}: ${error.message}`,
        );
      }
    });
  }
}

export class Schedule {
  private events: Event[] = [];

  public command(signature: string, args: string[] = []): Event {
    const event = new Event(signature, args);
    this.events.push(event);
    return event;
  }

  public run(): void {
    if (this.events.length === 0) {
      logger.info("[SCHEDULER] No tasks scheduled.");
      return;
    }

    logger.info(`[SCHEDULER] Starting with ${this.events.length} tasks.`);
    for (const event of this.events) {
      event.run();
    }
  }
}
