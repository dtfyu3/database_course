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
    let chart;
    getSubjects(userId, subjects_list, null);
    function generate() {
        const subject = subjects_list.value;
        if(!subject) return;
        if (chart) chart.destroy();
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
        if (chart) chart.destroy();
        const ctx = document.getElementById('average-grade-chart').getContext('2d');
        const canvas_container = document.querySelector('.canvas-container');
        const isMobile = window.innerWidth <= 768;
        document.getElementById('average-grade-chart').width = canvas_container.clientWidth * 0.9;
        if (!isMobile) document.getElementById('average-grade-chart').height = canvas_container.clientWidth * 0.3;
        else document.getElementById('average-grade-chart').height = canvas_container.clientWidth * 0.8;
        ctx.hidden = false;
        const maxRotation = isMobile ? 90 : 0;
        const datasets = [];
        chart = new Chart(ctx, {
            type: 'bar',
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
        createExportButton(chart);
    }
});