
export class Position {

    constructor(public readonly row: number, public readonly column: number) {
    }

    left():Position{
        return this.move(0, -1);
    }

    right():Position{
        return this.move(0, 1);
    }

    above():Position{
        return this.move(-1, 0);
    }

    below():Position{
        return this.move(1, 0);
    }

    eq(pos: Position){
        return this.column === pos.column && this.row === pos.row;
    }

    move(drow: number, dcol: number) {
        return new Position(this.row + drow, this.column + dcol)
    }
}
