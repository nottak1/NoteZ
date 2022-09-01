const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const url = require('url');
require("dotenv").config();
const PORT = process.env.PORT || 8888;
const app = express();
const auth = require("./middleware/auth");


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'webdev'
});


app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length,  X-Requested-With, x-access-token');
    next();

});

connection.connect(err => {

    // create users table
    const createUserTableQuery = [
        'CREATE TABLE IF NOT EXISTS users',
        '(user_id INT PRIMARY KEY AUTO_INCREMENT,',
        'username VARCHAR(50),',
        'password VARCHAR(250),',
        'img_url MEDIUMTEXT DEFAULT NULL,',
        'isAdmin BIT DEFAULT 0)'
    ].join(' ');
    connection.query(createUserTableQuery, (err, result) => {
        if (err) throw err;
        console.log('User Table created');
    });

    // create requests table
    const createRequestsTableQuery = [
        'CREATE TABLE IF NOT EXISTS requests',
        '(request_id INT PRIMARY KEY AUTO_INCREMENT,',
        'request_endpoint VARCHAR(50),',
        'request_method VARCHAR(50),',
        'amount INT)',
    ].join(' ');
    connection.query(createRequestsTableQuery, (err, result) => {
        if (err) throw err;
        console.log('Requests Table created');
    });

    // create to_do_list table
    const createToDoListQuery = [
        'CREATE TABLE IF NOT EXISTS lists',
        '(list_id INT PRIMARY KEY AUTO_INCREMENT,',
        'user_id INT,',
        'FOREIGN KEY (user_id) REFERENCES users(user_id),',
        'list_name VARCHAR(150),',
        'isDiary BIT DEFAULT 0,',
        'description VARCHAR(1000),',
        'time TIMESTAMP)'
    ].join(' ');
    connection.query(createToDoListQuery, (err, result) => {
        if (err) throw err;
        console.log('To-do-list Table created');
    });

    const createTasksQuery = [
        'CREATE TABLE IF NOT EXISTS tasks',
        '(task_id INT PRIMARY KEY AUTO_INCREMENT,',
        'list_id INT,',
        'FOREIGN KEY (list_id) REFERENCES lists(list_id) ON DELETE CASCADE,',
        'task_name VARCHAR(150),',
        'task_description VARCHAR(250),',
        'task_duedate DATE,',
        'isChecked BIT DEFAULT 0)'
    
    ].join(' ');
    connection.query(createTasksQuery, (err, result) => {
        if (err) throw err;
        console.log('Tasks Table created');
    });

});

connection.promise = (sql) => {
    return new Promise((resolve, reject) => {
        connection.query(sql, (err, result) => {
            if (err) { reject(new Error()); }
            else { resolve(result);}
            
        });
    });
};


//get requests
app.get("/API/v1/requests/", auth, async (req, res) => {    
    await connection.promise("SELECT * FROM requests WHERE request_endpoint = '/API/v1/requests/' AND request_method = 'GET'")
    .then((result) => {
        console.log("get requests: ", result);
        let sql;
        if (result.length > 0) {
            sql = `UPDATE requests SET amount = amount + 1 WHERE request_endpoint = '/API/v1/requests/' AND request_method = 'GET'`;
            return connection.promise(sql);
        } else {
            sql = `INSERT INTO requests (request_endpoint, request_method, amount) values ('/API/v1/requests/', 'GET', 1)`;
            return connection.promise(sql);
        }
    }).then((result) => {
        console.log("requst result message", result.message);
    }).catch((err) => {
        console.log(err);
    });

    connection.query(`SELECT * FROM requests`, 
    (err, result) => {
        if (err) throw err;
        res.send(JSON.stringify(result));
    });
});

