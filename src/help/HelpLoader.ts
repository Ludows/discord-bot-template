import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";

class HelpLoader {
  private cache = new Map<string, string>();
  private helpDir = path.resolve(process.cwd(), "src/help/interactions");

  public boot(): void {
    if (!fs.existsSync(this.helpDir)) {
      logger.warn(
        `HelpLoader: Dossier help absent à l'adresse ${this.helpDir}`,
      );
      return;
    }

    const files = fs.readdirSync(this.helpDir);
    for (const file of files) {
      if (file.endsWith(".md")) {
        const name = file.replace(".md", "");
        const content = fs.readFileSync(path.join(this.helpDir, file), "utf-8");
        this.cache.set(name, content);
        logger.info(`[HELP] Loaded help for interaction: ${name}`);
      }
    }
  }

  public get(name: string): string | null {
    return this.cache.get(name) || null;
  }

  public has(name: string): boolean {
    return this.cache.has(name);
  }
}

export const helpLoader = new HelpLoader();
