import { serviceRegistry } from "./ServiceRegistry";

export const servicesList = [];

// Enregistrement global
serviceRegistry.registerAll(servicesList);
