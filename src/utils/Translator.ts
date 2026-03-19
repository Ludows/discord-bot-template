import { AsyncLocalStorage } from "node:async_hooks";
import { logger } from "./logger";

export type TranslationMap = { [key: string]: string | TranslationMap };

export class Translator {
  private static instance: Translator;
  private translations: Record<string, TranslationMap> = {};
  private locale: string = "fr";
  private storage = new AsyncLocalStorage<string>();

  private constructor() {}

  public static getInstance(): Translator {
    if (!Translator.instance) {
      Translator.instance = new Translator();
    }
    return Translator.instance;
  }

  public setLocale(locale: string): void {
    this.locale = locale;
  }

  public getLocale(): string {
    return this.storage.getStore() || this.locale;
  }

  /**
   * Run a callback with a specific locale for the current execution context
   */
  public async runWithLocale<T>(
    locale: string,
    callback: () => Promise<T>,
  ): Promise<T> {
    const normalized = this.normalizeLocale(locale);
    return this.storage.run(normalized, callback);
  }

  public register(locale: string, translations: TranslationMap): void {
    this.translations[locale] = translations;
  }

  public translate(
    key: string,
    replacements: Record<string, string> = {},
  ): string {
    const currentLocale = this.getLocale();
    const localeTranslations = this.translations[currentLocale];

    if (!localeTranslations) {
      // Fallback to default locale if current requested locale is not registered
      const fallbackTranslations = this.translations[this.locale];
      if (!fallbackTranslations) return key;

      return this.resolveKey(
        fallbackTranslations,
        key,
        replacements,
        this.locale,
      );
    }

    return this.resolveKey(
      localeTranslations,
      key,
      replacements,
      currentLocale,
    );
  }

  private resolveKey(
    translations: TranslationMap,
    key: string,
    replacements: Record<string, string>,
    locale: string,
  ): string {
    let value = this.getNestedValue(translations, key);

    if (typeof value !== "string") {
      logger.warn(
        `Translation key "${key}" not found or not a string for locale "${locale}"`,
      );
      return key;
    }

    // Replace placeholders: :name -> value
    Object.entries(replacements).forEach(([k, v]) => {
      value = (value as string).replace(`:${k}`, v);
    });

    return value as string;
  }

  public normalizeLocale(locale: string): string {
    if (!locale) return this.locale;
    const short = locale.split("-")[0].toLowerCase();
    return this.translations[short] ? short : this.locale;
  }

  private getNestedValue(obj: any, path: string): any {
    return path
      .split(".")
      .reduce((prev, curr) => (prev ? prev[curr] : null), obj);
  }
}

export const translator = Translator.getInstance();
