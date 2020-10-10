import {stripMargin} from "../util/stripMargin";
import {Position, Rectangle} from "../position";
import {fuzzyColor} from "../draw";
import {Random} from "../util/random";
import {darkenColor} from "../util/color";
import {Tile} from "../tile";

const random = new Random(0);

export const baseWallBg = 0x323232;
export const baseWallFg = darkenColor(baseWallBg, 0.5);


const wallHeight = 3;
const wallWidth = 7;

const wallPattern = stripMargin`
    |    B    BA B  AB  A BA A A 
    |  A A AB A  AB  A AB AB  A  
    |                       
    |    A    AB A  BA  B AB B B 
    |  B A BA B  BA  B BA BA  B  
    |                       
`.split("\n");

const textures = stripMargin`
    |                      ┌─┬─┬┐█                            ┌─┬─┬─┬─┬─┬─┐█       ┌─┬─┬┐█              ┌┬─┬─┬─┬─┬─┬┐█              ┌┬─┬─┐█       ┌─┬─┬─┬─┬─┬─┐█       ┌┬─┬─┐█       ┌┬─┬─┐█               
    |                      ├┬┴┬┴┤█                            ├┬┴┬┴┬┴┬┴┬┴┬┤█       ├┬┴┬┴┤█              ├┴┬┴┬┴┬┴┬┴┬┴┤█              ├┴┬┴┬┤█       ├┬┴┬┴┬┴┬┴┬┴┬┤█       ├┴┬┴┬┤█       ├┴┬┴┬┤█               
    |                      ├┴┬┴┬┤█                            ├┴┬┴┬┼─┴─┴─┴┘█       ├┴┬┴┬┤█              └─┴─┴─┴┬┴┬┴┬┤█              ├┬┴┬┴┤█       ├┴┬┴┬┴┬┴┬┴┬┴┤█       └─┴─┴┘█       └─┴─┴┘█               
    |        ┌┬─┬─┐█       ├┬┴┬┴┤█       ┌┬─┬─┬─┬─┬─┬┐█       ├┬┴┬┴┤█              ├┬┴┬┴┼─┬─┬─┬┐█              ├┬┴┬┴┤█       ┌┬─┬─┬─┼┴┬┴┬┤█       ├┬┴┬┴┬┴┬┴┬┴┬┤█              ┌┬─┬─┐█                    
    |        ├┴┬┴┬┤█       ├┴┬┴┬┤█       ├┴┬┴┬┴┬┴┬┴┬┴┤█       ├┴┬┴┬┤█              ├┴┬┴┬┴┬┴┬┴┬┴┤█              ├┴┬┴┬┤█       ├┴┬┴┬┴┬┴┬┴┬┴┤█       ├┴┬┴┬┴┬┴┬┴┬┴┤█              ├┴┬┴┬┤█                    
    |        └─┴─┴┘█       └─┴─┴┘█       └─┴─┴─┴─┴─┴─┘█       └─┴─┴┘█              └─┴─┴─┴─┴─┴─┘█              └─┴─┴┘█       └─┴─┴─┴─┴─┴─┘█       └─┴─┴─┴─┴─┴─┘█              └─┴─┴┘█                    
    |                                                                                                                                                                                                     
    |                                                                                                                                                                                                            
    |                                                                                                                                                                                                            
    |                      ┌┬─┬─┐█                            ┌┬─┬─┬─┬─┬─┬┐█       ┌┬─┬─┐█              ┌─┬─┬─┬─┬─┬─┐█              ┌─┬─┬┐█       ┌┬─┬─┬─┬─┬─┬┐█       ┌─┬─┬┐█       ┌─┬─┬┐█               
    |                      ├┴┬┴┬┤█                            ├┴┬┴┬┴┬┴┬┴┬┴┤█       ├┴┬┴┬┤█              ├┬┴┬┴┬┴┬┴┬┴┬┤█              ├┬┴┬┴┤█       ├┴┬┴┬┴┬┴┬┴┬┴┤█       ├┬┴┬┴┤█       ├┬┴┬┴┤█               
    |                      ├┬┴┬┴┤█                            ├┬┴┬┴┬┴─┴─┴─┘█       ├┬┴┬┴┤█              └┴─┴─┴─┼┬┴┬┴┤█              ├┴┬┴┬┤█       ├┬┴┬┴┬┴┬┴┬┴┬┤█       └┴─┴─┘█       └┴─┴─┘█               
    |        ┌─┬─┬┐█       ├┴┬┴┬┤█       ┌─┬─┬─┬─┬─┬─┐█       ├┴┬┴┬┤█              ├┴┬┴┬┴┬─┬─┬─┐█              ├┴┬┴┬┤█       ┌─┬─┬─┬┴┬┴┬┴┤█       ├┴┬┴┬┴┬┴┬┴┬┴┤█              ┌─┬─┬┐█                    
    |        ├┬┴┬┴┤█       ├┬┴┬┴┤█       ├┬┴┬┴┬┴┬┴┬┴┬┤█       ├┬┴┬┴┤█              ├┬┴┬┴┬┴┬┴┬┴┬┤█              ├┬┴┬┴┤█       ├┬┴┬┴┬┴┬┴┬┴┬┤█       ├┬┴┬┴┬┴┬┴┬┴┬┤█              ├┬┴┬┴┤█                    
    |        └┴─┴─┘█       └┴─┴─┘█       └┴─┴─┴─┴─┴─┴┘█       └┴─┴─┘█              └┴─┴─┴─┴─┴─┴┘█              └┴─┴─┘█       └┴─┴─┴─┴─┴─┴┘█       └┴─┴─┴─┴─┴─┴┘█              └┴─┴─┘█                    
    |                                                                                                                                                                                                              
    |                                                                                                                                                                                                            
    |                                                                                                                                                                                                            
    `.split('\n');

