import {background, clearScreen, goHome, hideCursor} from "./util/ansi";
import {darkenColor, hexToRgb, Rgb, rgbToHex} from "./color";
import {Cell, Dir, Level} from "./level";
import {
    baseBg,
    baseCrateAtPositionBg,
    baseCrateAtPositionFg,
    baseCrateBg,
    baseCrateFg,
    baseFg,
    baseWallBg,
    baseWallFg,
    crateTile,
    goalSprite,
    playerSprites,
    tileHeight,
    tileWidth,
    wallTile
} from "./tiles";
import {Random} from "./util/pick";
import {Position} from "./position";

type Paxel = {
    ch: string;
    bg: number;
    fg: number;
}

function fuzzyColor(random: Random, color: number): number {
    let rand = random.next();

    let d =
        rand < 0.25 ? -1 :
        rand < 0.5 ? 2 :
        rand < 0.75 ? 1 :
        4;

    const rgb = hexToRgb(color);
    return rgbToHex({
        r: rgb.r + d,
        g: rgb.g + d,
        b: rgb.b + d,
    })
}

function paxel(ch: string, fg: number, bg: number): Paxel{

    return {
        ch: ch,
        fg: fg,
        bg: bg,
    };
}

let pssPrev: Paxel[][] | null = null;
let levelPrev: Level | null = null;

function init(level: Level): Paxel[][]{
    const pss: Paxel[][] = [];

    for (let row = 0; row < level.height + 1; row++) {
        pss.push([]);
    }
    return pss;
}


const visibilityCache = new Map<string, boolean>();

type Cone = {
    readonly dx: number;
    readonly dy: number;
    readonly dz: number;
    readonly theta: number;
}
type Light = {
    readonly color: Rgb;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly direction: Cone | null;
}



