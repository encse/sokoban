import {Puzzle, PuzzleCollection, Snapshot} from "./puzzle.js";

function isSnapshotString(line: string): boolean {

    // class AtomicMoveCharacters(str, Enum):
    //     """
    //     Characters used in textual representation of :class:`.Snapshot`.
    //     Not all variants use all characters. Also, for different variants, same
    //     character may have different meaning (represent different
    //     :class:`.Direction`).
    //     """
    //     l = 'l'
    //     u = 'u'
    //     r = 'r'
    //     d = 'd'
    //     L = 'L'
    //     U = 'U'
    //     R = 'R'
    //     D = 'D'
    //     w = 'w'
    //     W = 'W'
    //     e = 'e'
    //     E = 'E'
    //     n = 'n'
    //     N = 'N'
    //     s = 's'
    //     S = 'S'

    const AtomicMoveCharacters = "lurdLURDwensWENS";
    const NonMoveCharacters = "[]{}*";
    //         JUMP_BEGIN = '['
    //         JUMP_END = ']'
    //         PUSHER_CHANGE_BEGIN = '{'
    //         PUSHER_CHANGE_END = '}'
    //         CURRENT_POSITION_CH = '*'

    const _RE_SNAPSHOT_STRING = new RegExp("^([0-9\\s" +
        rxEscape(AtomicMoveCharacters) +
        rxEscape(NonMoveCharacters) +
        rxEscape(RleCharacters) + "])*$");

    return (
        !Utilities.isBlank(line) &&
        !Utilities.containsOnlyDigitsAndSpaces(line) &&
        line.split("\n").every(line => _RE_SNAPSHOT_STRING.test(line))
    );
}

//class BoardCellCharacters(str, Enum):
//     """Characters used in textual representation of boards."""
//     WALL = '#'
//     PUSHER = '@'
//     PUSHER_ON_GOAL = '+'
//     BOX = '$'
//     BOX_ON_GOAL = '*'
//     GOAL = '.'
//     FLOOR = ' '
//     VISIBLE_FLOOR = '-'
//     ALT_PUSHER1 = 'p'
//     ALT_PUSHER2 = 'm'
//     ALT_PUSHER_ON_GOAL1 = 'P'
//     ALT_PUSHER_ON_GOAL2 = 'M'
//     ALT_BOX1 = 'b'
//     ALT_BOX_ON_GOAL1 = 'B'
//     ALT_GOAL1 = 'o'
//     ALT_VISIBLE_FLOOR1 = '_'

const BoardCellCharacters = "#@+$*. -pmPMbBo_";

//       GROUP_LEFT_DELIM = '('
//       GROUP_RIGHT_DELIM = ')'
//       RLE_ROW_SEPARATOR = '|'
const RleCharacters = "()|";

