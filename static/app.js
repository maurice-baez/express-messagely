"use strict";

const $registerForm = $("#register-form");
const $loginForm = $("#login-form");
const $alert = $(".alert");








/** Make call to server to login user. */
async function loginUser(evt) {

  evt.preventDefault(evt);
  const username = $("#username").val();
  const password = $("#password").val();

  try {
    const resp = await axios.post("http://localhost:3000/auth/login",
      { username, password });
    const token = resp.data.token;
    window.localStorage.setItem("token", token);
    return;
  }
  catch (err) {
    $alert.text("Invalid username/password.");
  }

}




/** Make call to server to register user */
async function registerUser(evt) {
  evt.preventDefault(evt);

  const username = $("#username").val();
  const password = $("#password").val();
  const first_name = $("#first-name").val();
  const last_name = $("#last-name").val();
  const phone = $("#phone").val();

  try{
    const resp = await axios.post("http://localhost:3000/auth/register",
    { username, password, first_name, last_name, phone });
    const token = resp.data.token;
    localStorage.setItem({ token });
  }
  catch (err){
    $alert.text("Invalid input");
  }
}





$loginForm.on("submit", loginUser);
$registerForm.on("submit", registerUser);