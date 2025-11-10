/**
 * DatabaseService - сервис для работы с IndexedDB
 */
export class DatabaseService {
    constructor() {
        this.dbName = 'MinesweeperDB';
        this.version = 1;
        this.db = null;
    }

    async initializeDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                reject(new Error(`Не удалось подключиться к базе данных: ${request.error}`));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Создаём хранилище для игр
                if (!db.objectStoreNames.contains('games')) {
                    const gamesStore = db.createObjectStore('games', { keyPath: 'id', autoIncrement: true });
                    gamesStore.createIndex('date_played', 'date_played', { unique: false });
                    gamesStore.createIndex('player_name', 'player_name', { unique: false });
                }

                // Создаём хранилище для ходов
                if (!db.objectStoreNames.contains('moves')) {
                    const movesStore = db.createObjectStore('moves', { keyPath: 'id', autoIncrement: true });
                    movesStore.createIndex('game_id', 'game_id', { unique: false });
                    movesStore.createIndex('move_number', 'move_number', { unique: false });
                }
            };
        });
    }

    async saveGame(gameRecord) {
        if (!this.db) {
            await this.initializeDatabase();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['games', 'moves'], 'readwrite');
            const gamesStore = transaction.objectStore('games');
            const movesStore = transaction.objectStore('moves');

            // Сохраняем игру
            const gameData = {
                date_played: gameRecord.getDatePlayed(),
                player_name: gameRecord.getPlayerName(),
                field_size: gameRecord.getFieldSize(),
                mines_count: gameRecord.getMinesCount(),
                mine_positions: gameRecord.getMinePositions(),
                game_result: gameRecord.getGameResult(),
                total_moves: gameRecord.getTotalMoves(),
                created_at: new Date().toISOString()
            };

            const gameRequest = gamesStore.add(gameData);

            gameRequest.onsuccess = (event) => {
                const gameId = event.target.result;

                // Сохраняем ходы
                let movesSaved = 0;
                const moves = gameRecord.getMoves();

                if (moves.length === 0) {
                    transaction.oncomplete = () => resolve(gameId);
                    return;
                }

                for (const move of moves) {
                    const moveData = {
                        game_id: gameId,
                        move_number: move.getMoveNumber(),
                        row_coord: move.getRowCoord(),
                        col_coord: move.getColCoord(),
                        move_type: move.getMoveType(),
                        result: move.getResult()
                    };

                    const moveRequest = movesStore.add(moveData);
                    moveRequest.onsuccess = () => {
                        movesSaved++;
                        if (movesSaved === moves.length) {
                            resolve(gameId);
                        }
                    };
                    moveRequest.onerror = () => {
                        reject(new Error(`Ошибка при сохранении хода: ${moveRequest.error}`));
                    };
                }
            };

            gameRequest.onerror = () => {
                reject(new Error(`Ошибка при сохранении игры: ${gameRequest.error}`));
            };
        });
    }

    async getAllGames() {
        if (!this.db) {
            await this.initializeDatabase();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['games'], 'readonly');
            const store = transaction.objectStore('games');
            const index = store.index('date_played');
            const request = index.openCursor(null, 'prev'); // Сортировка по убыванию даты

            const games = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    games.push({
                        id: cursor.value.id,
                        date_played: cursor.value.date_played,
                        player_name: cursor.value.player_name,
                        field_size: cursor.value.field_size,
                        mines_count: cursor.value.mines_count,
                        game_result: cursor.value.game_result,
                        total_moves: cursor.value.total_moves
                    });
                    cursor.continue();
                } else {
                    resolve(games);
                }
            };

            request.onerror = () => {
                reject(new Error(`Ошибка при получении списка игр: ${request.error}`));
            };
        });
    }

    async getGameById(gameId) {
        if (!this.db) {
            await this.initializeDatabase();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['games', 'moves'], 'readonly');
            const gamesStore = transaction.objectStore('games');
            const movesStore = transaction.objectStore('moves');
            const movesIndex = movesStore.index('game_id');

            // Получаем игру
            const gameRequest = gamesStore.get(gameId);

            gameRequest.onsuccess = (event) => {
                const game = event.target.result;
                if (!game) {
                    resolve(null);
                    return;
                }

                // Получаем ходы
                const movesRequest = movesIndex.getAll(gameId);

                movesRequest.onsuccess = () => {
                    const moves = movesRequest.result.map(move => ({
                        move_number: move.move_number,
                        row_coord: move.row_coord,
                        col_coord: move.col_coord,
                        move_type: move.move_type,
                        result: move.result
                    }));

                    // Сортируем ходы по номеру
                    moves.sort((a, b) => a.move_number - b.move_number);

                    resolve({
                        id: game.id,
                        date_played: game.date_played,
                        player_name: game.player_name,
                        field_size: game.field_size,
                        mines_count: game.mines_count,
                        mine_positions: game.mine_positions,
                        game_result: game.game_result,
                        total_moves: game.total_moves,
                        moves: moves
                    });
                };

                movesRequest.onerror = () => {
                    reject(new Error(`Ошибка при получении ходов: ${movesRequest.error}`));
                };
            };

            gameRequest.onerror = () => {
                reject(new Error(`Ошибка при получении игры: ${gameRequest.error}`));
            };
        });
    }

    async deleteGame(gameId) {
        if (!this.db) {
            await this.initializeDatabase();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['games', 'moves'], 'readwrite');
            const gamesStore = transaction.objectStore('games');
            const movesStore = transaction.objectStore('moves');
            const movesIndex = movesStore.index('game_id');

            // Удаляем ходы
            const movesRequest = movesIndex.getAll(gameId);

            movesRequest.onsuccess = () => {
                const moves = movesRequest.result;
                let deletedMoves = 0;

                if (moves.length === 0) {
                    // Удаляем игру
                    const deleteRequest = gamesStore.delete(gameId);
                    deleteRequest.onsuccess = () => resolve(true);
                    deleteRequest.onerror = () => reject(new Error(`Ошибка при удалении игры: ${deleteRequest.error}`));
                    return;
                }

                for (const move of moves) {
                    const deleteMoveRequest = movesStore.delete(move.id);
                    deleteMoveRequest.onsuccess = () => {
                        deletedMoves++;
                        if (deletedMoves === moves.length) {
                            // Удаляем игру
                            const deleteRequest = gamesStore.delete(gameId);
                            deleteRequest.onsuccess = () => resolve(true);
                            deleteRequest.onerror = () => reject(new Error(`Ошибка при удалении игры: ${deleteRequest.error}`));
                        }
                    };
                    deleteMoveRequest.onerror = () => {
                        reject(new Error(`Ошибка при удалении хода: ${deleteMoveRequest.error}`));
                    };
                }
            };

            movesRequest.onerror = () => {
                reject(new Error(`Ошибка при получении ходов: ${movesRequest.error}`));
            };
        });
    }

    async getGamesCount() {
        if (!this.db) {
            await this.initializeDatabase();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['games'], 'readonly');
            const store = transaction.objectStore('games');
            const request = store.count();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error(`Ошибка при подсчёте игр: ${request.error}`));
            };
        });
    }
}

