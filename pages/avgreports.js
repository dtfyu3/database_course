document.addEventListener("DOMContentLoaded", () => {
    const userId = window.localStorage.getItem("userId");
    const groups_list = document.getElementById('groups-list');
    groups_list.disabled = true;
    const subjects_list = document.getElementById('subjects-list');
    subjects_list.addEventListener('change', subjectChange);
    const generatebtn = document.getElementById('generate-report');
    generatebtn.addEventListener('click', generate);
    let radios = document.getElementsByName('report-type');
    radios.forEach(radio => { radio.addEventListener('change', radioTypeChanged) });
    let beginDate;
    let endDate;
    let report_type;
    let avgChart;
    getSubjects(userId, subjects_list);
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

        createExportButton(avgChart);
    }
    function subjectChange(){
        getGroups(window.localStorage.getItem("teacherId"),subjects_list.value,null,groups_list)
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
    window.addEventListener('resize', function () {
        if (avgChart) {
            avgChart.destroy();
            generatebtn.click(); // Перерисовка графика
        }
    });
});