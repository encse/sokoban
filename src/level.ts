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

export enum Dir {
    Up =    0,
    Right = 1,
    Down =  2,
    Left =  3,
}

const horiz = (dir: Dir) => dir === Dir.Left || dir === Dir.Right;
const vert = (dir: Dir) => !horiz(dir);


type State = {
    readonly time: number;
    readonly author: string;
    readonly title: string;
    readonly ccol: number;
    readonly crow: number;
    readonly goalPositions: readonly Position[];
    readonly wallPositions: readonly Position[];
    readonly voidPositions: readonly Position[];
    readonly cratePositions: readonly Position[];
    readonly playerPosition: Position;
    readonly playerDirection: Dir;
    readonly completed: boolean;
    readonly steps: number;
    readonly pushes: number;
    readonly visitedHoriz: ReadonlyMap<string, number>;
    readonly visitedVert: ReadonlyMap<string, number>;
}


function* positions(crow: number, ccol: number): Iterable<Position> {
    for (let irow = 0; irow < crow; irow++) {
        for (let icol = 0; icol < ccol; icol++) {
            yield new Position(irow, icol);
        }
    }
}


function  getCh(map: string[], position: Position): string {
    const {row, column} = position;
    if (row >= 0 && row < map.length && column >= 0 && column < map[row].length) {
        return map[row][column];
    }
    return ' ';
}


function find(map: string[], crow: number, ccol: number, ch: string): Position[] {
    return [...positions(crow, ccol)].filter(pos => getCh(map, pos) === ch);
}

