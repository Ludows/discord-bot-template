import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FieldDefinition,
  Generator,
} from "../../../src/console/generators/Generator";
import { HttpGenerator } from "../../../src/console/generators/HttpGenerator";
import { InteractionGenerator } from "../../../src/console/generators/InteractionGenerator";
import { ModelGenerator } from "../../../src/console/generators/ModelGenerator";
import { ServiceGenerator } from "../../../src/console/generators/ServiceGenerator";
import { SlashInteractionGenerator } from "../../../src/console/generators/SlashInteractionGenerator";
import { TestGenerator } from "../../../src/console/generators/TestGenerator";

import fs from "fs";

// Concrete implementation of abstract Generator to test base logic
class DummyGen extends Generator {
  public type = "dummy";
  public targetDir = "dummy";
  public stubFile = "dummy.stub";
  public generate() {}

  public exposeWrite(f: string, c: string) {
    this.write(f, c);
  }
  public exposeReadStub() {
    return this.readStub();
  }
  public exposeTimestamp() {
    return this.timestamp();
  }
}

describe("Generator Base", () => {
  let gen: DummyGen;

  beforeEach(() => {
    gen = new DummyGen();
    vi.clearAllMocks();
  });

  it("parseFields extrait type, default string, nullables, unique", () => {
    const fields = gen.parseFields([
      "name:string",
      "age:integer?",
      "email:string!unique",
    ]);
    expect(fields).toEqual([
      { name: "name", type: "string", nullable: false, unique: false },
      { name: "age", type: "integer", nullable: true, unique: false },
      { name: "email", type: "string", nullable: false, unique: true },
    ]);
  });

  it("parseFields gère fallback sur type non valide", () => {
    const fields = gen.parseFields(["name:unknown_type"]);
    expect(fields[0].type).toBe("string");
  });

  it("toSequelizeType map les types", () => {
    expect(gen.toSequelizeType("integer")).toBe("DataTypes.INTEGER");
    expect(gen.toSequelizeType("uuid" as any)).toBe("DataTypes.UUID");
    // fallback
    expect(gen.toSequelizeType("something" as any)).toBe("DataTypes.STRING");
  });

  it("toTsType map les types", () => {
    expect(gen.toTsType("integer")).toBe("number");
    expect(gen.toTsType("uuid" as any)).toBe("string");
    // fallback
    expect(gen.toTsType("something" as any)).toBe("string");
  });

  it("readStub lis le fichier si existant", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue("STUB_DATA");
    expect(gen.exposeReadStub()).toBe("STUB_DATA");
  });

  it("readStub lance Error si stub file is missing", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    expect(() => gen.exposeReadStub()).toThrow();
  });

  it("write mkdirp et writeFileSync si inexistant", () => {
    vi.spyOn(fs, "existsSync").mockImplementation((p) => {
      if (p.toString().includes("dummy.ts")) return false; // le fichier
      return false; // le dossier parent
    });
    const mkdirSpy = vi.spyOn(fs, "mkdirSync").mockReturnValue(undefined);
    const writeSpy = vi.spyOn(fs, "writeFileSync").mockReturnValue(undefined);

    gen.exposeWrite("path/dummy.ts", "CONTENT");
    expect(mkdirSpy).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
    expect(writeSpy).toHaveBeenCalled();
  });

  it("write lance Error si le fichier existe déjà", () => {
    vi.spyOn(fs, "existsSync").mockImplementation((p) => {
      if (p.toString().includes("dummy.ts")) return true; // file exists
      return true; // dir exists
    });
    expect(() => gen.exposeWrite("dummy.ts", "C")).toThrow();
  });

  it("timestamp génère le bon format YYYYMM...", () => {
    const val = gen.exposeTimestamp();
    expect(val.length).toBe(14); // YYYYMMDDHHmmss
  });
});

