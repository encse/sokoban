import {Screen, KeyCode} from "../app";
import {Drawable} from "../draw";
import {SokobanApp} from "../sokobanApp";
import {Level} from "../level";

type State = {
    level: Level
}

export class ConfirmExitScreen extends Screen<State, SokobanApp> {
    constructor(app: SokobanApp) {
        super({
            level: Level.fromBoard("#######\n#,$,$,#\n,,,@,,,\n#,,,$,#\n#######")
        }, app);
    }

    render(): Drawable[] {
        const drawables: Drawable[] = [];

        drawables.push(this.state.level)

        return drawables;
    }

    onKeyPress(key: KeyCode) {
        switch (key) {
            case KeyCode.LeftArrow:
                this.setState({level: this.state.level.left()});
                break;
            case KeyCode.RightArrow:
                this.setState({level: this.state.level.right()});
                break;
            case KeyCode.UpArrow:
                this.setState({level: this.state.level.up()});
                break;
            case KeyCode.DownArrow:
                this.setState({level: this.state.level.down()});
                break;
            case KeyCode.Esc:
                this.app.back();
                break;
        }
    }
}