import {clearScreen, showCursor} from "./util/ansi";
import {draw} from "./draw";
import {loadPuzzleCollection} from "./puzzle";
import {Level} from "./level";
import * as fs from "fs";

const puzzleCollection = loadPuzzleCollection("resources/original_and_extra.sok");
const saveFile = "resources/levels.sav";
const levels = new Map<number, Level>();



function getLevel(i: number): Level {
    i = (i + puzzleCollection.puzzles.length) % puzzleCollection.puzzles.length;

    if (!levels.has(i)) {
        levels.set(i, Level.fromData(puzzleCollection.puzzles[i]))
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
        const fd = fs.openSync(saveFile, 'w');
        fs.writeSync(fd, [...levels.values()].map(level => level.serialize()).join('\n'));
        fs.closeSync(fd);
    }
    levels.set(levelIndex, newLevel);
    currentLevel = newLevel;
    draw(currentLevel, false);
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
            levelIndex += puzzleCollection.puzzles.length;
        }
        updateLevel(() => getLevel(levelIndex));
    } else if(data[0] == 114){
        levels.delete(levelIndex);
        updateLevel(() => getLevel(levelIndex));
    } else if(data[0] == 120){
        levelIndex++;
        if(levelIndex > puzzleCollection.puzzles.length -1){
            levelIndex-=puzzleCollection.puzzles.length;
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


draw(currentLevel, true);

setTimeout(()=>{
    setInterval(()=>updateLevel(level => level.tick()), 1000);
}, 5000);

