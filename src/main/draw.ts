import {background, goHome, hideCursor} from "./util/ansi";
import {hexToRgb, rgbToHex} from "./color";
import {Level} from "./level";
import {Random} from "./util/pick";
import {Tile} from "./util/stripMargin";
import {logo} from "./objects/logo";

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

let prevTerminalTile: Tile | null = null;
let levelPrev: Level | null = null;
let showLogoPrev: boolean | null = null;
let prevTerminalHeight: number | null = null;
let prevTerminalWidth: number | null = null;



function drawTrack(_random: Random, _level: Level) {
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
    const levelTile = new Tile();
    level.draw(levelTile);

    if (showLogo) {
        levelTile.drawTile(logo,
            Math.floor((levelTile.width - logo.width) / 2),
            Math.floor((levelTile.height - logo.height) / 2)
        );
    }

    if (showLogo !== showLogoPrev) {
        prevTerminalTile = null;
    }
    if (levelPrev?.title != level?.title) {
        prevTerminalTile = null;
    }

    const terminalWidth = process.stdout.columns;
    const terminalHeight = process.stdout.rows;

    const terminalTile = new Tile();
    terminalTile.drawTile(levelTile,
        Math.floor((terminalWidth - levelTile.width) / 2),
        Math.floor((terminalHeight - levelTile.height) / 2),
    );

    if (prevTerminalTile == null) {
        process.stdout.write(`${goHome}${hideCursor}`);
        let t = 100 / (terminalWidth * terminalHeight);
        let end = Date.now() + t;
        for (let [icol, irow] of fizzleFade(terminalWidth, terminalHeight)) {
            const p = {ch: ' ', fg: 0, bg: 0, ... terminalTile.get(icol, irow)};
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
            prevTerminalTile = null;
        }

        let st = '';
        for (let irow = 0; irow < terminalHeight; irow++) {
            for (let icol = 0; icol < terminalWidth; icol++) {
                const prev = prevTerminalTile?.get(icol, irow);
                const p = {ch: ' ', fg: 0, bg: 0, ... terminalTile.get(icol, irow)};
                if (p.ch != prev?.ch || p.fg != prev?.fg || p.bg != prev?.bg) {
                    st += `\x1b[${irow + 1};${icol + 1}H`;
                    st += background(p.ch, p.fg, p.bg);
                }
            }
        }
        process.stdout.write(st);
    }

    prevTerminalTile = levelTile;
    showLogoPrev = showLogo;
    levelPrev = level;
    prevTerminalWidth = terminalWidth;
    prevTerminalHeight = terminalHeight;
}

