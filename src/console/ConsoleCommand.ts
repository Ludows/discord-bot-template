export abstract class ConsoleCommand {
  public abstract signature: string;
  public abstract description: string;

  public abstract handle(): Promise<void>;

  public async run(): Promise<void> {
    try {
      await this.handle();
    } catch (e: any) {
      this.error(`Erreur fatale: ${e.message}`);
      process.exit(1);
    }
  }

  protected info(msg: string): void {
    console.log(`\x1b[36mℹ️ INFO:\x1b[0m ${msg}`);
  }

  protected success(msg: string): void {
    console.log(`\x1b[32m✅ SUCCESS:\x1b[0m ${msg}`);
  }

  protected warn(msg: string): void {
    console.warn(`\x1b[33m⚠️ WARN:\x1b[0m ${msg}`);
  }

  protected error(msg: string): void {
    console.error(`\x1b[31m❌ ERROR:\x1b[0m ${msg}`);
  }

  protected line(msg: string = ""): void {
    console.log(msg);
  }

  protected getArg(index: number): string | null {
    const rawArgs = process.argv.slice(2);
    const args = rawArgs.filter((a) => !a.startsWith("--"));
    return args[index] || null;
  }

  protected hasFlag(flag: string): boolean {
    const rawArgs = process.argv.slice(2);
    return rawArgs.includes(`--${flag}`);
  }

  protected getOption(key: string): string | null {
    const rawArgs = process.argv.slice(2);
    const opt = rawArgs.find((a) => a.startsWith(`--${key}=`));
    if (opt) {
      return opt.split("=")[1];
    }
    return null;
  }
}