function drawLight(random: Random, level: Level, pss: Paxel[][]) {
    const lights: Light[] = [];
    for (let row = 0; row < level.height; row++) {
        for (let column = 0; column < level.width; column++) {
            const p = new Position(row, column);
            const n = [
                level.getCell2(p.left().above()),
                level.getCell2(p.above()),
                level.getCell2(p.right().above()),
                level.getCell2(p.left()),
                level.getCell2(p),
                level.getCell2(p.right()),
                level.getCell2(p.left().below()),
                level.getCell2(p.below()),
                level.getCell2(p.right()),
            ];

            if (random.next() < 0.1 && n.filter(x => x !== Cell.Wall && x !== Cell.Void).length> 5 ) {
                lights.push({
                    color: hexToRgb(0x222222),
                    x: p.column * tileWidth + (tileWidth/2),
                    y: p.row * tileHeight + (tileHeight/2),
                    z: 5,
                    direction: null,
                });
            }
        }
    }

    lights.push({
        y: level.playerPosition.row * tileHeight + (tileHeight / 2),
        x: level.playerPosition.column * tileWidth + (tileWidth / 2),
        z: 1,
        color: hexToRgb(0xff0000),
        direction: {
            dx: level.playerDirection === Dir.Right ? -1 : level.playerDirection === Dir.Left ? 1 : 0,
            dy: level.playerDirection === Dir.Down ? -1 : level.playerDirection === Dir.Up ? 1 : 0,
            dz: 0,
            theta: Math.PI / 5
        },
    });

    const visible = (x1:number, y1:number, x2:number, y2:number): boolean => {

        x1 = Math.floor(x1);
        y1 = Math.floor(y1);
        x2 = Math.floor(x2);
        y2 = Math.floor(y2);
        const key = `${level.title};${x1};${y1};${x2};${y2}`;
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

            if (level.getCell(y1, x1) == Cell.Wall) {
                res = false;
                break;
            }
        }
        visibilityCache.set(key, res);
        return res;

    };

    for (let row = 0; row < level.height; row++) {
        for (let column = 0; column < level.width; column++) {

            const lighten = (color: number) => {
                const ia = 1;
                const rgb = hexToRgb(color);
                const kd = {
                    r: Math.max(1,rgb.r)/255,
                    g: Math.max(1,rgb.g)/255,
                    b: Math.max(1,rgb.b)/255,
                };

                const ka = kd;

                const ks =  {
                    r: .2,
                    g: .2,
                    b: .2
                };

                const alpha = 10;

                let i = {
                    r: ia*ka.r,
                    g: ia*ka.g,
                    b: ia*ka.b,
                };

                for (let light of lights) {
                    if (!visible(column, row, light.x, light.y)) {
                        continue;
                    }

                    const lx = light.x - (column + 0.5);
                    const ly = (light.y - (row + 0.5)) * 2; //pixels are twice as tall than wide
                    const lz = light.z;

                    const distance = Math.sqrt(lx * lx + ly * ly + lz * lz);
                    const d =  lz / distance; // <L',N'>  (N' = 0,0,1)

                    const s =  Math.pow(lz / distance, alpha); // <R',V'> == <V',L'> == <-N', L'>

                    let phi = 1;
                    if (light.direction != null) {
                       phi =  -(lx * light.direction.dx + ly * light.direction.dy + lz * light.direction.dz) / distance;
                      if (phi < Math.cos(light.direction.theta)){
                          phi = 0;
                      } else {
                          phi = Math.pow(phi, 0.0001);
                      }
                    }
                    const ild = {
                        r: 5*light.color.r / 255 * phi,
                        g: 5*light.color.g / 255 * phi,
                        b: 5*light.color.b / 255 * phi
                    };
                    const ils = ild;

                    const a = 1;
                    const b = 0;
                    const c = 0.001;
                    i.r += kd.r * d * ild.r * (1/(a+b*distance+c*distance*distance));
                    i.r += ks.r * s * ils.r * (1/(a+b*distance+c*distance*distance));

                    i.g += kd.g * d * ild.g * (1/(a+b*distance+c*distance*distance));
                    i.g += ks.g * s * ils.g * (1/(a+b*distance+c*distance*distance));

                    i.b += kd.b * d * ild.b * (1/(a+b*distance+c*distance*distance));
                    i.b += ks.b * s * ils.b * (1/(a+b*distance+c*distance*distance));
                //     if(row == 10){
                //         console.log(column, d, i.r);
                //     }
                }

                return rgbToHex({
                    r: i.r * 255,
                    g: i.g * 255,
                    b: i.b * 255,
                });
            };

            if(level.getCell(row, column) !== Cell.Void){
                let p = pss[row][column];
                pss[row][column] = {...p, fg: lighten(p.fg), bg: lighten(p.bg)}
            }
        }
    }

    // for(let light of lights) {
    //     print(pss, 'x', Math.floor(light.y), Math.floor(light.x), 0x0000ff);
    // }
}
function drawGround(random: Random, level: Level, pss: Paxel[][]) {

    let fg = fuzzyColor(random, baseFg);
    let bg = fuzzyColor(random, baseBg);
    let i = 0;
    let ch = random.pick('▓▒░ '.split(''));
    for (let row = 0; row < level.height; row++) {
        for (let column = 0; column < level.width; column++) {

            if (i % 2 == 0) {
                const cell = level.getCell(row, column);
                fg = fuzzyColor(random, baseFg);
                bg = cell == Cell.Void ? 0 : fuzzyColor(random, baseBg);
                ch = cell == Cell.Void ? ' ' : random.pick('▓▒░ '.split(''));
            }
            i++;
            pss[row][column] = paxel(ch, fg, bg);
        }
    }
}

function drawTrack(_random: Random, level: Level, pss: Paxel[][]) {

    for (let row = 0; row < level.crow; row++) {
        for (let column = 0; column < level.ccol; column++) {
            let h = level.visitedHoriz(row, column);
            let v = level.visitedVert(row, column);
            if(h + v > 0){
                const x = column*tileWidth;
                const y = row*tileHeight;
                const d = (x: number, y: number, s: number) => {
                    if(pss[y][x] != null) {
                        pss[y][x] = {
                            ...pss[y][x],
                            bg: darkenColor(pss[y][x].bg, Math.pow(0.98, s)),
                            fg: darkenColor(pss[y][x].fg, Math.pow(0.98, s))
                        }
                    }
                };

                for(let i=0;i<tileWidth;i++){
                    d(x+i, y, h);
                    d(x+i, y+2, h);
                }
                for(let i=0;i<tileHeight;i++){
                    d(x+1, y+i, v);
                    d(x+2, y+i, v);
                    d(x+tileWidth-1, y+i, v);
                    d(x+tileWidth-2, y+i, v);
                }
            }
        }
    }
}


