export class Rectangle {
    constructor(
        public readonly x: number,
        public readonly y: number,
        public readonly width: number,
        public readonly height: number
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

    move(drow: number, dcol: number) {
        return new Rectangle(this.x + dcol, this.y + drow, this.width, this.height);
    }

    get center(): Position {
        return new Position(this.x + this.width / 2, this.y + this.height / 2);
    }

    eq(playerRectangle: Rectangle) {
        return this.y == playerRectangle.y && this.x == playerRectangle.x && this.width == playerRectangle.width && this.height == playerRectangle.height;
    }
}

export class Position {

    constructor(public readonly x: number, public readonly y: number) {
    }

    eq(pos: Position){
        return this.x === pos.x && this.y === pos.y;
    }

    move(drow: number, dcol: number) {
        return new Position(this.x + dcol, this.y + drow)
    }
}
