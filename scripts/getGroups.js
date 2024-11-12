function getGroups(teacher_id, subject, subject_id,list) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '../api/api.php?get_action=getSubjectGroups', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        teacher_id: teacher_id,
        subject_id: subject_id,
        subject: subject,
    }));

    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const response = JSON.parse(xhr.response);
                const groups = response['groups'];
                fillList(list, groups, 'group');

            }
            catch (e) { console.error('Error parsing JSON: ', e); }
        }
    }
}