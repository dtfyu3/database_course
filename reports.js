document.addEventListener("DOMContentLoaded", () => {
    const userId = window.localStorage.getItem("userId");
    const groups_list = document.getElementById('groups-list');
    const subjects_list = document.getElementById('subjects-list');
    subjects_list.addEventListener('change', pick);
    const generatebtn = document.getElementById('generate-report');
    generatebtn.addEventListener('click', generate);

    getSubjects();

    function generate() {
        if (groups_list.value != '' && subjects_list.value != '') {
            const groupId = groups_list.value;
            const subject = subjects_list.value;
            getAvg(groupId, subject);
        }
    }

    function getAvg(groupId, subject) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'api/api.php?get_action=getAvg', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            group_id: groupId,
            subject: subject,
        }));

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.response);
                    const result = response['avg'];
                    const groups = result.map(item => item.group);
                    const averages = result.map(item => parseFloat(item.avg));
                    createChart(groups, averages);

                }
                catch (e) { console.error('Error parsing JSON: ', e); }
            }
        }
    }

    function createChart(groups, averages) {
        const ctx = document.getElementById('average-grade-chart').getContext('2d');
        ctx.hidden = false;
        
        const avgChart = new Chart(ctx, {
            type: 'bar', // Вы можете использовать 'bar', 'line', 'pie' и другие типы графиков
            data: {
                labels: groups, // Группы как метки по оси X
                datasets: [{
                    label: 'Средний балл',
                    data: averages, // Средние баллы как данные для графика
                    backgroundColor: 'rgba(75, 192, 192, 0.2)', 
                    borderColor: 'rgba(75, 192, 192, 1)', 
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }


    function pick(event) {
        const subject = event.currentTarget.value;
        if (subject != "" && subject != null && subject != undefined) {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'api/api.php?get_action=getGroupsForSubject', true);
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
        xhr.open('POST', 'api/api.php?get_action=getSubjects', true);
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
        values.forEach(element => {
            const option = document.createElement("option");
            option.textContent = element[name];
            list.appendChild(option);
        });
    }
});