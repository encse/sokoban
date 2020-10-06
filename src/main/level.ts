import {Position, Rectangle} from "./position";
import {Puzzle} from "./puzzle";
import {baseBg, baseFg, tileHeight, tileWidth} from "./tiles";
import {fail} from "./util/fail";
import {draw, fuzzyColor, Light, paxel, Paxel} from "./draw";
import {hexToRgb} from "./color";
import {Random} from "./util/pick";

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
    readonly board: string;
    readonly ccol: number;
    readonly crow: number;
    readonly goalRectangles: readonly Rectangle[];
    readonly wallRectangles: readonly Rectangle[];
    readonly voidRectangles: readonly Rectangle[];
    readonly crateRectangles: readonly Rectangle[];
    readonly playerRectangle: Rectangle;
    readonly playerDirection: Dir;
    readonly lights: readonly Light[];
    readonly completed: boolean;
    readonly ground: Tile;
    readonly steps: number;
    readonly pushes: number;
    readonly history: string;
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
    const {row, col} = position;
    if (row >= 0 && row < map.length && col >= 0 && col < map[row].length) {
        return map[row][col];
    }
    return ' ';
}


function find(map: string[], crow: number, ccol: number, ch: string): Rectangle[] {
    return [...positions(crow, ccol)].filter(pos => getCh(map, pos) === ch).map(pos => new Rectangle(pos.row*tileHeight, pos.col*tileWidth, tileHeight, tileWidth));
}

function findVoids(map: string[], crow: number, ccol: number, ): Rectangle[] {
    const voids: Rectangle[] = [];
    let ps = new Set(positions(crow, ccol));

    const has = (p: Position) => voids.some(v => v.contains(p));
    let any = true;
    while (any) {
        any = false;
        for (let p of ps) {
            const topLeft = new Position(p.row * tileHeight, p.col * tileWidth);
            if (getCh(map, p) == ' ' && (
                p.col == 0 ||
                p.col == map[p.row].length - 1 ||
                p.row == 0 ||
                p.row == map.length - 1 ||
                has(topLeft.moveTile(-1,0)) ||
                has(topLeft.moveTile(1,0)) ||
                has(topLeft.moveTile(0,-1)) ||
                has(topLeft.moveTile(0,1))
            )) {
                ps.delete(p);
                voids.push(new Rectangle(topLeft.row, topLeft.col, tileHeight, tileWidth));
                any = true;
            }
        }
    }
    return voids;
}

const visibilityCache = new Map<string, boolean>();


function createLights(level: Level, crow: number, ccol: number): Light[] {
    const lights: Light[] = [];
    for (let row = 0; row < crow; row++) {
        for (let column = 0; column < ccol; column++) {
            const p = new Position(row * tileHeight + tileHeight/2, column * tileWidth+tileWidth/2);
            const n = [
                level.getCell(p.moveTile(-1, -1)),
                level.getCell(p.moveTile(-1,  0)),
                level.getCell(p.moveTile(-1,  1)),
                level.getCell(p.moveTile( 0, -1)),
                level.getCell(p),
                level.getCell(p.moveTile( 0,  1)),
                level.getCell(p.moveTile( 1, -1)),
                level.getCell(p.moveTile( 1,  0)),
                level.getCell(p.moveTile( 1,  1)),
            ];

            if (Math.random() < 0.05 && n.filter(x => x !== Cell.Wall && x !== Cell.Void).length > 5 ) {
                lights.push({
                    color: hexToRgb(0x555555),
                    x: p.col,
                    y: p.row,
                    z: 3 * tileWidth,
                    direction: null,
                });
            }
        }
    }

    // lights.push({
    //     x: level.playerRectangle.col * tileWidth + 4 +
    //         (level.playerDirection === Dir.Right ? -3 : level.playerDirection === Dir.Left ? 3 : 0),
    //     y: level.playerRectangle.row * tileHeight + 1.5 +
    //         (level.playerDirection === Dir.Down ? -1 : level.playerDirection === Dir.Up ? 1 : 0),
    //     z: 1,
    //     color: hexToRgb(0x440000),
    //     direction: {
    //         x: level.playerDirection === Dir.Right ? -1 : level.playerDirection === Dir.Left ? 1 : 0,
    //         y: level.playerDirection === Dir.Down ? -1 : level.playerDirection === Dir.Up ? 1 : 0,
    //         z: -0.2,
    //         cosTheta: Math.cos(Math.PI/3)
    //     },
    // });
    return lights;
}

