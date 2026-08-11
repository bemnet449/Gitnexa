import ora, { type Ora } from "ora";

export function createSpinner(text: string): Ora {
  return ora({
    text,
    color: "cyan",
    spinner: "dots",
  });
}

export async function withSpinner<T>(
  text: string,
  work: () => Promise<T>,
  successText?: string | ((result: T) => string),
  failText = "Failed",
): Promise<T> {
  const spinner = createSpinner(text).start();
  try {
    const result = await work();
    const done =
      typeof successText === "function"
        ? successText(result)
        : (successText ?? text);
    spinner.succeed(done);
    return result;
  } catch (error) {
    spinner.fail(failText);
    throw error;
  }
}
