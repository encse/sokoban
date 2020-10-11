// https://umumble.com/blogs/gdev/pixel_by_pixel-screen-fills-in-wolfenstein-3d/
export function* permutePoints(width: number, height: number): Iterable<[number, number]> {
    let x: number;
    let y: number;

    let rndval = 1;
    do {
        y = (rndval & 0x000FF) - 1; // low 8 bits - 1 = coordinate y
        x = (rndval & 0x1FF00) >> 8; // next 9 bits = coordinate x
        let lsb = rndval & 1; // the least significant bit is lost when shifted
        rndval >>= 1;
        if (lsb) // if the extended bit = 0, then do not xor
        {
            rndval ^= 0x00012000;
        }

        if (0 <= x && x < width && 0 <= y && y < height) {
            yield [x, y];
        }
    } while (rndval != 1);
}