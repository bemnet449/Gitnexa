# ⚡ Gitnexa

[![npm version](https://img.shields.io/npm/v/gitnexa)](https://www.npmjs.com/package/gitnexa)
[![npm downloads](https://img.shields.io/npm/dw/gitnexa)](https://www.npmjs.com/package/gitnexa)
[![license](https://img.shields.io/npm/l/gitnexa)](./LICENSE)

AI-powered Git assistant for the terminal. Get smart, Conventional Commit messages from your staged changes — reviewed and scored before anything gets committed.

## Install

```bash
npm install -g gitnexa
```

## Setup

```bash
gitnexa setup
```

You'll be asked for an API key and, optionally, a model name.

- Get a key: [Google AI Studio](https://aistudio.google.com/apikey) or [OpenRouter](https://openrouter.ai/keys)
- No model preference? Use `openrouter/free` — it auto-picks whichever free model is currently available.

Config is saved once to a config file in your home directory and works across every project on your machine. Run `gitnexa setup` again anytime to update your key or model.

## Usage

```bash
git add .
gitnexa commit
```

Gitnexa analyzes your staged diff, generates a Conventional Commit message, scores it for quality, and asks you to confirm before committing. Nothing is ever auto-committed.

## Commands

| Command | What it does |
|---|---|
| `gitnexa setup` | Configure or update your API key and model |
| `gitnexa analyze` | Preview staged files and change stats |
| `gitnexa commit` | Generate, review, and confirm a commit message |
| `gitnexa history` | Show recent commits (`-l, --limit <number>`) |
| `gitnexa explain [ref]` | Explain any commit in plain language |

## Requirements

- Node.js 18+
- Git installed and on your `PATH`

## License

MIT