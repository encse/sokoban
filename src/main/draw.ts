import {background, goHome, hideCursor} from "./util/ansi";
import {darkenColor, hexToRgb, Rgb, rgbToHex} from "./color";
import {Cell, Dir, Level, Tile} from "./level";
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
    logo,
    playerSprites,
    tileHeight,
    tileWidth,
    wallTile
} from "./tiles";
import {Random} from "./util/pick";
import {Position} from "./position";

export type Paxel = {
    ch: string;
    bg: number;
    fg: number;
}

export function fuzzyColor(random: Random, color: number): number {
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

export function paxel(ch: string, fg: number, bg: number): Paxel{

    return {
        ch: ch,
        fg: fg,
        bg: bg,
    };
}

let pssPrev: Paxel[][] | null = null;
let levelPrev: Level | null = null;
let showLogoPrev: boolean | null = null;
let prevTerminalHeight: number | null = null;
let prevTerminalWidth: number | null = null;


type Cone = {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly cosTheta: number;
}
export type Light = {
    readonly color: Rgb;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly direction: Cone | null;
}


function init(level: Level): Paxel[][]{
    const pss: Paxel[][] = [];

    const columns = process.stdout.columns;
    const rows = process.stdout.rows;

    for (let irow = 0; irow < Math.max(level.height, rows); irow++) {
        const row: Paxel[] = [];
        pss.push(row);
        for (let icol = 0; icol < Math.max(level.width, columns); icol++) {
            row.push(paxel(' ', 0,0));
        }
    }
    return pss;
}

function drawLights(level: Level, pss: Paxel[][]) {

    for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {

            const lighten = (color: number) => {
                const ambientIntensity = 1.5;

                const rgb = hexToRgb(color);
                const diffuseReflectionRatio = {
                    r: Math.max(1,rgb.r)/255,
                    g: Math.max(1,rgb.g)/255,
                    b: Math.max(1,rgb.b)/255,
                };

                const ambientReflectionRatio = diffuseReflectionRatio;
                const specularReflectionRatio = {
                    r: 0.0,
                    g: 0.0,
                    b: 0.0
                };

                const specularAlpha = 1;

                let i = {
                    r: ambientIntensity * ambientReflectionRatio.r,
                    g: ambientIntensity * ambientReflectionRatio.g,
                    b: ambientIntensity * ambientReflectionRatio.b,
                };

                for (let light of level.lights) {
                    if (!level.visible(x, y, light.x, light.y)) {
                        continue;
                    }

                    const lx = light.x - (x + 0.5);
                    const ly = (light.y - (y + 0.5)) * 2; //pixels are twice as tall than wide
                    const lz = light.z;

                    const lightSourceDistance = Math.sqrt(lx * lx + ly * ly + lz * lz);

                    let cosPhi = 1;
                    if (light.direction != null) {
                        cosPhi = -(lx * light.direction.x + ly * light.direction.y + lz * light.direction.z) / lightSourceDistance;
                        if (cosPhi < light.direction.cosTheta) {
                            cosPhi = 0; // outside spotlight
                        }
                    }

                    const diffuseLightIntensity = {
                        r: light.color.r / 255 * cosPhi,
                        g: light.color.g / 255 * cosPhi,
                        b: light.color.b / 255 * cosPhi
                    };
                    const specularLightIntensiy = diffuseLightIntensity;

                    const d = lz / lightSourceDistance; // <L',N'>  (N' = 0,0,1)
                    const s = Math.pow(lz / lightSourceDistance, specularAlpha); // <R',V'> == <V',L'> == <-N', L'>

                    const a = 0.1;
                    const b = 0.001;
                    const c = 0.001;

                    let distanceAttenuation = 1 / (a + b * lightSourceDistance + c * lightSourceDistance * lightSourceDistance);
                    i.r += diffuseReflectionRatio.r * d * diffuseLightIntensity.r * distanceAttenuation;
                    i.r += specularReflectionRatio.r * s * specularLightIntensiy.r * distanceAttenuation;

                    i.g += diffuseReflectionRatio.g * d * diffuseLightIntensity.g * distanceAttenuation;
                    i.g += specularReflectionRatio.g * s * specularLightIntensiy.g * distanceAttenuation;

                    i.b += diffuseReflectionRatio.b * d * diffuseLightIntensity.b * distanceAttenuation;
                    i.b += specularReflectionRatio.b * s * specularLightIntensiy.b * distanceAttenuation;
                }

                return rgbToHex({
                    r: i.r * 255,
                    g: i.g * 255,
                    b: i.b * 255,
                });
            };

            if(level.getCell(new Position(y, x)) !== Cell.Void){
                let p = pss[y][x];
                pss[y][x] = {...p, fg: lighten(p.fg), bg: lighten(p.bg)}
            }
        }
    }

    for(let light of level.lights) {
        print(pss, 'x', Math.floor(light.y), Math.floor(light.x), 0x0000ff);
    }
}


