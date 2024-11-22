import {Level} from "./level.js";
import {PuzzleCollection} from "./puzzle.js";
import {App} from "./app.js";
import {LevelScreen} from "./screens/levelScreen.js";
import {LevelSelectorScreen} from "./screens/levelSelectorScreen.js";
import {ConfirmExitScreen} from "./screens/confirmExitScreen.js";


export class SokobanApp extends App {
    private levels = new Map<number, Level>();
    constructor(private puzzleCollection: PuzzleCollection) {
        // super({
        //
        //     logo: true,
        // // });
        //
        // this.setState({
        //     level: this.getLevel(0),
        // })

        // setTimeout(() => {
        //     setInterval(() => this.updateLevel(level => level.tick()), 1000);
        // }, 5000);
        super();
        this.gotoLevel(0);
    }

    gotoLevel(i: number) {
        this.setScreen(new LevelScreen(this.getLevel(i), this));
    }

    private getLevel(i: number): Level {
        i = (i + this.puzzleCollection.puzzles.length) % this.puzzleCollection.puzzles.length;

        if (!this.levels.has(i)) {
            this.levels.set(i, Level.fromPuzzle(i, this.puzzleCollection.puzzles[i]));
        }
        return this.levels.get(i)!;
    }

    confirmExit() {
        this.setScreen(new ConfirmExitScreen(this))
    }

    selectLevel() {
        this.setScreen(new LevelSelectorScreen(this.puzzleCollection.puzzles.length, this));
    }

}