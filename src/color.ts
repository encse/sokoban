
export type Rgb = {readonly r:number, readonly g: number, readonly b: number};
export type Hsl = {readonly h:number, readonly s: number, readonly l: number};

export function hexToRgb(color: number): Rgb {
    return {
        r: (color >> 16) & 255,
        g: (color >> 8) & 255,
        b: (color >> 0) & 255
    };
}



export function rgbToHex(rgb: Rgb): number {
    const r=clamp(Math.round(rgb.r));
    const g=clamp(Math.round(rgb.g));
    const b=clamp(Math.round(rgb.b));
    return (r << 16) + (g << 8) + (b);
}

export function hslToRgb(hsl: Hsl){
    let {h,s,l} = hsl;
    s /= 100;
    l /= 100;

    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c/2,
        r = 0,
        g = 0,
        b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return {r,g,b};
}
export function rgbToHsl(rgb: Rgb) {
    // Make r, g, and b fractions of 1
    let {r,g,b}=rgb;
    r /= 255;
    g /= 255;
    b /= 255;

    // Find greatest and smallest channel values
    let cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;
    // Calculate hue
    // No difference
    if (delta == 0)
        h = 0;
    // Red is max
    else if (cmax == r)
        h = ((g - b) / delta) % 6;
    // Green is max
    else if (cmax == g)
        h = (b - r) / delta + 2;
    // Blue is max
    else
        h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    // Make negative hues positive behind 360°
    if (h < 0)
        h += 360;

    // Calculate lightness
    l = (cmax + cmin) / 2;

    // Calculate saturation
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    // Multiply l and s by 100
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);


    return {h, s,l}
}

export function darkenColor(hex: number, m: number){

    let hsl = rgbToHsl(hexToRgb(hex));
    hsl.l *= m;
    return rgbToHex(hslToRgb(hsl));
}



function clamp(number: number) {
    return Math.min(Math.max(0, number), 255);
}

