import {Position, Rectangle} from "../util/position";
import {darkenColor} from "../util/color";
import {tile, Tile} from "../tile";

const colors = [
    0x000000, // black
    0x202020, // fg
    0x654321, // bg
    darkenColor(0x654321, 0.5), // edgeBg
    0x202020, // fgAtGoal
    0x909021, // bgAtGoal
    darkenColor(0x909021, 0.5), // edgeBgAtGoal
]

const tiles: Tile[] = [
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

    public constructor(center: Position, private atGoal: boolean) {
        this.center = center;
        this.rectangle = new Rectangle(
            center.x - tiles[0].width / 2,
            center.y - tiles[0].height / 2,
            tiles[0].width,
            tiles[0].height
        )
    }

    draw(surface: Tile) {
        surface.drawTile(tiles[this.atGoal ? 1 : 0], this.rectangle.x, this.rectangle.y)
    }
}