import { Move } from './Move.js';
import { GameRecord } from './GameRecord.js';

/**
 * Класс Game - основная логика игры Сапёр
 */
export class Game {
    constructor() {
        this.size = 0;
        this.mines = 0;
        this.mineField = [];
        this.visibleField = [];
        this.remainingMines = 0;
        this.gameStarted = false;
        this.playerName = '';
        this.moveCount = 0;
        this.moves = [];
        this.minePositions = [];
    }

    initializeGame(size, mines, playerName) {
        // Ограничиваем размер и количество мин допустимыми значениями
        const clampedSize = Math.max(2, size);
        const maxMines = (clampedSize * clampedSize) - 1;
        const clampedMines = Math.max(1, Math.min(mines, maxMines));

        this.size = clampedSize;
        this.mines = clampedMines;
        this.remainingMines = clampedMines;
        this.gameStarted = false;
        this.playerName = playerName;
        this.moveCount = 0;
        this.moves = [];
        this.minePositions = [];

        // Инициализируем поля
        this.mineField = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.visibleField = Array(this.size).fill(null).map(() => Array(this.size).fill(' '));
    }

    openCell(row, col) {
        if (!this.gameStarted) {
            this.placeMines(row, col);
        }

        this.moveCount++;

        if (this.mineField[row][col] === -1) {
            this.visibleField[row][col] = '*';
            this.revealAllMines();
            const result = { game_over: true, win: false, adjacent_mines: 0 };
            this.moves.push(Move.createOpenMove(this.moveCount, row, col, result));
            return result;
        }

        this.revealCell(row, col);

        if (this.checkWin()) {
            const result = { game_over: true, win: true, adjacent_mines: this.mineField[row][col] };
            this.moves.push(Move.createOpenMove(this.moveCount, row, col, result));
            return result;
        }

        const result = { game_over: false, win: false, adjacent_mines: this.mineField[row][col] };
        this.moves.push(Move.createOpenMove(this.moveCount, row, col, result));
        return result;
    }

    toggleFlag(row, col) {
        const cell = this.visibleField[row][col];
        if (cell === ' ') {
            this.visibleField[row][col] = 'F';
            this.remainingMines--;
            this.moveCount++;
            this.moves.push(Move.createFlagMove(this.moveCount, row, col, true));
            return true;
        } else if (cell === 'F') {
            this.visibleField[row][col] = ' ';
            this.remainingMines++;
            this.moveCount++;
            this.moves.push(Move.createFlagMove(this.moveCount, row, col, false));
            return true;
        }
        return false;
    }

    getVisibleField() {
        return this.visibleField;
    }

    getFullField() {
        const field = [];
        for (let r = 0; r < this.size; r++) {
            field[r] = [];
            for (let c = 0; c < this.size; c++) {
                field[r][c] = this.mineField[r][c] === -1 ? 'X' : String(this.mineField[r][c]);
            }
        }
        return field;
    }

    getRemainingMines() {
        return this.remainingMines;
    }

    placeMines(firstRow, firstCol) {
        let placed = 0;
        this.minePositions = [];

        while (placed < this.mines) {
            const r = Math.floor(Math.random() * this.size);
            const c = Math.floor(Math.random() * this.size);
            if ((r === firstRow && c === firstCol) || this.mineField[r][c] === -1) {
                continue;
            }

            this.mineField[r][c] = -1;
            this.minePositions.push({ row: r, col: c });
            placed++;

            // Увеличиваем счётчики соседних клеток
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (
                        nr >= 0 && nr < this.size
                        && nc >= 0 && nc < this.size
                        && this.mineField[nr][nc] !== -1
                    ) {
                        this.mineField[nr][nc]++;
                    }
                }
            }
        }
        this.gameStarted = true;
    }

    revealCell(row, col) {
        if (this.visibleField[row][col] !== ' ') {
            return;
        }
        const count = this.mineField[row][col];
        this.visibleField[row][col] = count === 0 ? '0' : String(count);

        if (count === 0) {
            // Автоматически раскрываем соседние клетки
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr !== 0 || dc !== 0) {
                        const nr = row + dr;
                        const nc = col + dc;
                        if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
                            this.revealCell(nr, nc);
                        }
                    }
                }
            }
        }
    }

    revealAllMines() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.mineField[r][c] === -1 && this.visibleField[r][c] !== '*') {
                    this.visibleField[r][c] = 'X';
                }
            }
        }
    }

    checkWin() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.visibleField[r][c] === ' ' && this.mineField[r][c] !== -1) {
                    return false;
                }
            }
        }
        return true;
    }

    // Методы для работы с базой данных
    getPlayerName() {
        return this.playerName;
    }

    getSize() {
        return this.size;
    }

    getMines() {
        return this.mines;
    }

    getMinePositions() {
        return this.minePositions;
    }

    getMoves() {
        return this.moves;
    }

    getMoveCount() {
        return this.moveCount;
    }

    createGameRecord(gameResult) {
        const gameRecord = new GameRecord(
            this.playerName,
            this.size,
            this.mines,
            this.minePositions,
            gameResult,
            this.moveCount
        );

        for (const move of this.moves) {
            gameRecord.addMove(move);
        }

        return gameRecord;
    }
}