describe("Generators Children", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(fs, "existsSync").mockReturnValue(true); // Stub exists, target doesn't (we override for write)
    vi.spyOn(fs, "readFileSync").mockReturnValue("STUB_{{Name}}_{{name}}");
    vi.spyOn(fs, "writeFileSync").mockReturnValue(undefined);
    vi.spyOn(fs, "mkdirSync").mockReturnValue(undefined);
  });

  it("ServiceGenerator.generate", () => {
    vi.spyOn(fs, "existsSync").mockImplementation((p) =>
      p.toString().endsWith(".stub") ? true : false,
    );
    const gen = new ServiceGenerator();
    gen.generate("MyService");
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("MyServiceService.ts"),
      "STUB_MyService_{{name}}",
      "utf-8",
    );
  });

  it("HttpGenerator.generate", () => {
    vi.spyOn(fs, "existsSync").mockImplementation((p) =>
      p.toString().endsWith(".stub") ? true : false,
    );
    const gen = new HttpGenerator();
    gen.generate("MyApi");
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("MyApiApi.ts"),
      "STUB_MyApi_{{name}}",
      "utf-8",
    );
  });

  it("Interaction et SlashInteraction Generators formatent le markdown et le TS", () => {
    vi.spyOn(fs, "existsSync").mockImplementation((p) =>
      p.toString().endsWith(".stub") ? true : false,
    );

    const iGen = new InteractionGenerator();
    iGen.generate("Ping");
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2); // TS et MD

    const sGen = new SlashInteractionGenerator();
    sGen.generate("Pong");
    expect(fs.writeFileSync).toHaveBeenCalledTimes(4); // 2 de iGen, 2 de sGen
  });

  it("Model et Migration manipulent les fields", () => {
    vi.spyOn(fs, "existsSync").mockImplementation((p) =>
      p.toString().endsWith(".stub") ? true : false,
    );
    vi.spyOn(fs, "readFileSync").mockReturnValue(
      "M_{{table}}_{{fieldsDecl}}_{{fieldsCols}}_{{upCols}}",
    );

    const gen = new ModelGenerator();
    const fields: FieldDefinition[] = [
      { name: "age", type: "integer", nullable: false, unique: true },
    ];
    gen.generate("User", fields);

    // Model => TS, puis MigrationGenerator => TS
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
  });

  it("TestGenerator testType errors", () => {
    vi.spyOn(fs, "existsSync").mockImplementation((p) =>
      p.toString().endsWith(".stub") ? true : false,
    );
    const gen = new TestGenerator();
    expect(() => gen.generate("User")).toThrow();
    expect(() => gen.generate("User", [], "invalid")).toThrow();
  });

  it("TestGenerator formats interaction, service, http", () => {
    vi.spyOn(fs, "existsSync").mockImplementation((p) =>
      p.toString().endsWith(".stub") ? true : false,
    );
    vi.spyOn(fs, "readFileSync").mockReturnValue("{{subcommandTests}}");

    const gen = new TestGenerator();

    gen.generate("Srv", [], "service");
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("SrvService.test.ts"),
      "{{subcommandTests}}",
      "utf-8",
    );

    gen.generate("Api", [], "http");
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("ApiApi.test.ts"),
      "{{subcommandTests}}",
      "utf-8",
    );

    // Mock fs.readFileSync pour l'interaction existante (subcommand parse)
    vi.spyOn(fs, "existsSync").mockImplementation((p) => {
      if (p.toString().endsWith(".stub")) return true;
      if (p.toString().endsWith("IterInteraction.ts")) return true;
      return false;
    });
    vi.spyOn(fs, "readFileSync").mockImplementation((p) => {
      if (p.toString().endsWith(".stub")) return "T_{{subcommandTests}}";
      if (p.toString().endsWith("IterInteraction.ts"))
        return `protected signature = 'iter:a,b';`;
      return "";
    });

    gen.generate("Iter", [], "slash-interaction");
    // Vois "iter:a,b" -> 2 subs -> a, b
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("IterInteraction.test.ts"),
      expect.stringContaining("spyOn(interaction as any, 'a')"),
      "utf-8",
    );
  });

  it("TestGenerator handle fallback fallback sur sous commandes pour signature incomplète", () => {
    vi.spyOn(fs, "existsSync").mockImplementation((p) =>
      p.toString().endsWith(".stub") ? true : false,
    );
    vi.spyOn(fs, "readFileSync").mockImplementation((p) => {
      if (p.toString().endsWith(".stub")) return "T_{{subcommandTests}}";
      if (p.toString().endsWith("BasicInteraction.ts"))
        return `export class BasicInteraction {}`;
      return "";
    });
    const gen = new TestGenerator();
    gen.generate("Basic", [], "interaction");
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("BasicInteraction.test.ts"),
      expect.stringContaining("// TODO: Ajoutez"),
      "utf-8",
    );
  });
});
