import fs from "fs";
import path from "path";
import { FieldDefinition, Generator } from "./Generator";

export class TestGenerator extends Generator {
  public type = "test";
  public targetDir = "tests";
  public stubFile = ""; // Resolved dynamically

  public generate(
    name: string,
    fields?: FieldDefinition[],
    testType?: string,
  ): void {
    if (!testType) throw new Error("testType est requis pour TestGenerator");

    const pascalName = this.toPascalCase(name);
    const lowerName = name.toLowerCase();

    let target = "";
    let stub = "";

    if (testType === "interaction" || testType === "slash-interaction") {
      target = `tests/interactions/${pascalName}Interaction.test.ts`;
      stub =
        testType === "interaction"
          ? "tests/interaction.test.stub"
          : "tests/slash-interaction.test.stub";
    } else if (testType === "service") {
      target = `tests/services/${pascalName}Service.test.ts`;
      stub = "tests/service.test.stub";
    } else if (testType === "http") {
      target = `tests/http/${pascalName}Api.test.ts`;
      stub = "tests/http.test.stub";
    } else {
      throw new Error(`Type de test invalide: ${testType}`);
    }

    this.stubFile = stub;
    let content = this.readStub();
    content = content.replace(/{{Name}}/g, pascalName);
    content = content.replace(/{{name}}/g, lowerName);

    if (testType === "interaction" || testType === "slash-interaction") {
      content = content.replace(
        /{{subcommandTests}}/g,
        this.buildSubcommandTests(pascalName, testType),
      );
    }

    this.write(target, content);
  }

  private buildSubcommandTests(pascalName: string, testType: string): string {
    const sourceFile = path.resolve(
      process.cwd(),
      `src/interactions/${pascalName}Interaction.ts`,
    );
    if (!fs.existsSync(sourceFile)) {
      return `  // TODO: Ajoutez ici les tests pour les sous-commandes de ${pascalName}Interaction\n`;
    }

    const fileContent = fs.readFileSync(sourceFile, "utf-8");
    const signatureMatch = fileContent.match(
      /signature\s*=\s*['"\`]([^'"\`]+)['"\`]/,
    );

    if (!signatureMatch || !signatureMatch[1]) {
      return `  // TODO: Ajoutez ici les tests pour les sous-commandes de ${pascalName}Interaction\n`;
    }

    const signature = signatureMatch[1];
    const cmdParts = signature.split(" ")[0];
    if (!cmdParts.includes(":")) {
      return `  // TODO: Ajoutez ici les tests pour la méthode d'exécution principale de ${pascalName}Interaction\n`;
    }

    const subcommands = cmdParts.split(":")[1].split(",");
    let tests = "";

    for (const sub of subcommands) {
      tests += `  it('sous-commande ${sub} est appelée', async () => {\n`;
      if (testType === "interaction") {
        tests += `    const spy = vi.spyOn(interaction as any, '${sub}').mockResolvedValue(undefined);\n`;
        tests += `    await interaction.handle(message, ['${sub}']);\n`;
      } else {
        tests += `    const spy = vi.spyOn(interaction as any, '${sub}').mockResolvedValue(undefined);\n`;
        tests += `    const slash = mockSlashInteraction('${sub}');\n`;
        tests += `    await interaction.handleSlash(slash);\n`;
      }
      tests += `    expect(spy).toHaveBeenCalledOnce();\n`;
      tests += `  });\n\n`;
    }

    return tests;
  }
}
