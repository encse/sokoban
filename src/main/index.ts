import {loadPuzzleCollection} from "./puzzle";
import {SudokuApp} from "./sudokuApp";

new SudokuApp(loadPuzzleCollection("resources/original_and_extra.sok"));
