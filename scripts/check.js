if (document.referrer === '' || !window.localStorage.getItem("teacherId") || !window.localStorage.getItem("userId")) {
    window.location.href = '../auth/register.html';
}