export function draw(level: Level) {
    const random = new Random(0);
    const pss = init(level);
    drawGround(random, level, pss);
    drawTrack(random, level, pss);
    drawGoals(random, level, pss);
    drawWallsShadows(random, level, pss);
    drawCrates(random, level, pss);
    drawPlayer(random, level, pss);
    drawWalls(random, level, pss);
    drawLight(random, level, pss);

    if (levelPrev !=null && (levelPrev.width !== level.width || levelPrev.height !== level.height)) {
        pssPrev = null;
    }
    let st = '';
    if (pssPrev == null) {
        st += `${clearScreen}${goHome}${hideCursor}`;
    }

    const fmt = (num: number) => num.toString(10).padStart(4, '0');
    print(pss, `${level.title}    Steps: ${fmt(level.steps)}    Pushes: ${fmt(level.pushes)}    Time: ${fmt(level.time)}`, 0,0, 0xffffff);
    for(let irow=0;irow<pss.length;irow++){
        for(let icol = 0;icol<pss[0].length;icol++){
            const prev = pssPrev?.[irow]?.[icol];
            const p = pss[irow][icol] ?? {ch: ' ', fg: 0, bg: 0};
            if(p.ch != prev?.ch || p.fg != prev?.fg || p.bg != prev?.bg) {
                st += `\x1b[${irow+1};${icol+1}H`;
                st += background(p.ch, p.fg, p.bg);
            }
        }
    }

    pssPrev = pss;
    levelPrev = level;

   process.stdout.write(st);
}



function drawShadow(random: Random, level: Level,pss: Paxel[][], tileWidth: number, tileHeight: number, irow: number, icol: number, fg: number, bg: number, drow: number=0, dcol: number=0) {
    let st = '';
    for (let tileRow = 0; tileRow < tileHeight; tileRow++) {
        for (let tileCol = 0; tileCol < tileWidth; tileCol++) {
            st += ' ';
        }
        st+=' \n';
    }
    drawTile(random, level, pss, irow, icol, st.split('\n'), dcol,drow, fg, bg, false);

}


function drawWallsShadows(random: Random, level: Level,pss: Paxel[][]) {

    for (let wall of level.wallPositions) {
        const {row, column} = wall;
        drawShadow(random, level, pss, tileWidth, tileHeight, row, column, baseBg, darkenColor(baseWallFg, 0.9), 0,0);
    }
}

function drawWalls(random: Random, level: Level,pss: Paxel[][]) {

    for (let wall of level.wallPositions) {
        const {row, column} = wall;

        let p = (row + column) % 2 == 1 ? "A" : "B";
        let np = (row + column) % 2 == 1 ? "B" : "A";
        const wallAboveLeft = level.isWall(wall.above().left()) ? p : " ";
        const wallAbove = level.isWall(wall.above()) ? np : " ";
        const wallLeft = level.isWall(wall.left()) ? np : " ";
        const wallAboveRight = level.isWall(wall.above().right()) ? p : " ";
        const wallRight =level. isWall(wall.right()) ? np : " ";
        const wallBelowLeft = level.isWall(wall.below().left()) ? p : " ";
        const wallBelow = level.isWall(wall.below()) ? np : " ";
        const wallBelowRight = level.isWall(wall.below().right()) ? p : " ";

        const tiles = [
            wallTile(wallAboveLeft, wallAbove, wallLeft, p),
            wallTile(" ", wallAbove, " ", p),
            wallTile(wallAbove, wallAboveRight, p, wallRight),
            wallTile(wallLeft, p, " ", " "),
            wallTile(" ", p, " ", " "),
            wallTile(p, wallRight, " ", " "),
            wallTile(wallLeft, p, wallBelowLeft, wallBelow),
            wallTile(wallLeft, p, wallBelowLeft, wallBelow),
            wallTile(p, wallRight, wallBelow, wallBelowRight),
        ];

        let i = 0;
        let fg = fuzzyColor(random, baseWallFg);
        let bg = fuzzyColor(random, baseWallBg);

        for(let tileRow=0;tileRow<tileHeight;tileRow++){
            for(let tileCol=0;tileCol<tileWidth;tileCol++){

                if (i % 2 == 0) {
                    fg = fuzzyColor(random, baseWallFg);
                    bg = fuzzyColor(random, baseWallBg);
                }
                i++;

                let ch: string;
                if (tileRow == 0) {
                    if (tileCol == 0){
                        ch = tiles[0][tileHeight][tileWidth];
                    } else if(tileCol < tileWidth - 1){
                        ch = tiles[1][tileHeight][tileWidth + tileCol];
                    } else {
                        ch = tiles[2][tileHeight][tileWidth - 1];
                    }
                } else if(tileRow < tileHeight - 1)  {
                    if (tileCol == 0){
                        ch = tiles[3][tileRow][tileWidth];
                    } else if(tileCol < tileWidth - 1){
                        ch = tiles[4][tileRow][tileWidth + tileCol];
                    } else {
                        ch = tiles[5][tileRow][tileWidth - 1];
                    }
                } else {
                    if (tileCol == 0){
                        ch = tiles[6][tileHeight-1][tileWidth];
                    } else if(tileCol < tileWidth - 1){
                        ch = tiles[7][tileHeight-1][tileWidth + tileCol];
                    } else {
                        ch = tiles[8][tileHeight-1][tileWidth - 1];
                    }
                }

                pss[row * tileHeight + tileRow][column*tileWidth+tileCol] = paxel(ch, fg, bg);

            }
        }

    }
}


