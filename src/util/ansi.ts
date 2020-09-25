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


export const background = (st: string, r: number, g: number, b: number, br: number, bg: number, bb: number) => {
    r = Math.min(Math.max(0, r), 255);
    g = Math.min(Math.max(0, g), 255);
    b = Math.min(Math.max(0, b), 255);
    br = Math.min(Math.max(0, br), 255);
    bg = Math.min(Math.max(0, bg), 255);
    bb = Math.min(Math.max(0, bb), 255);
    let res = "";
    res += `\x1b[38;2;${r};${g};${b}m`;
    res += `\x1b[48;2;${br};${bg};${bb}m`;
    res += st;
    res +=`\x1b[0m`;
    return res;
}

export const clearScreen = '\x1b[2J';
export const goHome = '\x1b[H';