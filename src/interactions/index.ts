import { runner } from "./InteractionRunner";
import { slashRegistry } from "./SlashInteractionRegistry";

export const interactionsList = [];

// Enregistrement global
slashRegistry.registerAll(interactionsList);
runner.registerAll(interactionsList);
