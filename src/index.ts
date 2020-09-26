import {background, clearScreen, Color, color, goHome, hideCursor, showCursor} from "./util/ansi";
import {stripMargin} from "./util/stripMargin";
import * as fs from "fs";

const baseFg = 0x424242;
const baseBg = 0x505050;
const baseCrateFg = 0x202020;
const baseCrateBg = 0x654321;
const baseCrateAtPositionFg = 0x202020;
const baseCrateAtPositionBg = 0x909021;

enum Cell {
    Wall,
    Crate,
    Player,
    Goal,
    Empty,
    Void
}

enum Dir {
    Up =    0,
    Right = 1,
    Left =  3,
    Down =  2,
}

const crateSprite = stripMargin`
    | ┌┬┬┬┬┐ 
    | │├ΘΘ├│ 
    | └┴┴┴┴┘ 
`.split('\n');

const playerSprites = [
    stripMargin`
    |  █▄▄▄▄█
    |  ▓▓██▓▓ 
    |  ▓▓██▓▓   
    `.split('\n'),
    stripMargin`
    |  ▓▓▓ █▀ 
    |  █████  
    |  ▓▓▓ █▄   
    `.split('\n'),
    stripMargin`
    |  ▓▓██▓▓ 
    |  ▓▓██▓▓  
    |  █▀▀▀▀█
    `.split('\n'),
    stripMargin`
    |  ▀█ ▓▓▓ 
    |   █████ 
    |  ▄█ ▓▓▓   
    `.split('\n'),
];

const goalSprite = stripMargin`
    |        
    |    /\\ 
    |    \\/
`.split('\n');

const tileHeight = 3;
const tileWidth = 7;

const wallPattern = stripMargin`
    |    B    BA B  AB  A BA A A 
    |  A A AB A  AB  A AB AB  A  
    |                       
    |    A    AB A  BA  B AB B B 
    |  B A BA B  BA  B BA BA  B  
    |                       
`.split("\n");
// const wallTiles = stripMargin`
//     |                ┌─┬─┐                    ┌─┬─┬─┬─┬┐     ┌─┬─┐          ┌┬─┬─┬─┬─┐          ┌┬─┬┐     ┌─┬─┬─┬─┬┐     ┌┬─┬┐     ┌┬─┬┐
//     |                ├┬┴┬┤                    ├┬┴┬┴┬┴┬┴┤     ├┬┴┬┤          ├┴┬┴┬┴┬┴┬┤          ├┴┬┴┤     ├┬┴┬┴┬┴┬┴┤     ├┴┬┴┤     ├┴┬┴┤
//     |                ├┴┬┴┤                    ├┴┬┴┬┴─┴─┘     ├┴┬┴┤          └─┴─┴┬┴┬┴┤          ├┬┴┬┤     ├┴┬┴┬┴┬┴┬┤     └─┴─┘     └─┴─┘
//     |      ┌┬─┬┐     ├┬┴┬┤     ┌┬─┬─┬─┬─┐     ├┬┴┬┤          ├┬┴┬┴┬─┬─┐          ├┬┴┬┤     ┌┬─┬─┼┴┬┴┤     ├┬┴┬┴┬┴┬┴┤          ┌┬─┬┐
//     |      ├┴┬┴┤     ├┴┬┴┤     ├┴┬┴┬┴┬┴┬┤     ├┴┬┴┤          ├┴┬┴┬┴┬┴┬┤          ├┴┬┴┤     ├┴┬┴┬┴┬┴┬┤     ├┴┬┴┬┴┬┴┬┤          ├┴┬┴┤
//     |      └─┴─┘     └─┴─┘     └─┴─┴─┴─┴┘     └─┴─┘          └─┴─┴─┴─┴┘          └─┴─┘     └─┴─┴─┴─┴┘     └─┴─┴─┴─┴┘          └─┴─┘
//     |
//     |
//     |
//     |                ┌┬─┬┐                    ┌┬─┬─┬─┬─┐     ┌┬─┬┐          ┌─┬─┬─┬─┬┐          ┌─┬─┐     ┌┬─┬─┬─┬─┐     ┌─┬─┐     ┌─┬─┐
//     |                ├┴┬┴┤                    ├┴┬┴┬┴┬┴┬┤     ├┴┬┴┤          ├┬┴┬┴┬┴┬┴┤          ├┬┴┬┤     ├┴┬┴┬┴┬┴┬┤     ├┬┴┬┤     ├┬┴┬┤
//     |                ├┬┴┬┤                    ├┬┴┬┼─┴─┴┘     ├┬┴┬┤          └┴─┴─┼┬┴┬┤          ├┴┬┴┤     ├┬┴┬┴┬┴┬┴┤     └┴─┴┘     └┴─┴┘
//     |      ┌─┬─┐     ├┴┬┴┤     ┌─┬─┬─┬─┬┐     ├┴┬┴┤          ├┴┬┴┼─┬─┬┐          ├┴┬┴┤     ┌─┬─┬┴┬┴┬┤     ├┴┬┴┬┴┬┴┬┤          ┌─┬─┐
//     |      ├┬┴┬┤     ├┬┴┬┤     ├┬┴┬┴┬┴┬┴┤     ├┬┴┬┤          ├┬┴┬┴┬┴┬┴┤          ├┬┴┬┤     ├┬┴┬┴┬┴┬┴┤     ├┬┴┬┴┬┴┬┴┤          ├┬┴┬┤
//     |      └┴─┴┘     └┴─┴┘     └┴─┴─┴─┴─┘     └┴─┴┘          └┴─┴─┴─┴─┘          └┴─┴┘     └┴─┴─┴─┴─┘     └┴─┴─┴─┴─┘          └┴─┴┘
//     |
//     |
//     |
// `.split('\n');


