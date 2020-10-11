import {hexToRgb, Rgb, rgbToHex} from "../util/color";
import {Cell, Level} from "../level";
import {Position} from "../util/position";
import {Tile} from "../tile";

type Cone = {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly cosTheta: number;
}

export type Light = {
    readonly color: Rgb;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly direction: Cone | null;
}

export function addLights(level: Level, tile: Tile) {

    for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {

            const lighten = (color: number) => {
                const ambientIntensity = 1.5;

                const rgb = hexToRgb(color);
                const diffuseReflectionRatio = {
                    r: Math.max(1, rgb.r) / 255,
                    g: Math.max(1, rgb.g) / 255,
                    b: Math.max(1, rgb.b) / 255,
                };

                const ambientReflectionRatio = diffuseReflectionRatio;
                const specularReflectionRatio = {
                    r: 0.0,
                    g: 0.0,
                    b: 0.0
                };

                const specularAlpha = 1;

                let i = {
                    r: ambientIntensity * ambientReflectionRatio.r,
                    g: ambientIntensity * ambientReflectionRatio.g,
                    b: ambientIntensity * ambientReflectionRatio.b,
                };

                for (let light of level.lights) {
                    if (!level.visible(x, y, light.x, light.y)) {
                        continue;
                    }

                    const lx = light.x - (x + 0.5);
                    const ly = (light.y - (y + 0.5)) * 2; //pixels are twice as tall than wide
                    const lz = light.z;

                    const lightSourceDistance = Math.sqrt(lx * lx + ly * ly + lz * lz);

                    let cosPhi = 1;
                    if (light.direction != null) {
                        cosPhi = -(lx * light.direction.x + ly * light.direction.y + lz * light.direction.z) / lightSourceDistance;
                        if (cosPhi < light.direction.cosTheta) {
                            cosPhi = 0; // outside spotlight
                        }
                    }

                    const diffuseLightIntensity = {
                        r: light.color.r / 255 * cosPhi,
                        g: light.color.g / 255 * cosPhi,
                        b: light.color.b / 255 * cosPhi
                    };
                    const specularLightIntensiy = diffuseLightIntensity;

                    const d = lz / lightSourceDistance; // <L',N'>  (N' = 0,0,1)
                    const s = Math.pow(lz / lightSourceDistance, specularAlpha); // <R',V'> == <V',L'> == <-N', L'>

                    const a = 0.1;
                    const b = 0.001;
                    const c = 0.001;

                    let distanceAttenuation = 1 / (a + b * lightSourceDistance + c * lightSourceDistance * lightSourceDistance);
                    i.r += diffuseReflectionRatio.r * d * diffuseLightIntensity.r * distanceAttenuation;
                    i.r += specularReflectionRatio.r * s * specularLightIntensiy.r * distanceAttenuation;

                    i.g += diffuseReflectionRatio.g * d * diffuseLightIntensity.g * distanceAttenuation;
                    i.g += specularReflectionRatio.g * s * specularLightIntensiy.g * distanceAttenuation;

                    i.b += diffuseReflectionRatio.b * d * diffuseLightIntensity.b * distanceAttenuation;
                    i.b += specularReflectionRatio.b * s * specularLightIntensiy.b * distanceAttenuation;
                }

                return rgbToHex({
                    r: i.r * 255,
                    g: i.g * 255,
                    b: i.b * 255,
                });
            };

            if (level.getCell(new Position(x, y)) !== Cell.Void) {
                let p = {...{ch: ' ', bg: 0, fg: 0}, ...tile.get(x, y)}
                tile.set(x, y, {...p, fg: lighten(p.fg), bg: lighten(p.bg)});
            }
        }
    }

    // for(let light of level.lights) {
    //     print(tile, 'x', Math.floor(light.y), Math.floor(light.x), 0x0000ff);
    // }
}
