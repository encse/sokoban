import {Tile, tile} from "../util/stripMargin";
import {Position, Rectangle} from "../position";
import {tileHeight, tileWidth} from "../tiles";
import {darkenColor} from "../color";
import {Level} from "../level";

const colors = [
    0x000000, // black
    0x202020, // fg
    0x654321, // bg
    darkenColor(0x654321, 0.5), // edgeBg
    0x202020, // fgAtGoal
    0x909021, // bgAtGoal
    darkenColor(0x909021, 0.5), // edgeBgAtGoal
]

const tiles:Tile[] = [
    tile(colors)`
        |┌┬┬┬┬┐▄|222222 |1111113|
        |│├ΘΘ├│█|2222223|1111113|
        |└┴┴┴┴┘█|2222223|1111113|
    `,
    tile(colors)`
        |┌┬┬┬┬┐▄|555555 |4444446|
        |│├ΘΘ├│█|5555556|4444446|
        |└┴┴┴┴┘█|5555556|4444446|
    `
];

export class Crate {
    readonly rectangle: Rectangle;
    readonly center: Position;

    public constructor(center: Position) {
        this.center = center;
        this.rectangle = new Rectangle(Math.floor(center.x - tileWidth / 2), Math.floor(center.y - tileHeight / 2), tileWidth, tileHeight)
    }

    draw(tile: Tile, level: Level) {
        tile.drawTile(tiles[level.isGoal(this.center) ? 1 : 0], this.rectangle.x, this.rectangle.y)
    }
}