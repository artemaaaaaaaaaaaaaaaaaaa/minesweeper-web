/**
 * Класс TableFormatter - форматирование таблицы игр
 */
export class TableFormatter {
    static formatGamesTable(games) {
        if (games.length === 0) {
            return '<p class="empty-message">Сохранённых игр пока нет.</p>';
        }

        let html = '<table class="games-table">';
        html += '<thead><tr>';
        html += '<th>ID</th>';
        html += '<th>Игрок</th>';
        html += '<th>Дата</th>';
        html += '<th>Размер</th>';
        html += '<th>Мины</th>';
        html += '<th>Результат</th>';
        html += '<th>Ходы</th>';
        html += '</tr></thead>';
        html += '<tbody>';

        for (const game of games) {
            html += '<tr>';
            html += `<td>${game.id}</td>`;
            html += `<td>${this.escapeHtml(game.player_name)}</td>`;
            html += `<td>${this.formatDate(game.date_played)}</td>`;
            html += `<td>${this.formatFieldSize(game.field_size)}</td>`;
            html += `<td>${game.mines_count}</td>`;
            html += `<td>${this.formatGameResult(game.game_result)}</td>`;
            html += `<td>${game.total_moves}</td>`;
            html += '</tr>';
        }

        html += '</tbody></table>';
        html += '<p class="table-hint">Используйте кнопку "Повтор игры" для просмотра сохранённой игры.</p>';

        return html;
    }

    static formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day}.${month}.${year} ${hours}:${minutes}`;
        } catch (e) {
            return dateString;
        }
    }

    static formatFieldSize(size) {
        return `${size}×${size}`;
    }

    static formatGameResult(result) {
        return result === 'win' ? 'Победа' : 'Поражение';
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

