import {Tile} from "../tile.js";
import {Player} from "./player.js";
import {darkenColor} from "../util/color.js";

export class Track {
    private prev: Track | null = null;
    private steps: [number, number][] = [];

    visit(player: Player, horiz: boolean, vert: boolean): Track {
        const res = new Track();
        res.prev = this;
        if (horiz) {
            for (let i = 0; i < player.rectangle.width; i++) {
                res.steps.push([player.rectangle.x + i, player.rectangle.y]);
                res.steps.push([player.rectangle.x + i, player.rectangle.y + player.rectangle.height - 1]);
            }
        }
        if (vert) {
            for (let i = 0; i < player.rectangle.height; i++) {
                res.steps.push([player.rectangle.x + 1, player.rectangle.y + i]);
                res.steps.push([player.rectangle.x + 2, player.rectangle.y + i]);
                res.steps.push([player.rectangle.x + player.rectangle.width - 1, player.rectangle.y + i]);
                res.steps.push([player.rectangle.x + player.rectangle.width - 2, player.rectangle.y + i]);
            }
        }
        return res;
    }

    draw(surface: Tile) {
        let track: Track | null = this;
        while (track != null) {
            for (let [x, y] of track.steps) {
                const p = surface.get(x, y);
                if (p.fg != null) {
                    surface.set(x, y, {...p, fg: darkenColor(p.fg, 0.95)});
                }
            }

            track = track.prev;
        }
    }
}
