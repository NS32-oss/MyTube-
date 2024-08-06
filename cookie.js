function setCookie(name, value, days, secure = false) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  let cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
  if (secure) {
    cookie += "; Secure";
  }
  document.cookie = cookie;
}
