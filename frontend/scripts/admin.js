//redirect if not logged in.
if (!window.localStorage.getItem("token") || JSON.parse(window.localStorage.getItem("user")).isAdmin.data[0] == 0) {
    window.location.replace("login.html");
}

//sign out 

document.querySelector('#sign-out').addEventListener('click',  (event) => {
    window.localStorage.removeItem("user");
    window.localStorage.removeItem("token");
  });

const endPointRoot = "https://api.anunayisa.com/API/v1/requests";
// const endPointRoot = "http://localhost:8888/API/v1/requests/";
let tableObj;
const token = window.localStorage.getItem("token");

function getRequests() {
    const xhttp = new XMLHttpRequest();
    xhttp.open("GET", endPointRoot, true);
    xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");

    xhttp.setRequestHeader("x-access-token", token);
    xhttp.send();

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            tableObj = JSON.parse(this.responseText);
            displayTable(tableObj);
        }
        if (this.readyState == 4 && this.status == 404) {
            document.getElementById("feedback").innerHTML = this.responseText;
        }
        if (this.readyState == 4 && this.status == 401) {
            document.getElementById("feedback").innerHTML = "401 Unauthorized Error: " + " Must be signed in to access.";
        }
        if (this.readyState == 4 && this.status == 403) {
            document.getElementById("feedback").innerHTML = "403 Forbidden Error";
        }
    };
}
window.onload = getRequests;

let displayTable = (tableObj) => {
    for (let i of tableObj) {
        let tr = document.createElement('tr');
        let td_method = document.createElement('td');
        let td_uri = document.createElement('td');
        let td_count = document.createElement('td');
        let text_method = document.createTextNode(i['request_method']);
        let text_uri = document.createTextNode(i['request_endpoint']);
        let text_count = document.createTextNode(i['amount']);

        td_method.appendChild(text_method);
        td_uri.appendChild(text_uri);
        td_count.appendChild(text_count);
        tr.appendChild(td_method);
        tr.appendChild(td_uri);
        tr.appendChild(td_count);
        let tableBody = document.getElementById("tableBody");
        tableBody.appendChild(tr);
    }
};
