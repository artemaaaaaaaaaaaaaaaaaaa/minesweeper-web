/**
 * Класс Move - представляет один ход в игре
 */
export class Move {
    constructor(moveNumber, rowCoord, colCoord, moveType, result) {
        this.moveNumber = moveNumber;
        this.rowCoord = rowCoord;
        this.colCoord = colCoord;
        this.moveType = moveType; // 'open' или 'flag'
        this.result = result; // 'safe', 'mine', 'win', 'flag_set', 'flag_removed'
    }

    static createOpenMove(moveNumber, row, col, gameResult) {
        let result = 'safe';
        if (gameResult.game_over && !gameResult.win) {
            result = 'mine';
        } else if (gameResult.game_over && gameResult.win) {
            result = 'win';
        }

        return new Move(moveNumber, row, col, 'open', result);
    }

    static createFlagMove(moveNumber, row, col, flagSet) {
        const result = flagSet ? 'flag_set' : 'flag_removed';
        return new Move(moveNumber, row, col, 'flag', result);
    }

    getMoveNumber() {
        return this.moveNumber;
    }

    getRowCoord() {
        return this.rowCoord;
    }

    getColCoord() {
        return this.colCoord;
    }

    getMoveType() {
        return this.moveType;
    }

    getResult() {
        return this.result;
    }
}

