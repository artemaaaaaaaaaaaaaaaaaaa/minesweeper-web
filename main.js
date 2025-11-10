import { GameController } from './GameController.js';

/**
 * Главный модуль приложения
 */
class MinesweeperApp {
    constructor() {
        this.controller = new GameController();
        this.mainContent = document.getElementById('main-content');
        this.init();
    }

    async init() {
        const gameContainer = document.createElement('div');
        gameContainer.id = 'game-container';
        this.mainContent.appendChild(gameContainer);

        await this.controller.initialize(gameContainer);

        // Настройка обработчиков
        this.setupEventHandlers();

        // Установка колбэков
        this.controller.setGameOverCallback((gameId, won) => {
            this.showGameOverNotification(gameId, won);
        });

        this.controller.setReplayCloseCallback(() => {
            this.showMainMenu();
        });
    }

    setupEventHandlers() {
        // Кнопка "Новая игра"
        document.getElementById('btn-new-game').addEventListener('click', () => {
            this.showNewGameModal();
        });

        // Кнопка "Список игр"
        document.getElementById('btn-game-list').addEventListener('click', () => {
            this.showGameList();
        });

        // Кнопка "Повтор игры"
        document.getElementById('btn-replay').addEventListener('click', () => {
            this.showReplayModal();
        });

        // Кнопка "Справка"
        document.getElementById('btn-help').addEventListener('click', () => {
            this.showHelpModal();
        });

        // Форма новой игры
        const newGameForm = document.getElementById('new-game-form');
        newGameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.startNewGame();
        });

        // Обновление подсказки о количестве мин
        const fieldSizeInput = document.getElementById('field-size');
        const minesCountInput = document.getElementById('mines-count');
        fieldSizeInput.addEventListener('input', () => {
            const size = parseInt(fieldSizeInput.value) || 10;
            const maxMines = (size * size) - 1;
            minesCountInput.max = maxMines;
            const recommended = Math.max(1, Math.floor(size * size * 0.15));
            minesCountInput.value = Math.min(recommended, maxMines);
            document.getElementById('mines-hint').textContent = 
                `Рекомендуется: ~${recommended} (максимум: ${maxMines})`;
        });

        // Кнопка "Начать повтор"
        document.getElementById('btn-start-replay').addEventListener('click', async () => {
            await this.startReplay();
        });

        // Модальные окна
        this.setupModals();
    }

    setupModals() {
        const modals = ['new-game-modal', 'replay-modal', 'help-modal'];
        
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            const closeBtn = modal.querySelector('.close');
            
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });

            // Отмена
            const cancelBtn = modal.querySelector('[id^="cancel"]');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }

            // Закрытие при клике вне модального окна
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    showNewGameModal() {
        document.getElementById('new-game-modal').style.display = 'block';
    }

    showReplayModal() {
        document.getElementById('replay-modal').style.display = 'block';
    }

    showHelpModal() {
        document.getElementById('help-modal').style.display = 'block';
    }

    async startNewGame() {
        const playerName = document.getElementById('player-name').value || 'Игрок';
        const size = parseInt(document.getElementById('field-size').value) || 10;
        const mines = parseInt(document.getElementById('mines-count').value) || 15;

        // Валидация
        const clampedSize = Math.max(2, Math.min(30, size));
        const maxMines = (clampedSize * clampedSize) - 1;
        const clampedMines = Math.max(1, Math.min(mines, maxMines));

        document.getElementById('new-game-modal').style.display = 'none';

        this.mainContent.innerHTML = '<div id="game-container"></div>';
        const gameContainer = document.getElementById('game-container');
        await this.controller.initialize(gameContainer);
        await this.controller.startNewGame(clampedSize, clampedMines, playerName);
    }

    async showGameList() {
        this.mainContent.innerHTML = '<div id="game-list-container"></div>';
        const container = document.getElementById('game-list-container');
        await this.controller.showGameList(container);
    }

    async startReplay() {
        const gameId = parseInt(document.getElementById('replay-game-id').value);
        if (!gameId || gameId < 1) {
            alert('Введите корректный ID игры');
            return;
        }

        document.getElementById('replay-modal').style.display = 'none';
        this.mainContent.innerHTML = '<div id="replay-container"></div>';
        const container = document.getElementById('replay-container');
        await this.controller.replayGame(gameId, container);
    }

    showMainMenu() {
        this.mainContent.innerHTML = `
            <div class="welcome-screen">
                <h2>Добро пожаловать в игру "Сапёр"!</h2>
                <p>Выберите действие из меню выше, чтобы начать.</p>
            </div>
        `;
    }

    showGameOverNotification(gameId, won) {
        // Можно добавить уведомление о сохранении игры
        console.log(`Игра завершена. ID: ${gameId}, Результат: ${won ? 'Победа' : 'Поражение'}`);
    }
}

// Запуск приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new MinesweeperApp();
});

