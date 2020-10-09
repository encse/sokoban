import {Tile, tile} from "../util/stripMargin";
import {Position, Rectangle} from "../position";
import {tileHeight, tileWidth} from "../tiles";

const colors = [
    0x0000ff
]

const goalTile = tile(colors)`
     |       |       |       |
    |   /\\  |       |   00  |
    |   \\/  |       |   00  |
`;

export class Goal {
    readonly rectangle: Rectangle;
    readonly center: Position;

    public constructor(center: Position) {
        this.center = center;
        this.rectangle = new Rectangle(Math.floor(center.x - tileWidth / 2), Math.floor(center.y - tileHeight / 2), tileWidth, tileHeight)
    }

    draw(tile: Tile) {
        tile.drawTile(goalTile, this.rectangle.x, this.rectangle.y)
    }
}