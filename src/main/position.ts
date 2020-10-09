import {tileHeight, tileWidth} from "./tiles";

export class Rectangle {
    constructor(
        public readonly y: number,
        public readonly x: number,
        public readonly height: number,
        public readonly width: number
    ) {
    }

    contains(position: Position) {
        return (
            this.y <= position.y &&
            position.y < this.y + this.height &&
            this.x <= position.x &&
            position.x < this.x + this.width
        );
    }

    moveTile(drow: number, dcol: number) {
        return new Rectangle(this.y + drow * tileHeight, this.x + dcol * tileWidth, this.height, this.width);
    }

    move(drow: number, dcol: number) {
        return new Rectangle(this.y + drow, this.x + dcol, this.height, this.width);
    }

    get center(): Position {
        return new Position(this.y + this.height/2, this.x+this.width/2);
    }

    eq(playerRectangle: Rectangle) {
        return this.y == playerRectangle.y && this.x == playerRectangle.x && this.width == playerRectangle.width && this.height == playerRectangle.height;
    }
}

export class Position {

    constructor(public readonly y: number, public readonly x: number) {
    }

    tileLeft():Position{
        return this.moveTile(0, -1);
    }

    tileRight():Position{
        return this.moveTile(0, 1);
    }

    tileAbove():Position{
        return this.moveTile(-1, 0);
    }

    tileBelow():Position{
        return this.moveTile(1, 0);
    }

    eq(pos: Position){
        return this.x === pos.x && this.y === pos.y;
    }

    moveTile(drow: number, dcol: number) {
        return new Position(this.y + drow*tileHeight, this.x + dcol*tileWidth)
    }

    move(drow: number, dcol: number) {
        return new Position(this.y + drow, this.x + dcol)
    }
}
