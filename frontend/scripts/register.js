import {messages} from "../../resource/messages.js";

const xhttp = new XMLHttpRequest();
const endPointRoot = "https://api.anunayisa.com/API/v1/user/";
// const endPointRoot = "http://localhost:8888/API/v1/user/";
let postBook = () => {
    let username1 = document.getElementById("username").value;
    let password1 = document.getElementById("password").value;

    const checkInput = userInput => !userInput.trim().length;

    if (checkInput(username1) || checkInput(password1)) {
        document.getElementById("wrongInput").innerHTML = messages.emptyInput;
        return

    }

    let params = {username: username1, password: password1}
    xhttp.open("POST", endPointRoot, true);
    xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhttp.send(JSON.stringify(params));
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            window.location.replace('login.html');
        }

        if (this.readyState == 4 && this.status == 404) {

        document.getElementById("feedback").innerHTML = messages[404]
        }

        if (this.readyState == 4 && this.status == 401) {

        document.getElementById("feedback").innerHTML = messages[401];
        }

        if (this.readyState == 4 && this.status == 403) {
            const warning = "User already exists with that username";
            document.getElementById("wrongInput").innerHTML = messages.UserExistsError;
        }
    };
}

document.getElementById("buttonLogin").onclick = postBook;