export function wallTexture(st1: string, st2: string, st3: string, st4: string): string[] {
    const st = st1 + st2 + st3 + st4;
    for (let y = 0; y < wallPattern.length - 1; y++) {
        for (let x = 0; x < textures[0].length - 1; x++) {
            if (
                wallPattern[y][x] == st[0] &&
                wallPattern[y][x + 1] == st[1] &&
                wallPattern[y + 1][x] == st[2] &&
                wallPattern[y + 1][x + 1] == st[3]
            ) {
                let res = [];
                for (let i = 0; i < wallHeight * 2; i++) {
                    res.push(textures[(y * wallHeight) + i].substr((x * wallWidth), 2 * wallWidth));
                }
                return res;
            }
        }
    }
    throw new Error();
}

function getTile(isWall: (position: Position) => boolean, center: Position): Tile {

    const tile = new Tile();
    const {y, x} = center;

    let p = (y + x) % 2 == 1 ? "A" : "B";
    let np = (y + x) % 2 == 1 ? "B" : "A";
    const wallAboveLeft = isWall(center.move(-wallWidth, -wallHeight)) ? p : " ";
    const wallAbove = isWall(center.move(0, -wallHeight)) ? np : " ";
    const wallLeft = isWall(center.move(-wallWidth, 0)) ? np : " ";
    const wallAboveRight = isWall(center.move(wallWidth, -wallHeight)) ? p : " ";
    const wallRight = isWall(center.move(wallWidth, 0)) ? np : " ";
    const wallBelowLeft = isWall(center.move(-wallWidth, wallHeight)) ? p : " ";
    const wallBelow = isWall(center.move(0, wallHeight)) ? np : " ";
    const wallBelowRight = isWall(center.move(wallWidth, wallHeight)) ? p : " ";

    const textures = [
        wallTexture(wallAboveLeft, wallAbove, wallLeft, p),
        wallTexture(" ", wallAbove, " ", p),
        wallTexture(wallAbove, wallAboveRight, p, wallRight),
        wallTexture(wallLeft, p, " ", " "),
        wallTexture(" ", p, " ", " "),
        wallTexture(p, wallRight, " ", " "),
        wallTexture(wallLeft, p, wallBelowLeft, wallBelow),
        wallTexture(wallLeft, p, wallBelowLeft, wallBelow),
        wallTexture(p, wallRight, wallBelow, wallBelowRight),
    ];

    let i = 0;
    let fg = fuzzyColor(random, baseWallFg);
    let bg = fuzzyColor(random, baseWallBg);

    for (let yT = 0; yT < wallHeight; yT++) {
        for (let xT = 0; xT < wallWidth; xT++) {

            if (i % 2 == 0) {
                fg = fuzzyColor(random, baseWallFg);
                bg = fuzzyColor(random, baseWallBg);
            }
            i++;

            let ch: string;
            if (yT == 0) {
                if (xT == 0) {
                    ch = textures[0][wallHeight][wallWidth];
                } else if (xT < wallWidth - 2) {
                    ch = textures[1][wallHeight][wallWidth + xT];
                } else {
                    ch = textures[2][wallHeight][xT];
                }
            } else if (yT < wallHeight - 1) {
                if (xT == 0) {
                    ch = textures[3][yT][wallWidth];
                } else if (xT < wallWidth - 2) {
                    ch = textures[4][yT][wallWidth + xT];
                } else {
                    ch = textures[5][yT][xT];
                }
            } else {
                if (xT == 0) {
                    ch = textures[6][wallHeight - 1][wallWidth];
                } else if (xT < wallWidth - 2) {
                    ch = textures[7][wallHeight - 1][wallWidth + xT];
                } else {
                    ch = textures[8][wallHeight - 1][xT];
                }
            }

            tile.set(x + xT, y + yT, {ch, fg, bg});
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

    public draw(surface: Tile) {
        surface.drawTile(this.tile, this.rectangle.x, this.rectangle.y)
    }

}