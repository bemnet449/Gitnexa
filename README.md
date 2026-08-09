# GitSense

AI-powered Git assistant for the terminal.

GitSense analyzes your **staged** changes, generates a Conventional Commit with Google Gemini, validates and scores the message locally, then creates the commit only after you confirm.

> CLI only for v1. The service-based architecture is designed so a VS Code extension (or other clients) can reuse the same core later.

---

## Features

- Detect Git repositories safely (no crashes outside a repo)
- Analyze staged files, diffs, and change stats
- Generate Conventional Commit messages with Gemini
- Validate commit structure (type, scope, description)
- Score commit quality locally (not AI-only)
- Confirm before committing — never auto-commits
- Show recent commit history
- Explain any commit in plain technical language

---

## Demo

```bash
$ gitsense commit

✓ 4 files staged
✓ Commit generated

Generated commit:
feat(auth): add refresh token authentication

Quality score: 95/100

✓ Valid Conventional Commit
✓ Clear description
✓ Appropriate scope
✓ Good action wording

Create this commit? (Y/n) Y

✓ Commit created successfully.
```

---

## Installation

### From source (development)

```bash
git clone https://github.com/gitsense/gitsense.git
cd gitsense
npm install
npm run build
npm link
```

### Eventually via npm

```bash
npm install -g gitsense
```

### Local development without linking

```bash
npm run dev -- analyze
npm run dev -- commit
npm run dev -- history --limit 5
npm run dev -- explain HEAD
```

---

## API key setup

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Set your key and model in `.env`:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=poolside/laguna-s-2.1:free
```

Supported providers (auto-detected):

- **OpenRouter** — keys starting with `sk-or-`, or models like `provider/model` (e.g. `poolside/laguna-s-2.1:free`)
- **Google Gemini** — Gemini API keys with models like `gemini-2.0-flash`

Get keys from [OpenRouter](https://openrouter.ai/keys) or [Google AI Studio](https://aistudio.google.com/apikey).

GitSense never hard-codes API keys and never prints them to the terminal. Put secrets only in `.env` (gitignored), never in `.env.example`.

---

## Usage

1. Enter a Git repository
2. Stage your changes: `git add .`
3. Run GitSense:

```bash
gitsense commit
```

---

## Commands

### `gitsense analyze`

Show repository info and staged change analysis.

```bash
gitsense analyze
```

Example output:

```text
Repository: travel-buddy
Branch: main

Staged files:
  • src/auth/auth.service.ts
  • src/auth/auth.controller.ts

Changes:
  +42 / -10 across 2 file(s)
```

### `gitsense commit`

Full AI commit workflow:

1. Verify repository
2. Require staged changes
3. Analyze staged diff
4. Generate Conventional Commit via Gemini
5. Validate + score
6. Ask for confirmation
7. Create the Git commit if approved

```bash
gitsense commit
```

### `gitsense history`

Show recent commits (default: 10).

```bash
gitsense history
gitsense history --limit 10
```

### `gitsense explain`

Explain a commit (default: `HEAD`).

```bash
gitsense explain HEAD
gitsense explain a83f91d
```

---

## Architecture

```text
src/
  index.ts                 # CLI entry
  commands/                # Thin Commander handlers
  services/                # Business logic
    git.service.ts
    ai.service.ts
    commit.service.ts
    score.service.ts
    history.service.ts
  validators/              # Conventional Commit rules
  prompts/                 # Gemini prompt builders + parsers
  types/                   # Shared TypeScript types
  utils/                   # Logger, formatter, errors
  config/                  # Constants
```

Responsibilities stay separated:

| Layer | Role |
| --- | --- |
| Commands | CLI UX only |
| GitService | Repository, staged diffs, history, commit execution |
| AIService | Gemini communication |
| CommitService | Commit workflow + confirmation |
| ScoreService | Local quality scoring |
| Validators | Conventional Commit structure |

---

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes (for `commit` / `explain`) | Google Gemini API key |
| `GEMINI_MODEL` | No | Model name (default `gemini-2.0-flash`) |

`.env` is ignored by git. Use `.env.example` as a template.

---

## Development

```bash
npm install
npm run dev -- --help
npm run build
```

Requirements:

- Node.js 18+
- Git installed and available on `PATH`

---

## Testing

```bash
npm test
```

Unit tests cover:

- Git repository detection
- Conventional Commit validation
- Commit scoring
- AI response parsing

External Gemini calls are mocked. Tests do **not** require a real API key.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make focused changes with tests
4. Run `npm test` and `npm run build`
5. Open a pull request

Please keep v1 scope CLI-only (no VS Code extension, web app, or backend).

---

## License

MIT — see [LICENSE](./LICENSE).
