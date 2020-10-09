import {stripMargin} from "./util/stripMargin";
import {darkenColor} from "./color";

export const baseFg = 0x424242;
export const baseBg = 0x505050;


export const baseWallFg = darkenColor(0x323232, 0.5);
export const baseWallBg = 0x323232;



export const tileHeight = 3;
export const tileWidth = 7;

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