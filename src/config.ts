import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// 1. Définir APP_ENV avant chargement
export const env = (process.env.APP_ENV || "dev") as
  | "dev"
  | "staging"
  | "production"
  | "test";

const loadEnv = (file: string) => {
  const p = path.resolve(process.cwd(), file);
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: true });
  }
};

// 2. Charger .env -> .env.{APP_ENV} -> .env.{APP_ENV}.local
loadEnv(".env");
loadEnv(`.env.${env}`);
loadEnv(`.env.${env}.local`);

export type DbDialect = "postgres" | "mysql" | "sqlite" | "mariadb" | "mssql";

export const config = {
  env,
  token: process.env.DISCORD_TOKEN || "",
  clientId: process.env.DISCORD_CLIENT_ID || "",
  guildId: process.env.GUILD_ID || "",
  prefix: process.env.PREFIX || "!",
  logLevel: process.env.LOG_LEVEL || "info",
  database: {
    enabled: process.env.DATABASE_ENABLED === "true",
    dialect: (process.env.DATABASE_DIALECT || "postgres") as DbDialect,
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432", 10),
    name: process.env.DATABASE_NAME || "mybot",
    user: process.env.DATABASE_USER || "",
    pass: process.env.DATABASE_PASS || "",
    url: process.env.DATABASE_URL || "",
  },
  cache: {
    driver: (process.env.CACHE_DRIVER || "memory") as "memory" | "file",
    path:
      process.env.CACHE_PATH || path.resolve(process.cwd(), "storage/cache"),
  },
  modules: {
    chuckNorrisUrl: process.env.CHUCKNORRIS_API_URL || "",
    bm: process.env.BM_API_URL || "",
    fourchan: process.env.FOURCHAN_API_URL || "",
    sncfApiKey: process.env.SNCF_API_KEY || "",
  },
  youtube: {
    searchLimit: parseInt(process.env.YOUTUBE_SEARCH_LIMIT || "5", 10),
  },
  mail: {
    default: process.env.MAIL_MAILER || "log",
    from: {
      address: process.env.MAIL_FROM_ADDRESS || "hello@example.com",
      name: process.env.MAIL_FROM_NAME || "TrumpBot",
    },
    mailers: {
      smtp: {
        host: process.env.MAIL_HOST || "localhost",
        port: parseInt(process.env.MAIL_PORT || "1025", 10),
        user: process.env.MAIL_USERNAME || "",
        pass: process.env.MAIL_PASSWORD || "",
      },
      log: {
        // No extra config needed for log
      },
    },
  },

  /**
   * Get a configuration value by path (e.g., 'database.host')
   */
  get<T = any>(path: string): T | undefined {
    const parts = path.split(".");
    let current: any = this;
    for (const part of parts) {
      if (current === null || typeof current !== "object") return undefined;
      current = current[part];
    }
    return current as T;
  },

  /**
   * Set a configuration value by path (e.g., 'database.host')
   */
  set(path: string, value: any): void {
    const parts = path.split(".");
    let current: any = this;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== "object") {
        current[part] = {};
      }
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  },
};
