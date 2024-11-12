function getSubjects(userId,list, callback) {
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
                let subjects = response['subjects'];
                if(!callback) fillList(list, subjects, 'name');
                else callback(response)
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