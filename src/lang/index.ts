import { translator } from "../utils/Translator";
import { en } from "./en";
import { fr } from "./fr";

// Register available languages
translator.register("fr", fr);
translator.register("en", en);

// Default locale (can be changed via env if needed)
translator.setLocale("fr");
