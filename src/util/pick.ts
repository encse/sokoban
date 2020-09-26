
export class Random{
    constructor(private seed: number) {
    }

    next() {
        let x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    };

    pickInt(length: number) {
        return Math.floor(this.next() * length);
    }

    pick<T>(ts: T[]): T {
        return ts[this.pickInt(ts.length)];
    }
}
