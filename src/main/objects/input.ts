import {Position, Rectangle} from "../util/position";
import {Random} from "../util/random";
import {tile, Tile} from "../tile";
import {perturbedColor} from "../util/color";

export type InputProps = {
    readonly question: string;
    readonly text: string;
}

function getTile(props: InputProps) {
    const tile = new Tile();

    const width = props.question.length + 6;
    const height = 10;

    tile.fill(new Rectangle(0, 0, width, height), {bg: 0x88888, ch: ' ', fg: 0xffffff})

    for (let i = 0; i < width; i++) {
        tile.set(i, 0, {ch: i == 0 ? "┌" : i == width - 1 ? "┐" : "─"});
        tile.set(i, height - 1, {ch: i == 0 ? "└" : i == width - 1 ? "┘" : "─"});
    }
    for (let i = 1; i < height - 1; i++) {
        tile.set(0, i, {ch: "│"})
        tile.set(width - 1, i, {ch: "│"})
    }
    tile.print(props.question, 3, 3, 0xffffff);

    const inputWidth = width - 20;
    const inputX = (width - inputWidth) / 2;
    const inputY = 5;
    tile.fill(new Rectangle(inputX, inputY, inputWidth, 1), {bg: 0x000000})
    tile.print(props.text + "█", inputX, inputY, 0xffffff);
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