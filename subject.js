document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const subjectId = params.get("subject_id");
    const logout = document.getElementById('logout');
    const groupsList = document.querySelector('.groups-list');
    groupsList.addEventListener('change', pickGroup);
    logout.addEventListener('click', logOut);
    document.getElementById('avatarIcon').src = '/images/user.png';
    let name = document.querySelector('#username span');
    name.innerHTML = window.localStorage.getItem("userName");

    getGroups();

    function getGroups() {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'api/api.php?get_action=getSubjectGroups', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            teacher_id: window.localStorage.getItem("teacherId"),
            subject_id: subjectId
        }));

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.response);
                    groups = response['groups'];
                    fillGroupsList(groups)

                }
                catch (e) { console.error('Error parsing JSON: ', e); }
            }
        }
    }
    function fillGroupsList(groups) {
        groups.forEach(element => {
            const option = document.createElement("option");
            option.textContent = element.group;
            groupsList.appendChild(option);
        });
    }

    function pickGroup(event) {
        const group = event.currentTarget.value;
        if (group != "" && group != null && group != undefined) {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'api/api.php?get_action=getGradesJournal', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({
                teacher_id: window.localStorage.getItem("teacherId"),
                subject_id: subjectId,
                group_id: group
            }));

            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.response);
                        const journal = response['journal'];
                        const classes = response['classes'];
                        makeJournalTable(classes, journal);

                    }
                    catch (e) { console.error('Error parsing JSON: ', e); }
                }
            }
        }
    }

    function makeJournalTable(classes, journal) {
        let tableToRemove = document.querySelector('table');
        if (tableToRemove != null) tableToRemove.remove();
        const table = document.createElement("table");
        const thead = document.createElement("thead");
        const firstrow = document.createElement("tr");
        let th = document.createElement("th");
        th.appendChild(document.createTextNode('№'));
        firstrow.appendChild(th);
        let stud = document.createElement("th");
        stud.appendChild(document.createTextNode('Студент'));
        firstrow.appendChild(stud);
        //th.textContent = 'Дата';
        //firstrow.appendChild(th);
        thead.appendChild(firstrow);
        const tbody = document.createElement("tbody");
        let counter = 1;
        classes.forEach(element => {
            let th = document.createElement("th");
            th.appendChild(document.createTextNode(element.date));
            firstrow.appendChild(th);
        });
        journal.forEach(journal => {
            let row = document.createElement("tr");
            let td = document.createElement("td");
            td.appendChild(document.createTextNode(counter)); //№
            row.appendChild(td);

            td = document.createElement("td");
            td.appendChild(document.createTextNode(journal.student)); //fio
            row.appendChild(td);

            classes.forEach(element => {
                let td = document.createElement("td");
                let grade = journal.grade == null ? '-' : journal.grade;
                td.appendChild(document.createTextNode(grade));
                row.appendChild(td);
            });

            counter++;
            tbody.appendChild(row);
        });

        // thead.appendChild(tr);
        table.appendChild(thead);
        table.appendChild(tbody);
        document.body.appendChild(table);

    }

    function logOut() {
        window.localStorage.clear();
        window.location.href = 'index.html';
    }
});