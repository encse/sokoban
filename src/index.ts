import {clearScreen, showCursor} from "./util/ansi";
import {draw} from "./draw";
import {loadLevelData} from "./levelData";
import {Level} from "./level";

const levelData = loadLevelData("resources/levels.txt");
const levels = new Map<number, Level>();

function getLevel(i: number): Level {
    i = (i + levelData.length) % levelData.length;

    if (!levels.has(i)) {
        levels.set(i, new Level(levelData[i]))
    }
    return levels.get(i)!;
}

let levelIndex = 0;
let level: Level = getLevel(levelIndex);

process.stdin.setRawMode(true);

process.on('SIGTERM', () => {
    process.exit(0);
});
process.on('exit', () => {
    process.stdout.write(clearScreen+showCursor);
});

process.stdin.on("data", (data) => {
    if (data[0] == 27 && data[1] == 91 && data[2]==0x44){
        level.left();
    }  else if(data[0] == 27 && data[1] == 91 && data[2]==0x43){
        level.right();
    }  else if(data[0] == 27 && data[1] == 91 && data[2]==0x41){
        level.up();
    }  else if(data[0] == 27 && data[1] == 91 && data[2]==0x42){
        level.down();
    } else if(data[0] == 122){
        levelIndex--;
        if(levelIndex < 0){
            levelIndex += levelData.length;
        }
        level = getLevel(levelIndex);
    } else if(data[0] == 114){
        levels.delete(levelIndex);
        level = getLevel(levelIndex);
    } else if(data[0] == 120){
        levelIndex++;
        if(levelIndex > levelData.length -1){
            levelIndex-=levelData.length;
        }
        level = getLevel(levelIndex);

    } else if(data[0] == 0x1b){
        process.exit(0);
    } else {
        console.log(data);
    }
    draw(level);
});

setInterval(()=>draw(level), 1000);

draw(level);
