import { FieldDefinition, Generator } from "./Generator";
import { MigrationGenerator } from "./MigrationGenerator";

export class ModelGenerator extends Generator {
  public type = "model";
  public targetDir = "src/database/models";
  public stubFile = "model.stub";

  public generate(name: string, fields: FieldDefinition[] = []): void {
    const pascalName = this.toPascalCase(name);
    const tableName = this.toSnakeCase(name) + "s";

    let content = this.readStub();
    content = content.replace(/{{Name}}/g, pascalName);
    content = content.replace(/{{table}}/g, tableName);
    content = content.replace(/{{fieldsDecl}}/g, this.buildFieldsDecl(fields));
    content = content.replace(/{{fieldsCols}}/g, this.buildFieldsCols(fields));

    this.write(`${this.targetDir}/${pascalName}.ts`, content);

    new MigrationGenerator().generate(name, fields);
  }

  private buildFieldsDecl(fields: FieldDefinition[]): string {
    if (fields.length === 0) return "";
    return fields
      .map((f) => {
        const tsType = this.toTsType(f.type);
        return `  declare ${f.name}: ${tsType} | null;`;
      })
      .join("\n");
  }

  private buildFieldsCols(fields: FieldDefinition[]): string {
    if (fields.length === 0) return "";
    return fields
      .map((f) => {
        const seqType = this.toSequelizeType(f.type);
        let col = `      ${f.name}: {\n        type: ${seqType},\n        allowNull: ${f.nullable},\n`;
        if (f.unique) col += `        unique: true,\n`;
        col += `      },`;
        return col;
      })
      .join("\n");
  }

  public register(name: string): void {
    const pascalName = this.toPascalCase(name);
    const indexPath = "src/database/models/index.ts";
    const importLine = `import { ${pascalName} } from "./${pascalName}";`;
    const bootLine = `${pascalName}.boot();`;

    this.appendImport(indexPath, importLine);
    this.appendStatementToFunction(indexPath, "bootModels", bootLine);
  }
}
