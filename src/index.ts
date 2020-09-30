import {clearScreen, showCursor} from "./util/ansi";
import {draw} from "./draw";
import {loadLevelData} from "./levelData";
import {Level} from "./level";

const levelData = loadLevelData("resources/levels.txt");
const levels = new Map<number, Level>();

function getLevel(i: number): Level {
    i = (i + levelData.length) % levelData.length;

    if (!levels.has(i)) {
        levels.set(i, Level.fromData(levelData[i]))
    }
    return levels.get(i)!;
}

let levelIndex = 0;

let currentLevel: Level = getLevel(levelIndex);
let previousLevel: Level = currentLevel;

function updateLevel(cb: (level: Level) => Level){
    const newLevel = cb(currentLevel);
    if (newLevel.title !== previousLevel.title) {
        previousLevel = newLevel;
    } else if (!newLevel.playerPosition.eq(currentLevel.playerPosition)) {
        previousLevel = currentLevel;
    }
    levels.set(levelIndex, newLevel);
    currentLevel = newLevel;
    draw(currentLevel);
}

process.stdin.setRawMode(true);

process.on('SIGTERM', () => {
    process.exit(0);
});
process.on('exit', () => {
    process.stdout.write(clearScreen+showCursor);
});

process.stdin.on("data", (data) => {
    if (data[0] == 27 && data[1] == 91 && data[2]==0x44){
        updateLevel(level => level.left());
    }  else if(data[0] == 27 && data[1] == 91 && data[2]==0x43){
        updateLevel(level => level.right());
    }  else if(data[0] == 27 && data[1] == 91 && data[2]==0x41){
        updateLevel(level => level.up());
    }  else if(data[0] == 27 && data[1] == 91 && data[2]==0x42){
        updateLevel(level => level.down());
    } else if(data[0] == 122){
        levelIndex--;
        if(levelIndex < 0){
            levelIndex += levelData.length;
        }
        updateLevel(() => getLevel(levelIndex));
    } else if(data[0] == 114){
        levels.delete(levelIndex);
        updateLevel(() => getLevel(levelIndex));
    } else if(data[0] == 120){
        levelIndex++;
        if(levelIndex > levelData.length -1){
            levelIndex-=levelData.length;
        }
        updateLevel(() => getLevel(levelIndex));

    } else if(data[0] == 127){
        updateLevel(() => previousLevel);
    }else if(data[0] == 0x1b){
        process.exit(0);
    } else {
        console.log(data);
    }
});

setInterval(()=>updateLevel(level => level.tick()), 100);

draw(currentLevel);
