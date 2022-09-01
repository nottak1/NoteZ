import {messages} from "../../resource/messages.js";


//redirect if not logged in.
if (!window.localStorage.getItem("token")) {
    window.location.replace("login.html");
}

//sign out 
$('#sign-out').click( () => {
    window.localStorage.removeItem("user");
    window.localStorage.removeItem("token");
  });
  
const diary = window.localStorage.getItem("diary");
const token = window.localStorage.getItem("token");
const user = JSON.parse(window.localStorage.getItem("user"));
let username = user.username;
const userId = user["user_id"];

//GET individual user info
let getUserInfo = () => {
    const xhttpUser = new XMLHttpRequest();
    // const user_endPointRoot = "http://localhost:8888/API/v1/";
    const user_endPointRoot = "https://api.anunayisa.com/API/v1/";
    xhttpUser.open("GET", user_endPointRoot + "user/" + username + `/${userId}/`, true);
    xhttpUser.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhttpUser.setRequestHeader("x-access-token", token);
    xhttpUser.send();
    xhttpUser.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            getDiary();
            let userObj = JSON.parse(this.responseText);
            let img = userObj[0]['img_url'];
            //update username 
            username = userObj[0]["username"];
            $("#userName").text(username);
            if (img != null) {
                headerLogo.setAttribute('src', img);
            }
        }
        if (this.readyState == 4 && this.status == 404) {
            document.getElementById("feedback").innerHTML = messages[404];
        }
        if (this.readyState == 4 && this.status == 401) {
            document.getElementById("feedback").innerHTML = messages[401];
        }
        if (this.readyState == 4 && this.status == 403) {
            document.getElementById("feedback").innerHTML = messages[403];
        }
    };
}
window.onload = getUserInfo();

let getDiary = () => {
    const xhttp = new XMLHttpRequest();
    const endPointRoot = "https://api.anunayisa.com/API/v1/lists/diary/" + diary;
    xhttp.open("GET", endPointRoot, true);
    xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhttp.setRequestHeader("x-access-token", token);
    xhttp.send();

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let givenDiary = JSON.parse(this.responseText);
            document.getElementById("diaryHeader").innerHTML = givenDiary[0].list_name;
            if (givenDiary[0].description) {
                document.getElementById("description").innerHTML = givenDiary[0].description;
            }

        }
        if (this.readyState == 4 && this.status == 404) {
            document.getElementById("feedback").innerHTML = messages[404];
        }
        if (this.readyState == 4 && this.status == 401) {
            document.getElementById("feedback").innerHTML = messages[401];
        }
        if (this.readyState == 4 && this.status == 403) {
            document.getElementById("feedback").innerHTML = messages[403];
        }
    };
}
window.onload = getDiary;

let updateDiary = () => {
    const xhttpUpdate = new XMLHttpRequest();
    let newDescription = document.getElementById("description").value;
    let diary_id = window.localStorage.getItem("diary");
    let task_endpoint = 'https://api.anunayisa.com/API/v1/lists/diary/' + diary_id;

    const token = window.localStorage.getItem("token");

    let params = {
        diaryDescription: newDescription
    }
    xhttpUpdate.open("PATCH", task_endpoint, true);
    xhttpUpdate.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhttpUpdate.setRequestHeader("x-access-token", token);
    xhttpUpdate.send(JSON.stringify(params));
    xhttpUpdate.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            window.location.replace("listAll.html");
        }
        if (this.readyState == 4 && this.status == 404) {
            document.getElementById("feedback").innerHTML = messages[404];
        }
        if (this.readyState == 4 && this.status == 401) {
            document.getElementById("feedback").innerHTML = messages[401];
        }
        if (this.readyState == 4 && this.status == 403) {
            document.getElementById("feedback").innerHTML = messages[403];
        }
    };
}

document.getElementById("updateDiary").onclick = updateDiary;