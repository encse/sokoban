import {stripMargin, Tile} from "../util/stripMargin";
import {Position, Rectangle} from "../position";
import {baseWallBg, baseWallFg, tileHeight, tileWidth} from "../tiles";
import {Level} from "../level";
import {fuzzyColor, paxel} from "../draw";
import {Random} from "../util/pick";

const random = new Random(0);


const wallPattern = stripMargin`
    |    B    BA B  AB  A BA A A 
    |  A A AB A  AB  A AB AB  A  
    |                       
    |    A    AB A  BA  B AB B B 
    |  B A BA B  BA  B BA BA  B  
    |                       
`.split("\n");

const wallTiles = stripMargin`
    |                      ┌─┬─┬┐▄                            ┌─┬─┬─┬─┬─┬─┐▄       ┌─┬─┬┐▄              ┌┬─┬─┬─┬─┬─┬┐▄              ┌┬─┬─┐▄       ┌─┬─┬─┬─┬─┬─┐▄       ┌┬─┬─┐▄       ┌┬─┬─┐▄               
    |                      ├┬┴┬┴┤█                            ├┬┴┬┴┬┴┬┴┬┴┬┤█       ├┬┴┬┴┤█              ├┴┬┴┬┴┬┴┬┴┬┴┤█              ├┴┬┴┬┤█       ├┬┴┬┴┬┴┬┴┬┴┬┤█       ├┴┬┴┬┤█       ├┴┬┴┬┤█               
    |                      ├┴┬┴┬┤█                            ├┴┬┴┬┼─┴─┴─┴┘█       ├┴┬┴┬┤█              └─┴─┴─┴┬┴┬┴┬┤█              ├┬┴┬┴┤█       ├┴┬┴┬┴┬┴┬┴┬┴┤█       └─┴─┴┘█       └─┴─┴┘█               
    |        ┌┬─┬─┐▄       ├┬┴┬┴┤█       ┌┬─┬─┬─┬─┬─┬┐▄       ├┬┴┬┴┤█              ├┬┴┬┴┼─┬─┬─┬┐▄              ├┬┴┬┴┤█       ┌┬─┬─┬─┼┴┬┴┬┤█       ├┬┴┬┴┬┴┬┴┬┴┬┤█              ┌┬─┬─┐▄                    
    |        ├┴┬┴┬┤█       ├┴┬┴┬┤█       ├┴┬┴┬┴┬┴┬┴┬┴┤█       ├┴┬┴┬┤█              ├┴┬┴┬┴┬┴┬┴┬┴┤█              ├┴┬┴┬┤█       ├┴┬┴┬┴┬┴┬┴┬┴┤█       ├┴┬┴┬┴┬┴┬┴┬┴┤█              ├┴┬┴┬┤█                    
    |        └─┴─┴┘█       └─┴─┴┘█       └─┴─┴─┴─┴─┴─┘█       └─┴─┴┘█              └─┴─┴─┴─┴─┴─┘█              └─┴─┴┘█       └─┴─┴─┴─┴─┴─┘█       └─┴─┴─┴─┴─┴─┘█              └─┴─┴┘█                    
    |                                                                                                                                                                                                     
    |                                                                                                                                                                                                            
    |                                                                                                                                                                                                            
    |                      ┌┬─┬─┐▄                            ┌┬─┬─┬─┬─┬─┬┐▄       ┌┬─┬─┐▄              ┌─┬─┬─┬─┬─┬─┐▄              ┌─┬─┬┐▄       ┌┬─┬─┬─┬─┬─┬┐▄       ┌─┬─┬┐▄       ┌─┬─┬┐▄               
    |                      ├┴┬┴┬┤█                            ├┴┬┴┬┴┬┴┬┴┬┴┤█       ├┴┬┴┬┤█              ├┬┴┬┴┬┴┬┴┬┴┬┤█              ├┬┴┬┴┤█       ├┴┬┴┬┴┬┴┬┴┬┴┤█       ├┬┴┬┴┤█       ├┬┴┬┴┤█               
    |                      ├┬┴┬┴┤█                            ├┬┴┬┴┬┴─┴─┴─┘█       ├┬┴┬┴┤█              └┴─┴─┴─┼┬┴┬┴┤█              ├┴┬┴┬┤█       ├┬┴┬┴┬┴┬┴┬┴┬┤█       └┴─┴─┘█       └┴─┴─┘█               
    |        ┌─┬─┬┐▄       ├┴┬┴┬┤█       ┌─┬─┬─┬─┬─┬─┐▄       ├┴┬┴┬┤█              ├┴┬┴┬┴┬─┬─┬─┐▄              ├┴┬┴┬┤█       ┌─┬─┬─┬┴┬┴┬┴┤█       ├┴┬┴┬┴┬┴┬┴┬┴┤█              ┌─┬─┬┐▄                    
    |        ├┬┴┬┴┤█       ├┬┴┬┴┤█       ├┬┴┬┴┬┴┬┴┬┴┬┤█       ├┬┴┬┴┤█              ├┬┴┬┴┬┴┬┴┬┴┬┤█              ├┬┴┬┴┤█       ├┬┴┬┴┬┴┬┴┬┴┬┤█       ├┬┴┬┴┬┴┬┴┬┴┬┤█              ├┬┴┬┴┤█                    
    |        └┴─┴─┘█       └┴─┴─┘█       └┴─┴─┴─┴─┴─┴┘█       └┴─┴─┘█              └┴─┴─┴─┴─┴─┴┘█              └┴─┴─┘█       └┴─┴─┴─┴─┴─┴┘█       └┴─┴─┴─┴─┴─┴┘█              └┴─┴─┘█                    
    |                                                                                                                                                                                                              
    |                                                                                                                                                                                                            
    |                                                                                                                                                                                                            
    `.split('\n');

