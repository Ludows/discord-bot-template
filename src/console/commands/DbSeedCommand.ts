import { Process } from "../../utils/Process";
import { ConsoleCommand } from "../ConsoleCommand";

export class DbSeedCommand extends ConsoleCommand {
  public signature = "dbseed";
  public description = "Peupler la base de données avec des données initiales";

  public async handle(): Promise<void> {
    this.info("Initialisation du seeding...");

    // Exemple d'utilisation de Process pour vérifier la version de node
    const nodeVersion = await Process.run("node -v");
    if (nodeVersion.successful()) {
      this.info(`Utilisation de Node: ${nodeVersion.output()}`);
    }

    this.info("Simulation du peuplement des tables...");
    this.line("- Users... OK");
    this.line("- Settings... OK");

    this.success("Base de données peuplée avec succès.");
  }
}

if (require.main === module) {
  new DbSeedCommand().run();
}
