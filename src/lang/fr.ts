import { TranslationMap } from "../utils/Translator";

export const fr: TranslationMap = {
  messages: {
    welcome: "Bienvenue, :name !",
    error: "Une erreur est survenue.",
    success: "Opération réussie.",
  },
  commands: {
    ping: {
      description: "Répond Pong avec différentes options",
      pong: "Pong ! :latency ms",
    },
  },
};
