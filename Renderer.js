/**
 * Класс Renderer - отрисовка игрового поля в HTML
 */
export class Renderer {
    constructor(containerElement) {
        this.container = containerElement;
    }

    displayField(field, remainingMines) {
        const size = field.length;
        let html = '<div class="game-info">';
        html += `<div class="mines-counter">Оставшиеся мины: <strong>${remainingMines}</strong></div>`;
        html += '</div>';

        html += '<div class="game-field">';
        html += '<div class="field-header">';
        html += '<div class="column-header"></div>';
        for (let c = 0; c < size; c++) {
            html += `<div class="column-header">${c}</div>`;
        }
        html += '</div>';

        for (let r = 0; r < size; r++) {
            html += '<div class="field-row">';
            html += `<div class="row-header">${r}</div>`;
            for (let c = 0; c < size; c++) {
                const cell = field[r][c];
                const cellClass = this.getCellClass(cell);
                const cellContent = this.formatCell(cell);
                html += `<div class="cell ${cellClass}" data-row="${r}" data-col="${c}">${cellContent}</div>`;
            }
            html += '</div>';
        }
        html += '</div>';

        this.container.innerHTML = html;
    }

    getCellClass(cell) {
        if (cell === ' ') return 'cell-hidden';
        if (cell === 'F') return 'cell-flag';
        if (cell === 'X') return 'cell-mine';
        if (cell === '*') return 'cell-exploded';
        if (/^\d$/.test(cell)) {
            return `cell-number cell-number-${cell}`;
        }
        return 'cell-unknown';
    }

    formatCell(cell) {
        switch (cell) {
            case ' ':
                return '';
            case 'F':
                return '⚑';
            case 'X':
                return '💣';
            case '*':
                return '💥';
            default:
                return cell;
        }
    }

    showWinMessage(moves) {
        const message = document.createElement('div');
        message.className = 'game-message game-message-win';
        message.innerHTML = `
            <h2>🎉 ПОЗДРАВЛЯЕМ! 🎉</h2>
            <p>Вы выиграли игру за ${moves} ходов!</p>
            <p>Все мины успешно отмечены или открыты безопасно!</p>
        `;
        this.container.appendChild(message);
    }

    showGameOverMessage() {
        const message = document.createElement('div');
        message.className = 'game-message game-message-lose';
        message.innerHTML = `
            <h2>💥 ИГРА ОКОНЧЕНА! 💥</h2>
            <p>Вы наступили на мину!</p>
            <p>Повезёт в следующий раз!</p>
        `;
        this.container.appendChild(message);
    }

    clear() {
        this.container.innerHTML = '';
    }
}