//register user
app.post("/API/v1/user/", (req, res) => {
    let body = "";
    req.on('data', function (chunk) {
        if (chunk != null) {
            body += chunk;
        }
    });
    req.on('end', function () {
        let username = JSON.parse(body).username;
        let password = JSON.parse(body).password;
        console.log(username);
        console.log('username: ' + username);
        console.log(JSON.parse(body));

        const addUser = async () => {
            const hashedPassword = await bcrypt.hash(password, 10);
            const sqlQuery = `INSERT INTO users (username, password, isAdmin) values ('${username}', '${hashedPassword}', 0)`;
            console.log(sqlQuery);
            connection.query(sqlQuery, function (err, result) {
                if (err) throw err;
                console.log("last inserted id for user: ");
                const token = jwt.sign(
                    { user_id: username},
                    process.env.TOKEN_KEY,
                    {
                        expiresIn: "2h",
                    }
                );
                const user = {
                    user_id : result.insertId,
                    username: username,
                    token: token
                }
                console.log("record inserted");
                res.status(200).json(user);
            });           
        }

        //Check if user exists, then creates new one or throws error.
        connection.promise(`SELECT * FROM users WHERE username = '${username}'`)
        .then((result) => {
            console.log(result);
            if (result.length > 0) {
                console.log("username taken");
                res.status(403).send();
            } else {
                addUser();
            }
        });

        connection.promise("SELECT * FROM requests WHERE request_endpoint = '/API/v1/user/' AND request_method = 'POST'")
        .then((result) => {
            console.log(result);
            let sql;
            if (result.length > 0) {
                console.log("Admin record updated");
                sql = `UPDATE requests SET amount = amount + 1 WHERE request_endpoint = '/API/v1/user/' AND request_method = 'POST'`;
                return connection.promise(sql);
            } else {
                console.log("Admin record updated");
                sql = `INSERT INTO requests (request_endpoint, request_method, amount) values ('/API/v1/user/', 'POST', 1)`;
                return connection.promise(sql);
                
            }
        }).then((result) => {
            console.log(result.message);
        }).catch((err) => {
            console.log(err);
        });
    });
});

//login with user
app.post("/API/v1/user/login", (req, res) => {
    let body = "";
    req.on('data', function (chunk) {
        if (chunk != null) {
            body += chunk;
        }
    });
    req.on('end', function () {
        let username = JSON.parse(body).username;
        let password = JSON.parse(body).password;
        console.log(username);
        console.log('username: ' + username);
        console.log(JSON.parse(body));

        const checkUser = async () => {
            const sqlQuery = `SELECT * FROM users WHERE username = '${username}'`;
            console.log(sqlQuery);
            connection.query(sqlQuery, function (err, result, fields) {
                if (err) throw err;
                console.log("user searched");

                if (result.length > 0) {
                    console.log(result[0]);
                    bcrypt.compare(password, result[0].password, function(err, isMatch) {
                        if (err) {
                            throw err
                        } else if (!isMatch) {
                            console.log("User " + username + " exists, but password doesn't match");
                            console.log("Password input: " + password);
                            console.log("Password db: " + result[0].password);
                            res.status(403).send();
                        } else {
                            console.log("Password matches!")
                            console.log("User " + username + " exists");
                            

                            const token = jwt.sign(
                                { user_id: username},
                                process.env.TOKEN_KEY,
                                {
                                    expiresIn: "2h",
                                }
                            );

                            const user = {
                                user_id : result[0].user_id,
                                username: username,
                                token: token,
                                isAdmin: result[0].isAdmin
                            }

                            res.status(200).json(user);
                        }
                      });                   
                } else {
                    console.log("User " + username + " does not exist");
                    res.status(404).send();
                }
            });
            
        }
        checkUser();
        connection.promise("SELECT * FROM requests WHERE request_endpoint = '/API/v1/user/login' AND request_method = 'POST'")
        .then((result) => {
            console.log(result);
            let sql;
            if (result.length > 0) {
                console.log("Admin record updated");
                sql = `UPDATE requests SET amount = amount + 1 WHERE request_endpoint = '/API/v1/user/login' AND request_method = 'POST'`;
                return connection.promise(sql);
            } else {
                console.log("Admin record updated");
                sql = `INSERT INTO requests (request_endpoint, request_method, amount) values ('/API/v1/user/login', 'POST', 1)`;
                return connection.promise(sql);
            }
        }).then((result) => {
            console.log(result.message);
        }).catch((err) => {l
            console.log(err);
        });
});

});


