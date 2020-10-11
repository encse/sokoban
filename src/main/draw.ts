import {background, clearScreen, goHome} from "./util/ansi";
import {Tile} from "./tile";
import {Rectangle} from "./util/position";

let prevTerminalTile: Tile | null = null;
let prevTerminalHeight: number | null = null;
let prevTerminalWidth: number | null = null;

export interface Drawable {
    draw(surface: Tile): void
}

export function draw(drawables: Drawable[]) {
    const levelTile = new Tile();
    for (let drawable of drawables) {
        drawable.draw(levelTile);
    }

    const terminalWidth = process.stdout.columns;
    const terminalHeight = process.stdout.rows;

    const terminalTile = new Tile();
    terminalTile.drawTile(levelTile,
        (terminalWidth - levelTile.width) / 2,
        (terminalHeight - levelTile.height) / 2,
    );

    // if (prevTerminalTile == null) {
    //     process.stdout.write(`${goHome}${hideCursor}`);
    //     let t = 100 / (terminalWidth * terminalHeight);
    //     let end = Date.now() + t;
    //     for (let [icol, irow] of permutePoints(terminalWidth, terminalHeight)) {
    //         const p = {ch: ' ', fg: 0, bg: 0, ...terminalTile.get(icol, irow)};
    //         let st = `\x1b[${irow + 1};${icol + 1}H`;
    //         st += background(p.ch, p.fg, p.bg);
    //         process.stdout.write(st);
    //         while (Date.now() < end) {
    //             ;
    //         }
    //         end += t;
    //     }
    // } else

    if (terminalWidth !== prevTerminalWidth || terminalHeight !== prevTerminalHeight) {
        prevTerminalTile = null;
    }

    let st = '';
    if(prevTerminalTile == null){
        st += clearScreen;
    }
    for (let irow = 0; irow < terminalHeight; irow++) {
        for (let icol = 0; icol < terminalWidth; icol++) {
            const prev = {ch: ' ', fg: 0, bg: 0, ...prevTerminalTile?.get(icol, irow)};
            const p = {ch: ' ', fg: 0, bg: 0, ...terminalTile.get(icol, irow)};
            if (p.ch !== prev?.ch || p.fg !== prev?.fg || p.bg !== prev?.bg) {
                st += `\x1b[${irow + 1};${icol + 1}H`;
                st += background(p.ch, p.fg, p.bg);
            }
        }
    }

    process.stdout.write(st);
    prevTerminalTile = terminalTile;
    prevTerminalWidth = terminalWidth;
    prevTerminalHeight = terminalHeight;
}

