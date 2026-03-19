import { FieldDefinition, Generator } from "./Generator";

export class ServiceGenerator extends Generator {
  public type = "service";
  public targetDir = "src/services";
  public stubFile = "service.stub";

  public generate(name: string, fields?: FieldDefinition[]): void {
    const pascalName = this.toPascalCase(name);
    let content = this.readStub();
    content = content.replace(/{{Name}}/g, pascalName);
    this.write(`${this.targetDir}/${pascalName}Service.ts`, content);
  }

  public register(name: string): void {
    const pascalName = this.toPascalCase(name);
    const indexPath = "src/services/index.ts";
    const importLine = `import { ${pascalName}Service } from "./${pascalName}Service";`;
    const instanceLine = `new ${pascalName}Service(),`;

    this.appendImport(indexPath, importLine);
    this.appendToList(indexPath, "servicesList", instanceLine);
  }
}
