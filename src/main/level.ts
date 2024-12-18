import {Position, Rectangle} from "./util/position.js";
import {fail} from "./util/fail.js";
import {Puzzle} from "./puzzle.js";
import {hexToRgb} from "./util/color.js";
import {Crate} from "./objects/crate.js";
import {Player} from "./objects/player.js";
import {Goal} from "./objects/goal.js";
import {Wall} from "./objects/wall.js";
import {Floor} from "./objects/floor.js";
import {addLights, Light} from "./objects/lights.js";
import {Tile} from "./tile.js";
import {Track} from "./objects/track.js";

const tileWidth = 7;
const tileHeight = 3;

export enum Cell {
    Wall,
    Crate,
    Player,
    Goal,
    Empty,
    Void
}

export enum Dir {
    Up = 0,
    Right = 1,
    Down = 2,
    Left = 3,
}

const horiz = (dir: Dir) => dir === Dir.Left || dir === Dir.Right;
const vert = (dir: Dir) => !horiz(dir);

type State = {
    readonly index: number;
    readonly time: number;
    readonly author: string;
    readonly title: string;
    readonly board: string;
    readonly ccol: number;
    readonly crow: number;
    readonly goals: readonly Goal[];
    readonly walls: readonly Wall[];
    readonly voidRectangles: readonly Rectangle[];
    readonly crates: readonly Crate[];
    readonly player: Player;
    readonly lights: readonly Light[];
    readonly floor: Floor;
    readonly track: Track;
    readonly completed: boolean;
    readonly steps: number;
    readonly pushes: number;
    readonly history: string;
}


function* positions(crow: number, ccol: number): Iterable<Position> {
    for (let irow = 0; irow < crow; irow++) {
        for (let icol = 0; icol < ccol; icol++) {
            yield new Position(icol, irow);
        }
    }
}

function getCh(map: string[], position: Position): string {
    const {y, x} = position;
    if (y >= 0 && y < map.length && x >= 0 && x < map[y].length) {
        return map[y][x];
    }
    return ' ';
}


function find(map: string[], crow: number, ccol: number, ch: string): Rectangle[] {
    return [...positions(crow, ccol)]
        .filter(pos => getCh(map, pos) === ch)
        .map(pos => new Rectangle(pos.x * tileWidth, pos.y * tileHeight, tileWidth, tileHeight));
}


function findVoids(map: string[], crow: number, ccol: number,): Rectangle[] {
    const voids: Rectangle[] = [];
    let ps = new Set(positions(crow, ccol));

    const has = (p: Position) => voids.some(v => v.contains(p));
    let any = true;
    while (any) {
        any = false;
        for (let p of ps) {
            const topLeft = new Position(p.x * tileWidth, p.y * tileHeight);
            if (getCh(map, p) == ' ' && (
                p.x == 0 ||
                p.x == ccol - 1 ||
                p.y == 0 ||
                p.y == crow - 1 ||
                has(topLeft.move(0, -tileHeight)) ||
                has(topLeft.move(0, tileHeight)) ||
                has(topLeft.move(-tileWidth, 0)) ||
                has(topLeft.move(tileWidth, 0))
            )) {
                ps.delete(p);
                voids.push(new Rectangle(topLeft.x, topLeft.y, tileWidth, tileHeight));
                any = true;
            }
        }
    }
    return voids;
}

const visibilityCache = new Map<string, boolean>();


function createStaticLights(level: Level, crow: number, ccol: number): Light[] {
    const lights: Light[] = [];
    for (let row = 0; row < crow; row+=3) {
        for (let column = 0; column < ccol; column+=3) {
            const p = new Position(column * tileWidth + tileWidth / 2, row * tileHeight + tileHeight / 2);
            const n = [
                level.getCell(p.move(-tileWidth, -tileHeight)),
                level.getCell(p.move(0, -tileHeight)),
                level.getCell(p.move(tileWidth, -tileHeight)),
                level.getCell(p.move(-tileWidth, 0)),
                level.getCell(p),
                level.getCell(p.move(tileWidth, 0)),
                level.getCell(p.move(-tileWidth, tileHeight)),
                level.getCell(p.move(0, tileHeight)),
                level.getCell(p.move(tileWidth, tileHeight)),
            ];

           // if (n.filter(x => x !== Cell.Wall && x !== Cell.Void).length > 5) {
                lights.push({
                    color: hexToRgb(0x222222),
                    x: p.x,
                    y: p.y,
                    z: 4 * tileWidth,
                    direction: null,
                });
           // }
        }
    }
    return lights;
}