export function wallTile(st1:string,st2:string,st3:string,st4:string): string[] {
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

function getTile(isWall: (position: Position) => boolean, center: Position) {

    const tile = new Tile();
    const {y, x} = center;

    let p = (y + x) % 2 == 1 ? "A" : "B";
    let np = (y + x) % 2 == 1 ? "B" : "A";
    const wallAboveLeft = isWall(center.moveTile(-1, -1)) ? p : " ";
    const wallAbove = isWall(center.moveTile(-1, 0)) ? np : " ";
    const wallLeft = isWall(center.moveTile(0, -1)) ? np : " ";
    const wallAboveRight = isWall(center.moveTile(-1, 1)) ? p : " ";
    const wallRight = isWall(center.moveTile(0, 1)) ? np : " ";
    const wallBelowLeft = isWall(center.moveTile(1, -1)) ? p : " ";
    const wallBelow = isWall(center.moveTile(1, 0)) ? np : " ";
    const wallBelowRight = isWall(center.moveTile(1, 1)) ? p : " ";

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

    for (let yT = 0; yT < tileHeight; yT++) {
        for (let xT = 0; xT < tileWidth; xT++) {

            if (i % 2 == 0) {
                fg = fuzzyColor(random, baseWallFg);
                bg = fuzzyColor(random, baseWallBg);
            }
            i++;

            let ch: string;
            if (yT == 0) {
                if (xT == 0) {
                    ch = tiles[0][tileHeight][tileWidth];
                } else if (xT < tileWidth - 2) {
                    ch = tiles[1][tileHeight][tileWidth + xT];
                } else {
                    ch = tiles[2][tileHeight][xT];
                }
            } else if (yT < tileHeight - 1) {
                if (xT == 0) {
                    ch = tiles[3][yT][tileWidth];
                } else if (xT < tileWidth - 2) {
                    ch = tiles[4][yT][tileWidth + xT];
                } else {
                    ch = tiles[5][yT][xT];
                }
            } else {
                if (xT == 0) {
                    ch = tiles[6][tileHeight - 1][tileWidth];
                } else if (xT < tileWidth - 2) {
                    ch = tiles[7][tileHeight - 1][tileWidth + xT];
                } else {
                    ch = tiles[8][tileHeight - 1][xT];
                }
            }

            tile.set(x + xT, y + yT, paxel(ch, fg, bg));
        }
    }
    return tile;
}

export class Wall {
    readonly tile: Tile;
    readonly rectangle: Rectangle;

    public constructor(center: Position, isWall: (position: Position) => boolean) {
        this.tile = getTile(isWall, center);
        this.rectangle = new Rectangle(
            Math.floor(center.x - this.tile.width / 2),
            Math.floor(center.y - this.tile.height / 2),
            this.tile.width,
            this.tile.height)
    }

    public draw(tile: Tile) {
        tile.drawTile(this.tile, this.rectangle.x, this.rectangle.y)
    }

}