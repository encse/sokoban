import {tileHeight, tileWidth} from "./tiles";

export class Rectangle {
    constructor(
        public readonly row: number,
        public readonly col: number,
        public readonly height: number,
        public readonly width: number
    ) {
    }

    contains(position: Position) {
        return (
            this.row <= position.row &&
            position.row < this.row + this.height &&
            this.col <= position.col &&
            position.col < this.col + this.width
        );
    }

    moveTile(drow: number, dcol: number) {
        return new Rectangle(this.row + drow * tileHeight, this.col + dcol * tileWidth, this.height, this.width);
    }

    move(drow: number, dcol: number) {
        return new Rectangle(this.row + drow, this.col + dcol, this.height, this.width);
    }

    get center(): Position {
        return new Position(this.row + this.height/2, this.col+this.width/2);
    }

    eq(playerRectangle: Rectangle) {
        return this.row == playerRectangle.row && this.col == playerRectangle.col && this.width == playerRectangle.width && this.height == playerRectangle.height;
    }
}

export class Position {

    constructor(public readonly row: number, public readonly col: number) {
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
        return this.col === pos.col && this.row === pos.row;
    }

    moveTile(drow: number, dcol: number) {
        return new Position(this.row + drow*tileHeight, this.col + dcol*tileWidth)
    }

    move(drow: number, dcol: number) {
        return new Position(this.row + drow, this.col + dcol)
    }
}