const wallTiles = stripMargin`
    |                      ┌─┬─┬─┐                            ┌─┬─┬─┬─┬─┬─┬┐       ┌─┬─┬─┐              ┌┬─┬─┬─┬─┬─┬─┐              ┌┬─┬─┬┐       ┌─┬─┬─┬─┬─┬─┬┐       ┌┬─┬─┬┐       ┌┬─┬─┬┐               
    |                      ├┬┴┬┴┬┤                            ├┬┴┬┴┬┴┬┴┬┴┬┴┤       ├┬┴┬┴┬┤              ├┴┬┴┬┴┬┴┬┴┬┴┬┤              ├┴┬┴┬┴┤       ├┬┴┬┴┬┴┬┴┬┴┬┴┤       ├┴┬┴┬┴┤       ├┴┬┴┬┴┤               
    |                      ├┴┬┴┬┴┤                            ├┴┬┴┬┴┬┴─┴─┴─┘       ├┴┬┴┬┴┤              └─┴─┴─┴┬┴┬┴┬┴┤              ├┬┴┬┴┬┤       ├┴┬┴┬┴┬┴┬┴┬┴┬┤       └─┴─┴─┘       └─┴─┴─┘               
    |        ┌┬─┬─┬┐       ├┬┴┬┴┬┤       ┌┬─┬─┬─┬─┬─┬─┐       ├┬┴┬┴┬┤              ├┬┴┬┴┬┴┬─┬─┬─┐              ├┬┴┬┴┬┤       ┌┬─┬─┬─┼┴┬┴┬┴┤       ├┬┴┬┴┬┴┬┴┬┴┬┴┤              ┌┬─┬─┬┐                    
    |        ├┴┬┴┬┴┤       ├┴┬┴┬┴┤       ├┴┬┴┬┴┬┴┬┴┬┴┬┤       ├┴┬┴┬┴┤              ├┴┬┴┬┴┬┴┬┴┬┴┬┤              ├┴┬┴┬┴┤       ├┴┬┴┬┴┬┴┬┴┬┴┬┤       ├┴┬┴┬┴┬┴┬┴┬┴┬┤              ├┴┬┴┬┴┤                    
    |        └─┴─┴─┘       └─┴─┴─┘       └─┴─┴─┴─┴─┴─┴┘       └─┴─┴─┘              └─┴─┴─┴─┴─┴─┴┘              └─┴─┴─┘       └─┴─┴─┴─┴─┴─┴┘       └─┴─┴─┴─┴─┴─┴┘              └─┴─┴─┘                    
    |                                                                                                                                                                                                     
    |                                                                                                                                                                                                            
    |                                                                                                                                                                                                            
    |                      ┌┬─┬─┬┐                            ┌┬─┬─┬─┬─┬─┬─┐       ┌┬─┬─┬┐              ┌─┬─┬─┬─┬─┬─┬┐              ┌─┬─┬─┐       ┌┬─┬─┬─┬─┬─┬─┐       ┌─┬─┬─┐       ┌─┬─┬─┐               
    |                      ├┴┬┴┬┴┤                            ├┴┬┴┬┴┬┴┬┴┬┴┬┤       ├┴┬┴┬┴┤              ├┬┴┬┴┬┴┬┴┬┴┬┴┤              ├┬┴┬┴┬┤       ├┴┬┴┬┴┬┴┬┴┬┴┬┤       ├┬┴┬┴┬┤       ├┬┴┬┴┬┤               
    |                      ├┬┴┬┴┬┤                            ├┬┴┬┴┬┼─┴─┴─┴┘       ├┬┴┬┴┬┤              └┴─┴─┴─┼┬┴┬┴┬┤              ├┴┬┴┬┴┤       ├┬┴┬┴┬┴┬┴┬┴┬┴┤       └┴─┴─┴┘       └┴─┴─┴┘               
    |        ┌─┬─┬─┐       ├┴┬┴┬┴┤       ┌─┬─┬─┬─┬─┬─┬┐       ├┴┬┴┬┴┤              ├┴┬┴┬┴┼─┬─┬─┬┐              ├┴┬┴┬┴┤       ┌─┬─┬─┬┴┬┴┬┴┬┤       ├┴┬┴┬┴┬┴┬┴┬┴┬┤              ┌─┬─┬─┐                    
    |        ├┬┴┬┴┬┤       ├┬┴┬┴┬┤       ├┬┴┬┴┬┴┬┴┬┴┬┴┤       ├┬┴┬┴┬┤              ├┬┴┬┴┬┴┬┴┬┴┬┴┤              ├┬┴┬┴┬┤       ├┬┴┬┴┬┴┬┴┬┴┬┴┤       ├┬┴┬┴┬┴┬┴┬┴┬┴┤              ├┬┴┬┴┬┤                    
    |        └┴─┴─┴┘       └┴─┴─┴┘       └┴─┴─┴─┴─┴─┴─┘       └┴─┴─┴┘              └┴─┴─┴─┴─┴─┴─┘              └┴─┴─┴┘       └┴─┴─┴─┴─┴─┴─┘       └┴─┴─┴─┴─┴─┴─┘              └┴─┴─┴┘                    
    |                                                                                                                                                                                                              
    |                                                                                                                                                                                                            
    |                                                                                                                                                                                                            
    `.split('\n');

