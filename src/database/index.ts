import { Sequelize } from "sequelize";
import { config } from "../config";
import { logger } from "../utils/logger";
import { bootModels } from "./models";

export let sequelize: Sequelize | null = null;

export function buildSequelize(): Sequelize {
  if (config.database.url) {
    return new Sequelize(config.database.url, { logging: false });
  }

  return new Sequelize({
    dialect: config.database.dialect,
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    username: config.database.user,
    password: config.database.pass,
    logging: false,
  });
}

export async function databaseExists(seq: Sequelize): Promise<boolean> {
  const queryMap: Record<string, string> = {
    postgres: `SELECT 1 FROM pg_database WHERE datname='${config.database.name}'`,
    mysql: `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${config.database.name}'`,
    mariadb: `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${config.database.name}'`,
    mssql: `SELECT name FROM sys.databases WHERE name = '${config.database.name}'`,
  };

  const query = queryMap[config.database.dialect];
  if (!query) {
    if (config.database.dialect === "sqlite") {
      return true; // SQLite creates the file automatically
    }
    return false;
  }

  try {
    const results = await seq.query(query);
    return results[0].length > 0;
  } catch (e) {
    return false;
  }
}

export async function createDatabase(): Promise<void> {
  let sysDb = "postgres";
  if (
    config.database.dialect === "mysql" ||
    config.database.dialect === "mariadb"
  )
    sysDb = "mysql";
  if (config.database.dialect === "mssql") sysDb = "master";

  const tempSeq = new Sequelize({
    dialect: config.database.dialect,
    host: config.database.host,
    port: config.database.port,
    database: sysDb,
    username: config.database.user,
    password: config.database.pass,
    logging: false,
  });

  try {
    await tempSeq.query(`CREATE DATABASE ${config.database.name};`);
    logger.info(`Base de données ${config.database.name} créée.`);
  } catch (e: any) {
    logger.error(`Erreur lors de la création de la base: ${e.message}`);
  } finally {
    await tempSeq.close();
  }
}

export async function initDatabase(): Promise<void> {
  if (!config.database.enabled) {
    logger.info(
      "Module de base de données désactivé (DATABASE_ENABLED=false). Sequelize ignoré.",
    );
    return;
  }

  sequelize = buildSequelize();

  try {
    await sequelize.authenticate();
    logger.info("Connexion à la base de données établie avec succès.");

    // Initialisation des modèles
    bootModels();

    // In a real app we would use umzug for migrations, but here sync() is okay for dev
    if (config.env !== "production") {
      await sequelize.sync({ alter: true });
      logger.info("Synchronisation des modèles terminée.");
    }
  } catch (error) {
    logger.error("Impossible de se connecter à la base de données:", error);
  }
}
