import { getMigrationRunner } from "../../database/migrations";
import { ConsoleCommand } from "../ConsoleCommand";

export class MigrateCommand extends ConsoleCommand {
  public signature = "migrate";
  public description =
    "Gère les migrations de la base de données (up, rollback, reset, refresh, status)";

  public async handle(): Promise<void> {
    const action = this.getArg(0) || "up";
    const migrator = await getMigrationRunner();

    switch (action) {
      case "up":
        this.info("Exécution des migrations en attente...");
        await migrator.up();
        this.success("Migrations terminées.");
        break;

      case "rollback":
        this.info("Annulation de la dernière migration...");
        await migrator.down();
        this.success("Rollback terminé.");
        break;

      case "reset":
        this.info("Réinitialisation de toutes les migrations...");
        await migrator.down({ step: 0 });
        this.success("Réinitialisation terminée.");
        break;

      case "refresh":
        this.info("Rafraîchissement des migrations (reset + up)...");
        await migrator.down({ step: 0 });
        await migrator.up();
        this.success("Rafraîchissement terminé.");
        break;

      case "status":
        const pending = await migrator.pending();
        const executed = await migrator.executed();

        this.info("Statut des migrations :");
        this.line("\nExécutées :");
        executed.forEach((m) => this.line(`✅ ${m.name}`));
        if (executed.length === 0) this.line("(aucune)");

        this.line("\nEn attente :");
        pending.forEach((m) => this.line(`⏳ ${m.name}`));
        if (pending.length === 0) this.line("(aucune)");
        break;

      default:
        this.error(`Action inconnue : ${action}`);
        this.line(
          "Utilisation : npm run migrate -- [up|rollback|reset|refresh|status]",
        );
        break;
    }
  }
}

const command = new MigrateCommand();
if (require.main === module) {
  command.run();
}