function createPlayerLight(level: Level): Light {
    return {
        x: level.player.rectangle.x + 4 +
            (level.player.dir === Dir.Right ? -2 : level.player.dir === Dir.Left ? 2 : 0),
        y: level.player.rectangle.y + 1.5 +
            (level.player.dir === Dir.Down ? -0 : level.player.dir === Dir.Up ? 0 : 0),
        z: 1,
        color: hexToRgb(0x888800),
        direction: {
            x: level.player.dir === Dir.Right ? -1 : level.player.dir === Dir.Left ? 1 : 0,
            y: level.player.dir === Dir.Down ? -1 : level.player.dir === Dir.Up ? 1 : 0,
            z: 1,
            cosTheta: Math.cos(Math.PI / 3),
        },
    };
}

export class Level {

    public get author() {
        return this.state.author;
    }

    public get title() {
        return this.state.title;
    }

    public get goals() {
        return this.state.goals;
    }

    public get walls() {
        return this.state.walls;
    }

    public get crates() {
        return this.state.crates;
    }

    public get voidRectangles() {
        return this.state.voidRectangles;
    }

    public get player() {
        return this.state.player;
    }

    public get lights() {
        return [...this.state.lights, createPlayerLight(this)];
    };

    public get steps() {
        return this.state.steps;
    }

    public get pushes() {
        return this.state.pushes;
    }

    public get index() {
        return this.state.index;
    }

    public get time() {
        return this.state.time;
    }

    public get completed() {
        return this.state.completed;
    }

    public get floor() {
        return this.state.floor;
    }

    public get track() {
        return this.state.track;
    }

    get width() {
        return this.state.ccol * tileWidth;
    };

    get height() {
        return this.state.crow * tileHeight;
    };

    private constructor(private readonly state: State) {
    }

    public with(state: Partial<State>){
       return new Level({...this.state, ...state});
    }

    public static fromBoard(board: string): Level {
        const boardRows = board.split('\n');
        const ccol = Math.max(...boardRows.map(x => x.length));
        const crow = boardRows.length;
        const wallRects = find(boardRows, crow, ccol, '#');
        const voidRects = findVoids(boardRows, crow, ccol);
        const goalRects = find(boardRows, crow, ccol, '.');
        const level = new Level({
            index: -1,
            ccol: ccol,
            crow: crow,
            board: board,
            title: "",
            author: "",
            player: new Player(find(boardRows, crow, ccol, '@')[0].center, Dir.Right),
            walls: wallRects.map(rect => new Wall(rect.center, pos => wallRects.some(wall => wall.contains(pos)))),
            goals: goalRects.map(rect => new Goal(rect.center)),
            voidRectangles: voidRects,
            completed: false,
            crates: find(boardRows, crow, ccol, '$').map(rect => new Crate(rect.center, goalRects.some(goal => goal.contains(rect.center)))),
            floor: new Floor(ccol * tileWidth, crow * tileHeight, (pos) => voidRects.some(rect => rect.contains(pos))),
            lights: [],
            steps: 0,
            pushes: 0,
            history: '',
            time: 0,
            track: new Track()
        });

        return level.with({lights: createStaticLights(level, crow, ccol)});
    }

    public static fromPuzzle(index: number, puzzle: Puzzle): Level {
        return new Level({
            ...this.fromBoard(puzzle.board).state,
            index: index,
            title: puzzle.title ?? "",
            author: puzzle.author ?? "",
        });
    }

    isGoal(pos: Position) {
        return this.goals.some(goal => goal.rectangle.contains(pos));
    }

    isWall(pos: Position) {
        return this.walls.some(wall => wall.rectangle.contains(pos));
    }

    isCrate(pos: Position) {
        return this.crates.some(crate => crate.rectangle.contains(pos));
    }

