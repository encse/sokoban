import {background, clearScreen, Color, color, goHome} from "./util/ansi";
import {stripMargin} from "./util/stripMargin";

enum Cell {
    Wall,
    Crate,
    Player,
    Goal,
    Empty
}

enum Dir {
    Up =    ' ▲ ',
    Right = ' ▶ ',
    Left =  ' ◀ ',
    Down =  ' ▼ ',
}

const crateSprite = stripMargin`
    |  ┌┬┬┬┐ 
    |  │├Θ┤│ 
    |  └┴┴┴┘ 
`.split('\n');

const playerSprite = stripMargin`
    |        
    |   (*)  
    |        
`.split('\n');

const goalSprite = stripMargin`
    |        
    |    x   
    |        
`.split('\n');

const emptySprite = stripMargin`
    |        
    |        
    |        
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


const level0=stripMargin`
    | ------XXXXX--
    | XXXXXXX   XX-
    | XX X @XX ** X
    | X    *      X
    | X  *  XXX   X
    | XXX XXXXX*XXX
    | X *  XXX ..X-
    | X * * * ...X-
    | X    XXX...X-
    | X ** X-X...X-
    | X  XXX-XXXXX-
    | XXXX---------
`;

const level = stripMargin`
       |               XXX      
       |              XX.XXX    
       |              X....X    
       |  XXXXXXXXXXXXX....X    
       | XX   XX     XX....XXXXX
       | X  **XX  * @XX....    X
       | X      ** *X  ....X   X
       | X  * XX ** X X....X  XX
       | X  * XX *  X XX XXX  X 
       | XX XXXXX XXX         X 
       | XX   *  * XXXXX XXX  X 
       | X *XXX  X XXXXX X XXXX 
       | X   *   X       X      
       | X  * X* * *XXX  X      
       | X ***X *   X XXXX      
       | X    X  ** X           
       | XXXXXX   XXX           
       |      XXXXX             
`;
// XXXX---------
// const level=stripMargin`
//     | X @
// `;


type Pos = {readonly irow: number; readonly icol: number};
const mtx = level.split("\n");
function* positions(): Iterable<Pos>{
    for(let irow=0;irow<mtx.length;irow++) {
        for (let icol = 0; icol < mtx[0].length; icol++) {
            yield {irow, icol}
        }
    }
}
function find(ch: string): Pos[] {
    return [...positions()].filter(pos => getCh(pos) === ch);
}

function getCh(pos: Pos): string{
    const {irow, icol} = pos;
    if(irow >= 0 && irow < mtx.length && icol >=0 && icol < mtx[irow].length){
        return mtx[irow][icol];
    }
    return ' ';
}
const ccol = mtx[0].length;
const crow = mtx.length;
let player = find('@')[0];
let crates = find('*');
let walls = find('X');
let goals = find('.');
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
    return irow >= 0 && irow < mtx.length && icol >=0 && icol < mtx[irow].length;
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
        return  Cell.Empty;
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

function move(drow: number, dcol: number) {
    const posT = {irow: player.irow + drow, icol: player.icol + dcol};

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
            if (getCell(posTT) == Cell.Empty || getCell(posTT) == Cell.Goal) {
                player = posT;
                crates = [posTT, ...crates.filter(crate => !eq(crate, posT))];
            }
            break;
        case Cell.Goal:
        case Cell.Empty:
            player = posT;
            break;

    }
    draw();
}

let seed = 1;

type Paxel  ={
    ch: string;
    bg: number;
    fg: number;
}


function fuzzyColor(st: string, r: number, g: number, b: number, br: number, bg: number, bb: number): Paxel{
    let res = "";

    const random = () => {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };


    let rand = random();
    let i=0;
    for(let ch of st){
        if(i%2== 0){
            rand = random();
        }
        i++;
        let d =
            rand < 0.25 ? -1 :
            rand < 0.5 ? 2 :
            rand < 0.75 ? 1 :
            4;
        d*=2;
        res += background(ch, r+d, g+d, b+d, br+d, bg+d, bb+d);

    }
    return res;
}