type Level = {
    author: string;
    title: string;
    map: string;
}
function load(file: string){
    const res = fs.readFileSync(file, {encoding: 'ascii'}).split('\n');
    while (res.findIndex(x=>x.startsWith(':')) >= 0) {
        res.splice(0, 1);
    }

    const levels = [];
    while(res.findIndex((x=>x.startsWith('Author:'))) > 0) {
        res.splice(0, 2);
        const height = res.findIndex((x=>x.startsWith('Author:')));
        levels.push({
            map: res.slice(0, height),
            author: res[height].split(': ')[1],
            title: res[height+1].split(': ')[1],
        });
        res.splice(0, height+2);
    }
    return levels;
}

const levels = load('resources/levels.txt');

const level = levels[0];
const map = level.map;

let steps = 0;
type Pos = {readonly irow: number; readonly icol: number};
function* positions(): Iterable<Pos>{
    for(let irow=0;irow<crow;irow++) {
        for (let icol = 0; icol < ccol; icol++) {
            yield {irow, icol}
        }
    }
}
function find(ch: string): Pos[] {
    return [...positions()].filter(pos => getCh(pos) === ch);
}

function findVoids(): Pos[] {
   const voids: Pos[] = [];
   let ps = new Set(positions());

   const has = (p:Pos) => voids.some(v=>eq(p,v));
   let any = true;
   while(any) {
       any = false;
       for (let p of [...ps]) {
           if (getCh(p) == ' ' && (
               p.icol == 0 ||
               p.icol == map[p.irow].length - 1 ||
               p.irow == 0 ||
               p.irow == map.length - 1 ||
               has(above(p)) ||
               has(below(p)) ||
               has(left(p)) ||
               has(right(p)))
           ) {
               ps.delete(p);
               voids.push(p);
               any=true;
           }
       }
   }
   return voids;
}