    public getCell(pos: Position): Cell {

        if (!this.validPos(pos)) {
            return Cell.Void;
        } else if (this.player.rectangle.contains(pos)) {
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

    moveTile(dx: number, dy: number) {
        let oldState = this.state;
        let newState: State = oldState;
        const newPlayerRect = this.player.rectangle.move(dx * tileWidth, dy * tileHeight)
        newState = {
            ...newState,
            player: newState.player.withDir(
                dy == 1 && dx == 0 ? Dir.Down :
                dy == -1 && dx == 0 ? Dir.Up :
                dy == 0 && dx == -1 ? Dir.Left :
                dy == 0 && dx == 1 ? Dir.Right :
                this.player.dir
            )
        }

        let step =
            dy == 0 && dx == 1 ? 'r' :
            dy == 0 && dx == -1 ? 'l' :
            dy == 1 && dx == 0 ? 'd' :
            dy == -1 && dx == 0 ? 'u' :
            fail();

        switch (this.getCell(newPlayerRect.center)) {
            case Cell.Wall:
            case Cell.Player:
                break;
            case Cell.Crate:
                const newCratePosition = this.player.rectangle.move(2 * dx * tileWidth, 2 * dy * tileHeight);
                if (!this.completed && !this.isWall(newCratePosition.center) && !this.isCrate(newCratePosition.center)) {
                    const icrate = this.crates.findIndex(crate => crate.rectangle.contains(newPlayerRect.center));
                    const newCrates = this.crates.map((crate, i) => i == icrate ?
                        new Crate(newCratePosition.center, this.isGoal(newCratePosition.center)) : crate);

                    const newCompleted = newCrates.every(cratePosition => this.isGoal(cratePosition.center));
                    step = step.toUpperCase();
                    newState = {
                        ...newState,
                        pushes: this.pushes + 1,
                        steps: this.steps + 1,
                        player: newState.player.withCenter(newPlayerRect.center),
                        crates: newCrates,
                        completed: newCompleted,
                    };
                }
                break;
            case Cell.Goal:
            case Cell.Empty:
            case Cell.Void:

                newState = {
                    ...newState,
                    player: newState.player.withCenter(newPlayerRect.center),
                    steps: this.steps + 1,
                };

                break;
        }

        // turn in original position
        if (newState.player.dir !== oldState.player.dir) {
            if (vert(oldState.player.dir)) {
                if (horiz(newState.player.dir)) {
                    newState = {
                        ...newState, track:
                            newState.track.visit(oldState.player, true, false)
                    };
                } else {
                    newState = {
                        ...newState, track:
                            newState.track.visit(oldState.player, true, true)
                    }
                }
            } else {
                if (vert(newState.player.dir)) {
                    newState = {
                        ...newState, track:
                            newState.track.visit(oldState.player, false, true)
                    };
                } else {
                    newState = {
                        ...newState, track:
                            newState.track.visit(oldState.player, true, true)
                    }
                }
            }
        }

        if (!oldState.player.rectangle.eq(newState.player.rectangle)) {
            newState = {...newState, history: newState.history + step};
            if (horiz(newState.player.dir)) {
                newState = {
                    ...newState, track:
                        newState.track.visit(newState.player, true, false)
                };
            } else {
                newState = {
                    ...newState, track:
                        newState.track.visit(newState.player, false, true)
                };
            }
        }

        return new Level(newState);
    }

    private getKey(row: number, column: number) {
        return `${row};${column}`
    }

    left() {
        return this.moveTile(-1, 0);
    }

    right() {
        return this.moveTile(1, 0);
    }

    up() {
        return this.moveTile(0, -1);
    }

    down() {
        return this.moveTile(0, 1);
    }

    private validPos(pos: Position): boolean {
        const {y, x} = pos;
        return (
            y >= 0 && y < this.height &&
            x >= 0 && x < this.width &&
            !this.voidRectangles.some(p => p.contains(pos))
        );
    }

    tick() {
        return this.completed || this.steps == 0 ? this : this.with({time: this.state.time + 1});
    }

    visible(x1: number, y1: number, x2: number, y2: number): boolean {

        x1 = Math.floor(x1);
        y1 = Math.floor(y1);
        x2 = Math.floor(x2);
        y2 = Math.floor(y2);
        const key = `${this.title};${x1};${y1};${x2};${y2}`;
        const cached = visibilityCache.get(key);
        if (cached != null) {
            return cached;
        }

        let w = x2 - x1;
        let h = y2 - y1;
        let dx1 = 0, dy1 = 0, dx2 = 0, dy2 = 0;
        if (w < 0) {
            dx1 = -1;
        } else if (w > 0) {
            dx1 = 1;
        }
        if (h < 0) {
            dy1 = -1;
        } else if (h > 0) {
            dy1 = 1;
        }
        if (w < 0) {
            dx2 = -1;
        } else if (w > 0) {
            dx2 = 1;
        }

        let longest = Math.abs(w);
        let shortest = Math.abs(h);


        if (!(longest > shortest)) {
            longest = Math.abs(h);
            shortest = Math.abs(w);
            if (h < 0) {
                dy2 = -1;
            } else if (h > 0) {
                dy2 = 1;
            }
            dx2 = 0;
        }
        let numerator = longest >> 1;

        let res = true;
        for (let i = 0; i <= longest; i++) {

            numerator += shortest;
            if (!(numerator < longest)) {
                numerator -= longest;
                x1 += dx1;
                y1 += dy1;
            } else {
                x1 += dx2;
                y1 += dy2;
            }

            if (this.getCell(new Position(x1, y1)) == Cell.Wall) {
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

    draw(surface: Tile) {
        this.floor.draw(surface);
        this.track.draw(surface);
        for (let goal of this.goals) {
            goal.draw(surface);
        }

        for (let crate of this.crates) {
            crate.draw(surface);
        }

        this.player.draw(surface);

        for (let wall of this.walls) {
            wall.draw(surface);
        }

        addLights(this, surface);


    }
}