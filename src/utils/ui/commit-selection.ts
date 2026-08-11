import type { CommitInfo } from "../../types/git.types.js";
import { selectOption } from "./selection.js";
import { printPanel } from "./panel.js";
import { status } from "./status.js";
import { theme } from "./theme.js";

export type ExplainMode = "last" | "select";

/**
 * Ask whether to explain HEAD or pick from recent history.
 */
export async function selectExplainMode(): Promise<ExplainMode | null> {
  printPanel("Explain Commit", ["What would you like to explain?"], 44);
  status.blank();

  return selectOption<ExplainMode>("Choose an option", [
    { name: "Last commit", value: "last" },
    { name: "Select a commit", value: "select" },
  ]);
}

/**
 * Interactive list of recent commits. Returns the selected ref (hash), or null.
 */
export async function selectCommitFromList(
  commits: CommitInfo[],
  title = "Select Commit",
): Promise<string | null> {
  if (commits.length === 0) {
    return null;
  }

  printPanel(title, ["Choose a commit to explain"], 44);
  status.blank();
  status.muted("↑↓ Navigate   Enter Select");
  status.blank();

  return selectOption<string>(
    "Commit",
    commits.map((commit) => ({
      name: `${theme.hash(commit.shortHash)}  ${commit.message}`,
      value: commit.hash,
      description: `${commit.author} · ${commit.date}`,
    })),
  );
}