function rxEscape(st: string): string {
    return st.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

class VariantBoard {

    static _RE_BOARD_STRING = new RegExp("^([0-9\s" + rxEscape(BoardCellCharacters) + rxEscape(RleCharacters) + "])*$");

    static isBoardString(line: string): boolean {
        return (
            !Utilities.containsOnlyDigitsAndSpaces(line) &&
            line.split("\n").every(line => VariantBoard._RE_BOARD_STRING.test(line))
        );
    }
}

class Utilities {
    static RE_ONLY_DIGITS_AND_SPACES = /^([0-9\s])*$/;

    static isBlank(line: string) {
        return line == null || line.trim() == ""
    }

    static containsOnlyDigitsAndSpaces(line: string): boolean {
        return line.split("\n").every(l => Utilities.RE_ONLY_DIGITS_AND_SPACES.test(l))
    }
}


enum SOKTags {
    AUTHOR = 'Author',
    TITLE = 'Title',
    GOALORDER = 'goalorder',
    BOXORDER = 'boxorder',
    SOLVER = 'Solver',
    VARIANT = 'Game',
    CREATED_AT = 'Date created',
    SNAPSHOT_CREATED_AT = 'Date',
    UPDATED_AT = 'Date of last change',
    DURATION = 'Time',
    RAW_FILE_NOTES = '::',
    TAG_DELIMITERS = "=:",
}

export class SOKReader {
    private collHeaderTessellationHint: string | null = null;
    private readonly suppliedTesselationHint: string;

    constructor(
        private input: string[],
        private destCollection: PuzzleCollection,
        tesselationHint: string
    ) {
        this.suppliedTesselationHint = tesselationHint.toLowerCase();
    }

    public read() {
        this.splitInpit(this.input);
        this.parseTitleLines();
        this.parseCollectionNotes();
        this.parsePuzzles();
    }

    splitInpit(input_lines: string[]) {
        let firstBoardLine = input_lines.findIndex((x) => VariantBoard.isBoardString(x));
        let remainingLines: string[];
        if (firstBoardLine >= 0) {
            this.destCollection.notes = input_lines.slice(0, firstBoardLine);
            remainingLines = input_lines.slice(firstBoardLine);
        } else {
            this.destCollection.notes = input_lines;
            remainingLines = []
        }
        this.splitPuzzleChunks(remainingLines);
        this.splitSnapshotChunks();
    }

    splitPuzzleChunks(lines: string[]) {
        let remainingLines = lines;
        while (remainingLines.length > 0) {
            let puzzle = new Puzzle();

            const firstNoteLine = remainingLines.findIndex((x) => !VariantBoard.isBoardString(x));
            if (firstNoteLine >= 0) {
                puzzle.board = remainingLines.slice(0, firstNoteLine).join("\n");
                remainingLines = remainingLines.slice(firstNoteLine);
            } else {
                puzzle.board = remainingLines.join("\n");
                remainingLines = []
            }
            if (remainingLines.length > 0) {
                let firstBoardLine = remainingLines.findIndex(x => VariantBoard.isBoardString(x));

                if (firstBoardLine >= 0) {
                    puzzle.notes = remainingLines.slice(0, firstBoardLine);
                    remainingLines = remainingLines.slice(firstBoardLine);
                } else {
                    puzzle.notes = remainingLines;
                    remainingLines = []
                }
            } else {
                puzzle.notes = [];
            }
            this.destCollection.puzzles.push(puzzle)
        }
    }

    splitSnapshotChunks() {
        for (let puzzle of this.destCollection.puzzles) {
            let remainingLines: string[] = puzzle.notes;

            let firstMovesLines = remainingLines.findIndex(isSnapshotString);

            if (firstMovesLines >= 0) {
                puzzle.notes = remainingLines.slice(0, firstMovesLines);
                remainingLines = remainingLines.slice(firstMovesLines)
            } else {
                puzzle.notes = remainingLines;
                remainingLines = []
            }
            puzzle.snapshots = [];

            while (remainingLines.length > 0) {
                let snap = new Snapshot();

                let firstNoteLine = remainingLines.findIndex(x => !isSnapshotString(x));
                if (firstNoteLine >= 0) {
                    snap.moves = remainingLines.slice(0, firstNoteLine).map(movesLine => movesLine.trim()).join("");
                    remainingLines = remainingLines.slice(firstNoteLine)
                } else {
                    snap.moves = remainingLines.map(movesLine => movesLine.trim()).join("");
                    remainingLines = []
                }
                if (remainingLines.length > 0) {
                    firstMovesLines = remainingLines.findIndex(isSnapshotString);

                    if (firstMovesLines >= 0) {
                        snap.notes = remainingLines.slice(0, firstMovesLines);
                        remainingLines = remainingLines.slice(firstMovesLines)
                    } else {
                        snap.notes = remainingLines;
                        remainingLines = []
                    }
                } else {
                    snap.notes = []
                }
                puzzle.snapshots.push(snap)
            }
        }
    }

    private static getTagData(tag: string, line: string): string | null {
        for (let x of SOKTags.TAG_DELIMITERS) {
            let idx = line.indexOf(x);
            if (idx >= 0) {
                if (line.substring(0, idx).trim().toLowerCase() === tag.trim().toLowerCase()) {
                    return line.substring(idx + 1).trim();
                }
            }
        }
        return null;
    }

    isTaggedAs(tag: string, line: string) {
        return line.split("").some(chr => SOKTags.TAG_DELIMITERS.includes(chr)) &&
            line.trimLeft().toLowerCase().startsWith(tag.trimLeft().toLowerCase())
    }

    isCollectionTagLine(line: string) {
        return [SOKTags.AUTHOR, SOKTags.TITLE, SOKTags.VARIANT,
            SOKTags.CREATED_AT, SOKTags.UPDATED_AT].some(tag => this.isTaggedAs(tag, line))
    }

    isPuzzleTagLine(line: string) {
        return [SOKTags.AUTHOR, SOKTags.VARIANT, SOKTags.TITLE,
            SOKTags.BOXORDER, SOKTags.GOALORDER].some(tag => this.isTaggedAs(tag, line))
    }

    isSnapshotTagLine(line: string) {
        return [SOKTags.AUTHOR, SOKTags.SOLVER, SOKTags.CREATED_AT,
            SOKTags.SNAPSHOT_CREATED_AT, SOKTags.DURATION].some(tag => this.isTaggedAs(tag, line))
    }

    isRawFileNotesLine(line: string) {
        return line.trimLeft().startsWith(SOKTags.RAW_FILE_NOTES)
    }

    notesBeforePuzzle(puzzleIndex: number): string[] {
        if (puzzleIndex == 0) {
            return this.destCollection.notes
        }
        let prevPuzzle = this.destCollection.puzzles[puzzleIndex - 1];
        if ((prevPuzzle.snapshots).length > 0) {
            return prevPuzzle.snapshots[prevPuzzle.snapshots.length - 1].notes
        }
        return prevPuzzle.notes
    }

    notesBeforeSnapshot(puzzle_index: number, snapshotIndex: number) {
        let puzzle = this.destCollection.puzzles[puzzle_index];
        if (snapshotIndex == 0) {
            return puzzle.notes
        }
        return puzzle.snapshots[snapshotIndex - 1].notes
    }


    getAndRemoveTitleLine(notes: string[]) {

        // Titles
        // A title line is the last non-blank text line before
        // a puzzle or a game, provided the line is preceded
        // by a blank line or it is the only text line at this
        // position in the file.
        //
        // Title lines are optional unless a single or a last
        // text line from a preceding puzzle, game, or file
        // header can be mistaken for a title line.

        let candidateIndex = notes.reverse().findIndex(x => !Utilities.isBlank(x));

        if (candidateIndex < 0) {
            return "";
        }

        let preceedingIndex = -1;
        if (candidateIndex > 0) {
            preceedingIndex = candidateIndex - 1;
        }

        let followingIndex = -1;
        if (candidateIndex < notes.length - 1) {
            followingIndex = candidateIndex + 1;
        }

        const preceedingOk = preceedingIndex >= 0 ? Utilities.isBlank(notes[preceedingIndex]) : true;

        const followingOk = followingIndex >= 0 ? Utilities.isBlank(notes[followingIndex]) : true;

        if (preceedingOk && followingOk) {
            const titleLine = notes[candidateIndex].trim();
            notes.splice(candidateIndex, 1);
            return titleLine;
        }

        return "";
    }

    parseTitleLines() {
        this.destCollection.puzzles.forEach((puzzle, puzzle_index) => {
            puzzle.title = this.getAndRemoveTitleLine(
                this.notesBeforePuzzle(puzzle_index)
            );

            puzzle.snapshots.forEach((snap, snapshot_index) => {
                snap.title = this.getAndRemoveTitleLine(
                    this.notesBeforeSnapshot(puzzle_index, snapshot_index)
                )
            })
        })
    }

    parseCollectionNotes() {
        this.collHeaderTessellationHint = null;

        let remainingLines: string[] = [];
        for (const line of this.destCollection.notes) {
            if (this.isCollectionTagLine(line)) {
                this.collHeaderTessellationHint =
                    this.collHeaderTessellationHint ?? SOKReader.getTagData(SOKTags.VARIANT, line);

                this.destCollection.title =
                    this.destCollection.title ?? SOKReader.getTagData(SOKTags.TITLE, line);

                this.destCollection.author =
                    this.destCollection.author ?? SOKReader.getTagData(SOKTags.AUTHOR, line);

                this.destCollection.created_at =
                    this.destCollection.created_at ?? SOKReader.getTagData(SOKTags.CREATED_AT, line);

                this.destCollection.updated_at =
                    this.destCollection.updated_at && SOKReader.getTagData(SOKTags.UPDATED_AT, line);

            } else if (!this.isRawFileNotesLine(line)) {
                remainingLines.push(line)
            }
        }
        if (this.collHeaderTessellationHint != null) {
            this.collHeaderTessellationHint = (
                this.collHeaderTessellationHint.trim().toLowerCase()
            )
        }

        this.destCollection.notes = this.cleanupWhitespace(remainingLines)
    }

    parsePuzzles() {
        for (let puzzle of this.destCollection.puzzles) {
            let remainingLines: string[] = [];
            let tess: string | null = null;
            for (let line of puzzle.notes) {
                if (this.isPuzzleTagLine(line)) {
                    tess = (tess || SOKReader.getTagData(SOKTags.VARIANT, line));
                    puzzle.title = (
                        puzzle.title
                        || SOKReader.getTagData(SOKTags.TITLE, line)
                    );
                    puzzle.author = (
                        puzzle.author
                        || SOKReader.getTagData(SOKTags.AUTHOR, line)
                    );
                    puzzle.boxorder = (
                        puzzle.boxorder
                        || SOKReader.getTagData(SOKTags.BOXORDER, line)
                    );
                    puzzle.goalorder = (
                        puzzle.goalorder
                        || SOKReader.getTagData(SOKTags.GOALORDER, line)
                    )
                } else {
                    remainingLines.push(line)
                }
            }

            puzzle.notes = this.cleanupWhitespace(remainingLines);

            if (tess != null) {
                puzzle.tessellation = tess;
            } else if (this.collHeaderTessellationHint != null) {
                puzzle.tessellation = this.collHeaderTessellationHint;
            } else if (this.suppliedTesselationHint != null) {
                puzzle.tessellation = this.suppliedTesselationHint;
            }

            this.parseSnapshots(puzzle)
        }
    }


    parseSnapshots(puzzle: Puzzle) {
        for (let snap of puzzle.snapshots) {
            let remaining_lines: string[] = [];
            for (let line of snap.notes) {
                if (this.isSnapshotTagLine(line)) {
                    snap.solver = (
                        snap.solver
                        || SOKReader.getTagData(SOKTags.AUTHOR, line)
                    );
                    snap.solver = (
                        snap.solver
                        || SOKReader.getTagData(SOKTags.SOLVER, line)
                    );
                    snap.created_at = (
                        snap.created_at
                        || SOKReader.getTagData(SOKTags.CREATED_AT, line)
                    );
                    snap.duration = (
                        snap.duration
                        || SOKReader.getTagData(SOKTags.DURATION, line)
                    );
                    snap.created_at = (
                        snap.created_at ||
                        SOKReader.getTagData(SOKTags.SNAPSHOT_CREATED_AT, line)
                    );
                } else {
                    remaining_lines.push(line)
                }
            }

            snap.notes = this.cleanupWhitespace(remaining_lines);
            snap.tessellation = puzzle.tessellation
        }
    }

    cleanupWhitespace(lst: string[]): string[] {
        let i = lst.findIndex(x => !Utilities.isBlank(x));
        if (i < 0) {
            return [];
        }
        lst = lst.slice(i);

        i = lst.reverse().findIndex(x => !Utilities.isBlank(x));
        if (i >= -1) {
            lst = lst.slice(0, i + 1);
        }

        return lst.map(line => line.trim())
    }
}