function drawTrack(_random: Random, _level: Level, _pss: Paxel[][]) {
    //
    // for (let row = 0; row < level.height; row++) {
    //     for (let column = 0; column < level.width; column++) {
    //         iflevel.visited(row, column);
    //         if(h + v > 0){
    //             const x = column*tileWidth;
    //             const y = row*tileHeight;
    //             const d = (x: number, y: number, s: number) => {
    //                 if(pss[y][x] != null) {
    //                     pss[y][x] = {
    //                         ...pss[y][x],
    //                       //  bg: darkenColor(pss[y][x].bg, Math.pow(0.98, s)),
    //                         fg: darkenColor(pss[y][x].fg, Math.pow(0.98, s))
    //                     }
    //                 }
    //             };
    //
    //             for(let i=0;i<tileWidth;i++){
    //                 d(x+i, y, h);
    //                 d(x+i, y+2, h);
    //             }
    //             for(let i=0;i<tileHeight;i++){
    //                 d(x+1, y+i, v);
    //                 d(x+2, y+i, v);
    //                 d(x+tileWidth-1, y+i, v);
    //                 d(x+tileWidth-2, y+i, v);
    //             }
    //         }
    //     }
    // }
}



// https://umumble.com/blogs/gdev/pixel_by_pixel-screen-fills-in-wolfenstein-3d/
function* fizzleFade(width: number, height: number): Iterable<[number, number]> {
    let x: number;
    let y: number;

    let rndval = 1;
    do {
        y = (rndval & 0x000FF) - 1; // low 8 bits - 1 = coordinate y
        x = (rndval & 0x1FF00) >> 8; // next 9 bits = coordinate x
        let lsb = rndval & 1; // the least significant bit is lost when shifted
        rndval >>= 1;
        if (lsb) // if the extended bit = 0, then do not xor
            rndval ^= 0x00012000;

        if (0 <= x && x < width && 0 <= y && y < height) {
            yield [x, y];
        }
    } while (rndval != 1);
}


export function draw(level: Level, showLogo: boolean) {
    const random = new Random(0);
    const pss = init(level);
    drawTile2(pss, level.ground,0,0);
    //drawTrack(random, level, pss);
    drawGoals(random, level, pss);
    drawWallsBase(random, level, pss);
    drawCrates(random, level, pss);
    drawPlayer(random, level, pss);
    drawWalls(random, level, pss);
    if (showLogo) {
        drawTile(random, level, pss, 2, 2, logo, 0, 0, 0xffffff, null);
    }
    drawLights(level, pss);
    const fmt = (num: number) => num.toString(10).padStart(4, '0');
    print(pss, `${level.title}    Steps: ${fmt(level.steps)}    Pushes: ${fmt(level.pushes)}    Time: ${fmt(level.time)}`, 0, 0, 0xffffff);

    if (showLogo !== showLogoPrev) {
        pssPrev = null;
    }
    if (levelPrev?.title != level?.title) {
        pssPrev = null;
    }

    const terminalWidth = process.stdout.columns;
    const terminalHeight = process.stdout.rows;


    if (pssPrev == null) {
        process.stdout.write(`${goHome}${hideCursor}`);
        let t = 100 / (terminalWidth * terminalHeight);
        let end = Date.now() + t;
        for (let [icol, irow] of fizzleFade(terminalWidth, terminalHeight)) {
            const p = pss[irow][icol] ?? {ch: ' ', fg: 0, bg: 0};
            let st = `\x1b[${irow + 1};${icol + 1}H`;
            st += background(p.ch, p.fg, p.bg);
            process.stdout.write(st);
            while(Date.now() < end){
                ;
            }
            end += t;
        }
    } else {

        if (terminalWidth !== prevTerminalWidth || terminalHeight !== prevTerminalHeight){
            pssPrev = null;
        }

        let st = '';
        for (let irow = 0; irow < terminalHeight; irow++) {
            for (let icol = 0; icol < terminalWidth; icol++) {
                const prev = pssPrev?.[irow]?.[icol];
                const p = pss[irow][icol] ?? {ch: ' ', fg: 0, bg: 0};
                if (p.ch != prev?.ch || p.fg != prev?.fg || p.bg != prev?.bg) {
                    st += `\x1b[${irow + 1};${icol + 1}H`;
                    st += background(p.ch, p.fg, p.bg);
                }
            }
        }
        process.stdout.write(st);
    }

    pssPrev = pss;
    showLogoPrev = showLogo;
    levelPrev = level;
    prevTerminalWidth = terminalWidth;
    prevTerminalHeight = terminalHeight;
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


function drawWallsBase(random: Random, level: Level,pss: Paxel[][]) {

    for (let wall of level.wallRectangles) {
        const {row, col} = wall;
        drawShadow(random, level, pss, tileWidth, tileHeight, row, col, baseBg, darkenColor(baseWallFg, 0.9), 0,0);
    }
}

function drawWalls(random: Random, level: Level,pss: Paxel[][]) {

    for (let wall of level.wallRectangles) {
        const {row, col} = wall;

        let p = (row + col) % 2 == 1 ? "A" : "B";
        let np = (row + col) % 2 == 1 ? "B" : "A";
        const wallAboveLeft = level.isWall(wall.center.moveTile(-1, -1)) ? p : " ";
        const wallAbove = level.isWall(wall.center.moveTile(-1, 0)) ? np : " ";
        const wallLeft = level.isWall(wall.center.moveTile(0, -1)) ? np : " ";
        const wallAboveRight = level.isWall(wall.center.moveTile(-1, 1)) ? p : " ";
        const wallRight =level. isWall(wall.center.moveTile(0, 1)) ? np : " ";
        const wallBelowLeft = level.isWall(wall.center.moveTile(1, -1)) ? p : " ";
        const wallBelow = level.isWall(wall.center.moveTile(1, 0)) ? np : " ";
        const wallBelowRight = level.isWall(wall.center.moveTile(1, 1)) ? p : " ";

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

                pss[row + tileRow][col+tileCol] = paxel(ch, fg, bg);

            }
        }

    }
}

