document.addEventListener("DOMContentLoaded", () => {
    const userId = window.localStorage.getItem("userId");
    const groups_list = document.getElementById('groups-list');
    groups_list.disabled = true;
    const subjects_list = document.getElementById('subjects-list');
    subjects_list.addEventListener('change', pick);
    const generatebtn = document.getElementById('generate-report');
    generatebtn.addEventListener('click', generate);
    let radios = document.getElementsByName('report-type');
    radios.forEach(radio => { radio.addEventListener('change', radioTypeChanged) });
    let beginDate;
    let endDate;
    let report_type;
    let avgChart;
    getSubjects();
    function radioTypeChanged(event) {
        report_type = event.target.value;
        if (report_type === 'group') groups_list.disabled = true;
        else groups_list.disabled = false;
    }
    function generate() {
        if (report_type === 'student') {
            if (groups_list.value != '' && subjects_list.value != '') {
                const groupId = groups_list.value;
                const subject = subjects_list.value;
                if (avgChart) avgChart.destroy();
                getAvg(groupId, subject);
            }
        }
        else {
            if (subjects_list.value != '') {
                const subject = subjects_list.value;
                if (avgChart) avgChart.destroy();
                getAvg(null, subject);
            }
        }
    }

    function getAvg(groupId, subject) {
        beginDate = document.getElementById('begin-date').value || null;
        endDate = document.getElementById('end-date').value || null;
        for (let radio of radios) {
            if (radio.checked) {
                report_type = radio.value;
                break;
            }
        }
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '../api/api.php?get_action=getAvg', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            group_id: groupId,
            subject: subject,
            type: report_type,
            begin_date: beginDate,
            end_date: endDate
        }));

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.response);
                    const result = response['avg'];
                    // const groups = result.map(item => item[`${type}`]);
                    const averages = result.map(item => parseFloat(item.avg));
                    createChart(result, averages);

                }
                catch (e) { console.error('Error parsing JSON: ', e); }
            }
        }
    }

    function createChart(result, averages) {
        if (avgChart) avgChart.destroy();
        const ctx = document.getElementById('average-grade-chart').getContext('2d');
        const canvas_container = document.querySelector('.canvas-container');
        const isMobile = window.innerWidth <= 768;
        document.getElementById('average-grade-chart').width = canvas_container.clientWidth * 0.9;
        if (!isMobile) document.getElementById('average-grade-chart').height = canvas_container.clientWidth * 0.3;
        else document.getElementById('average-grade-chart').height = canvas_container.clientWidth * 0.8;
        ctx.hidden = false;
        const maxRotation = isMobile ? 90 : 0;

        const months = [];
        let groups;
        const start = new Date(beginDate);
        const end = new Date(endDate);
        const datasets = [];
        let labels;
        if (beginDate === null && endDate === null) {
            let temp = report_type === 'group' ? 'group' : 'student';
            groups = result.map(item => item[temp]);
            labels = groups;
            datasets.push({
                label: 'Средний балл',
                data: averages, // Средние баллы как данные для графика
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            })
        }
        else {
            while (start <= end) {
                const month = start.getMonth() + 1;
                const year = start.getFullYear();
                months.push(`${year}-${month < 10 ? '0' + month : month}`);
                start.setMonth(start.getMonth() + 1);
            }
            labels = months;
            const data = {};
            const temp = report_type === 'student' ? 'FIO' : 'group';
            result.forEach(item => {
                if (!data[item[`${temp}`]]) {
                    data[item[`${temp}`]] = {};
                }
                data[item[`${temp}`]][item.month] = item.avg;
            });
            for (const element in data) {
                const grades = months.map(month => data[element][month] || 0); // 0 если нет оценки
                datasets.push({
                    label: element,
                    data: grades,
                    fill: false,
                    backgroundColor: temp === 'group' ? 'rgba(75, 192, 192, 0.2)' : generateColorFromString(element),
                    borderColor: temp === 'group' ? 'rgba(75, 192, 192, 1)' : 'transparent',
                    borderWidth: 1,
                    tension: 0.1
                });
            }
        }
        avgChart = new Chart(ctx, {
            type: 'bar', // Вы можете использовать 'bar', 'line', 'pie' и другие типы графиков
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 0
                    },
                    x: {
                        ticks: {
                            maxRotation: maxRotation,
                            minRotation: maxRotation
                        }
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

    function generateColorFromString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const r = (hash >> 16) & 0xFF; // Красный
        const g = (hash >> 8) & 0xFF;  // Зеленый
        const b = hash & 0xFF;         // Синий
        const a = Math.random().toFixed(2); // Генерация случайной прозрачности от 0 до 1
        return `rgba(${r}, ${g}, ${b}, ${a})`;
        // return '#' + (hash & 0x00FFFFFF).toString(16).padStart(6, '0');
    }
    function pick(event) {
        const subject = event.currentTarget.value;
        if (subject != "" && subject != null && subject != undefined) {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '../api/api.php?get_action=getGroupsForSubject', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({
                teacher_id: window.localStorage.getItem("teacherId"),
                subject: subject,
            }));

            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.response);
                        const groups = response['groups'];
                        fillList(groups_list, groups, 'group');

                    }
                    catch (e) { console.error('Error parsing JSON: ', e); }
                }
            }
        }
    }
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


    window.addEventListener('resize', function () {
        if (avgChart) {
            avgChart.destroy();
            generatebtn.click(); // Перерисовка графика
        }
    });
});