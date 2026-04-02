# claude-env-switch

Switch between multiple environment configurations in `~/.claude/settings.json` — works on **macOS** and **Windows**.

Manage separate env setups (e.g. one for Opus, one for Sonnet, one for work vs personal) and switch between them instantly. Only the `env` key in `settings.json` is ever touched.

---

## Install

### From npm

```sh
npm install -g claude-env-switch
```

### From GitHub

```sh
npm install -g https://github.com/AdityaPedagada/claude-env-switch
```

### From a specific branch or commit

```sh
npm install -g "https://github.com/AdityaPedagada/claude-env-switch#main"
```

### Clone and install locally

```sh
git clone https://github.com/AdityaPedagada/claude-env-switch.git
cd claude-env-switch
npm install -g .
```

---

## Requirements

- **Node.js** >= 14 — [nodejs.org](https://nodejs.org)
- No other dependencies. Zero npm packages.

---

## Usage

```
claude-env <command> [args]
```

| Command | Description |
|---|---|
| `list` | List all saved configs, marks active one |
| `status` | Show active config and current `env` block |
| `show <name>` | Print the key-value pairs for a config |
| `new <name>` | Create a new config (opens file in editor) |
| `edit <name>` | Edit an existing config (opens file in editor) |
| `rename <old> <new>` | Rename a config |
| `delete <name>` | Delete a saved config |
| `use <name>` | Apply config → `~/.claude/settings.json` |
| `unset` | Remove `env` key from `~/.claude/settings.json` |

---

## How it works

**Configs are stored in:** `~/.claude-env-setup/settings-envs.json`
**Target file:** `~/.claude/settings.json` — only the `env` key is written, nothing else is touched.

When you run `claude-env use myconfig`, this is written into `settings.json`:

```json
{
  "env": {
    "ANTHROPIC_MODEL": "claude-opus-4-6",
    "ANTHROPIC_SMALL_FAST_MODEL": "claude-haiku-4-5-20251001"
  }
}
```

When you run `claude-env unset`, that `env` block is removed cleanly.

---

## Example workflow

```sh
# Create a config for Opus
claude-env new opus
# → opens ~/.claude-env-setup/settings-envs.json in your editor
# → edit the "opus" section, set your keys, save and close

# Create a config for Sonnet
claude-env new sonnet

# See all configs
claude-env list
#   opus
#   sonnet

# Switch to opus
claude-env use opus
# → Applied env config 'opus' to ~/.claude/settings.json

# Check what's active
claude-env status
# → Active env config: opus
# → Current 'env' in settings.json:
# → { "ANTHROPIC_MODEL": "claude-opus-4-6" }

# Switch to sonnet
claude-env use sonnet

# Remove env entirely
claude-env unset
```

---

## File locations

| File | Purpose |
|---|---|
| `~/.claude-env-setup/settings-envs.json` | Stores all your named configs + active marker |
| `~/.claude/settings.json` | Claude Code settings — only `env` key is modified |

---

## Publish to npm

1. Update `AdityaPedagada` in `package.json` with your GitHub username
2. Log in to npm:
   ```sh
   npm login
   ```
3. Publish:
   ```sh
   npm publish
   ```

To publish a new version:
```sh
npm version patch   # or minor / major
npm publish
```

---

## License

MIT
