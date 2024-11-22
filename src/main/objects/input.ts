import {Position, Rectangle} from "../util/position.js";
import {Random} from "../util/random.js";
import {tile, Tile} from "../tile.js";
import {darkenColor, perturbedColor} from "../util/color.js";
import {Crate} from "./crate.js";
import {Floor} from "./floor.js";

export type InputProps = {
    readonly question: string;
    readonly text: string;
}

const colors = [
    0x000000, // black
    0x202020, // fgAtGoal
    0x909021, // bgAtGoal
    0xffffff
]

const crate = tile(colors)`
    |┌┬┬┬┬┬┬┬┬┐|2222222222|1111111111|
    |│├┴┴┴┴┴┴┤│|2222222222|1111111111|
    |│├      ┤│|2222222322|1133333011|
    |│├┬┬┬┬┬┬┤│|2222222222|1111111111|
    |└┴┴┴┴┴┴┴┴┘|2222222222|1111111111|
`;


function getTile(props: InputProps) {
    const tile = new Tile();
    tile.drawTile(crate, 5, 3);
    tile.print(props.question, 0, 0, 0xffffff);

    const inputX = 7;
    const inputY = 5;
    const width = 6;
    const st = props.text.substring(props.text.length - width);
    tile.print(st.padStart(width, '_'), inputX, inputY);
    return tile;
}

export class Input {
    readonly tile: Tile;

    public constructor(private props: InputProps) {
        this.tile = getTile(props);
    }

    public draw(surface: Tile) {
        surface.drawTile(this.tile, (surface.width - this.tile.width) / 2, (surface.height - this.tile.height) / 2);
    }
}