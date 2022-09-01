
import {messages} from "../../resource/messages.js";

//redirect if not logged in
if (!window.localStorage.getItem("token")) {
    window.location.replace("login.html");
}

const token = window.localStorage.getItem("token");
const endPointRoot = "https://api.anunayisa.com/API/v1/";

const user = JSON.parse(window.localStorage.getItem("user"));
let username = user["username"];
const userId = user["user_id"];
let listObj;


//sign out 
$('#sign-out').click( () => {
    window.localStorage.removeItem("user");
    window.localStorage.removeItem("token");
  });


//GET individual user info
const xhttp = new XMLHttpRequest();
let getUserInfo = () => {
    xhttp.open("GET", endPointRoot + "user/" + username + `/${userId}/`, true);
    xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhttp.setRequestHeader("x-access-token", token);
    xhttp.send();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            getToDoList();
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
            document.getElementById("feedback").innerHTML = messages[404]
        }
        if (this.readyState == 4 && this.status == 401) {
            document.getElementById("feedback").innerHTML = messages[401]
        }
        if (this.readyState == 4 && this.status == 403) {
            document.getElementById("feedback").innerHTML = messages[403]
        }
    };
}
window.onload = getUserInfo;

//fetch to do list
const xhttpList = new XMLHttpRequest();
let getToDoList = () => {
    xhttpList.open("GET", endPointRoot + "lists/?user=" + userId, true);
    xhttpList.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhttpList.setRequestHeader("x-access-token", token);
    xhttpList.send();

    xhttpList.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            listObj = JSON.parse(this.responseText);
            displayToDoList(listObj);
        }
        if (this.readyState == 4 && this.status == 404) {
            document.getElementById("feedback").innerHTML = messages[404]
        }
        if (this.readyState == 4 && this.status == 401) {
            document.getElementById("feedback").innerHTML = messages[401]
        }
        if (this.readyState == 4 && this.status == 403) {
            document.getElementById("feedback").innerHTML = messages[403]
        }
    };
}

let displayToDoList = (listObj) => {
    for (let i of listObj) {
        let div_listName = document.createElement('div');
        div_listName.className = "todoListEntry"
        let btn_edit_tasks = document.createElement('button');
        let btn_delete_list = document.createElement('button');
        let div_listButtons = document.createElement('div');
        div_listButtons.className = "todoListButtons"
        let text_listName = document.createTextNode(i['list_name']);

        if (i["isDiary"]["data"][0] == 0) {
            div_listName.style.backgroundColor = '#f9faee';
        } else {
            // div_listName.className = "fsdfasdf";
            div_listName.style.backgroundColor = '#eef8f1';
        }

        let list_id = i["list_id"];
        btn_edit_tasks.id = list_id;
        btn_edit_tasks.className = "edit_btn";
        btn_delete_list.id = list_id + "Del";
        btn_delete_list.className = "delete_btn";
        btn_delete_list.innerHTML = "Delete";
        btn_edit_tasks.innerHTML = "Edit";
        
        btn_edit_tasks.onclick = () => {

            if (i["isDiary"]["data"][0] == 0) {
                window.localStorage.setItem("list", list_id);
                window.localStorage.setItem("listData", JSON.stringify(i));
                window.location.href = 'chosen_list.html'
            } else {
                window.localStorage.setItem("diary", list_id);
                window.localStorage.setItem("diaryData", JSON.stringify(i));
                window.location.href = 'chosen_diary.html'
            }
        }

        btn_delete_list.onclick = () => {
            deleteList(list_id);
            window.location.reload();             
        }

        div_listName.appendChild(text_listName);
        
        div_listButtons.appendChild(btn_edit_tasks);
        div_listButtons.appendChild(btn_delete_list);
        div_listName.appendChild(div_listButtons);
        
        let container = document.getElementsByClassName("listContainer")[0];
        container.appendChild(div_listName);
    }
};

//create new checklist
let addList = () => {
    let entryName = document.getElementById("entryName").value;

    if(document.getElementById("entryName").value.trim() == '') {
        document.getElementById("error").innerHTML = messages.blankListError
    } else {
        // List type 1 for diary
        let params = { listName: entryName, listType: 0, user_id: userId }
        xhttp.open("POST", endPointRoot + "lists/", true);
        xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhttp.setRequestHeader("x-access-token", token);
        xhttp.send(JSON.stringify(params));
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
            
                let list_id = JSON.parse(this.responseText).list_id;
                let data = this.responseText;
                window.localStorage.setItem("list", list_id);
                window.localStorage.setItem("listData", data);

                window.location.href = 'chosen_list.html'
            }
            if (this.readyState == 4 && this.status == 404) {
                window.alert(messages[404]);
            }
            if (this.readyState == 4 && this.status == 401) {
                window.alert(messages[401]);
            }
            if (this.readyState == 4 && this.status == 403) {
                window.alert(messages[403]);
            }
        };     
    }
}

//create new checklist
let addNote = () => {
    let entryName = document.getElementById("entryName").value;


    if(document.getElementById("entryName").value.trim() == '') {
        document.getElementById("error").innerHTML = messages.blankNoteError;
    } else {
        let params = { listName: entryName, listType: 1, user_id: userId }
        xhttp.open("POST", endPointRoot + "lists/", true);
        xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhttp.setRequestHeader("x-access-token", token);
        xhttp.send(JSON.stringify(params));
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
            
                let list_id = JSON.parse(this.responseText).list_id;
                let data = this.responseText;
                window.localStorage.setItem("diary", list_id);
                window.localStorage.setItem("diaryData", data);

                window.location.href = 'chosen_diary.html'
            }
            if (this.readyState == 4 && this.status == 404) {
                window.alert(messages[404]);
            }
            if (this.readyState == 4 && this.status == 401) {
                window.alert(messages[401]);
            }
            if (this.readyState == 4 && this.status == 403) {
                window.alert(messages[403]);
            }
        };
    }
}
    

let deleteList = (list_id) => {
    
    xhttp.open("DELETE", endPointRoot + "lists/" + list_id, true);
    xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhttp.setRequestHeader("x-access-token", token);
    xhttp.send();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
    
        }
        if (this.readyState == 4 && this.status == 404) {
            window.alert(messages[404]);
        }
        if (this.readyState == 4 && this.status == 401) {
            window.alert(messages[401]);
        }
        if (this.readyState == 4 && this.status == 403) {
            window.alert(messages[403]);
        }
    };
}

document.getElementById("addList").onclick = addList;
document.getElementById("addNote").onclick = addNote;