function draw() {
    seed = 0;
    process.stdout.write(`${clearScreen}${goHome}`);

    const paxels: Paxel[][] =[];

    for (let irow=0;irow<crow;irow++){
        for (let tileRow = 0; tileRow < tileHeight; tileRow++) {
            for (let icol = 0; icol < ccol; icol++) {
                for (let tileCol = 0; tileCol < tileHeight; tileCol++) {
                    paxels[irow*tileHeight + tileRow][icol*tileWidth+ tileCol] = fuzzyColor(' ', 0, 0, 0, 40, 40, 40);
                }
            }
        }
    }
    let res = '';
    for (let irow = 0; irow < crow; irow++) {
        for (let line = 0; line < tileHeight; line++) {
            for (let icol = 0; icol < ccol; icol++) {
                const pos = {irow, icol};

                let st: string;
                switch (getCell(pos)) {
                    case Cell.Player:
                        st = fuzzyColor(playerSprite[line], 255, 255, 255, 40, 40, 40);
                        break;
                    case Cell.Wall: {
                        st = "";
                        let p = (irow + icol) % 2 == 1 ? "A" : "B";
                        let np = (irow + icol) % 2 == 1 ? "B" : "A";
                        if (line == 0) {
                            const wallAboveLeft = isWall(above(left(pos))) ? p : " ";
                            const wallAbove = isWall(above(pos)) ? np : " ";
                            const wallLeft = isWall(left(pos)) ? np : " ";
                            const wallAboveRight = isWall(above(right(pos))) ? p : " ";
                            const wallRight = isWall(right(pos)) ? np : " ";

                            st += pattern(wallAboveLeft, wallAbove, wallLeft, p)[tileHeight].substr(tileWidth, 1);
                            st += pattern(" ", wallAbove, " ", p)[tileHeight].substr(tileWidth + 1, tileWidth - 2);
                            st += pattern(wallAbove, wallAboveRight, p, wallRight)[tileHeight].substr(tileWidth - 1, 1);
                        } else if (line < tileHeight - 1) {
                            const wallLeft = isWall(left(pos)) ? np : " ";
                            const wallRight = isWall(right(pos)) ? np : " ";
                            st += pattern(wallLeft, p, " ", " ")[line].substr(tileWidth, 1);
                            st += pattern(" ", p, " ", " ")[line].substr(tileWidth + 1, tileWidth - 2);
                            st += pattern(p, wallRight, " ", " ")[line].substr(tileWidth - 1, 1);
                        } else {
                            const wallBelowLeft = isWall(below(left(pos))) ? p : " ";
                            const wallBelow = isWall(below(pos)) ? np : " ";
                            const wallLeft = isWall(left(pos)) ? np : " ";
                            const wallBelowRight = isWall(below(right(pos))) ? p : " ";
                            const wallRight = isWall(right(pos)) ? np : " ";

                            st += pattern(wallLeft, p, wallBelowLeft, wallBelow)[tileHeight - 1].substr(tileWidth, 1);
                            st += pattern(" ", p, " ", wallBelow)[tileHeight - 1].substr(tileWidth + 1, tileWidth - 2);
                            st += pattern(p, wallRight, wallBelow, wallBelowRight)[tileHeight - 1].substr(tileWidth - 1, 1);
                        }

                        st = fuzzyColor(st, 50, 50, 50, 80, 80, 80);
                        break;
                    }
                    case Cell.Crate:
                        st = fuzzyColor(crateSprite[line], 30, 30, 30, 101, 67, 33);
                        break;
                    case Cell.Goal: {
                        st = fuzzyColor(goalSprite[line], 255, 255, 255, 40, 40, 40);
                        break;
                    }
                    case Cell.Empty:
                    {
                        st = emptySprite[line];
                        st = mtx[irow][icol] == '-' ? st : fuzzyColor(st, 10, 10, 10, 40, 40, 40);
                        break;
                    }
                    default:
                        throw new Error("");
                }
                res += st;
            }
            res += "\n";

        }
    }

    process.stdout.write(res);
}
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
    } else {
        console.log(data);
    }
});

draw();
 new Promise<void>(() => {});