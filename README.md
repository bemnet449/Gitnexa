# ⚡ Gitzap

AI-powered Git assistant for the terminal. Zap out clean, Conventional Commit messages from your staged changes — reviewed and scored before anything gets committed.

## Install

```bash
npm install -g gitzap
```

## Setup

```bash
gitzap setup
```

You'll be asked for an API key and, optionally, a model name.

- Get a key: [Google AI Studio](https://aistudio.google.com/apikey) or [OpenRouter](https://openrouter.ai/keys)
- No model preference? Use `openrouter/free` — it auto-picks whichever free model is currently available.

Config is saved once to `~/.gitzap/.env` and works across every project on your machine. Run `gitzap setup` again anytime to update your key or model.

## Usage

```bash
git add .
gitzap commit
```

Gitzap analyzes your staged diff, generates a Conventional Commit message, scores it for quality, and asks you to confirm before committing. Nothing is ever auto-committed.

## Commands

| Command | What it does |
|---|---|
| `gitzap setup` | Configure or update your API key and model |
| `gitzap analyze` | Preview staged files and change stats |
| `gitzap commit` | Generate, review, and confirm a commit message |
| `gitzap history` | Show recent commits (`-l, --limit <number>`) |
| `gitzap explain [ref]` | Explain any commit in plain language |

## Requirements

- Node.js 18+
- Git installed and on your `PATH`

## License

MIT
