import {Tile} from "../level";
import {tileHeight, tileWidth} from "../tiles";
import {Paxel} from "../draw";

export function stripMargin(strings: TemplateStringsArray, ...values: any[]): string {
    let s = strings[0];
    for (let i = 0; i < values.length; i++) {
        s += values[i];
        s += strings[i + 1];
    }
    return (s
            .split("\n")
            .filter(line => line.match(/^\s*\| /))
            .map(line => line.replace(/^\s*\| /, ""))
            .join('\n')
    );
}

export function tile(colors: number[]) {
    return (strings: TemplateStringsArray, ...values: any[]) => {
        let s = strings[0];
        for (let i = 0; i < values.length; i++) {
            s += values[i];
            s += strings[i + 1];
        }
        const lines = (s
                .split("\n")
                .filter(line => line.match(/^\s*\|/))
                .map(line => line.replace(/^\s*\|/, ""))
                .join('\n')
        ).split('\n');

        const res = [];

        for (let tileRow = 0; tileRow < tileHeight; tileRow++) {
            const line: { ch?: string, fg?: number, bg?: number }[] = [];
            res.push(line);

            for (let tileCol = 0; tileCol < tileWidth; tileCol++) {

                const ch = lines[tileRow][tileCol];
                const bg = lines[tileRow][tileCol + tileWidth + 1];
                const fg = lines[tileRow][tileCol + 2 * tileWidth + 2];

                const p: { ch?: string, fg?: number, bg?: number } = {};
                if (ch != ' ') {
                    p.ch = ch;
                }
                if (fg != ' ') {
                    p.fg = colors[fg.charCodeAt(0) - '0'.charCodeAt(0)];
                }
                if (bg != ' ') {
                    p.bg = colors[bg.charCodeAt(0) - '0'.charCodeAt(0)];
                }

                line.push(p);
            }
        }

        return res;
    }

}