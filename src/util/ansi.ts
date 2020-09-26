function ansiBlock(num: number) {
    return (st: any): string => {
        return `\x1b[${num}m${st}\x1b[0m`;
    }
}

export const inverse = ansiBlock(7);
export const bold = ansiBlock(1);
export const black = ansiBlock(30);
export const red = ansiBlock(31);
export const green = ansiBlock(32);
export const yellow = ansiBlock(33);
export const blue = ansiBlock(34);
export const magenta = ansiBlock(35);
export const cyan = ansiBlock(36);
export const white = ansiBlock(37);

export const blackBg = ansiBlock(40);
export const redBg = ansiBlock(41);
export const greenBg = ansiBlock(42);
export const yellowBg = ansiBlock(43);
export const blueBg = ansiBlock(44);
export const magentaBg = ansiBlock(45);
export const cyanBg = ansiBlock(46);
export const whiteBg = ansiBlock(47);

export enum Color {
    Black,
    Red,
    Green,
    Yellow,
    Blue,
    Magenta,
    Cyan,
    White,
    Gray=60,
    BrightRed=61,
    BrightGreen=62,
    BrightYellow=63,
    BrightBlue=64,
    BrightMagenta=65,
    BrightCyan=66,
    BrightWhite=67,
};

export const color = (st: string, fg: Color, bg?: Color, bold?: boolean) => {
    let res = "";
    res += `\x1b[${30+fg}m`;
    if (bg != null) {
        res += `\x1b[${40 + bg}m`;
    }
    if (bold){
        res += `\x1b[${1}m`;
    }
    res += st;
    res +=`\x1b[0m`;
    return res;
}


export const background = (st: string, fg: number, bg: number) => {
    const fgR = (fg >> 16) & 255;
    const fgG = (fg >> 8) & 255;
    const fgB = (fg >> 0) & 255;

    const bgR = (bg >> 16) & 255;
    const bgG = (bg >> 8) & 255;
    const bgB = (bg >> 0) & 255;

    let res = "";
    res += `\x1b[38;2;${fgR};${fgG};${fgB}m`;
    res += `\x1b[48;2;${bgR};${bgG};${bgB}m`;
    res += st;
    res +=`\x1b[0m`;
    return res;
}

export const clearScreen = '\x1b[2J';
export const goHome = '\x1b[H';