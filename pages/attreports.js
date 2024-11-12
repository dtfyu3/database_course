document.addEventListener("DOMContentLoaded", () => {
    const teacherId = window.localStorage.getItem("teacherId");
    const userId = window.localStorage.getItem("userId");
    const generatebtn = document.getElementById('generate-report');
    generatebtn.addEventListener('click', generate);
    if (!teacherId && !userId || document.referrer === '') {
        window.location.href = 'auth/register.html';
        return;
    }
    const subjects_list = document.getElementById('subjects-list');
    let avgChart;
    getSubjects();

    function getSubjects() {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '../api/api.php?get_action=getSubjects', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            user_id: userId
        }));

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.response);
                    subjects = response['subjects'];
                    fillList(subjects_list, subjects, 'name');
                }
                catch (e) { console.error('Error parsing JSON: ', e); }
            }
        }
    }

    function fillList(list, values, name) {
        if (name === 'group' && list.options.length > 1) {
            while (list.options.length > 1) list.remove(1);
        }
        for (const subject of Object.values(values)) {
            const option = document.createElement("option");
            option.textContent = subject[name];
            list.appendChild(option);
        }
    }
    function generate() {
        const subject = subjects_list.value;
        if (avgChart) avgChart.destroy();
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '../api/api.php?get_action=getAttReport', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            subject: subject
        }));
        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.response);
                    const result = response['att'];
                    const months = result.map(item => item.month);
                    const absents = result.map(item => item.absent);
                    const presents = result.map(item => item.present);
                    createChart(months, absents, presents);

                }
                catch (e) { console.error('Error parsing JSON: ', e); }
            }
        }
    }

    function createChart(months, absents, presents) {
        if (avgChart) avgChart.destroy();
        const ctx = document.getElementById('average-grade-chart').getContext('2d');
        const canvas_container = document.querySelector('.canvas-container');
        const isMobile = window.innerWidth <= 768;
        document.getElementById('average-grade-chart').width = canvas_container.clientWidth * 0.9;
        if (!isMobile) document.getElementById('average-grade-chart').height = canvas_container.clientWidth * 0.3;
        else document.getElementById('average-grade-chart').height = canvas_container.clientWidth * 0.8;
        ctx.hidden = false;
        const maxRotation = isMobile ? 90 : 0;
        const datasets = [];
        avgChart = new Chart(ctx, {
            type: 'bar', // Вы можете использовать 'bar', 'line', 'pie' и другие типы графиков
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Присутствует',
                        data: presents,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Отсутствует',
                        data: absents,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Анализ посещаемости по месяцам' }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Количество' } },
                    x: {
                        ticks: {
                            maxRotation: maxRotation,
                            minRotation: maxRotation
                        },
                        title: { display: true, text: 'Месяцы' }
                    },
                }
            }
        });

        createExportButton();
    }

    function createExportButton() {
        let export_button = document.querySelectorAll('.export-container');
        if (export_button.length > 0) export_button.forEach(button => { button.remove(); });
        const div = document.createElement("div");
        div.classList.add('export-container');
        const input = document.createElement("input");
        input.type = 'button';
        input.value = 'Экспорт Excel';
        input.classList.add('export');
        div.appendChild(input);
        document.body.appendChild(div);
        div.addEventListener('click', () => {
            const labels = avgChart.data.labels;
            const datasets = avgChart.data.datasets;
            const excelData = [];
            const headers = [...datasets.map(dataset => dataset.label)];
            // const headers = [avgChart.data.labels[0], ...avgChart.data.datasets.map(dataset => dataset.label)];
            excelData.push(headers);

            // Добавляем данные
            labels.forEach((label, index) => {
                const row = [label];
                datasets.forEach(dataset => {
                    row.push(dataset.data[index]);
                });
                excelData.push(row);
            });

            // Преобразуем данные в формат Excel
            const ws = XLSX.utils.aoa_to_sheet(excelData); // Преобразование массива в лист
            const wb = XLSX.utils.book_new(); // Создаем новую книгу
            XLSX.utils.book_append_sheet(wb, ws, 'Chart Data'); // Добавляем лист в книгу
            XLSX.writeFile(wb, 'chart_data.xlsx');
        });

    }
});