export type Tile = {ch?: string, bg?: number, fg?:number}[][];

function createGround(random: Random, level: Level): Tile {
    let ch = random.pick('▓▒░ '.split(''));
    let prevVoid = true;
    const tile: Tile = [];
    for (let row = 0; row < level.height; row++) {
        let fg: number = 0;
        let bg: number = 0;
        const pss: Paxel[] = [];
        tile.push(pss);
        for (let column = 0; column < level.width; column++) {
            let cell = level.getCell(new Position(row, column));
            const isVoid = cell == Cell.Void;
            if (column % 2 == 0 || prevVoid !== isVoid) {
                fg = fuzzyColor(random, baseFg);
                bg = isVoid ? 0 : fuzzyColor(random, baseBg);
                ch = isVoid ? ' ' : random.pick('▓▒░ '.split(''));
            }
            prevVoid = isVoid;
            pss.push(paxel(ch, fg, bg));
        }
    }

    return tile;
}

function playerLight(level: Level): Light {
    return {
        x: level.playerRectangle.col + 4 +
            (level.playerDirection === Dir.Right ? -3 : level.playerDirection === Dir.Left ? 3 : 0),
        y: level.playerRectangle.row + 1.5 +
            (level.playerDirection === Dir.Down ? -1 : level.playerDirection === Dir.Up ? 1 : 0),
        z: 1,
        color: hexToRgb(0x440000),
        direction: {
            x: level.playerDirection === Dir.Right ? -1 : level.playerDirection === Dir.Left ? 1 : 0,
            y: level.playerDirection === Dir.Down ? -1 : level.playerDirection === Dir.Up ? 1 : 0,
            z: -0.2,
            cosTheta: Math.cos(Math.PI / 3)
        },
    };
}

export class Level {

    public get author() {return this.state.author;}
    public get title() {return this.state.title;}
    public get goalRectangles() {return this.state.goalRectangles;}
    public get wallRectangles() {return this.state.wallRectangles;}
    public get crateRectangles() {return this.state.crateRectangles;}
    public get voidRectangles() {return this.state.voidRectangles;}
    public get playerRectangle() {return this.state.playerRectangle;}
    public get playerDirection() {return this.state.playerDirection;}
    public get lights() {
        return [...this.state.lights, playerLight(this)];
    };
    public get steps() {return this.state.steps;}
    public get pushes() {return this.state.pushes;}
    public get time() {return this.state.time;}
    public get completed() {return this.state.completed;}
    public get ground() { return this.state.ground; }

    get width() {
        return this.state.ccol * tileWidth;
    };

    get height() {
        return this.state.crow * tileHeight;
    };

    private constructor(private readonly state: State) {

    }

    public static fromData(puzzle: Puzzle):Level{
        const board = puzzle.board.split('\n');
        const ccol= Math.max(...board.map(x => x.length));
        const crow = board.length;
        const level = new Level({
            ccol : ccol,
            crow : crow,
            board : puzzle.board,
            title : puzzle.title ?? "",
            author: puzzle.author ?? "",
            playerRectangle: find(board, crow, ccol, '@')[0],
            wallRectangles: find(board, crow, ccol, '#'),
            goalRectangles: find(board, crow, ccol, '.'),
            voidRectangles: findVoids(board, crow, ccol),
            completed:false,
            crateRectangles: find(board, crow, ccol, '$'),
            playerDirection: Dir.Right,
            ground: [],
            lights: [],
            steps: 0,
            pushes: 0,
            history: '',
            time: 0,
            visitedHoriz: new Map<string, number>(),
            visitedVert: new Map<string, number>()
        });
        const random = new Random(0);
        return new Level({
            ...level.state,
            lights: createLights(level, crow, ccol),
            ground: createGround(random, level)
        });
    }

    isGoal(pos: Position) {
        return this.goalRectangles.some(goal => goal.contains(pos));
    }

    isWall(pos: Position) {
        return this.wallRectangles.some(wall => wall.contains(pos));
    }

    isCrate(pos: Position) {
        return this.crateRectangles.some(crates => crates.contains(pos));
    }