function getCh(pos: Pos): string{
    const {irow, icol} = pos;
    if(irow >= 0 && irow < map.length && icol >=0 && icol < map[irow].length){
        return map[irow][icol];
    }
    return ' ';
}
const ccol = Math.max(...map.map(x=>x.length));
const crow = map.length;
let player = find('@')[0];
let crates = find('$');
let walls = find('#');
let goals = find('.');
let voids = findVoids();
let dir = Dir.Right;

function isGoal(pos: Pos){
    return goals.some(goal => eq(goal, pos));
}
function isWall(pos: Pos){
    return walls.some(wall => eq(wall, pos));
}
function eq(posA: Pos, posB: Pos){
    return posA.icol === posB.icol && posA.irow === posB.irow;
}

function validPos(pos: Pos): boolean{
    const {irow, icol} = pos;
    return irow >= 0 && irow < map.length && icol >=0 && icol < map[irow].length && !voids.some(p => eq(p, pos));
}

function left(pos: Pos){
    return {irow: pos.irow, icol: pos.icol - 1};
}
function right(pos: Pos){
    return {irow: pos.irow, icol: pos.icol + 1};
}

function above(pos: Pos){
    return {irow: pos.irow-1, icol: pos.icol};
}
function below(pos: Pos){
    return {irow: pos.irow+1, icol: pos.icol};
}
function getCell(pos: Pos){
    if (!validPos(pos)) {
        return Cell.Void;
    } else if (eq(player, pos)) {
        return Cell.Player;
    } else if (walls.some(wall => eq(wall, pos))){
        return Cell.Wall;
    } else if(crates.some(wall => eq(wall, pos))){
        return Cell.Crate;
    } else if(goals.some(wall => eq(wall, pos))){
        return Cell.Goal;
    } else {
        return Cell.Empty;
    }
}

function pattern(st1:string,st2:string,st3:string,st4:string): string[] {
    const st = st1+st2+st3+st4;
    for (let irow = 0; irow < wallPattern.length - 1; irow++) {
        for (let icol = 0; icol < wallTiles[0].length - 1; icol ++) {
            if (
                wallPattern[irow][icol] == st[0] &&
                wallPattern[irow][icol + 1] == st[1] &&
                wallPattern[irow + 1][icol] == st[2] &&
                wallPattern[irow + 1][icol + 1] == st[3]
            ) {
                let res = [];
                for (let i = 0; i < tileHeight * 2; i++) {
                    res.push(wallTiles[(irow * tileHeight) + i].substr((icol * tileWidth), 2 * tileWidth));
                }
                return res;
            }
        }
    }
    return ["xxxxxxxxxx", "xxxxxxxxxx", "xxxxxxxxxx", "xxxxxxxxxx", "xxxxxxxxxx", "xxxxxxxxxx",];
}

