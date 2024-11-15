let data;
function createSessionsTable(sessions) {
    let tableToRemove = document.querySelector('table');
    if (tableToRemove) tableToRemove.remove();
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const firstrow = document.createElement("tr");
    let th = document.createElement("th");
    th.appendChild(document.createTextNode('№'));
    firstrow.appendChild(th);
    let date = document.createElement("th");
    date.appendChild(document.createTextNode('Дата'));
    let subject = document.createElement("th");
    subject.appendChild(document.createTextNode('Предмет'))
    let type = document.createElement("th");
    type.appendChild(document.createTextNode('Тип'));
    let teacher = document.createElement("th");
    teacher.appendChild(document.createTextNode('Преподаватель'));
    let student = document.createElement("th");
    student.appendChild(document.createTextNode('Студент'));
    let mark = document.createElement("th");
    mark.appendChild(document.createTextNode('Оценка'));
    firstrow.appendChild(date);
    firstrow.appendChild(subject);
    firstrow.appendChild(type);
    firstrow.appendChild(teacher);
    firstrow.appendChild(student);
    firstrow.appendChild(mark);
    thead.appendChild(firstrow);
    const tbody = document.createElement("tbody");
    let counter = 1;
    for (const session_row of Object.values(sessions)) {
        let row = document.createElement("tr");
        let td = document.createElement("td");
        td.appendChild(document.createTextNode(counter));
        row.appendChild(td);
        td = document.createElement("td");
        const [year, month, day] = session_row.date.split("-");
        const date = `${day}.${month}.${year}`;
        td.appendChild(document.createTextNode(date));
        row.appendChild(td);
        td = document.createElement("td");
        td.appendChild(document.createTextNode(session_row.subject));
        row.appendChild(td);
        td = document.createElement("td");
        td.appendChild(document.createTextNode(session_row.type));
        row.appendChild(td);
        td = document.createElement("td");
        td.appendChild(document.createTextNode(session_row.teacher));
        row.appendChild(td);
        td = document.createElement("td");
        td.appendChild(document.createTextNode(session_row.student));
        row.appendChild(td);
        td = document.createElement("td");
        td.appendChild(document.createTextNode(session_row.mark));
        row.appendChild(td);
        counter++;
        tbody.appendChild(row);
    }



    table.appendChild(thead);
    table.appendChild(tbody);
    document.querySelector('.table-container').appendChild(table);
}

function filter(){
    const filterValue = document.getElementById('filter').value.toLowerCase();
    const filteredData = data.filter(entry => {
        const surname = entry.student.split(' ')[0].toLowerCase(); 
        return surname.includes(filterValue);
    });
    createSessionsTable(filteredData);
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector('.back-button').addEventListener('click', () => {
        window.localStorage.removeItem("currentSubjectId");
        history.back();
    });
    document.getElementById("filter").addEventListener('input',filter);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '../api/api.php?get_action=getSessionsResults', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({}));
    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const response = JSON.parse(xhr.response);
                data = response['sessions'];
                createSessionsTable(data);

            }
            catch (e) { console.error('Error parsing JSON: ', e); }
        }
    }
});