import {Screen, KeyCode} from "../app";
import {Drawable} from "../draw";
import {Input} from "../objects/input";
import {SokobanApp} from "../sokobanApp";

export class LevelSelectorScreen extends Screen<{inputText: string}, SokobanApp> {

    constructor(private levelCount: number, app: SokobanApp) {
        super({
            inputText: ""
        }, app);
    }

    render(): Drawable[] {
        const drawables: Drawable[] = [];

        drawables.push(new Input({
            question: `Jump to level (1-${this.levelCount}):`,
            text: this.state.inputText
        }));
        return drawables;
    }

	onKeyPress(key: KeyCode) {
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
				if (i >= 0 && i < this.levelCount) {
                    this.app.gotoLevel(i);
				}
				break;
			case KeyCode.Esc:
			    this.app.back();
				break;
		}
	}
}