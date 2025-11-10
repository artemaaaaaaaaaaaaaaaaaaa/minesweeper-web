import { Game } from './Game.js';
import { Renderer } from './Renderer.js';
import { DatabaseService } from './DatabaseService.js';
import { GameRecord } from './GameRecord.js';
import { TableFormatter } from './TableFormatter.js';

/**
 * Класс GameController - контроллер игры
 */
export class GameController {
    constructor() {
        this.game = new Game();
        this.renderer = null;
        this.database = new DatabaseService();
        this.currentReplayIndex = 0;
        this.currentReplayData = null;
        this.gameContainer = null;
    }

    async initialize(containerElement) {
        this.gameContainer = containerElement;
        this.renderer = new Renderer(containerElement);
        await this.database.initializeDatabase();
    }

    async startNewGame(size, mines, playerName) {
        if (!this.renderer) {
            throw new Error('Renderer не инициализирован. Вызовите initialize() сначала.');
        }

        this.game.initializeGame(size, mines, playerName);
        this.renderer.clear();
        this.renderer.displayField(this.game.getVisibleField(), this.game.getRemainingMines());
        this.attachCellHandlers();
    }

    attachCellHandlers() {
        const cells = this.gameContainer.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                if (e.target.classList.contains('cell-hidden') || e.target.classList.contains('cell-flag')) {
                    const row = parseInt(e.target.dataset.row);
                    const col = parseInt(e.target.dataset.col);
                    this.handleCellClick(row, col, false);
                }
            });

            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (e.target.classList.contains('cell-hidden') || e.target.classList.contains('cell-flag')) {
                    const row = parseInt(e.target.dataset.row);
                    const col = parseInt(e.target.dataset.col);
                    this.handleCellClick(row, col, true);
                }
            });
        });
    }

    async handleCellClick(row, col, isRightClick) {
        if (isRightClick) {
            // Установка/снятие флага
            this.game.toggleFlag(row, col);
            this.renderer.displayField(this.game.getVisibleField(), this.game.getRemainingMines());
            this.attachCellHandlers();
        } else {
            // Открытие клетки
            const result = this.game.openCell(row, col);
            this.renderer.displayField(this.game.getVisibleField(), this.game.getRemainingMines());
            this.attachCellHandlers();

            if (result.game_over) {
                // Показываем полное поле
                this.renderer.displayField(this.game.getFullField(), 0);
                this.attachCellHandlers();

                // Сохраняем игру
                const gameResult = result.win ? 'win' : 'lose';
                const gameRecord = this.game.createGameRecord(gameResult);
                const gameId = await this.database.saveGame(gameRecord);

                if (result.win) {
                    this.renderer.showWinMessage(this.game.getMoveCount());
                } else {
                    this.renderer.showGameOverMessage();
                }

                // Уведомляем о завершении игры
                this.onGameOver(gameId, result.win);
            }
        }
    }

    onGameOver(gameId, won) {
        // Это будет переопределено в main.js
        if (this.gameOverCallback) {
            this.gameOverCallback(gameId, won);
        }
    }

    setGameOverCallback(callback) {
        this.gameOverCallback = callback;
    }

    async showGameList(containerElement) {
        const games = await this.database.getAllGames();
        containerElement.innerHTML = '<h2>Список сохранённых игр</h2>';
        containerElement.innerHTML += TableFormatter.formatGamesTable(games);
    }

    async replayGame(gameId, containerElement) {
        const gameData = await this.database.getGameById(gameId);

        if (!gameData) {
            containerElement.innerHTML = `<p class="error-message">Игра с ID ${gameId} не найдена.</p>`;
            return;
        }

        this.currentReplayData = gameData;
        this.currentReplayIndex = 0;

        // Инициализируем поле для повтора
        const size = gameData.field_size;
        const field = Array(size).fill(null).map(() => Array(size).fill(' '));
        let remainingMines = gameData.mines_count;

        containerElement.innerHTML = `
            <div class="replay-header">
                <h2>Повтор игры #${gameId}</h2>
                <p><strong>Игрок:</strong> ${TableFormatter.escapeHtml(gameData.player_name)}</p>
                <p><strong>Дата:</strong> ${TableFormatter.formatDate(gameData.date_played)}</p>
                <p><strong>Размер поля:</strong> ${gameData.field_size}×${gameData.field_size}</p>
                <p><strong>Количество мин:</strong> ${gameData.mines_count}</p>
                <p><strong>Результат:</strong> ${TableFormatter.formatGameResult(gameData.game_result)}</p>
                <p><strong>Всего ходов:</strong> ${gameData.total_moves}</p>
                <button id="replay-next-btn" class="btn btn-primary">Следующий ход</button>
                <button id="replay-reset-btn" class="btn btn-secondary">Сбросить</button>
                <button id="replay-close-btn" class="btn btn-secondary">Закрыть</button>
            </div>
            <div id="replay-field-container"></div>
            <div id="replay-move-info"></div>
        `;

        const replayFieldContainer = document.getElementById('replay-field-container');
        const replayRenderer = new Renderer(replayFieldContainer);
        replayRenderer.displayField(field, remainingMines);

        const nextBtn = document.getElementById('replay-next-btn');
        const resetBtn = document.getElementById('replay-reset-btn');
        const closeBtn = document.getElementById('replay-close-btn');
        const moveInfo = document.getElementById('replay-move-info');

        let currentField = field;
        let currentRemainingMines = remainingMines;
        const minePositions = JSON.parse(gameData.mine_positions);

        const applyNextMove = () => {
            if (this.currentReplayIndex >= gameData.moves.length) {
                moveInfo.innerHTML = '<p class="replay-complete">Повтор игры завершён.</p>';
                nextBtn.disabled = true;
                return;
            }

            const move = gameData.moves[this.currentReplayIndex];
            const row = move.row_coord;
            const col = move.col_coord;

            if (move.move_type === 'open') {
                const isMine = minePositions.some(mp => mp.row === row && mp.col === col);

                if (isMine) {
                    currentField[row][col] = '*';
                    // Показываем все мины
                    for (const minePos of minePositions) {
                        if (currentField[minePos.row][minePos.col] !== '*') {
                            currentField[minePos.row][minePos.col] = 'X';
                        }
                    }
                } else {
                    // Подсчитываем соседние мины
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const nr = row + dr;
                            const nc = col + dc;
                            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                                if (minePositions.some(mp => mp.row === nr && mp.col === nc)) {
                                    count++;
                                }
                            }
                        }
                    }
                    currentField[row][col] = count === 0 ? '0' : String(count);

                    // Раскрываем область нулей (упрощённая версия)
                    if (count === 0) {
                        this.revealArea(currentField, row, col, size, minePositions);
                    }
                }
            } else if (move.move_type === 'flag') {
                if (move.result === 'flag_set') {
                    currentField[row][col] = 'F';
                    currentRemainingMines--;
                } else {
                    currentField[row][col] = ' ';
                    currentRemainingMines++;
                }
            }

            replayRenderer.displayField(currentField, currentRemainingMines);

            const moveDesc = move.move_type === 'open' ? 'открытие' : 'флаг';
            const resultDesc = {
                'safe': 'безопасно',
                'mine': 'МИНА!',
                'win': 'ПОБЕДА!',
                'flag_set': 'установлен',
                'flag_removed': 'снят'
            }[move.result] || move.result;

            moveInfo.innerHTML = `
                <p class="move-description">
                    <strong>Ход #${move.move_number}:</strong> ${moveDesc} (${row}, ${col}) - ${resultDesc}
                </p>
            `;

            if (move.result === 'mine' || move.result === 'win') {
                moveInfo.innerHTML += '<p class="replay-complete">Игра завершена!</p>';
                nextBtn.disabled = true;
            }

            this.currentReplayIndex++;
        };

        nextBtn.addEventListener('click', applyNextMove);
        resetBtn.addEventListener('click', () => {
            this.currentReplayIndex = 0;
            currentField = Array(size).fill(null).map(() => Array(size).fill(' '));
            currentRemainingMines = remainingMines;
            replayRenderer.displayField(currentField, currentRemainingMines);
            moveInfo.innerHTML = '';
            nextBtn.disabled = false;
        });

        closeBtn.addEventListener('click', () => {
            if (this.onReplayClose) {
                this.onReplayClose();
            }
        });

        this.onReplayClose = null;
    }

    setReplayCloseCallback(callback) {
        this.onReplayClose = callback;
    }

    revealArea(field, row, col, size, minePositions) {
        const queue = [[row, col]];
        const visited = new Set();

        while (queue.length > 0) {
            const [r, c] = queue.shift();
            const key = `${r},${c}`;
            if (visited.has(key)) continue;
            visited.add(key);

            if (field[r][c] !== ' ') continue;

            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                        if (minePositions.some(mp => mp.row === nr && mp.col === nc)) {
                            count++;
                        }
                    }
                }
            }

            field[r][c] = count === 0 ? '0' : String(count);

            if (count === 0) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr !== 0 || dc !== 0) {
                            const nr = r + dr;
                            const nc = c + dc;
                            if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited.has(`${nr},${nc}`)) {
                                queue.push([nr, nc]);
                            }
                        }
                    }
                }
            }
        }
    }
}

