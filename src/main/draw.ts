import {background} from "./util/ansi";
// import {Level} from "./level";
// import {logo} from "./objects/logo";
import {Tile} from "./tile";
// import {permutePoints} from "./permutePoints";
// import {Input} from "./objects/input";

let prevTerminalTile: Tile | null = null;
// let levelPrev: Level | null = null;
// let showLogoPrev: boolean | null = null;
// let prevTerminalHeight: number | null = null;
// let prevTerminalWidth: number | null = null;

export interface Drawable {
    draw(surface: Tile): void
}

export function draw(drawables: Drawable[]) {
    const levelTile = new Tile();
    for (let drawable of drawables) {
        drawable.draw(levelTile);
    }

    // if (showLogo) {
    //     levelTile.drawTile(logo,
    //         Math.floor((levelTile.width - logo.width) / 2),
    //         Math.floor((levelTile.height - logo.height) / 2)
    //     );
    // } else {
    //     new Input("Select level: 1-100").draw(levelTile);
    // }
    //
    // if (showLogo !== showLogoPrev) {
    //     prevTerminalTile = null;
    // }

    // if (levelPrev?.title != level?.title) {
    //     prevTerminalTile = null;
    // }

    const terminalWidth = process.stdout.columns;
    const terminalHeight = process.stdout.rows;

    const terminalTile = new Tile();
    terminalTile.drawTile(levelTile,
        Math.floor((terminalWidth - levelTile.width) / 2),
        Math.floor((terminalHeight - levelTile.height) / 2),
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

    // if (terminalWidth !== prevTerminalWidth || terminalHeight !== prevTerminalHeight) {
    //     prevTerminalTile = null;
    // }

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
    //
    //
    // showLogoPrev = showLogo;
    // levelPrev = level;
    // prevTerminalTile = terminalTile;
    // prevTerminalWidth = terminalWidth;
    // prevTerminalHeight = terminalHeight;
}

