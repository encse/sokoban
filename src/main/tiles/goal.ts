import {tile} from "../util/stripMargin";
import {Position, Rectangle} from "../position";
import {tileHeight, tileWidth} from "../tiles";
import {Screen} from "../draw";

const colors = [
    0x008800
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
            Math.floor(center.y - tileHeight / 2),
            Math.floor(center.x - tileWidth / 2),
            tileHeight,
            tileWidth
        )
    }

    draw(screen: Screen) {
        screen.drawTile(goalTile, this.rectangle.x, this.rectangle.y)
    }
}