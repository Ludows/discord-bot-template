import { sequelize } from "../database";
import { logger } from "../utils/logger";

export abstract class Service {
  protected abstract name: string;

  public abstract boot(): Promise<void>;

  protected log(message: string): void {
    logger.info(`[SERVICE:${this.name}] ${message}`);
  }

  protected fail(message: string): never {
    logger.error(`[SERVICE:${this.name}] FAIL: ${message}`);
    throw new Error(message);
  }

  protected async transaction<T>(callback: () => Promise<T>): Promise<T> {
    if (!sequelize) {
      throw new Error("La base de données est désactivée.");
    }

    const t = await sequelize.transaction();
    try {
      const result = await callback();
      await t.commit();
      return result;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}
