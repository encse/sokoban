import {background, clearScreen, goHome, hideCursor} from "./util/ansi";
import {darkenColor, hexToRgb, rgbToHex} from "./color";
import {Cell, Level} from "./level";
import {
    baseBg,
    baseCrateAtPositionBg,
    baseCrateAtPositionFg,
    baseCrateBg,
    baseCrateFg,
    baseFg, baseWallBg, baseWallFg, crateTile,
    goalSprite,
    playerSprites,
    tileHeight,
    tileWidth, wallTile
} from "./tiles";
import {Random} from "./util/pick";

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

function drawPlayer(random: Random, level: Level,pss: Paxel[][]) {

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
                p = {...p, bg: fuzzyColor(random, playerSprites.colors[bg.charCodeAt(0) - '0'.charCodeAt(0)])};
            } else {
                fuzzyColor(random, 0xffffff);
            }
            if (fg != ' ') {
                p = {...p, fg: fuzzyColor(random, playerSprites.colors[fg.charCodeAt(0) - '0'.charCodeAt(0)])};
            } else {
                fuzzyColor(random, 0xffffff);
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