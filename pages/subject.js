document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const teacherId = window.localStorage.getItem("teacherId");
    const userId = window.localStorage.getItem("userId");
    // const subjectId = params.get("subject_id");
    const subjectId = window.localStorage.getItem("currentSubjectId");
    const logout = document.getElementById('logout');
    let journal_type;
    const groupsList = document.querySelector('.groups-list');
    groupsList.addEventListener('change', pickGroup);
    logout.addEventListener('click', logOut);
    document.getElementById('avatarIcon').src = '/images/user.png';
    let name = document.querySelector('#username span');
    name.innerHTML = window.localStorage.getItem("userName");
    groupsList.disabled = true;
    const export_button = document.querySelector('.export');
    export_button.addEventListener('click', exportTable);
    document.querySelectorAll('.journal-type-container div').forEach(div =>
        div.addEventListener('click', (event) => {
            const target = event.currentTarget;
            const radio = target.querySelector('input');
            journal_type = radio.value;
            if (!radio.checked) {
                radio.checked = true;
            }
            groupsList.disabled = false;
            groupsList.value = "";
            let tableToRemove = document.querySelector('table');
            if (tableToRemove != null) tableToRemove.remove();
            if (document.querySelector('.journal-type-header')) document.querySelector('.journal-type-header').remove();
            export_button.disabled = true
            export_button.hidden = true;;
        })
    );

    if (!teacherId && !userId || document.referrer === '') {
        window.location.href = 'auth/register.html';
        return;
    }
    document.querySelector('.back-button').addEventListener('click', () => {
        window.localStorage.removeItem("currentSubjectId");
        history.back();
    });
    getGroups();
    function getGroups() {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '../api/api.php?get_action=getSubjectGroups', true);
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

    function pickGroup(event, group = null) {
        if (!group) group = event.currentTarget.value;
        if (group != "" && group != null && group != undefined) {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '../api/api.php?get_action=getJournal', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({
                teacher_id: window.localStorage.getItem("teacherId"),
                subject_id: subjectId,
                group_id: group,
                type: journal_type
            }));

            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.response);
                        const classes = response['classes'];
                        const students = response['students'];
                        makeJournalTable(classes, students);

                    }
                    catch (e) { console.error('Error parsing JSON: ', e); }
                }
            }
        }
    }

    function makeJournalTable(classes, students) {
        let tableToRemove = document.querySelector('table');
        if (tableToRemove) tableToRemove.remove();
        if (document.querySelector('.journal-type-header-container')) document.querySelector('.journal-type-header-container').remove();
        const div = document.createElement("div");
        div.classList.add('journal-type-header-container');
        const span = document.createElement("span");
        span.classList.add('journal-type-header');
        span.textContent = journal_type == 'grades' ? 'Журнал оценок' : 'Журнал посещаемости';
        div.appendChild(span);

        const table = document.createElement("table");
        const thead = document.createElement("thead");
        const firstrow = document.createElement("tr");
        let th = document.createElement("th");
        th.appendChild(document.createTextNode('№'));
        firstrow.appendChild(th);
        let stud = document.createElement("th");
        stud.appendChild(document.createTextNode('Студент'));
        firstrow.appendChild(stud);
        thead.appendChild(firstrow);
        const tbody = document.createElement("tbody");
        let counter = 1;

        classes.forEach(element => {
            let th = document.createElement("th");
            const [year, month, day] = element.date.split("-");
            const date = `${day}.${month}`;
            th.appendChild(document.createTextNode(date));
            th.classList.add('class-date');
            th.dataset['date'] = element.date;
            let span = document.createElement("span");
            span.classList.add('tooltip');
            span.textContent = 'Изменить';
            th.appendChild(span);
            firstrow.appendChild(th);
        });



        for (const student of Object.values(students)) {
            let row = document.createElement("tr");
            let td = document.createElement("td");
            td.appendChild(document.createTextNode(counter)); //№
            row.appendChild(td);
            td = document.createElement("td");
            td.appendChild(document.createTextNode(student.student)) //fio
            row.appendChild(td);
            if (journal_type == 'grades') {
                classes.forEach(classes => {
                    let td = document.createElement("td");
                    const gradeObj = student.grades.find(grade => grade.date === classes.date);
                    let grade = gradeObj ? gradeObj.grade : '-';
                    td.appendChild(document.createTextNode(grade));
                    td.classList.add('grade');
                    td.dataset['grade'] = isNaN(grade) ? null : grade;
                    let span = document.createElement("span");
                    span.classList.add('tooltip');
                    span.textContent = 'Изменить';
                    td.appendChild(span);
                    row.appendChild(td);

                })
            }
            else {
                classes.forEach(classes => {
                    let td = document.createElement("td");
                    const attendanceObj = student.attendance.find(att => att.date === classes.date);
                    let attendance = attendanceObj ? (attendanceObj.status === 'Присутствует' ? 'present' : 'absent') : 'absent';
                    if (attendance == 'absent') td.appendChild(document.createTextNode("Н"));
                    td.classList.add('attendance')
                    td.classList.add(`${attendance}`);
                    if (attendanceObj && attendanceObj.remark) {
                        td.dataset['remark'] = attendanceObj.remark;
                        td.classList.add('remarked');
                        let span = document.createElement("span");
                        span.classList.add("icon");
                        span.textContent = '!';
                        td.appendChild(span);
                    }
                    let span = document.createElement("span");
                    span.classList.add('tooltip');
                    span.textContent = 'Изменить';
                    td.appendChild(span);
                    row.appendChild(td);
                })
            }

            counter++;
            tbody.appendChild(row);
        }
        table.appendChild(thead);
        table.appendChild(tbody);
        document.querySelector('.table-container').prepend(table);
        document.querySelector('.table-container').prepend(div);
        export_button.disabled = false;
        export_button.hidden = false;

        document.querySelectorAll('.attendance, .grade, .class-date').forEach(element => {
            element.addEventListener('click', pressTableCell);
        });
    }

    function pressTableCell(event) {
        const target = event.currentTarget;
        const type = target.className;
        const r = target.closest('tr');
        const remark = target.dataset['remark'] ? target.dataset['remark'] : '';
        const student = r.childNodes[1].innerText;
        const attendanceOrGrade = journal_type === 'grades' ? target.dataset['grade'] : target.classList[target.classList.length - 1];
        let date;
        const find = Array.from(r.children).findIndex(child => child === target);
        if (find) { date = document.querySelector('thead tr').childNodes[find].dataset['date']; }
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
        createForm(type, date, student, attendanceOrGrade, remark);
    }

    function createForm(type, selectedDate, student, attendanceOrGrade, remark) {
        if (document.querySelector('.modal')) document.querySelector('.modal').remove();
        const div = document.createElement("div");
        div.classList.add('modal');
        div.style.display = 'block';
        const content = document.createElement("div");
        content.classList.add('modal-content');
        const span = document.createElement("span");
        span.classList.add('close');
        span.innerHTML = '&times;';
        const header = document.createElement("h2");
        header.innerHTML = 'Редактировать запись';
        const form = document.createElement("form");
        form.name = 'edit';
        const class_date = document.createElement("input");
        class_date.type = "date";
        class_date.value = selectedDate;
        class_date.disabled = true;
        const class_label = document.createElement("label");
        class_label.textContent = 'Дата занятия';
        if (type !== 'class-date') {
            const stud_label = document.createElement("label");
            stud_label.textContent = 'Студент';
            const stud_input = document.createElement("input");
            stud_input.id = 'student-input'
            stud_input.type = 'text';
            stud_input.value = student;
            stud_input.disabled = true;
            form.id = 'editForm';
            let label = document.createElement("label");
            label.textContent = type === 'grade' ? 'Оценка' : 'Посещение';
            let select = document.createElement("select");
            select.name = journal_type;
            select.required = true;
            if (journal_type === 'grades') {
                ['-', 2, 3, 4, 5].forEach(value => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    select.appendChild(option);
                    if (value === Number(attendanceOrGrade)) option.selected = true;
                });
            } else if (journal_type === 'attendance') {
                ['Присутствует', 'Отсутствует'].forEach(value => {
                    const option = document.createElement('option');
                    option.value = value === 'Присутствует' ? 'present' : 'absent';
                    option.textContent = value;
                    select.appendChild(option);
                    if (option.value === attendanceOrGrade) option.selected = true;
                });
            }
            form.appendChild(header);
            form.appendChild(class_label);
            form.appendChild(class_date);
            form.appendChild(stud_label);
            form.appendChild(stud_input);
            form.appendChild(label);
            form.appendChild(select);
            if (journal_type === 'attendance') {
                let label = document.createElement("label");
                label.textContent = 'Примечание';
                input = document.createElement("input");
                input.name = 'remark';
                input.value = remark;
                form.appendChild(label);
                form.appendChild(input);
            }
            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.textContent = 'Сохранить';
            form.appendChild(submitButton);
            form.appendChild(span);
            content.appendChild(form);
            div.appendChild(content);
            span.addEventListener('click', () => {
                document.querySelector('.modal').remove();
            });
            document.body.appendChild(div);
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '../api/api.php?get_action=updateRecord', true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(JSON.stringify({
                    student: student,
                    subject_id: subjectId,
                    date: selectedDate,
                    type: journal_type,
                    value: select.value,
                    remark: remark
                }));

                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.response);
                            if (response.success) {
                                pickGroup(undefined, groupsList.value);
                            }
                        }
                        catch (e) { console.error('Error parsing JSON: ', e); }
                    }
                }
                div.remove();
            })
        }

    }
    async function exportTable() {
        try {
            let table;
            const type = journal_type === 'grades' ? 'Успеваемость' : 'Посещаемость';
            table = getTable();
            const workbook = XLSX.utils.table_to_book(table, { sheet: `${groupsList.value}_${type}` });
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = String(today.getFullYear()).slice(-2);
            const formattedDate = `${day}.${month}.${year}`;
            XLSX.writeFile(workbook, `${groupsList.value}_${type}_${formattedDate}.xlsx`);

        } catch (error) {
            console.error(error);
        }

    }

    function getTable() {
        const tooltips = document.querySelectorAll('.tooltip');
        tooltips.forEach(tooltip => tooltip.style.display = 'none');

        const table = document.querySelector('table');
        const clone_table = table.cloneNode(true);
        clone_table.querySelectorAll(".tooltip").forEach(tooltip => {
            tooltip.remove();
        });
        clone_table.querySelectorAll("tr").forEach((row, index) => {
            if (index === 0) {
                return;
            }
            const cells = row.querySelectorAll("td");
            const lastCell = cells[cells.length - 1];
            if (lastCell) {
                let cellText = lastCell.textContent.trim();
                const remark = lastCell.getAttribute("data-remark") || "";
                if (cellText === "Н" || cellText === "Н!") {
                    cellText = cellText.replace('!', '').trim();
                    if (remark) {
                        cellText += ` (${remark})`;
                    }
                }
                lastCell.textContent = cellText;
            }

        });
        return clone_table;
    }
    function logOut() {
        window.localStorage.clear();
        window.location.href = 'index.html';
    }
});