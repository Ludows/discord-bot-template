import * as p from "@clack/prompts";
import degit from "degit";
import fs from "fs-extra";
import { execSync } from "child_process";
import path from "path";
import pc from "picocolors";

const TEMPLATE_REPO = "Ludows/discord-bot-template";

async function main() {
  console.log();
  p.intro(pc.bgCyan(pc.black(" create-discord-bot ")));

  // --- Project name ---
  const projectName = await p.text({
    message: "Nom du projet",
    placeholder: "my-discord-bot",
    validate: (v) => (v.trim() ? undefined : "Le nom ne peut pas être vide."),
  });
  if (p.isCancel(projectName)) return p.cancel("Annulé.");

  const targetDir = path.resolve(process.cwd(), projectName as string);
  if (await fs.pathExists(targetDir)) {
    const overwrite = await p.confirm({
      message: `Le dossier "${projectName}" existe déjà. Écraser ?`,
      initialValue: false,
    });
    if (p.isCancel(overwrite) || !overwrite) return p.cancel("Annulé.");
    await fs.remove(targetDir);
  }

  // --- Database ---
  const database = await p.select({
    message: "Dialect de base de données",
    options: [
      { value: "mysql", label: "MySQL" },
      { value: "postgres", label: "PostgreSQL" },
      { value: "sqlite", label: "SQLite" },
      { value: "none", label: "Aucune" },
    ],
  });
  if (p.isCancel(database)) return p.cancel("Annulé.");

  // --- Cache ---
  const cache = await p.select({
    message: "Driver de cache",
    options: [
      { value: "file", label: "Fichier (persistant)" },
      { value: "memory", label: "Mémoire (volatile)" },
    ],
  });
  if (p.isCancel(cache)) return p.cancel("Annulé.");

  // --- Mail ---
  const includeMail = await p.confirm({
    message: "Inclure le système de mail ?",
    initialValue: false,
  });
  if (p.isCancel(includeMail)) return p.cancel("Annulé.");

  // --- Lang ---
  const lang = await p.select({
    message: "Langue par défaut",
    options: [
      { value: "fr", label: "Français" },
      { value: "en", label: "English" },
    ],
  });
  if (p.isCancel(lang)) return p.cancel("Annulé.");

  console.log();
  const spinner = p.spinner();

  // --- Clone template ---
  spinner.start("Téléchargement du template…");
  const emitter = degit(TEMPLATE_REPO, { cache: false, force: true });
  await emitter.clone(targetDir);
  spinner.stop("Template téléchargé.");

  // --- Update package.json ---
  const pkgPath = path.join(targetDir, "package.json");
  const pkg = await fs.readJson(pkgPath);
  pkg.name = (projectName as string)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  pkg.version = "1.0.0";
  pkg.description = "";
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });

  // --- Generate .env ---
  const dbPort = database === "postgres" ? 5432 : 3306;
  const dbName = pkg.name.replace(/-/g, "_");

  let env = [
    `APP_ENV=dev`,
    `DISCORD_TOKEN=`,
    `DISCORD_CLIENT_ID=`,
    `GUILD_ID=`,
    `PREFIX=!`,
    `LOG_LEVEL=info`,
    `DATABASE_ENABLED=${database !== "none"}`,
  ].join("\n");

  if (database !== "none") {
    env += [
      "",
      `DATABASE_DIALECT=${database}`,
      `DATABASE_HOST=localhost`,
      `DATABASE_PORT=${dbPort}`,
      `DATABASE_NAME=${dbName}`,
      `DATABASE_USER=root`,
      `DATABASE_PASS=`,
      `DATABASE_URL=`,
    ].join("\n");
  }

  env += [
    "",
    `CACHE_DRIVER=${cache}`,
    `CACHE_PATH=./storage/cache`,
    "",
  ].join("\n");

  await fs.writeFile(path.join(targetDir, ".env"), env);

  // --- Update default lang in config ---
  const configPath = path.join(targetDir, "src", "config.ts");
  if (await fs.pathExists(configPath)) {
    let config = await fs.readFile(configPath, "utf-8");
    config = config.replace(/locale:\s*['"](?:en|fr)['"]/, `locale: '${lang}'`);
    await fs.writeFile(configPath, config);
  }

  // --- Remove mail if not needed ---
  if (!includeMail) {
    await fs.remove(path.join(targetDir, "src", "mail"));
  }

  // --- Remove database if not needed ---
  if (database === "none") {
    await fs.remove(path.join(targetDir, "src", "database"));
  }

  // --- Install dependencies ---
  spinner.start("Installation des dépendances…");
  try {
    execSync("npm install", { cwd: targetDir, stdio: "ignore" });
    spinner.stop("Dépendances installées.");
  } catch {
    spinner.stop(pc.yellow("⚠ npm install a échoué. Lance-le manuellement."));
  }

  p.outro(
    [
      pc.green("✓") + " Projet prêt !",
      "",
      "  " + pc.cyan(`cd ${projectName}`),
      "  " + pc.cyan("# Remplis .env avec ton DISCORD_TOKEN"),
      "  " + pc.cyan("npm run dev"),
    ].join("\n")
  );
}

main().catch((err) => {
  console.error(pc.red("Erreur : ") + err.message);
  process.exit(1);
});
