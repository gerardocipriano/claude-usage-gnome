# Claude Usage — GNOME dock widget

Your Claude Pro/Max plan usage, always visible in the Ubuntu dock, right next to the "Show Apps" button.

```
5h ▰▰▱▱▱▱▱ 18%  ↻ 10:59
7d ▰▱▱▱▱▱▱  3%
```

- **5h**: usage of the current 5-hour session window, with the reset time (`↻`).
- **7d**: usage of the weekly limit.
- Bars turn **green** under 50%, **amber** under 80%, **red** above.
- Refreshes every 2 minutes.

## Requirements

- GNOME Shell 50 with the Ubuntu Dock (`ubuntu-dock@ubuntu.com`) at the bottom.
- `python3`.
- [Claude Code](https://docs.claude.com/en/docs/claude-code) logged in with a Pro/Max account: the widget reads the OAuth token from `~/.claude/.credentials.json`.

## Install (human)

```bash
git clone https://github.com/gerardocipriano/claude-usage-gnome.git
cd claude-usage-gnome
./install.sh
```

Then **log out and log back in**. On Wayland, GNOME Shell only detects new extensions at login.

## Install (agentic)

Paste this into Claude Code (or any coding agent with shell access):

> Install the GNOME extension from https://github.com/gerardocipriano/claude-usage-gnome.
> 1. Check `gnome-shell --version` is 50 and `ubuntu-dock@ubuntu.com` is enabled; stop and tell me if not.
> 2. Check `~/.claude/.credentials.json` exists; if not, tell me to run `claude /login`.
> 3. Clone the repo to `~/code/claude-usage-gnome` and run `./install.sh`.
> 4. Confirm the `Test:` line prints JSON like `{"h": 18, "s": 3, "till": "10:59"}`.
> 5. Tell me to log out and back in, then to check the dock.

Notes for agents:
- `install.sh` is idempotent: it copies the files to `~/.local/share/gnome-shell/extensions/claude-usage@gcipriano/` and adds the UUID to `org.gnome.shell enabled-extensions`.
- `gnome-extensions enable` fails before the next login on Wayland: that is expected, `install.sh` uses `gsettings` instead.
- Debug after login: `journalctl --user -b | grep -i claude-usage`.

## How it works

`usage.py` calls `https://api.anthropic.com/api/oauth/usage` (the same endpoint Claude Code uses for `/usage`) with your local OAuth token and prints `{h, s, till}`. `extension.js` runs it periodically and inserts a small widget before the dock's "Show Apps" icon. The token never leaves your machine except toward `api.anthropic.com`.

The endpoint is undocumented and may change. If the token expires and Claude Code has not refreshed it, the widget shows `n/d`: open Claude Code once to refresh it.

## Customize

- Refresh interval: `REFRESH_S` in `extension.js`.
- Colors and sizes: `stylesheet.css` (`BAR_W` in `extension.js` must match `.cu-track` width).

## Uninstall

```bash
gnome-extensions disable claude-usage@gcipriano
rm -rf ~/.local/share/gnome-shell/extensions/claude-usage@gcipriano
```

## License

MIT
