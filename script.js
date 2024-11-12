document.addEventListener('DOMContentLoaded', function () {
    let userId = null;
    const logout = document.getElementById('logout');
    logout.addEventListener('click', logOut);
    const avatarIcon = document.getElementById('avatarIcon');
    const subjectsGrid = document.getElementById("subjects");
    const teacherId = window.localStorage.getItem("teacherId");
    document.getElementById('avgreports').addEventListener('click', () => { window.location.href = '/pages/avgreports.html'; });
    document.getElementById('attreports').addEventListener('click', () => { window.location.href = '/pages/attreports.html'; });
    if (!window.localStorage.getItem("userId")) window.location.href = 'auth/register.html';
    else {
        userId = window.localStorage.getItem("userId");
        logout.style.display = "inline-block";
        document.getElementById('profile').style.display = "block";
        let name = document.querySelector('#username span');
        name.innerHTML = window.localStorage.getItem("userName");
        avatarIcon.src = '/images/user.png';
    }
    getSubjects(userId, null, response => {
        subjects = response['subjects'];
        window.localStorage.setItem("teacherId", response['teacher_id'])
        addSubjectCards(subjects);
    });

    function logOut() {
        window.localStorage.clear();
        location.reload();
    }

    function addSubjectCards(subjects) {
        for (const element of Object.values(subjects)) {
            const card = document.createElement("div");
            card.classList.add("subject-card");
            const title = document.createElement("span");
            title.classList.add('subject-name-span');
            title.textContent = element.name;
            const group_span = document.createElement("span");
            group_span.classList.add('subject-groups-span');
            if (Array.isArray(element.groups) && element.groups.length > 0) {
                group_span.textContent = "Группы: " + element.groups.join(", ");
            }
            card.appendChild(title);
            card.appendChild(group_span);
            card.addEventListener("click", () => {
                window.localStorage.setItem("currentSubjectId", element.id);
                window.location.href = 'pages/subject.html';
            });
            subjectsGrid.appendChild(card);
        }
    }

});