import { TranslationMap } from "../utils/Translator";

export const en: TranslationMap = {
  messages: {
    welcome: "Welcome, :name!",
    error: "An error occurred.",
    success: "Operation successful.",
  },
  commands: {
    ping: {
      description: "Replies with Pong and various options",
      pong: "Pong! :latency ms",
    },
  },
};
