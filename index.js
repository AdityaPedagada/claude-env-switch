#!/usr/bin/env node
// claude-env.js — JSON logic for claude-env.sh
// Called by claude-env.sh, never run directly by the user.
// No npm packages required — only Node.js built-ins.

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const SETTINGS  = path.join(os.homedir(), '.claude', 'settings.json');
const ENVS_FILE = path.join(os.homedir(), '.claude-env-setup', 'settings-envs.json');

// ── File helpers ──────────────────────────────────────────────────────────────

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function ensureSettings() {
  if (!fs.existsSync(SETTINGS)) {
    fs.mkdirSync(path.dirname(SETTINGS), { recursive: true });
    writeJson(SETTINGS, {});
    console.log('Created ' + SETTINGS);
  }
}

function ensureEnvsFile() {
  if (!fs.existsSync(ENVS_FILE)) {
    fs.mkdirSync(path.dirname(ENVS_FILE), { recursive: true });
    writeJson(ENVS_FILE, { configs: {} });
  }
}

const { execSync } = require('child_process');

// ── Editor opener (cross-platform, blocking) ──────────────────────────────────

function openEditor(file) {
  console.log('Opening: ' + file);
  const ed = process.env.VISUAL || process.env.EDITOR;
  if (ed) {
    execSync(ed + ' ' + JSON.stringify(file), { stdio: 'inherit' });
    return;
  }
  if (process.platform === 'darwin') {
    execSync('open -W ' + JSON.stringify(file), { stdio: 'inherit' });
    return;
  }
  if (process.platform === 'win32') {
    // start "" means no window title (required so the path isn't treated as the title)
    // /WAIT blocks until the associated app closes
    execSync('cmd.exe /c start "" /WAIT "' + file.replace(/"/g, '\\"') + '"', { stdio: 'inherit' });
    return;
  }
  // Linux fallback
  execSync('xdg-open ' + JSON.stringify(file), { stdio: 'inherit' });
}

// ── Commands ──────────────────────────────────────────────────────────────────

function cmdList() {
  ensureEnvsFile();
  const envs = readJson(ENVS_FILE);
  const configs = envs.configs || {};
  const names = Object.keys(configs);

  const active = envs.active || '';

  console.log('Saved env configs:');
  if (names.length === 0) {
    console.log('  (none)');
    return;
  }
  for (const name of names) {
    if (name === active) {
      console.log('  * ' + name + '  [active]');
    } else {
      console.log('    ' + name);
    }
  }
}

function cmdStatus() {
  ensureSettings();
  ensureEnvsFile();
  const envs = readJson(ENVS_FILE);
  const active = envs.active || '';
  const s = readJson(SETTINGS) || {};

  if (!active) {
    console.log('No env config is currently active (env key may be absent or set manually).');
  } else {
    console.log('Active env config: ' + active);
  }

  console.log('');
  console.log("Current 'env' in settings.json:");
  if (s.env) {
    console.log(JSON.stringify(s.env, null, 2));
  } else {
    console.log('(not set)');
  }
}

function cmdShow(name) {
  if (!name) { console.error('Usage: claude-env show <name>'); process.exit(1); }
  ensureEnvsFile();
  const envs = readJson(ENVS_FILE);
  const cfg = (envs.configs || {})[name];
  if (!cfg) { console.error("No config named '" + name + "'."); process.exit(1); }
  console.log("Config '" + name + "':");
  console.log(JSON.stringify(cfg, null, 2));
}

function cmdNew(name) {
  ensureEnvsFile();
  const envs = readJson(ENVS_FILE);
  envs.configs = envs.configs || {};

  if (!name) {
    console.error('Usage: claude-env new <name>');
    process.exit(1);
  }

  if (envs.configs[name]) {
    console.error("Config '" + name + "' already exists. Use 'edit' to modify it.");
    process.exit(1);
  }

  // Insert placeholder structure
  envs.configs[name] = { KEY: 'VALUE' };
  writeJson(ENVS_FILE, envs);

  openEditor(ENVS_FILE);
  console.log("Saved config '" + name + "'.");
}

function cmdEdit(name) {
  if (!name) { console.error('Usage: claude-env edit <name>'); process.exit(1); }
  ensureEnvsFile();
  const envs = readJson(ENVS_FILE);
  if (!(envs.configs || {})[name]) {
    console.error("No config named '" + name + "'. Use 'new' to create it.");
    process.exit(1);
  }

  openEditor(ENVS_FILE);
  console.log("Config '" + name + "' updated.");
}

function cmdUse(name) {
  if (!name) { console.error('Usage: claude-env use <name>'); process.exit(1); }
  ensureEnvsFile();
  ensureSettings();
  const envs = readJson(ENVS_FILE);
  const cfg = (envs.configs || {})[name];
  if (!cfg) { console.error("No config named '" + name + "'."); process.exit(1); }

  const settings = readJson(SETTINGS) || {};
  settings.env = cfg;
  writeJson(SETTINGS, settings);

  envs.active = name;
  writeJson(ENVS_FILE, envs);
  console.log("Applied env config '" + name + "' to ~/.claude/settings.json");
}

function cmdUnset() {
  ensureSettings();
  ensureEnvsFile();
  const settings = readJson(SETTINGS) || {};
  delete settings.env;
  writeJson(SETTINGS, settings);

  const envs = readJson(ENVS_FILE);
  delete envs.active;
  writeJson(ENVS_FILE, envs);
  console.log("Removed 'env' from ~/.claude/settings.json");
}

function cmdRename(oldName, newName) {
  if (!oldName || !newName) {
    console.error('Usage: claude-env rename <old> <new>');
    process.exit(1);
  }
  ensureEnvsFile();
  const envs = readJson(ENVS_FILE);
  envs.configs = envs.configs || {};

  if (!envs.configs[oldName]) {
    console.error("No config named '" + oldName + "'.");
    process.exit(1);
  }

  envs.configs[newName] = envs.configs[oldName];
  delete envs.configs[oldName];

  // Update active marker if renaming the active config
  if (envs.active === oldName) {
    envs.active = newName;
  }

  writeJson(ENVS_FILE, envs);

  console.log("Renamed '" + oldName + "' → '" + newName + "'.");
}

function cmdDelete(name) {
  if (!name) { console.error('Usage: claude-env delete <name>'); process.exit(1); }
  ensureEnvsFile();
  const envs = readJson(ENVS_FILE);
  envs.configs = envs.configs || {};
  delete envs.configs[name];
  writeJson(ENVS_FILE, envs);
  console.log("Deleted config '" + name + "'.");
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

const [,, cmd, ...args] = process.argv;

function cmdHelp() {
  console.log([
    '',
    'Usage: claude-env <command> [args]',
    '',
    'Commands:',
    '  list                  List all saved env configs (marks active)',
    '  status                Show active env and current settings.json env block',
    '  show   <name>         Print key-value pairs for a config',
    '  new    [name]         Create a new env config (opens editor)',
    '  edit   <name>         Open an existing config in editor to modify',
    '  rename <old> <new>    Rename a config',
    '  delete <name>         Delete a saved config',
    '  use    <name>         Apply config to ~/.claude/settings.json env key',
    '  unset                 Remove env key from ~/.claude/settings.json',
    '',
    'Env configs stored in : ~/.claude-env-setup/settings-envs.json',
    'Target file           : ~/.claude/settings.json  (only "env" key is touched)',
    '',
  ].join('\n'));
}

switch (cmd) {
  case 'list':          cmdList();                    break;
  case 'status':        cmdStatus();                  break;
  case 'show':          cmdShow(args[0]);             break;
  case 'new':           cmdNew(args[0]);              break;
  case 'edit':          cmdEdit(args[0]);             break;
  case 'use':           cmdUse(args[0]);              break;
  case 'unset':         cmdUnset();                   break;
  case 'rename':        cmdRename(args[0], args[1]);  break;
  case 'delete':        cmdDelete(args[0]);           break;
  case 'help':
  case '--help':
  case '-h':
  case undefined:       cmdHelp();                    break;
  default:
    console.error('Unknown command: ' + cmd);
    console.error('Run "node claude-env.js help" to see available commands.');
    process.exit(1);
}