function drawTile(
    random: Random,
    _level: Level,pss: Paxel[][],
    irow: number,
    icol: number,
    tile: string[],
    dx: number = 0,
    dy: number = 0,
    fg: number | null,
    bg: number | null,
    ignoreSpace: boolean = true
) {
    for (let tileRow = 0; tileRow < tile.length; tileRow++) {
        for (let tileCol = 0; tileCol < tile[tileRow].length; tileCol++) {
            if (!ignoreSpace || tile[tileRow][tileCol] != ' ') {
                const p = {
                    ...pss[irow * tileHeight + tileRow][icol * tileWidth + tileCol],
                    ch: tile[tileRow][tileCol],
                };

                if (fg != null) {
                    p.fg = fg;
                }
                if (bg != null) {
                    p.bg = fuzzyColor(random, bg);
                }

                pss[irow * tileHeight + tileRow + dy][icol * tileWidth + tileCol+ dx] = p;
            }
        }
    }
}
function drawGoals(random: Random, level: Level,pss: Paxel[][]) {
    for (let goal of level.goalPositions) {
        drawTile(random, level, pss, goal.row, goal.column, goalSprite, 0,0,0xffffff, null);
    }
}

function drawPlayer(_random: Random, level: Level,pss: Paxel[][]) {

    let irow = level.playerPosition.row;
    let icol = level.playerPosition.column;
    const tile = playerSprites.tiles[level.playerDirection];
    for (let tileRow = 0; tileRow < tileHeight; tileRow++) {
        for (let tileCol = 0; tileCol < tileWidth; tileCol++) {

            const ch = tile[tileRow][tileCol];
            const bg = tile[tileRow][tileCol + tileWidth];
            const fg = tile[tileRow][tileCol + 2 * tileWidth];

            let p = {
                ...pss[irow * tileHeight + tileRow][icol * tileWidth + tileCol],
            };
            if (ch != ' ') {
                p = {...p, ch};
            }
            if (bg != ' ') {
                p = {...p, bg: playerSprites.colors[bg.charCodeAt(0) - '0'.charCodeAt(0)]};
            }
            if (fg != ' ') {
                p = {...p, fg: playerSprites.colors[fg.charCodeAt(0) - '0'.charCodeAt(0)]};
            }
            pss[irow * tileHeight + tileRow][icol * tileWidth+ tileCol] = p;
        }
    }
}

function drawCrates(random: Random, level: Level,pss: Paxel[][]) {
    for(let crate of level.cratePositions){
        const bg =level.isGoal(crate) ? baseCrateAtPositionBg : baseCrateBg;
        drawShadow(random, level,pss, tileWidth-1, tileHeight, crate.row, crate.column, baseBg, darkenColor(bg, 0.5));
    }

    for(let cratePosition of level.cratePositions){
        const bg =level.isGoal(cratePosition) ? baseCrateAtPositionBg : baseCrateBg;
        const fg =level.isGoal(cratePosition) ? baseCrateAtPositionFg : baseCrateFg;
        drawTile(random, level,pss, cratePosition.row, cratePosition.column, crateTile, 0,0, fg, bg);
    }
}
function print(pss:Paxel[][], st: string, irow: number, icol: number, fg: number){
    for(let i=0;i<st.length;i++){
        pss[irow][icol+i] = {
            ...pss[irow][icol+i],
            ch: st[i],
            fg: fg
        }
    }
}