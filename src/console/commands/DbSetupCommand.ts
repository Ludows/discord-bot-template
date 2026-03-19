import { config } from "../../config";
import { buildSequelize, createDatabase, databaseExists } from "../../database";
import { ConsoleCommand } from "../ConsoleCommand";

export class DbSetupCommand extends ConsoleCommand {
  public signature = "db:setup";
  public description =
    "Vérifier, créer ou afficher les informations de base de données.";

  public async handle(): Promise<void> {
    const action = this.getArg(0);

    if (action === "check") {
      if (!config.database.enabled) {
        this.warn("Base de données désactivée.");
        return;
      }
      const seq = buildSequelize();
      const exists = await databaseExists(seq);
      await seq.close();
      if (exists) {
        this.success("La base de données existe et est joignable.");
        process.exit(0);
      } else {
        this.warn(
          "La base de données est introuvable. Tapez npm run db:create pour la générer.",
        );
        process.exit(1);
      }
    }

    if (action === "create") {
      if (!config.database.enabled) {
        this.warn("Base de données désactivée.");
        return;
      }
      const seq = buildSequelize();
      const exists = await databaseExists(seq);
      await seq.close();
      if (exists) {
        this.success(
          "La base de données existe déjà, aucune création requise.",
        );
        return;
      }
      await createDatabase();
      this.success(`La base de données ${config.database.name} a été créée !`);
      return;
    }

    if (action === "info") {
      this.info("Configuration de la base de données :");
      this.line(`- ENV : ${config.env}`);
      this.line(`- ENABLED : ${config.database.enabled}`);
      this.line(`- DIALECT : ${config.database.dialect}`);
      this.line(`- HOST : ${config.database.host}:${config.database.port}`);
      this.line(`- NAME : ${config.database.name}`);
      this.line(`- URL : ${config.database.url ? "***" : "Non définie"}`);
      process.exit(0);
    }

    this.warn('Action invalide. Utilisez "check", "create" ou "info".');
    process.exit(0);
  }
}

if (require.main === module) {
  new DbSetupCommand().run();
}
