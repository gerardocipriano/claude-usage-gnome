#!/usr/bin/env bash
# Installs the extension for the current user and enables it.
set -euo pipefail
UUID=claude-usage@gcipriano
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"
SRC="$(cd "$(dirname "$0")" && pwd)/$UUID"

[ -f "$HOME/.claude/.credentials.json" ] || { echo "Missing ~/.claude/.credentials.json: log in with Claude Code first (claude /login)." >&2; exit 1; }

mkdir -p "$DEST"
cp "$SRC"/* "$DEST"/
chmod +x "$DEST/usage.py"

python3 - "$UUID" <<'PY'
import ast, subprocess, sys
key = ['org.gnome.shell', 'enabled-extensions']
cur = ast.literal_eval(subprocess.check_output(['gsettings', 'get', *key]).decode().replace('@as ', ''))
if sys.argv[1] not in cur:
    subprocess.check_call(['gsettings', 'set', *key, str(cur + [sys.argv[1]])])
PY

echo "Test: $(python3 "$DEST/usage.py")"
echo "Installed. Log out and back in (Wayland) to load it."
