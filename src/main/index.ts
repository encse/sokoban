import {loadPuzzleCollection} from "./puzzle.js";
import {SokobanApp} from "./sokobanApp.js";

new SokobanApp(loadPuzzleCollection("resources/original_and_extra.sok"));
