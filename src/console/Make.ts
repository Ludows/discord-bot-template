import { ConsoleCommand } from "./ConsoleCommand";
import { ConsoleGenerator } from "./generators/ConsoleGenerator";
import { Generator } from "./generators/Generator";
import { HttpGenerator } from "./generators/HttpGenerator";
import { InteractionGenerator } from "./generators/InteractionGenerator";
import { MigrationGenerator } from "./generators/MigrationGenerator";
import { ModelGenerator } from "./generators/ModelGenerator";
import { ServiceGenerator } from "./generators/ServiceGenerator";
import { SlashInteractionGenerator } from "./generators/SlashInteractionGenerator";
import { TestGenerator } from "./generators/TestGenerator";

export class Make extends ConsoleCommand {
  public signature = "make";
  public description = "Générateur de code scaffolding.";

  public async handle(): Promise<void> {
    const targetType = this.getArg(0);
    const targetName = this.getArg(1);
    const rawFields = process.argv.slice(4).filter((a) => !a.startsWith("--"));

    if (!targetType || !targetName) {
      this.error("Usage: npm run make <type> <Name> [fields...]");
      this.line(
        "Types : command, service, http, interaction, slash-interaction, model, migration, test:interaction, test:slash-interaction, test:service, test:http",
      );
      process.exit(1);
    }

    let generator: Generator | null = null;
    let testType: string | undefined = undefined;

    switch (targetType) {
      case "model":
        generator = new ModelGenerator();
        break;
      case "migration":
        generator = new MigrationGenerator();
        break;
      case "service":
        generator = new ServiceGenerator();
        break;
      case "http":
        generator = new HttpGenerator();
        break;
      case "interaction":
        generator = new InteractionGenerator();
        break;
      case "slash-interaction":
        generator = new SlashInteractionGenerator();
        break;
      case "command":
        generator = new ConsoleGenerator();
        break;
      case "test:interaction":
        generator = new TestGenerator();
        testType = "interaction";
        break;
      case "test:slash-interaction":
        generator = new TestGenerator();
        testType = "slash-interaction";
        break;
      case "test:service":
        generator = new TestGenerator();
        testType = "service";
        break;
      case "test:http":
        generator = new TestGenerator();
        testType = "http";
        break;
      default:
        this.error(`Type de générateur inconnu : ${targetType}`);
        process.exit(1);
    }

    if (generator) {
      try {
        const fields = generator.parseFields(rawFields);
        generator.generate(targetName, fields, testType);
        generator.register(targetName);
        this.success(`Génération de ${targetType} terminée.`);
      } catch (e: any) {
        this.error(e.message);
        process.exit(1);
      }
    }
  }
}

if (require.main === module) {
  new Make().run();
}
