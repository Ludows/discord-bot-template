import { logger } from "../utils/logger";
import { Service } from "./Service";

class ServiceRegistry {
  private services: Service[] = [];

  public register(service: Service): void {
    this.services.push(service);
  }

  public registerAll(services: Service[]): void {
    services.forEach((s) => this.register(s));
  }

  /**
   * Boot all services sequentially
   */
  public async bootAll(): Promise<void> {
    logger.info(`Démarrage de ${this.services.length} services...`);
    for (const service of this.services) {
      try {
        await service.boot();
      } catch (error: any) {
        logger.error(`Erreur lors du boot du service: ${error.message}`, error);
        throw error; // On arrête le boot si un service critique échoue
      }
    }
    logger.info("Tous les services ont été démarrés avec succès.");
  }
}

export const serviceRegistry = new ServiceRegistry();