    public getCell(pos: Position): Cell {

        if (!this.validPos(pos)) {
            return Cell.Void;
        } else if (this.playerRectangle.contains(pos)) {
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

    moveTile(drow: number, dcol: number) {
        let oldState = this.state;
        let newState: State = oldState;
        const newPlayerRectangle = this.playerRectangle.moveTile(drow, dcol);

        let step =
            drow == 0 && dcol == 1 ? 'r' :
            drow == 0 && dcol == -1 ? 'l' :
            drow == 1 && dcol == 0 ? 'd' :
            drow == -1 && dcol == 0 ? 'u' :
            fail();

        switch (this.getCell(newPlayerRectangle.center)) {
            case Cell.Wall:
            case Cell.Player:
                break;
            case Cell.Crate:
                const newCratePosition = this.playerRectangle.moveTile(2 * drow, 2 * dcol);
                if (!this.completed && !this.isWall(newCratePosition.center) && !this.isCrate(newCratePosition.center)) {
                    const icrate = this.crateRectangles.findIndex(crate => crate.contains(newPlayerRectangle.center));
                    const newCratePositions = this.crateRectangles.map((cratePosition, i) => i == icrate ? newCratePosition : cratePosition);
                    const newCompleted = newCratePositions.every(cratePosition => this.isGoal(cratePosition.center));
                    step = step.toUpperCase();
                    newState = {
                        ...newState,
                        pushes: this.pushes + 1,
                        steps: this.steps + 1,
                        playerRectangle: newPlayerRectangle,
                        crateRectangles: newCratePositions,
                        completed: newCompleted,
                    };
                }
                break;
            case Cell.Goal:
            case Cell.Empty:
            case Cell.Void:
                newState = {
                    ...newState,
                    playerRectangle: newPlayerRectangle,
                    steps: this.steps + 1,
                };
                break;
        }


        const inc = (map: ReadonlyMap<string, number>, rectangle: Rectangle): ReadonlyMap<string, number> => {
            const key = this.getKey(rectangle.center.row, rectangle.center.col);
            const res = new Map<string, number>(map.entries());
            res.set(key, (map.get(key) ?? 0) + 1);
            return res;
        };

        const incHoriz = (state: State, rectangle: Rectangle) => {
            return  {
                ...state,
                visitedHoriz: inc(state.visitedHoriz, rectangle)
            }
        };

        const incVert = (state: State, rectangle: Rectangle) => {
            return  {
                ...state,
                visitedVert: inc(state.visitedVert, rectangle)
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
                    newState = incHoriz(newState, oldState.playerRectangle);
                } else {
                    newState = incHoriz(newState, oldState.playerRectangle);
                    newState = incVert(newState, oldState.playerRectangle);
                }
            } else {
                if (vert(newState.playerDirection)){
                    newState = incVert(newState, oldState.playerRectangle);
                } else {
                    newState = incVert(newState, oldState.playerRectangle);
                    newState = incHoriz(newState, oldState.playerRectangle);
                }
            }
        }

        if (!oldState.playerRectangle.eq(newState.playerRectangle)) {

            newState = {...newState, history: newState.history + step};
            if (horiz(newState.playerDirection)) {
                newState = incHoriz(newState, newState.playerRectangle);
            } else {
                newState = incVert(newState, newState.playerRectangle);
            }
        }


        return new Level(newState);
    }

    private getKey(row: number, column: number) {
        return `${row};${column}`
    }

    left() {
        return this.moveTile(0, -1);
    }

    right() {
        return this.moveTile(0, 1);
    }

    up() {
        return this.moveTile(-1, 0);
    }

    down() {
        return this.moveTile(1, 0);
    }

    private validPos(pos: Position): boolean {
        const {row, col} = pos;
        return (
            row >= 0 && row < this.height &&
            col >= 0 && col < this.width &&
            !this.voidRectangles.some(p => p.contains(pos))
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

            if (this.getCell(new Position(y1, x1)) == Cell.Wall) {
                res = false;
                break;
            }
        }
        visibilityCache.set(key, res);
        return res;

    };

    serialize() {
        return [
            this.state.title,
            "",
            this.state.board,
            `Author: ${this.state.author}`,
            `Snapshot`,
            this.state.history,
            `\n`,
        ].join('\n');
    }
}