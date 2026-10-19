import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const REFRESH_S = 120;
const BAR_W = 70;

export default class ClaudeUsage extends Extension {
    enable() {
        this._data = null;
        this._widgets = [];
        this._attach();
        this._refresh();
        this._timer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, REFRESH_S, () => {
            this._refresh();
            return GLib.SOURCE_CONTINUE;
        });
        // The dock rebuilds its children: re-check the attachment.
        this._attachTimer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 5, () => {
            this._attach();
            return GLib.SOURCE_CONTINUE;
        });
    }

    disable() {
        GLib.source_remove(this._timer);
        GLib.source_remove(this._attachTimer);
        this._widgets.forEach(w => w.destroy());
        this._widgets = [];
    }

    _attach() {
        this._widgets = this._widgets.filter(w => w.get_parent());
        for (const dock of Main.layoutManager.uiGroup.get_children()) {
            if (dock.name !== 'dashtodockContainer' || !dock.dash?._showAppsIcon)
                continue;
            const icon = dock.dash._showAppsIcon;
            const parent = icon.get_parent();
            if (!parent || this._widgets.some(w => w.get_parent() === parent))
                continue;
            const w = this._buildWidget();
            parent.insert_child_below(w, icon);
            this._widgets.push(w);
        }
    }

    _buildPill(keys) {
        const box = new St.BoxLayout({style_class: 'cu-box', vertical: true,
            y_align: Clutter.ActorAlign.CENTER});
        const rows = keys.map(key => {
            const r = new St.BoxLayout({style_class: 'cu-row'});
            const track = new St.Widget({style_class: 'cu-track', y_align: Clutter.ActorAlign.CENTER});
            const fill = new St.Widget({style_class: 'cu-fill'});
            track.add_child(fill);
            const pct = new St.Label({style_class: 'cu-pct', y_align: Clutter.ActorAlign.CENTER});
            r.add_child(new St.Label({style_class: 'cu-key', text: key, y_align: Clutter.ActorAlign.CENTER}));
            r.add_child(track);
            r.add_child(pct);
            box.add_child(r);
            return {row: r, fill, pct};
        });
        return [box, rows];
    }

    _buildWidget() {
        const [w, [h, s]] = this._buildPill(['5h', '7d']);
        w._h = h;
        w._s = s;
        w._till = new St.Label({style_class: 'cu-till', y_align: Clutter.ActorAlign.CENTER});
        h.row.add_child(w._till);
        this._update(w);
        return w;
    }

    _set(r, v) {
        if (v === undefined) {
            r.pct.text = '—';
            r.fill.width = 0;
            return;
        }
        const c = v < 50 ? '#57c785' : v < 80 ? '#f0b429' : '#ef5350';
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        r.fill.style = `background-color: ${c};`;
        r.fill.width = Math.round(BAR_W * scale * Math.min(v, 100) / 100);
        r.pct.text = `${v}%`;
        r.pct.style = v >= 80 ? `color: ${c};` : '';
    }

    _update(w) {
        this._set(w._h, this._data?.h);
        this._set(w._s, this._data?.s);
        w._till.text = this._data ? `↻ ${this._data.till}` : 'n/d';
    }

    _refresh() {
        const proc = Gio.Subprocess.new(['python3', `${this.path}/usage.py`],
            Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_SILENCE);
        proc.communicate_utf8_async(null, null, (p, res) => {
            try {
                const [, out] = p.communicate_utf8_finish(res);
                this._data = JSON.parse(out);
            } catch {
                this._data = null;
            }
            this._widgets.forEach(w => this._update(w));
        });
    }
}
