// Expose CSRF token for fetch calls
window.csrftoken = (document.cookie.match(/csrftoken=([^;]+)/) || [])[1];
