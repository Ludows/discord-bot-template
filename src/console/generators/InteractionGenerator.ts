import fs from "fs";
import { FieldDefinition, Generator } from "./Generator";

export class InteractionGenerator extends Generator {
  public type = "interaction";
  public targetDir = "src/interactions";
  public stubFile = "interaction.stub";

  public generate(name: string, fields?: FieldDefinition[]): void {
    const pascalName = this.toPascalCase(name);
    const lowerName = name.toLowerCase();

    let content = this.readStub();
    content = content.replace(/{{Name}}/g, pascalName);
    content = content.replace(/{{name}}/g, lowerName);

    this.write(`${this.targetDir}/${pascalName}Interaction.ts`, content);

    // Create help markdown
    const mdPath = `src/help/interactions/${lowerName}.md`;
    if (!fs.existsSync(mdPath)) {
      const mdContent = `## ${lowerName}\n\nDescription de la commande ${pascalName}.\n\n**Usage**\n!${lowerName}\n`;
      this.write(mdPath, mdContent);
    }
  }

  public register(name: string): void {
    const pascalName = this.toPascalCase(name);
    const indexPath = "src/interactions/index.ts";
    const importLine = `import { ${pascalName}Interaction } from "./${pascalName}Interaction";`;
    const instanceLine = `new ${pascalName}Interaction(),`;

    this.appendImport(indexPath, importLine);
    this.appendToList(indexPath, "interactionsList", instanceLine);
  }
}
