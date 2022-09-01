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

let preview = document.getElementById("preview");
let fileTag = document.getElementById("filetag");
let headerLogo = document.getElementById("headerLogo");


const endPointRoot = "https://api.anunayisa.com/API/v1/requests";
// const endPointRoot = "http://localhost:8888/API/v1/user/";

const token = window.localStorage.getItem("token");
const user = JSON.parse(window.localStorage.getItem("user"));
let username = user["username"];
const userId = user["user_id"];

//get userInfo
let getUserInfo = () => {
    const xhttp = new XMLHttpRequest();
    xhttp.open("GET", endPointRoot + username + `/${userId}/`, true);
    xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhttp.setRequestHeader("x-access-token", token);
    xhttp.send();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let userObj = JSON.parse(this.responseText);
            let img = userObj[0]['img_url'];
            //update username 
            username = userObj[0]["username"];
            $("#userName").text(username);
            if (img != null) {
                preview.setAttribute('src', img);
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

//update user profile picture
let updateAvatar = async (data) => {
    try {
        const response = await axios.patch(endPointRoot + username + `/${userId}/uploads/`, data, {
            headers: {
                "Content-Type": "multipart/form-data",
                "x-access-token": token
            }
        });
        return response.data;
    } catch ({ response }) {
        throw response.data;
    }
}

let base64EncodeFile = (e) => {
    $("#warning").text('');
    let file = e.files[0];
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result.substr(reader.result.indexOf(",") + 1));
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

let handleImageChange = async (e) => {
    if (e.files.length < 1) {
        return;
    }
    let fileSize = e.files[0]['size'];
    if (fileSize > 75000) {
        $("#warning").text(messages.fileTooBigError);
        return;
    }
    base64EncodeFile(e).then((result) => {
        const formData = new FormData();
        formData.append("images", result);
        updateAvatar(formData);
        window.location.reload();
    });

    const [file] = e.files;
    //display the photo selected
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
        preview.setAttribute('src', e.target.result);
        };
        reader.readAsDataURL(file);
    }


};


fileTag.addEventListener("change", function () {
    handleImageChange(this);
    
    
});
