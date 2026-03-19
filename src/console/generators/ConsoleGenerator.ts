import { FieldDefinition, Generator } from "./Generator";

export class ConsoleGenerator extends Generator {
  public type = "command";
  public targetDir = "src/console/commands";
  public stubFile = "console-command.stub";

  public generate(
    name: string,
    fields?: FieldDefinition[],
    testType?: string,
  ): void {
    const Name = this.toPascalCase(name);
    const stub = this.readStub();

    const content = stub
      .replace(/{{Name}}/g, Name)
      .replace(/{{name}}/g, name.toLowerCase());

    this.write(`${this.targetDir}/${Name}Command.ts`, content);
  }

  public register(name: string): void {
    const Name = this.toPascalCase(name);
    const kernelPath = "src/console/Kernel.ts";
    const importLine = `import { ${Name}Command } from "./commands/${Name}Command";`;
    const instanceLine = `new ${Name}Command(),`;

    this.appendImport(kernelPath, importLine);
    this.appendToList(kernelPath, "commands", instanceLine);
  }
}
