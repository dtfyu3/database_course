document.addEventListener('DOMContentLoaded', function () {
    let userId = null;
    const logout = document.getElementById('logout');
    logout.addEventListener('click', logOut);
    const avatarIcon = document.getElementById('avatarIcon');
    const subjectsGrid = document.getElementById("subjects");
    const teacherId = window.localStorage.getItem("teacherId");
    document.getElementById('reports').addEventListener('click',() => {window.location.href = 'reports.html';});
    if (!window.localStorage.getItem("userId")) window.location.href = 'auth/register.html';
    else {
        userId = window.localStorage.getItem("userId");
        logout.style.display = "inline-block";
        document.getElementById('profile').style.display = "block";
        let name = document.querySelector('#username span');
        name.innerHTML = window.localStorage.getItem("userName");
        avatarIcon.src = '/images/user.png';
    }
    getSubjects();

    function logOut() {
        window.localStorage.clear();
        location.reload();
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
                    window.localStorage.setItem("teacherId",response['teacher_id'])
                    addSubjectCards(subjects);
                }
                catch (e) { console.error('Error parsing JSON: ', e); }
            }
        }
    }

    function addSubjectCards(subjects) {
        subjects.forEach(element => {
            const card = document.createElement("div");
            card.classList.add("subject-card");
            const title = document.createElement("span");
            title.textContent = element.name;
            card.appendChild(title);
            card.addEventListener("click", () => {
                window.location.href = `subject.html?subject_id=${element.id}`;
            });
            subjectsGrid.appendChild(card);
        });
    }

});