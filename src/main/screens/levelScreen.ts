import {Screen, KeyCode} from "../app";
import {Drawable} from "../draw";
import {SokobanApp} from "../sokobanApp";
import {Level} from "../level";

type State = {
    previousLevel: Level | null,
    level: Level,
}

export class LevelScreen extends Screen<State, SokobanApp> {
    constructor(private level: Level, app: SokobanApp) {
        super({
            previousLevel: null,
            level: level
        }, app);
    }

    render(): Drawable[] {
        const drawables: Drawable[] = [];

        drawables.push(this.state.level)
        // const fmt = (num: number) => num.toString(10).padStart(4, '0');

        // drawables.push()
        // surface.print(
        //     `${this.title}    Steps: ${fmt(this.steps)}    Pushes: ${fmt(this.pushes)}    Time: ${fmt(this.time)}`,
        //     -2, -2, 0xffffff);
        // //
        // surface.print(
        //     `Move: arrows     Reset: r     Previous: z     Next: x     Select level: enter     Quit: q`,
        //     -2, this.height + 2, 0xffffff);

        // if (this.state.logo) {
        //     drawables.push(new Logo())
        // }

        return drawables;
    }

    onKeyPress(key: KeyCode) {
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
            case KeyCode.Esc:
                this.app.confirmExit();
                break;
            case KeyCode.Enter:
                this.app.selectLevel();
                break;
            case KeyCode.R:
                const level = this.state.level;
                this.app.gotoLevel(level.index);
                break;
            // case KeyCode.Z: {
            //     const level = this.state.level;
            //     if (level != null) {
            //         let index = level.index - 1;
            //         if (index < 0) {
            //             index += this.puzzleCollection.puzzles.length;
            //         }
            //         this.updateLevel(() => this.getLevel(index));
            //     }
            //
            //     break;
            // }
            // case KeyCode.X: {
            //     const level = this.state.level;
            //     if (level != null) {
            //         let index = level.index + 1;
            //         if (index > this.puzzleCollection.puzzles.length - 1) {
            //             index -= this.puzzleCollection.puzzles.length;
            //         }
            //         this.updateLevel(() => this.getLevel(index));
            //     }
            //     break;
            // }

        }
    }

    private updateLevel(cb: (level: Level) => Level) {
        const newLevel = cb(this.state.level);
        // if (newLevel.title !== level.title) {
        //     this.setState({previousLevel: newLevel});
        // } else
        if (!newLevel.player.center.eq(this.state.level.player.center)) {
            this.setState({previousLevel: this.state.level});
            // const fd = fs.openSync(saveFile, 'w');
            // fs.writeSync(fd, [...levels.values()].map(level => level.serialize()).join('\n'));
            // fs.closeSync(fd);
        }
        //this.levels.set(newLevel.index, newLevel);
        this.setState({level: newLevel})
    }
}