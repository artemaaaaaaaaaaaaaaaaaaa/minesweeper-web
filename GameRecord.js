/**
 * Класс GameRecord - представляет запись завершённой игры
 */
export class GameRecord {
    constructor(playerName, fieldSize, minesCount, minePositions, gameResult, totalMoves) {
        this.datePlayed = new Date().toISOString();
        this.playerName = playerName;
        this.fieldSize = fieldSize;
        this.minesCount = minesCount;
        this.minePositions = JSON.stringify(minePositions);
        this.gameResult = gameResult;
        this.totalMoves = totalMoves;
        this.moves = [];
    }

    addMove(move) {
        this.moves.push(move);
    }

    getDatePlayed() {
        return this.datePlayed;
    }

    getPlayerName() {
        return this.playerName;
    }

    getFieldSize() {
        return this.fieldSize;
    }

    getMinesCount() {
        return this.minesCount;
    }

    getMinePositions() {
        return this.minePositions;
    }

    getGameResult() {
        return this.gameResult;
    }

    getTotalMoves() {
        return this.totalMoves;
    }

    getMoves() {
        return this.moves;
    }

    getMinePositionsArray() {
        return JSON.parse(this.minePositions);
    }
}