function drawTile2(
    pss: Paxel[][],
    tile: Tile,
    x: number,
    y: number
) {
    for (let tileRow = 0; tileRow < tile.length; tileRow++) {
        if (pss[y + tileRow] == null) {
            continue;
        }
        for (let tileCol = 0; tileCol < tile[tileRow].length; tileCol++) {
            const pSrc = tile[tileRow][tileCol];
            const pDst = pss[y + tileRow][x + tileCol];
            if (pDst != null) {
                if (pSrc.bg != null) {
                    pDst.bg = pSrc.bg;
                }
                if (pSrc.fg != null) {
                    pDst.fg = pSrc.fg;
                }
                if (pSrc.ch != null) {
                    pDst.ch = pSrc.ch;
                }
            }
        }
    }
}

function drawTile(
    random: Random,
    _level: Level,
    pss: Paxel[][],
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
                    ...pss[irow + tileRow][icol + tileCol],
                    ch: tile[tileRow][tileCol],
                };

                if (fg != null) {
                    p.fg = fg;
                }
                if (bg != null) {
                    p.bg = fuzzyColor(random, bg);
                }

                pss[irow + tileRow + dy][icol + tileCol+ dx] = p;
            }
        }
    }
}
function drawGoals(random: Random, level: Level,pss: Paxel[][]) {
    for (let goal of level.goalRectangles) {
        drawTile(random, level, pss, goal.row, goal.col, goalSprite, 0,0,0xffffff, null);
    }
}

function drawPlayer(_random: Random, level: Level,pss: Paxel[][]) {

    let irow = level.playerRectangle.row;
    let icol = level.playerRectangle.col;
    const tile = playerSprites.tiles[level.playerDirection];
    for (let tileRow = 0; tileRow < tileHeight; tileRow++) {
        for (let tileCol = 0; tileCol < tileWidth; tileCol++) {

            const ch = tile[tileRow][tileCol];
            const bg = tile[tileRow][tileCol + tileWidth];
            const fg = tile[tileRow][tileCol + 2 * tileWidth];

            let p = {
                ...pss[irow + tileRow][icol + tileCol],
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
            pss[irow + tileRow][icol + tileCol] = p;
        }
    }
}

function drawCrates(random: Random, level: Level,pss: Paxel[][]) {
    for(let crate of level.crateRectangles){
        const bg =level.isGoal(crate.center) ? baseCrateAtPositionBg : baseCrateBg;
        drawShadow(random, level,pss, tileWidth-1, tileHeight, crate.row, crate.col, baseBg, darkenColor(bg, 0.5));
    }

    for(let cratePosition of level.crateRectangles){
        const bg =level.isGoal(cratePosition.center) ? baseCrateAtPositionBg : baseCrateBg;
        const fg =level.isGoal(cratePosition.center) ? baseCrateAtPositionFg : baseCrateFg;
        drawTile(random, level, pss, cratePosition.row, cratePosition.col, crateTile, 0,0, fg, bg);
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