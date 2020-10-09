import {stripMargin, tile} from "../util/stripMargin";
import {Position, Rectangle} from "../position";
import {tileHeight, tileWidth} from "../tiles";
import {darkenColor} from "../color";
import {Level, Tile} from "../level";
import {Screen, Sprite} from "../draw";

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
        |┌┬┬┬┬┐█|2222223|1111111
        |│├ΘΘ├│█|2222223|1111111
        |└┴┴┴┴┘█|2222223|1111111
    `,
    tile(colors)`
        |┌┬┬┬┬┐█|5555556|4444444
        |│├ΘΘ├│█|5555556|4444444
        |└┴┴┴┴┘█|5555556|4444444
    `
];

export class Crate {
    readonly rectangle: Rectangle;
    readonly center: Position;

    public constructor(center: Position) {
        this.center = center;
        this.rectangle = new Rectangle(
            Math.floor(center.y - tileHeight / 2),
            Math.floor(center.x - tileWidth / 2),
            tileHeight,
            tileWidth
        )
    }

    draw(screen: Screen, level: Level) {
        screen.drawTile(tiles[level.isGoal(this.center) ? 1 : 0], this.rectangle.x, this.rectangle.y)
    }

}