import {Position} from "./position";
import {LevelData} from "./levelData";
import {tileHeight, tileWidth} from "./tiles";

export enum Cell {
    Wall,
    Crate,
    Player,
    Goal,
    Empty,
    Void
}

enum Direction {
    Up =    0,
    Right = 1,
    Left =  3,
    Down =  2,
}

export class Level {
    readonly author: string;
    readonly title: string;
    readonly ccol: number;
    readonly crow: number;

    private goalPositionsI: Position[] = [];
    private wallPositionsI: Position[] = [];
    private voidPositionsI: Position[] = [];
    private cratePositionsI: Position[] = [];
    private playerPositionI: Position;
    private playerDirectionI = Direction.Right;
    private completedI: boolean = false;

    private stepsI: number = 0;
    private firstStepTime: number = 0;
    private lastStepTime: number = 0;


    get completed(): boolean {
        return this.completedI;
    }

    get cratesAtGoal(): number{
        return this.cratePositions.filter(cratePosition => this.isGoal(cratePosition)).length;
    }

    get time() {
        const stop = this.steps == 0 || this.completed ? this.lastStepTime : Date.now();
        return Math.floor((stop - this.firstStepTime) / 1000);
    }

    get playerPosition() {
        return this.playerPositionI;
    }

    get goalPositions(){
        return this.goalPositionsI;
    }

    get wallPositions(){
        return this.wallPositionsI;
    }

    get voidPositions(){
        return this.voidPositionsI;
    }

    get steps(){
        return this.stepsI;
    }

    get cratePositions(){
        return this.cratePositionsI;
    }
    get playerDirection(){
        return this.playerDirectionI;
    }

    get width() {
        return this.ccol * tileWidth;
    };

    get height() {
        return this.crow * tileHeight;
    };

    constructor(levelData: LevelData) {
        const map = levelData.map.split('\n');
        this.ccol = Math.max(...map.map(x => x.length));
        this.crow = map.length;
        this.title = levelData.title;
        this.author = levelData.author;
        this.playerPositionI = this.find(map, '@')[0];
        this.cratePositionsI = this.find(map, '$');
        this.wallPositionsI = this.find(map, '#');
        this.goalPositionsI = this.find(map, '.');
        this.voidPositionsI = this.findVoids(map);
    }

    isGoal(pos: Position) {
        return this.goalPositions.some(goal => goal.eq(pos));
    }

    isWall(pos: Position) {
        return this.wallPositions.some(wall => wall.eq(pos));
    }

    isCrate(pos: Position) {
        return this.cratePositions.some(crates => crates.eq(pos));
    }

    private getCell2(pos: Position): Cell {
        if (!this.validPos(pos)) {
            return Cell.Void;
        } else if (this.playerPosition.eq(pos)) {
            return Cell.Player;
        } else if (this.isWall(pos)) {
            return Cell.Wall;
        } else if (this.isCrate(pos)) {
            return Cell.Crate;
        } else if (this.isGoal(pos)) {
            return Cell.Goal;
        } else {
            return Cell.Empty;
        }
    }

    getCell(row: number, column: number): Cell {

        const pos = new Position(Math.floor(row / tileHeight), Math.floor(column / tileWidth));
        return this.getCell2(pos);
    }

    move(drow: number, dcol: number): boolean {
        const newPosition = this.playerPosition.move(drow, dcol);
        const oldPlayerPosition = this.playerPosition;
        this.playerDirectionI =
            drow == 1 && dcol == 0 ? Direction.Down :
            drow == -1 && dcol == 0 ? Direction.Up :
            drow == 0 && dcol == -1 ? Direction.Left :
            drow == 0 && dcol == 1 ? Direction.Right :
            this.playerDirection;

        switch (this.getCell2(newPosition)) {
            case Cell.Wall:
            case Cell.Player:
                break;
            case Cell.Crate:
                const newCratePosition = this.playerPosition.move(2 * drow, 2 * dcol);
                if (!this.isWall(newCratePosition) && !this.isCrate(newCratePosition)) {
                    this.playerPositionI = newPosition;
                    const icrate = this.cratePositions.findIndex(crate => crate.eq(newPosition));
                    this.cratePositions.splice(icrate, 1, newCratePosition);
                }
                break;
            case Cell.Goal:
            case Cell.Empty:
            case Cell.Void:
                this.playerPositionI = newPosition;
                break;

        }

        if (!oldPlayerPosition.eq(this.playerPosition)) {
            const now = Date.now();
            if (this.steps == 0) {
                this.firstStepTime = now;
            }
            if (!this.completed) {
                this.stepsI++;
                this.lastStepTime = now;
            }

            this.completedI = this.cratesAtGoal === this.cratePositions.length;
            return true;
        } else {
            return false
        }
    }

    left(): boolean {
        return this.move(0, -1);
    }

    right(): boolean {
        return this.move(0, 1);
    }

    up(): boolean {
        return this.move(-1, 0);
    }

    down(): boolean {
        return this.move(1, 0);
    }

    private validPos(pos: Position): boolean {
        const {row, column} = pos;
        return (
            row >= 0 && row < this.crow &&
            column >= 0 && column < this.ccol &&
            !this.voidPositions.some(p => p.eq(pos))
        );
    }

    private* positions(): Iterable<Position> {
        for (let irow = 0; irow < this.crow; irow++) {
            for (let icol = 0; icol < this.ccol; icol++) {
                yield new Position(irow, icol);
            }
        }
    }

    private find(map: string[], ch: string): Position[] {
        return [...this.positions()].filter(pos => Level.getCh(map, pos) === ch);
    }

    private findVoids(map: string[]): Position[] {
        const voids: Position[] = [];
        let ps = new Set(this.positions());

        const has = (p: Position) => voids.some(v => v.eq(p));
        let any = true;
        while (any) {
            any = false;
            for (let p of [...ps]) {
                if (Level.getCh(map, p) == ' ' && (
                    p.column == 0 ||
                    p.column == map[p.row].length - 1 ||
                    p.row == 0 ||
                    p.row == map.length - 1 ||
                    has(p.above()) ||
                    has(p.below()) ||
                    has(p.left()) ||
                    has(p.right()))
                ) {
                    ps.delete(p);
                    voids.push(p);
                    any = true;
                }
            }
        }
        return voids;
    }

    private static getCh(map: string[], position: Position): string {
        const {row, column} = position;
        if (row >= 0 && row < map.length && column >= 0 && column < map[row].length) {
            return map[row][column];
        }
        return ' ';
    }

}