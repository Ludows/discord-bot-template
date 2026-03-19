import { FieldDefinition, Generator } from "./Generator";

export class MigrationGenerator extends Generator {
  public type = "migration";
  public targetDir = "src/database/migrations";
  public stubFile = "migration.stub";

  public generate(name: string, fields: FieldDefinition[] = []): void {
    const tableName = this.toSnakeCase(name) + "s";
    const time = this.timestamp();

    let content = this.readStub();
    content = content.replace(/{{table}}/g, tableName);
    content = content.replace(/{{upCols}}/g, this.buildUpColumns(fields));

    this.write(`${this.targetDir}/${time}_create_${tableName}.ts`, content);
  }

  private buildUpColumns(fields: FieldDefinition[]): string {
    let cols = `      id: {\n        allowNull: false,\n        autoIncrement: true,\n        primaryKey: true,\n        type: Sequelize.INTEGER\n      },\n`;

    for (const f of fields) {
      cols += `      ${f.name}: {\n        type: Sequelize.${this.toSequelizeType(f.type).replace("DataTypes.", "")},\n        allowNull: ${f.nullable},\n`;
      if (f.unique) cols += `        unique: true,\n`;
      cols += `      },\n`;
    }

    cols += `      createdAt: {\n        allowNull: false,\n        type: Sequelize.DATE\n      },\n      updatedAt: {\n        allowNull: false,\n        type: Sequelize.DATE\n      }`;
    return cols;
  }
}