function findVoids(map: string[],crow: number, ccol: number, ): Position[] {
    const voids: Position[] = [];
    let ps = new Set(positions(crow, ccol));

    const has = (p: Position) => voids.some(v => v.eq(p));
    let any = true;
    while (any) {
        any = false;
        for (let p of [...ps]) {
            if (getCh(map, p) == ' ' && (
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

const visibilityCache = new Map<string, boolean>();


export class Level {

    public get author() {return this.state.author;}
    public get title() {return this.state.title;}
    public get ccol() {return this.state.ccol;}
    public get crow() {return this.state.crow;}
    public get goalPositions() {return this.state.goalPositions;}
    public get wallPositions() {return this.state.wallPositions;}
    public get cratePositions() {return this.state.cratePositions;}
    public get voidPositions() {return this.state.voidPositions;}
    public get playerPosition() {return this.state.playerPosition;}
    public get playerDirection() {return this.state.playerDirection;}
    public get steps() {return this.state.steps;}
    public get pushes() {return this.state.pushes;}
    public get time() {return this.state.time;}
    public get completed() {return this.state.completed;}



    get width() {
        return this.ccol * tileWidth;
    };

    get height() {
        return this.crow * tileHeight;
    };

    private constructor(private readonly state: State) {

    }

    public static fromData(levelData: LevelData):Level{
        const map = levelData.map.split('\n');
        const ccol= Math.max(...map.map(x => x.length));
        const crow = map.length;
        return new Level({
            ccol : ccol,
            crow : crow,
            title : levelData.title,
            author: levelData.author,
            playerPosition: find(map, crow, ccol, '@')[0],
            wallPositions: find(map, crow, ccol, '#'),
            goalPositions: find(map, crow, ccol, '.'),
            voidPositions: findVoids(map, crow, ccol),
            completed:false,
            cratePositions: find(map, crow, ccol, '$'),
            playerDirection: Dir.Right,
            steps: 0,
            pushes: 0,
            time: 0,
            visitedHoriz: new Map<string, number>(),
            visitedVert: new Map<string, number>()
        });
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

    public getCell2(pos: Position): Cell {
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

    move(drow: number, dcol: number) {
        let oldState = this.state;
        let newState: State = oldState;
        const newPosition = this.playerPosition.move(drow, dcol);


        switch (this.getCell2(newPosition)) {
            case Cell.Wall:
            case Cell.Player:
                break;
            case Cell.Crate:
                const newCratePosition = this.playerPosition.move(2 * drow, 2 * dcol);
                if (!this.completed && !this.isWall(newCratePosition) && !this.isCrate(newCratePosition)) {
                    const icrate = this.cratePositions.findIndex(crate => crate.eq(newPosition));
                    const newCratePositions = this.cratePositions.map((cratePosition, i) => i == icrate ? newCratePosition : cratePosition);
                    const newCompleted = newCratePositions.every(cratePosition => this.isGoal(cratePosition));
                    newState = {
                        ...newState,
                        pushes: this.pushes + 1,
                        steps: this.steps + 1,
                        playerPosition: newPosition,
                        cratePositions: newCratePositions,
                        completed: newCompleted,
                    };
                }
                break;
            case Cell.Goal:
            case Cell.Empty:
            case Cell.Void:
                newState = {
                    ...newState,
                    playerPosition: newPosition,
                    steps: this.steps + 1,
                };
                break;
        }


        const inc = (map: ReadonlyMap<string, number>, position: Position): ReadonlyMap<string, number> => {
            const key = this.getKey(position.row, position.column);
            const res = new Map<string, number>(map.entries());
            res.set(key, (map.get(key) ?? 0) + 1);
            return res;
        };

        const incHoriz = (state: State, position: Position) => {
            return  {
                ...state,
                visitedHoriz: inc(state.visitedHoriz, position)
            }
        };

        const incVert = (state: State, position: Position) => {
            return  {
                ...state,
                visitedVert: inc(state.visitedVert, position)
            }
        };

        newState = {
            ...newState,
            playerDirection:
                drow == 1 && dcol == 0 ? Dir.Down :
                drow == -1 && dcol == 0 ? Dir.Up :
                drow == 0 && dcol == -1 ? Dir.Left :
                drow == 0 && dcol == 1 ? Dir.Right :
                this.playerDirection
        };

        // turn in original position
        if (newState.playerDirection !== oldState.playerDirection) {
            if (vert(oldState.playerDirection)) {
                if (horiz(newState.playerDirection)){
                    newState = incHoriz(newState, oldState.playerPosition);
                } else {
                    newState = incHoriz(newState, oldState.playerPosition);
                    newState = incVert(newState, oldState.playerPosition);
                }
            } else {
                if (vert(newState.playerDirection)){
                    newState = incVert(newState, oldState.playerPosition);
                } else {
                    newState = incVert(newState, oldState.playerPosition);
                    newState = incHoriz(newState, oldState.playerPosition);
                }
            }
        }

        if (!oldState.playerPosition.eq(newState.playerPosition)) {
            if (horiz(newState.playerDirection)) {
                newState = incHoriz(newState, newState.playerPosition);
            } else {
                newState = incVert(newState, newState.playerPosition);
            }
        }

        return new Level(newState);
    }

    private getKey(row: number, column: number) {
        return `${row};${column}`
    }

    left() {
        return this.move(0, -1);
    }

    right() {
        return this.move(0, 1);
    }

    up() {
        return this.move(-1, 0);
    }

    down() {
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


    tick() {
        return this.completed || this.steps == 0 ? this : new Level({...this.state, time: this.state.time+1});
    }

    visitedHoriz(row: number, column: number) {
        return this.state.visitedHoriz.get(this.getKey(row, column)) ?? 0;
    }
    visitedVert(row: number, column: number) {
        return this.state.visitedVert.get(this.getKey(row, column)) ?? 0;
    }


    visible(x1:number, y1:number, x2:number, y2:number): boolean {

        x1 = Math.floor(x1);
        y1 = Math.floor(y1);
        x2 = Math.floor(x2);
        y2 = Math.floor(y2);
        const key = `${this.title};${x1};${y1};${x2};${y2}`;
        const cached = visibilityCache.get(key);
        if (cached != null){
            return cached;
        }

        let w = x2 - x1 ;
        let h = y2 - y1 ;
        let dx1 = 0, dy1 = 0, dx2 = 0, dy2 = 0;
        if (w < 0) dx1 = -1; else if (w > 0) dx1 = 1;
        if (h < 0) dy1 = -1; else if (h > 0) dy1 = 1;
        if (w < 0) dx2 = -1; else if (w > 0) dx2 = 1;

        let longest = Math.abs(w);
        let shortest = Math.abs(h);


        if (!(longest > shortest)) {
            longest = Math.abs(h);
            shortest = Math.abs(w);
            if (h < 0) dy2 = -1;
            else if (h > 0) dy2 = 1;
            dx2 = 0;
        }
        let numerator = longest >> 1;

        let res = true;
        for (let i=0;i<=longest;i++) {

            numerator += shortest;
            if (!(numerator < longest)) {
                numerator -= longest ;
                x1 += dx1;
                y1 += dy1;
            } else {
                x1 += dx2;
                y1 += dy2;
            }

            if (this.getCell(y1, x1) == Cell.Wall) {
                res = false;
                break;
            }
        }
        visibilityCache.set(key, res);
        return res;

    };
}