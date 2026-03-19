import { FieldDefinition, Generator } from "./Generator";

export class HttpGenerator extends Generator {
  public type = "http";
  public targetDir = "src/http/endpoints";
  public stubFile = "http.stub";

  public generate(name: string, fields?: FieldDefinition[]): void {
    const pascalName = this.toPascalCase(name);
    let content = this.readStub();
    content = content.replace(/{{Name}}/g, pascalName);
    this.write(`${this.targetDir}/${pascalName}Api.ts`, content);
  }
}
