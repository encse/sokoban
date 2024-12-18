import {clearScreen, hideCursor, showCursor} from "./util/ansi.js";
import {draw, Drawable} from "./draw.js";

export enum KeyCode {
    Backspace = 127,
    Enter = 13,
    Esc = 27,

    LeftArrow = 37,
    UpArrow = 38,
    RightArrow = 39,
    DownArrow = 40,

    Num0 = 48,
    Num1 = 49,
    Num2 = 50,
    Num3 = 51,
    Num4 = 52,
    Num5 = 53,
    Num6 = 54,
    Num7 = 55,
    Num8 = 56,
    Num9 = 57,

    A = 97,
    B = 98,
    C = 99,
    D = 100,
    E = 101,
    F = 102,
    G = 103,
    H = 104,
    I = 105,
    J = 106,
    K = 107,
    L = 108,
    M = 109,
    N = 110,
    O = 111,
    P = 112,
    Q = 113,
    R = 114,
    S = 115,
    T = 116,
    U = 117,
    V = 118,
    W = 119,
    X = 120,
    Y = 121,
    Z = 122,
}

export abstract class Screen<State, TApp extends App>{
    state: State;

    protected constructor(
        state: State,
        protected app: TApp,
    ) {
        this.state = state;
    }

    private dirty = false;

    setState(newState: Partial<State>) {
        this.state = Object.assign(this.state as any, newState);
        if (!this.dirty) {
            Promise.resolve().then(() => {
                this.dirty = false;
                this.app.draw(this, this.render());
            })
        }
    }

    onKeyPress(_key: KeyCode): void {
    }

    abstract render(): Drawable[];
}

export abstract class App {

    private screens: Screen<any, any>[] = [];
    protected constructor() {
        process.stdout.write(`${hideCursor}`);

        process.stdin.setRawMode(true);

        process.on('SIGWINCH', () => {
            this.refresh();

        });

        process.on('SIGTERM', () => {
            process.exit(0);
        });
        process.on('exit', () => {
            process.stdout.write(clearScreen + showCursor);
        });

        process.stdin.on("data", (data) => {
            if (data.length == 1) {
                this.onKeyPress(data[0]);
            } else if (data.length == 3) {
                if (data[0] == 27 && data[1] == 91 && data[2] == 0x44) {
                    this.onKeyPress(KeyCode.LeftArrow);
                } else if (data[0] == 27 && data[1] == 91 && data[2] == 0x43) {
                    this.onKeyPress(KeyCode.RightArrow);
                } else if (data[0] == 27 && data[1] == 91 && data[2] == 0x41) {
                    this.onKeyPress(KeyCode.UpArrow);
                } else if (data[0] == 27 && data[1] == 91 && data[2] == 0x42) {
                    this.onKeyPress(KeyCode.DownArrow);
                }
            }
        });

    }

    setScreen(screen: Screen<any, any>){
        this.screens.push(screen);
        this.refresh();
    }

    back(){
        if(this.screens.length > 1){
            this.screens.pop();
            this.refresh();
        }
    }
    get screen(): Screen<any , any> | null {
        return this.screens[this.screens.length - 1];
    }

    draw(screen: Screen<any, any>, drawables: Drawable[]){
        if (this.screen == screen){
            draw(drawables);
        }
    }

    onKeyPress(key: KeyCode): void {
        if (this.screen != null) {
            this.screen.onKeyPress(key);
        }
    }

    private refresh() {
        if (this.screen != null) {
            this.draw(this.screen, this.screen.render());
        }
    }
}



