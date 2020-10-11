import {Position, Rectangle} from "../util/position";
import {Tile, tile} from "../tile";

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
        this.rectangle = new Rectangle(
            Math.floor(center.x - goalTile.width / 2),
            Math.floor(center.y - goalTile.height / 2),
            goalTile.width,
            goalTile.height
        )
    }

    draw(surface: Tile) {
        surface.drawTile(goalTile, this.rectangle.x, this.rectangle.y)
    }
}