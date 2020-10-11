import {Level} from "./level";
import {loadPuzzleCollection, PuzzleCollection} from "./puzzle";
import {Drawable} from "./draw";
import {Input} from "./objects/input";
import {App, KeyCode} from "./app";
import {Logo} from "./objects/logo";

const puzzleCollection = loadPuzzleCollection("resources/original_and_extra.sok");
const saveFile = "resources/levels.sav";

enum Mode {
    Logo,
    LevelSelect,
    Play,
}

type State = {
    readonly level: Level | null,
    readonly previousLevel: Level | null,
    readonly logo: boolean,
    readonly inputText: string,
    readonly mode: Mode,
}

export class SudokuApp extends App<State> {
    private levels = new Map<number, Level>();

    constructor(private puzzleCollection: PuzzleCollection) {
        super({
            previousLevel: null,
            level: null,
            logo: true,
            inputText: "",
            mode: Mode.Logo,
        });

        this.setState({
            level: this.getLevel(0),
        })

        setTimeout(() => {
            setInterval(() => this.updateLevel(level => level.tick()), 1000);
        }, 5000);
    }

    private getLevel(i: number): Level {
        i = (i + this.puzzleCollection.puzzles.length) % this.puzzleCollection.puzzles.length;

        if (!this.levels.has(i)) {
            this.levels.set(i, Level.fromPuzzle(i, this.puzzleCollection.puzzles[i]));
        }
        return this.levels.get(i)!;
    }

    private updateLevel(cb: (level: Level) => Level) {
        const level = this.state.level;
        if (level == null) {
            return;
        }
        const newLevel = cb(level);
        if (newLevel.title !== level.title) {
            this.setState({previousLevel: newLevel});
        } else if (!newLevel.player.center.eq(level.player.center)) {
            this.setState({previousLevel: level});
            // const fd = fs.openSync(saveFile, 'w');
            // fs.writeSync(fd, [...levels.values()].map(level => level.serialize()).join('\n'));
            // fs.closeSync(fd);
        }
        this.levels.set(newLevel.index, newLevel);
        this.setState({level: newLevel})
    }

    onKeyPress(key: KeyCode) {
        this.setState({logo: false});
        switch (this.state.mode) {
            case Mode.LevelSelect:
                switch (key) {
                    case KeyCode.Num0:
                    case KeyCode.Num1:
                    case KeyCode.Num2:
                    case KeyCode.Num3:
                    case KeyCode.Num4:
                    case KeyCode.Num5:
                    case KeyCode.Num6:
                    case KeyCode.Num7:
                    case KeyCode.Num8:
                    case KeyCode.Num9:
                        this.setState({
                            inputText: this.state.inputText + String.fromCharCode(key)
                        });
                        break
                    case KeyCode.Backspace:
                        this.setState({
                            inputText: this.state.inputText.substring(0, this.state.inputText.length - 1)
                        });
                        break;
                    case KeyCode.Enter:
                        const i = parseInt(this.state.inputText, 10) - 1;
                        if (i >= 0 && i < puzzleCollection.puzzles.length) {
                            this.updateLevel(() => this.getLevel(i));
                        }

                        this.setState({
                            inputText: "",
                            mode: Mode.Play
                        });
                        break;
                    case KeyCode.Esc:
                        this.setState({
                            inputText: "",
                            mode: Mode.Play
                        });
                        break;
                }
                break;
            default:
                switch (key) {
                    case KeyCode.Backspace:
                        const previousLevel = this.state.previousLevel;
                        if (previousLevel != null) {
                            this.updateLevel(() => previousLevel);
                        }
                        break;
                    case KeyCode.LeftArrow:
                        this.updateLevel(level => level.left());
                        break;
                    case KeyCode.RightArrow:
                        this.updateLevel(level => level.right());
                        break;
                    case KeyCode.UpArrow:
                        this.updateLevel(level => level.up());
                        break;
                    case KeyCode.DownArrow:
                        this.updateLevel(level => level.down());
                        break;
                    case KeyCode.Enter:
                        this.setState({mode: Mode.LevelSelect})
                        break;
                    case KeyCode.R:
                        const level = this.state.level;
                        if (level != null) {
                            this.levels.delete(level.index);
                            this.updateLevel(() => this.getLevel(level.index));
                        }
                        break;
                    case KeyCode.Z: {
                        const level = this.state.level;
                        if (level != null) {
                            let index = level.index - 1;
                            if (index < 0) {
                                index += puzzleCollection.puzzles.length;
                            }
                            this.updateLevel(() => this.getLevel(index));
                        }

                        break;
                    } case KeyCode.X: {
                        const level = this.state.level;
                        if (level != null) {
                            let index = level.index + 1;
                            if (index > puzzleCollection.puzzles.length - 1) {
                                index -= puzzleCollection.puzzles.length;
                            }
                            this.updateLevel(() => this.getLevel(index));
                        }
                        break;
                    } case KeyCode.Esc:
                        process.exit(0);
                        break;
                }
        }
    }

    render(): Drawable[] {
        const drawables: Drawable[] = [];
        if (this.state.level != null) {
            drawables.push(this.state.level)
        }

        if (this.state.logo) {
            drawables.push(new Logo())
        }

        if (this.state.mode === Mode.LevelSelect) {
            drawables.push(new Input({
                question: `Jump to level: (1-${puzzleCollection.puzzles.length})`,
                text: this.state.inputText
            }));
        }
        return drawables;
    }
}