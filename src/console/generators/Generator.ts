import fs from "fs";
import path from "path";

export type FieldType =
  | "string"
  | "integer"
  | "boolean"
  | "text"
  | "float"
  | "date"
  | "uuid"
  | "json"
  | "vector";

export interface FieldDefinition {
  name: string;
  type: FieldType;
  nullable: boolean;
  unique: boolean;
}

export abstract class Generator {
  public abstract type: string;
  public abstract targetDir: string;
  public abstract stubFile: string;

  public abstract generate(
    name: string,
    fields?: FieldDefinition[],
    testType?: string,
  ): void;

  public register(name: string): void {}

  protected appendImport(filePath: string, importLine: string): void {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, "utf-8");
    if (content.includes(importLine)) return;

    // Find the last import line or just prepend
    const lines = content.split("\n");
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("import ")) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex !== -1) {
      lines.splice(lastImportIndex + 1, 0, importLine);
    } else {
      lines.unshift(importLine);
    }

    fs.writeFileSync(fullPath, lines.join("\n"), "utf-8");
  }

  protected appendToList(
    filePath: string,
    listName: string,
    itemLine: string,
  ): void {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, "utf-8");
    if (content.includes(itemLine)) return;

    // Look for the array definition, allowing for optional type hint
    const regex = new RegExp(
      `${listName}(\\s*:\\s*[^=]+)?\\s*=\\s*\\[([\\s\\S]*?)\\]`,
      "g",
    );
    content = content.replace(regex, (match, typeHint, p1) => {
      const trimmed = p1.trim();
      const separator = trimmed && !trimmed.endsWith(",") ? "," : "";
      const spacing = trimmed.includes("\n") ? "\n    " : " ";
      const endSpacing = trimmed.includes("\n") ? "\n  " : " ";

      if (!trimmed) {
        return `${listName}${typeHint || ""} = [${itemLine}]`;
      }

      return `${listName}${typeHint || ""} = [${p1.trim()}${separator}${spacing}${itemLine}${endSpacing}]`;
    });

    fs.writeFileSync(fullPath, content, "utf-8");
  }

  protected appendStatementToFunction(
    filePath: string,
    functionName: string,
    statement: string,
  ): void {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, "utf-8");
    if (content.includes(statement)) return;

    // Look for the function body
    const regex = new RegExp(
      `(function\\s+${functionName}\\s*\\([^)]*\\)\\s*{)([\\s\\S]*?)(})`,
      "g",
    );
    content = content.replace(regex, (match, head, body, tail) => {
      const trimmedBody = body.trim();
      const spacing = body.includes("\n") ? "\n  " : " ";
      const endSpacing = body.includes("\n") ? "\n" : "";

      if (!trimmedBody) {
        return `${head}${spacing}${statement}${endSpacing}${tail}`;
      }

      return `${head}${body.replace(/\s+$/, "")}${spacing}${statement}${endSpacing}${tail}`;
    });

    fs.writeFileSync(fullPath, content, "utf-8");
  }

  public parseFields(rawFields: string[]): FieldDefinition[] {
    return rawFields.map((field) => {
      let unique = false;
      let nullable = false;
      let nameAndType = field;

      if (nameAndType.includes("!unique")) {
        unique = true;
        nameAndType = nameAndType.replace("!unique", "");
      }

      if (nameAndType.endsWith("?")) {
        nullable = true;
        nameAndType = nameAndType.replace("?", "");
      }

      const parts = nameAndType.split(":");
      const name = parts[0];
      const rawType = parts[1] || "string";

      const validTypes: FieldType[] = [
        "string",
        "integer",
        "boolean",
        "text",
        "float",
        "date",
        "uuid",
        "json",
        "vector",
      ];
      const type = validTypes.includes(rawType as FieldType)
        ? (rawType as FieldType)
        : "string";

      return { name, type, nullable, unique };
    });
  }

  public toSequelizeType(type: FieldType): string {
    const map: Record<FieldType, string> = {
      string: "DataTypes.STRING",
      integer: "DataTypes.INTEGER",
      boolean: "DataTypes.BOOLEAN",
      text: "DataTypes.TEXT",
      float: "DataTypes.FLOAT",
      date: "DataTypes.DATE",
      uuid: "DataTypes.UUID",
      json: "DataTypes.JSON",
      vector: "DataTypes.ARRAY(DataTypes.FLOAT)",
    };
    return map[type] || "DataTypes.STRING";
  }

  public toTsType(type: FieldType): string {
    const map: Record<FieldType, string> = {
      string: "string",
      integer: "number",
      boolean: "boolean",
      text: "string",
      float: "number",
      date: "Date",
      uuid: "string",
      json: "Record<string, unknown>",
      vector: "number[]",
    };
    return map[type] || "string";
  }

  protected readStub(): string {
    const stubPath = path.resolve(
      process.cwd(),
      `src/console/stubs/${this.stubFile}`,
    );
    if (!fs.existsSync(stubPath)) {
      throw new Error(`Stub file non trouvé : ${stubPath}`);
    }
    return fs.readFileSync(stubPath, "utf-8");
  }

  protected write(filename: string, content: string): void {
    const fullPath = path.resolve(process.cwd(), filename);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(fullPath)) {
      throw new Error(`Fichier déjà existant : ${filename}`);
    }

    fs.writeFileSync(fullPath, content, "utf-8");
    console.log(`\x1b[32m✅ SUCCESS:\x1b[0m Fichier créé -> ${filename}`);
  }

  protected toPascalCase(str: string): string {
    return str
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  }

  protected toSnakeCase(str: string): string {
    return str
      .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      .replace(/^_/, "");
  }

  protected timestamp(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }
}
