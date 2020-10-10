import {Position, Rectangle} from "./position";

export class Tile {
    private pss = new Map<string, { ch?: string, bg?: number, fg?: number }>();

    private rectangle: Rectangle | null = null;

    get x(): number {
        return this.rectangle == null ? 0 : this.rectangle.x;
    }

    get y(): number {
        return this.rectangle == null ? 0 : this.rectangle.y;
    }

    get width(): number {
        return this.rectangle == null ? 0 : this.rectangle.width;
    }

    get height(): number {
        return this.rectangle == null ? 0 : this.rectangle.height;
    }

    get(x: number, y: number): { ch?: string, bg?: number, fg?: number } {
        return this.pss.get(this.key(x, y)) ?? {};
    }

    set(x: number, y: number, p: { ch?: string, bg?: number, fg?: number }) {
        this.pss.set(this.key(x, y), {...this.get(x, y), ...p});
        if (this.rectangle == null) {
            this.rectangle = new Rectangle(x, y, 1, 1);
        } else if (!this.rectangle.contains(new Position(x, y))) {
            const left = Math.min(x, this.rectangle.x);
            const top = Math.min(y, this.rectangle.y);
            const right = Math.max(x, this.rectangle.x + this.rectangle.width - 1);
            const bottom = Math.max(y, this.rectangle.y + this.rectangle.height - 1);
            this.rectangle = new Rectangle(left, top, right - left + 1, bottom - top + 1);
        }
    }

    key(x: number, y: number) {
        return `${x},${y}`;
    }

    drawTile(tile: Tile, x: number, y: number) {
        for (let yT = 0; yT < tile.height; yT++) {
            for (let xT = 0; xT < tile.width; xT++) {
                this.set(x + xT, y + yT, tile.get(tile.x + xT, tile.y + yT));
            }
        }
    }

    print(st: string, x: number, y: number, fg: number) {
        for (let i = 0; i < st.length; i++) {
            this.set(x + i, y, {ch: st[i], fg: fg});
        }
    }
}

function getLines(strings: TemplateStringsArray, values: any[]) {
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

    const columns: string[][] = [];
    for(let line of lines){
        columns.push(line.split('|'));
    }
    return columns;
}

export function solidTile(fg: number) {
    return (strings: TemplateStringsArray, ...values: any[]) => {

        const lines = getLines(strings, values);
        const tile = new Tile();

        for (let y = 0; y < lines.length; y++) {
            for (let x = 0; x < lines[y][0].length; x++) {
                const ch = lines[y][0][x];
                const p: { ch?: string, fg?: number, bg?: number } = {};
                if (ch !== ' ') {
                    p.ch = ch;
                    p.fg = fg;
                }
                tile.set(x, y, p);
            }
        }

        return tile;
    }
}

export function tile(colors: number[]) {
    return (strings: TemplateStringsArray, ...values: any[]) => {
        const lines = getLines(strings, values);

        const tile = new Tile();
        const tileHeight = lines.length;
        const tileWidth = lines[0][0].length;
        for (let y = 0; y < tileHeight; y++) {

            for (let x = 0; x < tileWidth; x++) {

                const ch = lines[y][0][x];
                const bg = lines[y][1][x];
                const fg = lines[y][2][x];

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

                tile.set(x, y, p);
            }
        }

        return tile;
    }

}