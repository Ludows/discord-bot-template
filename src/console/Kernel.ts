import { DbSeedCommand } from "./commands/DbSeedCommand";
import { DbSetupCommand } from "./commands/DbSetupCommand";
import { MigrateCommand } from "./commands/MigrateCommand";
import { ConsoleCommand } from "./ConsoleCommand";
import { Make } from "./Make";
import { Schedule } from "./Schedule";

export class Kernel {
  private commands: ConsoleCommand[] = [
    new Make(),
    new DbSeedCommand(),
    new DbSetupCommand(),
    new MigrateCommand(),
  ];

  /**
   * Define the application's command schedule.
   * Override this method to register your scheduled tasks.
   */
  public schedule(_schedule: Schedule): void {
    // Define your scheduled tasks here
  }

  /**
   * Start the scheduler. Call this during bot startup.
   */
  public startScheduler(): void {
    const schedule = new Schedule();
    this.schedule(schedule);
    schedule.run();
  }

  public async handle(): Promise<void> {
    const args = process.argv.slice(2);
    const signature = args[0];

    if (!signature || signature === "help" || signature === "--help") {
      this.displayHelp();
      return;
    }

    const command = this.commands.find((c) => c.signature === signature);

    if (!command) {
      console.error(
        `\x1b[31m❌ ERROR:\x1b[0m Commande inconnue : "${signature}"`,
      );
      this.displayHelp();
      process.exit(1);
    }

    // Shift arguments to remove the command signature
    // This allows commands to use this.getArg(0) for their first actual argument
    process.argv.splice(2, 1);

    await command.run();
  }

  private displayHelp(): void {
    console.log("\x1b[36mℹ️ INFO:\x1b[0m Commandes disponibles :\n");

    // Sort commands by signature for better readability
    const sortedCommands = [...this.commands].sort((a, b) =>
      a.signature.localeCompare(b.signature),
    );

    for (const command of sortedCommands) {
      console.log(
        `  \x1b[32m${command.signature.padEnd(25)}\x1b[0m ${command.description}`,
      );
    }
    console.log("\nUsage: npm run command {signature} [arguments]");
  }
}

if (require.main === module) {
  new Kernel().handle();
}