//get individual user
app.get("/API/v1/user/:username/:userId", auth, (req, res) => {
    connection.query(`SELECT * FROM users where username = '${req.params.username}' AND user_id = '${req.params.userId}'`, 
    (err, result) => {
        if (err) throw err;
        res.send(JSON.stringify(result));
    });

    connection.promise("SELECT * FROM requests WHERE request_endpoint = '/API/v1/user/:username/:userId/' AND request_method = 'GET'")
    .then((result) => {
        console.log(result);
        let sql;
        if (result.length > 0) {
            console.log("Admin record updated");
            sql = `UPDATE requests SET amount = amount + 1 WHERE request_endpoint = '/API/v1/user/:username/:userId/' AND request_method = 'GET'`;
            return connection.promise(sql);
        } else {
            console.log("Admin record updated");
            sql = `INSERT INTO requests (request_endpoint, request_method, amount) values ('/API/v1/user/:username/:userId/', 'GET', 1)`;
            return connection.promise(sql);
            
        }
    }).then((result) => {
        console.log(result.message);
    }).catch((err) => {
        console.log(err);
    });
});


//lists and task endpoints >> add new checklist
app.post("/API/v1/lists/", auth, (req, res) => {
    let body = "";
    req.on('data', function (chunk) {
        if (chunk != null) {
            body += chunk;
        }
    });
    req.on('end', function () {
        let listName = JSON.parse(body).listName;
        let listType = parseInt(JSON.parse(body).listType);
        let user_id = parseInt(JSON.parse(body).user_id);
        console.log('UserID: ' + user_id);
        console.log(listName);
        console.log('list type: ' + listType);
        console.log(JSON.parse(body));

        const addList = async () => {
            const sqlQuery = `INSERT INTO lists (list_name, isDiary, user_id) values ('${listName}', ${listType}, ${user_id})`;
            connection.query(sqlQuery, function (err, result) {
                if (err) throw err;
                console.log("record inserted");
                res.status(200).json({list_name: listName, list_id: result.insertId, isDiary: {type: "Buffer", data: [listType]}});
            });           
        }
        addList();

        connection.promise("SELECT * FROM requests WHERE request_endpoint = '/API/v1/lists/' AND request_method = 'POST'")
        .then((result) => {
            console.log(result);
            let sql;
            if (result.length > 0) {
                console.log("Admin record updated");
                sql = `UPDATE requests SET amount = amount + 1 WHERE request_endpoint = '/API/v1/lists/' AND request_method = 'POST'`;
                return connection.promise(sql);
            } else {
                console.log("Admin record updated");
                sql = `INSERT INTO requests (request_endpoint, request_method, amount) values ('/API/v1/lists/', 'POST', 1)`;
                return connection.promise(sql);
                
            }
        }).then((result) => {
            console.log(result.message);
        }).catch((err) => {
            console.log(err);
        });
    });
});


