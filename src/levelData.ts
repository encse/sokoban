import * as fs from "fs";

export type LevelData = {
    readonly author: string;
    readonly title: string;
    readonly map: string;
}

export function loadLevelData(file: string): LevelData[] {
    const res = fs.readFileSync(file, {encoding: 'ascii'}).split('\n');
    while (res.findIndex(x=>x.startsWith(':')) >= 0) {
        res.splice(0, 1);
    }

    const levelData: LevelData[] = [];
    while(res.findIndex((x=>x.startsWith('Author:'))) > 0) {
        res.splice(0, 2);
        const height = res.findIndex((x=>x.startsWith('Author:')));
        levelData.push({
            map: res.slice(0, height).join('\n'),
            author: res[height].split(': ')[1],
            title: res[height+1].split(': ')[1],
        });
        res.splice(0, height+2);
    }
    return levelData;
}
