import { ChildProcess, exec, spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface ProcessResult {
  output(): string;
  errorOutput(): string;
  exitCode(): number | null;
  successful(): boolean;
  failed(): boolean;
}

export class Process {
  /**
   * Run a process synchronously (wrapped in Promise)
   */
  public static async run(command: string): Promise<ProcessResult> {
    try {
      const { stdout, stderr } = await execAsync(command);
      return new WrappedResult(stdout, stderr, 0);
    } catch (error: any) {
      return new WrappedResult(
        error.stdout || "",
        error.stderr || "",
        error.code || 1,
      );
    }
  }

  /**
   * Start a process asynchronously
   */
  public static start(command: string): ChildProcess {
    const parts = command.split(" ");
    const cmd = parts[0];
    const args = parts.slice(1);
    return spawn(cmd, args, { shell: true });
  }
}

class WrappedResult implements ProcessResult {
  constructor(
    private stdout: string,
    private stderr: string,
    private code: number | null,
  ) {}

  public output(): string {
    return this.stdout.trim();
  }

  public errorOutput(): string {
    return this.stderr.trim();
  }

  public exitCode(): number | null {
    return this.code;
  }

  public successful(): boolean {
    return this.code === 0;
  }

  public failed(): boolean {
    return !this.successful();
  }
}