//get list of lists
app.get("/API/v1/lists/", auth, async (req, res) => {    
    await connection.promise("SELECT * FROM requests WHERE request_endpoint = '/API/v1/lists/' AND request_method = 'GET'")
    .then((result) => {
        console.log("get requests: ", result);
        let sql;
        if (result.length > 0) {
            sql = `UPDATE requests SET amount = amount + 1 WHERE request_endpoint = '/API/v1/lists/' AND request_method = 'GET'`;
            return connection.promise(sql);
        } else {
            sql = `INSERT INTO requests (request_endpoint, request_method, amount) values ('/API/v1/lists/', 'GET', 1)`;
            return connection.promise(sql);
        }
    }).then((result) => {
        console.log("requst result message", result.message);
    }).catch((err) => {
        console.log(err);
    });

    const q = url.parse(req.url, true);
    connection.query(`SELECT * FROM lists where user_id = ${parseInt(q.query["user"])}`, 
    (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});


//Get tasks for individual list
app.get("/API/v1/lists/:listid", auth, async (req, res) => {    
    await connection.promise("SELECT * FROM requests WHERE request_endpoint = '/API/v1/lists/:listid' AND request_method = 'GET'")
    .then((result) => {
        console.log("get requests: ", result);
        let sql;
        if (result.length > 0) {
            sql = `UPDATE requests SET amount = amount + 1 WHERE request_endpoint = '/API/v1/lists/:listid' AND request_method = 'GET'`;
            return connection.promise(sql);
        } else {
            sql = `INSERT INTO requests (request_endpoint, request_method, amount) values ('/API/v1/lists/:listid', 'GET', 1)`;
            return connection.promise(sql);
        }
    }).then((result) => {
        console.log("requst result message", result.message);
    }).catch((err) => {
        console.log(err);
    });

    const q = url.parse(req.url, true);
    connection.query(`SELECT * FROM tasks where list_id = ${parseInt(req.params.listid)}`, 
    (err, result) => {
        if (err) throw err;
        console.log("chosen list data")
        res.json(result);
    });
});

//Delete list
app.delete("/API/v1/lists/:listid", auth, async (req, res) => {    
    await connection.promise("SELECT * FROM requests WHERE request_endpoint = '/API/v1/lists/:listid' AND request_method = 'DELETE'")
    .then((result) => {
        console.log("get requests: ", result);
        let sql;
        if (result.length > 0) {
            sql = `UPDATE requests SET amount = amount + 1 WHERE request_endpoint = '/API/v1/lists/:listid' AND request_method = 'DELETE'`;
            return connection.promise(sql);
        } else {
            sql = `INSERT INTO requests (request_endpoint, request_method, amount) values ('/API/v1/lists/:listid', 'DELETE', 1)`;
            return connection.promise(sql);
        }
    }).then((result) => {
        console.log("request result message", result.message);
    }).catch((err) => {
        console.log(err);
    });

    const q = url.parse(req.url, true);
    connection.query(`DELETE FROM lists WHERE list_id = ${parseInt(req.params.listid)}`, 
    (err, result) => {
        if (err) throw err;
        console.log("chosen list data");
        res.json(result);
    });
});

//Get Diary "list" (no tasks)
app.get("/API/v1/lists/diary/:diaryid", auth, async (req, res) => {    
    await connection.promise("SELECT * FROM requests WHERE request_endpoint = '/API/v1/lists/diary/:diaryid' AND request_method = 'GET'")
    .then((result) => {
        console.log("get requests: ", result);
        let sql;
        if (result.length > 0) {
            sql = `UPDATE requests SET amount = amount + 1 WHERE request_endpoint = '/API/v1/lists/diary/:diaryid' AND request_method = 'GET'`;
            return connection.promise(sql);
        } else {
            sql = `INSERT INTO requests (request_endpoint, request_method, amount) values ('/API/v1/lists/diary/:diaryid', 'GET', 1)`;
            return connection.promise(sql);
        }
    }).then((result) => {
        console.log("requst result message", result.message);
    }).catch((err) => {
        console.log(err);
    });

    const q = url.parse(req.url, true);
    connection.query(`SELECT * FROM lists where list_id = ${parseInt(req.params.diaryid)}`, 
    (err, result) => {
        if (err) throw err;
        console.log("chosen diary data")
        console.log(result);
        res.json(result);
    });
});


//Create tasks
app.post("/API/v1/lists/:list_id/task", auth, (req, res) => {
    let body = "";
    req.on('data', function (chunk) {
        if (chunk != null) {
            body += chunk;
        }
    });
    req.on('end', function () {
        let taskName = JSON.parse(body).taskName
        let taskDescription = JSON.parse(body).taskDescription;
        let task_duedate = JSON.parse(body).duedate;
        let list_id = parseInt(req.params.list_id);
        
        const addTask = async () => {
            const sqlQuery = `INSERT INTO tasks (task_name, task_description, task_duedate, list_id) values ('${taskName}', '${taskDescription}', ${task_duedate}, ${list_id})`;
            connection.query(sqlQuery, function (err, result) {
                if (err) throw err;
                console.log("record inserted");
                res.status(200).json({taskName: taskName, status: "created"});

            });           
        }

        addTask();

        connection.promise("SELECT * FROM requests WHERE request_endpoint = '/API/v1/lists/:list_id/task' AND request_method = 'POST'")
        .then((result) => {
            console.log(result);
            let sql;
            if (result.length > 0) {
                console.log("Admin record updated");
                sql = `UPDATE requests SET amount = amount + 1 WHERE request_endpoint = '/API/v1/lists/:list_id/task' AND request_method = 'POST'`;
                return connection.promise(sql);
            } else {
                console.log("Admin record updated");
                sql = `INSERT INTO requests (request_endpoint, request_method, amount) values ('/API/v1/lists/:list_id/task', 'POST', 1)`;
                return connection.promise(sql);
                
            }
        }).then((result) => {
            console.log(result.message);
        }).catch((err) => {
            console.log(err);
        });
    });
});

//update tasks
app.patch("/API/v1/lists/:list_id/task/:taskid", auth, (req, res) => {
    let body = "";
    req.on('data', function (chunk) {
        if (chunk != null) {
            body += chunk;
        }
    });
    req.on('end', function () {
        let taskName = JSON.parse(body).taskName
        let taskDescription = JSON.parse(body).taskDescription;
        let task_duedate = JSON.parse(body).duedate;
        let task_id = parseInt(req.params.taskid)
        
        const updateTask = async () => {
            const sqlQuery = `UPDATE tasks SET task_name='${taskName}', task_description='${taskDescription}', task_duedate=${task_duedate} WHERE task_id = ${task_id}`;
            connection.query(sqlQuery, function (err, result) {
                if (err) throw err;
                console.log("record inserted");
                res.status(200).json({taskName: taskName, status: "updated"});

            });           
        }

        updateTask();

        connection.promise("SELECT * FROM requests WHERE request_endpoint = '/API/v1/lists/:list_id/task/:taskid' AND request_method = 'PATCH'")
        .then((result) => {
            console.log(result);
            let sql;
            if (result.length > 0) {
                console.log("Admin record updated");
                sql = `UPDATE requests SET amount = amount + 1 WHERE request_endpoint = '/API/v1/lists/:list_id/task/:taskid' AND request_method = 'PATCH'`;
                return connection.promise(sql);
            } else {
                console.log("Admin record updated");
                sql = `INSERT INTO requests (request_endpoint, request_method, amount) values ('/API/v1/lists/:list_id/task/:taskid', 'PATCH', 1)`;
                return connection.promise(sql);
                
            }
        }).then((result) => {
            console.log(result.message);
        }).catch((err) => {
            console.log(err);
        });
    });
});

//update task's isChecked
app.patch("/API/v1/lists/:list_id/task/:taskid/check", auth, (req, res) => {
    let body = "";
    req.on('data', function (chunk) {
        if (chunk != null) {
            body += chunk;
        }
    });
    req.on('end', function () {
        let checked = JSON.parse(body).checked
        
        const updateTask = async () => {
            const sqlQuery = `UPDATE tasks SET isChecked=${checked} WHERE task_id = ${req.params.taskid}`;
            connection.query(sqlQuery, function (err, result) {
                if (err) throw err;
                console.log("record inserted");
                res.status(200).json({taskid: req.params.taskid, status: "updated"});

            });           
        }

        updateTask();

        connection.promise("SELECT * FROM requests WHERE request_endpoint = '/API/v1/lists/:list_id/task/:taskid/check' AND request_method = 'PATCH'")
        .then((result) => {
            console.log(result);
            let sql;
            if (result.length > 0) {
                console.log("Admin record updated");
                sql = `UPDATE requests SET amount = amount + 1 WHERE request_endpoint = '/API/v1/lists/:list_id/task/:taskid/check' AND request_method = 'PATCH'`;
                return connection.promise(sql);
            } else {
                console.log("Admin record updated");
                sql = `INSERT INTO requests (request_endpoint, request_method, amount) values ('/API/v1/lists/:list_id/task/:taskid/check', 'PATCH', 1)`;
                return connection.promise(sql);
                
            }
        }).then((result) => {
            console.log(result.message);
        }).catch((err) => {
            console.log(err);
        });
    });
});



//Delete a task
app.delete("/API/v1/lists/:list_id/task/:taskid", auth, async (req, res) => {    
    await connection.promise("SELECT * FROM requests WHERE request_endpoint = '/API/v1/lists/:list_id/task/:taskid' AND request_method = 'DELETE'")
    .then((result) => {
        console.log("get requests: ", result);
        let sql;
        if (result.length > 0) {
            sql = `UPDATE requests SET amount = amount + 1 WHERE request_endpoint = '/API/v1/lists/:list_id/task/:taskid' AND request_method = 'DELETE'`;
            return connection.promise(sql);
        } else {
            sql = `INSERT INTO requests (request_endpoint, request_method, amount) values ('/API/v1/lists/:list_id/task/:taskid', 'DELETE', 1)`;
            return connection.promise(sql);
        }
    }).then((result) => {
        console.log("request result message", result.message);
    }).catch((err) => {
        console.log(err);
    });

    const q = url.parse(req.url, true);
    connection.query(`DELETE FROM tasks WHERE task_id = ${parseInt(req.params.taskid)}`, 
    (err, result) => {
        if (err) throw err;
        console.log("chosen list data");
        res.json(result);
    });
});

//update diary
app.patch("/API/v1/lists/diary/:diaryid", auth, (req, res) => {
    let body = "";
    req.on('data', function (chunk) {
        if (chunk != null) {
            body += chunk;
        }
    });
    req.on('end', function () {
        let diaryDescription = JSON.parse(body).diaryDescription;
        
        const updateDiary = async () => {
            const sqlQuery = `UPDATE lists SET description = '${diaryDescription}' WHERE list_id = ${req.params.diaryid}`;
            connection.query(sqlQuery, function (err, result) {
                if (err) throw err;
                console.log("record inserted");
                res.status(200).json({diaryid: req.params.diaryid, status: "updated"});
            });           
        }

        updateDiary();

        connection.promise("SELECT * FROM requests WHERE request_endpoint = '/API/v1/lists/diary/:diaryid' AND request_method = 'PATCH'")
        .then((result) => {
            console.log(result);
            let sql;
            if (result.length > 0) {
                console.log("Admin record updated");
                sql = `UPDATE requests SET amount = amount + 1 WHERE request_endpoint = '/API/v1/lists/diary/:diaryid' AND request_method = 'PATCH'`;
                return connection.promise(sql);
            } else {
                console.log("Admin record updated");
                sql = `INSERT INTO requests (request_endpoint, request_method, amount) values ('/API/v1/lists/diary/:diaryid', 'PATCH', 1)`;
                return connection.promise(sql);
                
            }
        }).then((result) => {
            console.log(result.message);
        }).catch((err) => {
            console.log(err);
        });
    });
});

//helper remove the begining of a string
let removeBegining = (str) => {
    str = str.replace('"images"', "@")
    for (let i = 0; i < str.length; i++) {
        if (str[i] != "@") {
            str = str.replace(str[i], " ");
        } if (str[i] == "@") {
            str = str.replace(str[i], " ");
            str = str.trim();
            return str;
        }
    }
};

//helper remove the end of a string
let removeEnd = (str) => {
    let newStr = '';
    for (let i = 0; i < str.length; i++) {
        if (str[i] != "-") {
            newStr += str[i];
        } if (str[i] == "-") {
            newStr = newStr.trim();
            return newStr;
        }
    }
};

//update user profile picture
app.patch("/API/v1/user/:username/:userId/uploads", auth, (req, res) => {
    let body = "";
    req.on('data', function (chunk) {
        if (chunk != null) {
            body += chunk;
        }
    });
    req.on('end', function () {
        let str = removeBegining(body);
        let cleanStr = removeEnd(str);
        cleanStr = "data:image/png;charset=utf-8;base64," + cleanStr;
        console.log("**************************: ", cleanStr);

        const updatePicture = async () => {
            connection.query(
                `UPDATE users 
                SET img_url = '${cleanStr}'
                where username = '${req.params.username}' AND user_id = '${req.params.userId}'`, 
            (err, result) => {
                if (err) throw err;
                res.send(JSON.stringify(result));
            });
        }
        updatePicture();
        connection.promise("SELECT * FROM requests WHERE request_endpoint = '/API/v1/user/:username/:userId/uploads' AND request_method = 'PATCH'")
        .then((result) => {
            console.log(result);
            let sql;
            if (result.length > 0) {
                console.log("Admin record updated");
                sql = `UPDATE requests SET amount = amount + 1 WHERE request_endpoint = '/API/v1/user/:username/:userId/uploads' AND request_method = 'PATCH'`;
                return connection.promise(sql);
            } else {
                console.log("Admin record updated");
                sql = `INSERT INTO requests (request_endpoint, request_method, amount) values ('/API/v1/user/:username/:userId/uploads', 'PATCH', 1)`;
                return connection.promise(sql);
                
            }
        }).then((result) => {
            console.log(result.message);
        }).catch((err) => {
            console.log(err);
        });
    }); 

});




app.listen(PORT, (err) => {
    if (err) throw err;
    console.log("Listening to port", PORT);
});