let timeStart: number=0;
function move(drow: number, dcol: number) {

    const posT = {irow: player.irow + drow, icol: player.icol + dcol};

    const oldPos = player;
    dir =
        drow == 1  && dcol == 0 ? Dir.Down :
        drow == -1  && dcol == 0 ? Dir.Up :
        drow == 0  && dcol == -1 ? Dir.Left :
        drow == 0  && dcol == 1 ? Dir.Right :
        dir;

    switch(getCell(posT)){
        case Cell.Wall:
            break;
        case Cell.Player:
            break;
        case Cell.Crate:
            const posTT = {irow: player.irow + 2 * drow, icol: player.icol + 2 * dcol};
            if (getCell(posTT) == Cell.Empty || getCell(posTT) == Cell.Void || getCell(posTT) == Cell.Goal) {
                player = posT;
                crates = [posTT, ...crates.filter(crate => !eq(crate, posT))];
            }
            break;
        case Cell.Goal:
        case Cell.Empty:
        case Cell.Void:
            player = posT;
            break;

    }
    if(!eq(oldPos, player)){
        if(steps == 0){
            timeStart = Date.now();
        }
        steps++;
    }
    draw();
}

setInterval(()=>draw(), 1000);

let seed = 1;

type Paxel  ={
    ch: string;
    bg: number;
    fg: number;
}


function clamp(number: number) {
    return Math.min(Math.max(0, number), 255);
}

const random = () => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};
function fuzzyColor(fg: number): number {
    let rand = random();

    let d =
        rand < 0.25 ? -1 :
        rand < 0.5 ? 2 :
        rand < 0.75 ? 1 :
        4;
    const fgR=clamp(((fg >>16)&255) + d);
    const fgG=clamp(((fg >>8)&255) + d);
    const fgB=clamp(((fg >>0)&255) + d);
    return (fgR << 16) + (fgG << 8) + (fgB);
}
function paxel(ch: string, fg: number, bg: number): Paxel{

    return {
        ch: ch,
        fg: fg,
        bg: bg,
    };
}

function pickInt(length: number) {
    return Math.floor(random() * length);
}

function pick<T>(ts: T[]): T {
    return ts[pickInt(ts.length)];
}


function init(): Paxel[][]{
    const pss: Paxel[][] = [];

    for (let irow = 0; irow < crow * tileHeight+1; irow++) {
        pss.push([]);
    }
    return pss;
}

function drawBase(pss: Paxel[][]) {

    let fg = fuzzyColor(baseFg);
    let bg = fuzzyColor(baseBg);
    let i = 0;
    let ch = pick('▓▒░ '.split(''));
    for (let irow = 0; irow < crow * tileHeight; irow++) {
        for (let icol = 0; icol < ccol * tileWidth; icol++) {

            if (i % 2 == 0) {
                const cell = getCell({
                    irow:Math.floor(irow/tileHeight),
                    icol: Math.floor(icol/tileWidth)}
                );
                fg = fuzzyColor(baseFg);
                bg = cell == Cell.Void ? 0 : fuzzyColor(baseBg);
                ch = cell == Cell.Void ? ' ' : pick('▓▒░ '.split(''));
            }
            i++;
            pss[irow][icol] = paxel(ch, fg, bg);
        }
    }
}
type Rgb = {r:number, g: number, b: number};
type Hsl = {h:number, s: number, l: number};

function hexToRgb(color: number): Rgb {
    return {
        r: (color >> 16) & 255,
        g: (color >> 8) & 255,
        b: (color >> 0) & 255
    };
}

function rgbToHex(rgb: Rgb): number {
    const r=clamp(rgb.r);
    const g=clamp(rgb.g);
    const b=clamp(rgb.b);
    return (r << 16) + (g << 8) + (b);
}

function hslToRgb(hsl: Hsl){
    let {h,s,l} = hsl;
    s /= 100;
    l /= 100;

    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c/2,
        r = 0,
        g = 0,
        b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return {r,g,b};
}
function rgbToHsl(rgb: Rgb) {
    // Make r, g, and b fractions of 1
    let {r,g,b}=rgb;
    r /= 255;
    g /= 255;
    b /= 255;

    // Find greatest and smallest channel values
    let cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;
    // Calculate hue
    // No difference
    if (delta == 0)
        h = 0;
    // Red is max
    else if (cmax == r)
        h = ((g - b) / delta) % 6;
    // Green is max
    else if (cmax == g)
        h = (b - r) / delta + 2;
    // Blue is max
    else
        h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    // Make negative hues positive behind 360°
    if (h < 0)
        h += 360;

    // Calculate lightness
    l = (cmax + cmin) / 2;

    // Calculate saturation
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    // Multiply l and s by 100
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);


    return {h, s,l}
}

