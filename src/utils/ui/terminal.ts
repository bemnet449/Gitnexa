import { stdout } from "node:process";

const MIN_WIDTH = 60;
const FALLBACK_WIDTH = 80;

/** Usable line width based on the current terminal (or a sensible fallback). */
export function getTerminalWidth(): number {
  const columns = stdout.columns;
  if (!columns || columns < MIN_WIDTH) {
    return FALLBACK_WIDTH;
  }
  return columns;
}
