import {Position} from "../position";
import {fuzzyColor} from "../draw";
import {Random} from "../util/pick";
import {Tile} from "../tile";

export const baseFg = 0x424242;
export const baseBg = 0x505050;

const random = new Random(0);

function createFloorTile(width: number, height: number, isVoid: (pos: Position) => boolean): Tile {
    let ch = random.pick('▓▒░ '.split(''));
    let prevCellIsVoid = true;
    const tile = new Tile();
    for (let y = 0; y < height; y++) {
        let fg: number = 0;
        let bg: number = 0;
        for (let x = 0; x < width; x++) {
            let cellIsVoid = isVoid(new Position(x, y));
            if (x % 2 == 0 || prevCellIsVoid !== cellIsVoid) {
                fg = fuzzyColor(random, baseFg);
                bg = cellIsVoid ? 0 : fuzzyColor(random, baseBg);
                ch = cellIsVoid ? ' ' : random.pick('▓▒░ '.split(''));
            }
            prevCellIsVoid = cellIsVoid;
            tile.set(x, y, {ch, fg, bg});
        }
    }
    return tile;
}

export class Floor {
    readonly tile: Tile;

    public constructor(width: number, height: number, isVoid: (pos: Position) => boolean) {
        this.tile = createFloorTile(width, height, isVoid);
    }

    public draw(surface: Tile) {
        surface.drawTile(this.tile, 0, 0);
    }
}