function darkenColor(hex: number, m: number){

    let hsl = rgbToHsl(hexToRgb(hex));
    hsl.l *= m;
    return rgbToHex(hslToRgb(hsl));
}

function drawShadow(pss: Paxel[][], tileWidth: number, tileHeight: number, irow: number, icol: number, fg: number, bg: number, drow: number=0, dcol: number=0) {
    let st = '';
    for (let tileRow = 0; tileRow < tileHeight; tileRow++) {
        for (let tileCol = 0; tileCol < tileWidth; tileCol++) {
            st += ' ';
        }
        st+=' \n';
    }
    drawTile(pss, irow, icol, st.split('\n'), dcol,drow, fg, bg, false);

}

const baseWallFg = darkenColor(0x323232, 0.5);
const baseWallBg = 0x323232;

function drawWallsShadows(pss: Paxel[][]) {

    for (let wall of walls) {
        const {irow, icol} = wall;
        drawShadow(pss, tileWidth, tileHeight, irow, icol, baseBg, darkenColor(baseWallFg, 0.9), 0,0);
    }
}

function drawWalls(pss: Paxel[][]) {

    for (let wall of walls) {
        const {irow, icol} = wall;

        let p = (irow + icol) % 2 == 1 ? "A" : "B";
        let np = (irow + icol) % 2 == 1 ? "B" : "A";
        const wallAboveLeft = isWall(above(left(wall))) ? p : " ";
        const wallAbove = isWall(above(wall)) ? np : " ";
        const wallLeft = isWall(left(wall)) ? np : " ";
        const wallAboveRight = isWall(above(right(wall))) ? p : " ";
        const wallRight = isWall(right(wall)) ? np : " ";
        const wallBelowLeft = isWall(below(left(wall))) ? p : " ";
        const wallBelow = isWall(below(wall)) ? np : " ";
        const wallBelowRight = isWall(below(right(wall))) ? p : " ";

        const patterns = [
            pattern(wallAboveLeft, wallAbove, wallLeft, p),
            pattern(" ", wallAbove, " ", p),
            pattern(wallAbove, wallAboveRight, p, wallRight),
            pattern(wallLeft, p, " ", " "),
            pattern(" ", p, " ", " "),
            pattern(p, wallRight, " ", " "),
            pattern(wallLeft, p, wallBelowLeft, wallBelow),
            pattern(wallLeft, p, wallBelowLeft, wallBelow),
            pattern(p, wallRight, wallBelow, wallBelowRight),
        ];

        let i = 0;
        let fg = fuzzyColor(baseWallFg);
        let bg = fuzzyColor(baseWallBg);

        for(let tileRow=0;tileRow<tileHeight;tileRow++){
            for(let tileCol=0;tileCol<tileWidth;tileCol++){

                if (i % 2 == 0) {
                    fg = fuzzyColor(baseWallFg);
                    bg = fuzzyColor(baseWallBg);
                }
                i++;

                let ch: string;
                if (tileRow == 0) {
                    if (tileCol == 0){
                        ch = patterns[0][tileHeight][tileWidth];
                    } else if(tileCol < tileWidth - 1){
                        ch = patterns[1][tileHeight][tileWidth + tileCol];
                    } else {
                        ch = patterns[2][tileHeight][tileWidth - 1];
                    }
                } else if(tileRow < tileHeight - 1)  {
                    if (tileCol == 0){
                        ch = patterns[3][tileRow][tileWidth];
                    } else if(tileCol < tileWidth - 1){
                        ch = patterns[4][tileRow][tileWidth + tileCol];
                    } else {
                        ch = patterns[5][tileRow][tileWidth - 1];
                    }
                } else {
                    if (tileCol == 0){
                        ch = patterns[6][tileHeight-1][tileWidth];
                    } else if(tileCol < tileWidth - 1){
                        ch = patterns[7][tileHeight-1][tileWidth + tileCol];
                    } else {
                        ch = patterns[8][tileHeight-1][tileWidth - 1];
                    }
                }

                pss[irow * tileHeight + tileRow][icol*tileWidth+tileCol] = paxel(ch, fg, bg);

            }
        }

    }
}


