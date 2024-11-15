let resultDiv;
function isValidSQL(query) {
    const forbiddenKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER'];
    const regex = new RegExp(forbiddenKeywords.join('|'), 'i');
    return !regex.test(query);
}

function executeSQL() {
    if (isValidSQL) {
        const xhr = new XMLHttpRequest();
        const area = document.getElementById("query");
        const query = area.value;
        xhr.open('POST', '../api/api.php?get_action=executeRawSQL', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            query: query
        }));
        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.response);
                    if (response.error) {
                        resultDiv.innerHTML = `<span style="color: red;">${response.error}</span>`;
                    } else {
                        // Выводим таблицу с результатами
                        displayResults(response.results);
                    }

                }
                catch (e) {
                    resultDiv.innerHTML = `<span style="color: red;">Ошибка: ${e.message}</span>`;
                }
            }
        }
    }
}

function displayResults(results) {
    if (results.length === 0) {
        resultDiv.textContent = 'Нет данных для отображения.';
        return;
    }

    let table = '<table border="1" cellpadding="5" cellspacing="0"><tr>';

    // Заголовки таблицы
    Object.keys(results[0]).forEach(key => {
        table += `<th>${key}</th>`;
    });
    table += '</tr>';

    // Данные таблицы
    results.forEach(row => {
        table += '<tr>';
        Object.values(row).forEach(value => {
            table += `<td>${value !== null ? value : ''}</td>`;
        });
        table += '</tr>';
    });

    table += '</table>';
    resultDiv.innerHTML = table;
}
document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('.back-button').addEventListener('click', () => {
        window.localStorage.removeItem("currentSubjectId");
        history.back();
    });
    resultDiv = document.getElementById('result');
    document.getElementById('execute').addEventListener('click', executeSQL);
});
