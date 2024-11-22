import * as fs from "fs";
import {SOKReader} from "./sokparser.js";

export class PuzzleCollection {
    title: string | null = null;
    author: string | null = null;
    created_at: string | null = null;
    updated_at: string | null = null;
    notes: string[] = [];
    puzzles: Puzzle[] = [];
}

export class Puzzle {
    title: string | null = null;
    board: string = "";
    notes: string[] = [];
    snapshots: Snapshot[] = [];
    author: string | null = null;
    boxorder: string | null = null;
    goalorder: string | null = null;
    tessellation: string | null = null
}


export class Snapshot {
    moves: string = "";
    notes: string[] = [];
    solver: string | null = null;
    created_at: string | null = null;
    duration: string | null = null;
    tessellation: string | null = null;
    title: string = "";
}


export function loadPuzzleCollection(file: string): PuzzleCollection {
    const res = new PuzzleCollection();
    new SOKReader(fs.readFileSync(file, {encoding: 'utf-8'}).split(/\r?\n/), res, "").read();
    return res;
}