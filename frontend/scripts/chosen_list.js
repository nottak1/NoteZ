
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

let listData = JSON.parse(window.localStorage.getItem("listData"));
document.getElementById("listHeader").innerHTML = listData.list_name;
const xhttp = new XMLHttpRequest();

const user = JSON.parse(window.localStorage.getItem("user"));
let username = user.username;
const userId = user["user_id"];

const list = window.localStorage.getItem("list");

let tasksObj;
const token = window.localStorage.getItem("token");

//GET individual user info
let getUserInfo = () => {
    const user_endPointRoot = "https://api.anunayisa.com/API/v1/";
    xhttp.open("GET", user_endPointRoot + "user/" + username + `/${userId}/`, true);
    xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhttp.setRequestHeader("x-access-token", token);
    xhttp.send();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            getCheckList();
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
window.onload = getUserInfo;

//checkInput
let isEmpty = (str) => {
    return !str.trim().length;
};

//GET checklist
function getCheckList() {
    const xhttpList = new XMLHttpRequest();
    const list_endPointRoot = "https://api.anunayisa.com/API/v1/lists/" + list;
    xhttpList.open("GET", list_endPointRoot, true);
    xhttpList.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhttpList.setRequestHeader("x-access-token", token);
    xhttpList.send();

    xhttpList.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            tasksObj = JSON.parse(this.responseText);
            displayTasks(tasksObj);
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

class PulledTask {
    constructor(singleTaskObj, addOrUpdate) {
        this.task_id = singleTaskObj["task_id"];

        this.div_task = document.createElement('div');
        this.div_taskDetail = document.createElement('div');
        this.div_taskDetail.className = "taskDetail";

        //check box
        this.isChecked = document.createElement("input");
        this.isChecked.type = "checkbox";
        this.isChecked.checked = singleTaskObj['isChecked']['data'][0];
        if (this.isChecked.checked == 1) {
            this.div_task.style.backgroundColor = "rgb(211, 215, 222)";
        }
        this.isChecked.onclick = () => {
            if (addOrUpdate=="Update") {
                updateChecked(this.task_id, this.isChecked.checked);
                window.location.reload();                        
            }
        }

        this.input_taskDetail = document.createElement('input');
        this.input_taskDetail.value = singleTaskObj['task_description'];
        this.input_taskDetail.className = "inputTaskDetail"
        this.input_taskDetail.id = this.task_id + "update";
        this.input_taskDetail.addEventListener("input", function (e) {this.value = e.target.value;});

        this.div_taskBtns = document.createElement('div');
        this.div_taskBtns.className = "taskBtnsContainer";
        this.btn_taskUpdate = document.createElement('button');
        this.btn_taskDelete = document.createElement('button');
        this.btn_taskUpdate.className = addOrUpdate + "_btn";
        this.btn_taskDelete.className = "delete_btn";

        //add new/update task button
        this.btn_taskUpdate.id = this.task_id;
        this.btn_taskUpdate.innerHTML = addOrUpdate;
        //delete button should be at the right end
        this.div_taskBtns.appendChild(this.btn_taskUpdate);

        if (addOrUpdate == "Update") {
            //update or add button
            this.btn_taskUpdate.onclick = () => {
                updateTask(this.task_id, this.input_taskDetail.value);
            }  
            //task entry bar class name
            this.div_task.className = "taskEntry";
            //only show the delete button if it's update
            this.div_taskBtns.appendChild(this.btn_taskDelete);

        } else if (addOrUpdate == "Add") {
            //update or add button
            this.btn_taskUpdate.onclick = () => {
                createTask(this.input_taskDetail.value);
            };
            //task entry bar class name
            this.div_task.className = "taskEntryNew";
        }
        
        // Delete button properties
        this.btn_taskDelete.innerHTML = "Delete";
        this.btn_taskDelete.id = this.task_id + "Del";
        this.btn_taskDelete.onclick = () => {
            deleteTask(this.task_id);
            window.location.reload();
        }
        this.div_taskDetail.appendChild(this.isChecked);
        this.div_taskDetail.appendChild(this.input_taskDetail);

        this.div_task.appendChild(this.div_taskDetail);
        this.div_task.appendChild(this.div_taskBtns);

        let container = document.getElementsByClassName("tasksContainer")[0];
        container.appendChild(this.div_task);
    }
}

let displayTasks = (tasksObj) => {
    for (let i of tasksObj) {
        //create new task object
        let pulledTask = new PulledTask(i, "Update");
    }
};

let addTaskEntry = () => {
    let addedTaskEntry = new PulledTask({
        task_id:null,
        isChecked: {data: [0]},
        task_description: "",
    }, "Add");
};

//create a new task under a checklist
let createTask = (task_detail) => {
    let task_endpoint = 'https://api.anunayisa.com/API/v1/lists/' + list + '/task';
    const token = window.localStorage.getItem("token");
    const user = window.localStorage.getItem("user");

    let params = {taskName: null, taskDescription: task_detail, duedate: null}
    xhttp.open("POST", task_endpoint, true);
    xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhttp.setRequestHeader("x-access-token", token);
    xhttp.send(JSON.stringify(params));
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // document.getElementById("feedback").innerHTML = this.responseText;
            window.location.reload();
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

//**need to create separate input boxes.textareas for this
let updateTask = (task_id, task_detail) => {
    let task_endpoint = 'https://api.anunayisa.com/API/v1/lists/' + list + '/task/' + task_id ;
    const token = window.localStorage.getItem("token");
    const user = window.localStorage.getItem("user");
    // let task_name = document.getElementById("taskName").value;
    // let due_date = document.getElementById("dueDate").value;

    let params = {taskName: null, taskDescription: task_detail, duedate: null}
    xhttp.open("PATCH", task_endpoint, true);
    xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhttp.setRequestHeader("x-access-token", token);
    xhttp.send(JSON.stringify(params));
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            document.getElementById("feedback").innerHTML = this.responseText;
            window.location.reload();
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

let deleteTask = (task_id) => {
    let task_endpoint = 'https://api.anunayisa.com/API/v1/lists/' + list + '/task/' + task_id ;
    const token = window.localStorage.getItem("token");

    xhttp.open("DELETE", task_endpoint, true);
    xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhttp.setRequestHeader("x-access-token", token);
    xhttp.send();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            window.location.reload();
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

let updateChecked = (task_id, check_status) => {
    let task_endpoint = 'https://api.anunayisa.com/API/v1/lists/' + list + '/task/' + task_id + '/check';
    const token = window.localStorage.getItem("token");

    let params = {checked: check_status};
    xhttp.open("PATCH", task_endpoint, true);
    xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhttp.setRequestHeader("x-access-token", token);
    xhttp.send(JSON.stringify(params));
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
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

document.getElementById("newTask").onclick = addTaskEntry;