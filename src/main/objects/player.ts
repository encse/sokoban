import {Position, Rectangle} from "../util/position.js";
import {Dir} from "../level.js";
import {tile, Tile} from "../tile.js";

const colors = [
    0x000000, // black
    0xA9A9A9, // dark gray
    0x808080, // gray
    0x939EDA, //
    0x880000, // red
]

const tiles: Tile[] = [
    tile(colors)`
        | █▄▄▄▄█|       | 222222|
        | ▓▓░░▓▓|   11  | 003300|
        | ▓▓░░▓▓|   44  | 003300|
    `,
    tile(colors)`
        | ▓▓▓ █▀|       | 000 22|
        | ░░░░█ | 41111 | 33332 |
        | ▓▓▓ █▄|       | 000 22|
    `,
    tile(colors)`
        | ▓▓░░▓▓|   44  | 003300|
        | ▓▓░░▓▓|   11  | 003300|
        | █▀▀▀▀█|       | 222222|
    `,
    tile(colors)`
        | ▀█ ▓▓▓|       | 22 000|
        |  █░░░░|  11114|  23333|
        | ▄█ ▓▓▓|       | 22 000|
    `,
];

export class Player {
    readonly rectangle: Rectangle;
    readonly center: Position;
    readonly dir: Dir;

    public constructor(center: Position, dir: Dir) {
        this.center = center;
        this.dir = dir;
        this.rectangle = new Rectangle(
            Math.floor(center.x - tiles[0].width / 2),
            Math.floor(center.y - tiles[0].height / 2),
            tiles[0].width,
            tiles[0].height)
    }

    public withCenter(center: Position) {
        return new Player(center, this.dir);
    }

    public withDir(dir: Dir) {
        return new Player(this.center, dir);
    }

    public draw(surface: Tile) {
        surface.drawTile(tiles[this.dir], this.rectangle.x, this.rectangle.y)
    }

}