function drawTile(pss: Paxel[][], irow: number, icol: number, tile: string[], dx: number = 0, dy: number = 0, fg: number | null, bg: number | null, ignoreSpace: boolean = true) {
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
                    p.bg = fuzzyColor(bg);
                }

                pss[irow * tileHeight + tileRow + dy][icol * tileWidth + tileCol+ dx] = p;
            }
        }
    }
}
function drawGoals(pss: Paxel[][]) {
    for (let goal of goals) {
        drawTile(pss, goal.irow, goal.icol, goalSprite, 0,0,0xffffff, null);
    }
}

function drawPlayer(pss: Paxel[][]) {
    drawTile(pss, player.irow, player.icol, playerSprites[dir], 0,0,0xaaaaaa, null);
}

function drawCrates(pss: Paxel[][]) {
    for(let crate of crates){
        const bg =isGoal(crate) ? baseCrateAtPositionBg : baseCrateBg;
        const fg =isGoal(crate) ? baseCrateAtPositionFg : baseCrateFg;

        drawShadow(pss, tileWidth-1, tileHeight, crate.irow, crate.icol, baseBg, darkenColor(bg, 0.5));
    }

    for(let crate of crates){
        const bg =isGoal(crate) ? baseCrateAtPositionBg : baseCrateBg;
        const fg =isGoal(crate) ? baseCrateAtPositionFg : baseCrateFg;
        drawTile(pss, crate.irow, crate.icol, crateSprite, 0,0, fg, bg);
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
let pssPrev: Paxel[][] | null = null;



function draw() {
    seed = 0;
    const pss = init();
    drawBase(pss);
    drawGoals(pss);
    drawWallsShadows(pss);
    drawCrates(pss);
    drawPlayer(pss);
    drawWalls(pss);

    let st = '';
    if(pssPrev == null){
        st += `${clearScreen}${goHome}${hideCursor}`;
    }

    const time = steps == 0 ? 0 : Math.floor((Date.now() - timeStart)/1000);
    print(pss, `${level.title}    Steps: ${steps.toString(10).padStart(4, '0')}    Time: ${time.toString(10).padStart(4, '0')}`, 0,0, 0xffffff);
    for(let irow=0;irow<pss.length;irow++){
        for(let icol = 0;icol<pss[0].length;icol++){
            const prev = pssPrev?.[irow]?.[icol];
            const p = pss[irow][icol];
            if(p?.ch != prev?.ch || p?.fg != prev?.fg || p?.bg != prev?.bg) {
                st += `\x1b[${irow+1};${icol+1}H`;
                if(p == null){
                    st += ' ';
                } else {
                    st += background(p.ch, p.fg, p.bg);
                }
            }
        }
    }

    pssPrev = pss;

    process.stdout.write(st);
}
process.on('SIGTERM', () => {
    process.exit(0);
});
process.on('exit', () => {
    process.stdout.write(clearScreen+showCursor);
});
process.stdin.setRawMode(true);
process.stdin.on("data", (data) => {
    if (data[0] == 27 && data[1] == 91 && data[2]==0x44){
       move(0, -1);
    }  else if(data[0] == 27 && data[1] == 91 && data[2]==0x43){
        move(0, 1);
    }  else if(data[0] == 27 && data[1] == 91 && data[2]==0x41){
        move(-1, 0);
    }  else if(data[0] == 27 && data[1] == 91 && data[2]==0x42){
        move(1, 0);
    }  else if(data[0] == 0x1b){
        process.exit(0);
    }else {
        console.log(data);
    }
});

draw();
new Promise<void>(() => {});