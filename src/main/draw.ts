import {background, goHome, hideCursor} from "./util/ansi";
import {hexToRgb, rgbToHex} from "./util/color";
import {Level} from "./level";
import {Random} from "./util/random";
import {logo} from "./objects/logo";
import {Tile} from "./tile";

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
        {
            rndval ^= 0x00012000;
        }

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
            const p = {ch: ' ', fg: 0, bg: 0, ...terminalTile.get(icol, irow)};
            let st = `\x1b[${irow + 1};${icol + 1}H`;
            st += background(p.ch, p.fg, p.bg);
            process.stdout.write(st);
            while (Date.now() < end) {
                ;
            }
            end += t;
        }
    } else {

        if (terminalWidth !== prevTerminalWidth || terminalHeight !== prevTerminalHeight) {
            prevTerminalTile = null;
        }

        let st = '';
        for (let irow = 0; irow < terminalHeight; irow++) {
            for (let icol = 0; icol < terminalWidth; icol++) {
                const prev = prevTerminalTile?.get(icol, irow);
                const p = {ch: ' ', fg: 0, bg: 0, ...terminalTile.get(icol, irow)};
                if (p.ch != prev?.ch || p.fg != prev?.fg || p.bg != prev?.bg) {
                    st += `\x1b[${irow + 1};${icol + 1}H`;
                    st += background(p.ch, p.fg, p.bg);
                }
            }
        }
        process.stdout.write(st);
    }

    showLogoPrev = showLogo;
    levelPrev = level;
    prevTerminalTile = terminalTile;
    prevTerminalWidth = terminalWidth;
    prevTerminalHeight = terminalHeight;
}

