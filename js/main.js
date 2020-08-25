console.log("template object", Initiative, Communication, Goal);
/* basic service worker, will worry about this later 
window.onload = () => {
    'use strict';

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
                 .register('./sw.js');
    }
} */

const dbRef = firebase.database().ref();
const comRef = dbRef.child('communications');
const remRef = dbRef.child('reminders');
const userListUI = document.getElementById("userList");

/* Access Communications Document */
comRef.on("child_added", snap => {

    let communication = snap.val();
    console.log("database snapshot of communications", communication);

	let $li = document.createElement("li");
	$li.innerHTML = communication.type;
	$li.setAttribute("child-key", snap.key);
	$li.addEventListener("click", comClicked);
    // edit icon 
    let editIconUI = document.createElement("span");
    editIconUI.class = "edit-user";
    editIconUI.innerHTML = " ✎";
    editIconUI.setAttribute("userid", snap.key);
    editIconUI.addEventListener("click", editButtonClicked) // Append after li.innerHTML = value.name 
    $li.append(editIconUI);
    // delete icon 
    let deleteIconUI = document.createElement("span");
    deleteIconUI.class = "delete-user";
    deleteIconUI.innerHTML = " ☓";
    deleteIconUI.setAttribute("userid", snap.key);
    deleteIconUI.addEventListener("click", deleteButtonClicked) 
    $li.append(deleteIconUI);

    userListUI.append($li);
});

function comClicked(e) {

	var userID = e.target.getAttribute("child-key");

	const comRef = dbRef.child('communications/' + userID);
	const commInUI = document.getElementById("comm-in");

	commInUI.innerHTML = ""

	comRef.on("child_added", snap => {

		var $p = document.createElement("p");
		$p.innerHTML = snap.key  + " - " +  snap.val()
		commInUI.append($p);

	});

}
/* Access reminders document */
remRef.on("child_added", snap => {

	let reminder = snap.val();
    console.log("database snapshot of reminders", reminder);

	let $li = document.createElement("li");
	$li.innerHTML = reminder.time_before;
	$li.setAttribute("child-key", snap.key);
	$li.addEventListener("click", remClicked);
    // edit icon 
    let editIconUI = document.createElement("span");
    editIconUI.class = "edit-user";
    editIconUI.innerHTML = " ✎";
    editIconUI.setAttribute("userid", snap.key);
    editIconUI.addEventListener("click", editButtonClicked) // Append after li.innerHTML = value.name 
    $li.append(editIconUI);
    // delete icon 
    let deleteIconUI = document.createElement("span");
    deleteIconUI.class = "delete-user";
    deleteIconUI.innerHTML = " ☓";
    deleteIconUI.setAttribute("userid", snap.key);
    deleteIconUI.addEventListener("click", deleteButtonClicked) 
    $li.append(deleteIconUI);

    userListUI.append($li);
});


function remClicked(e) {

	var userID = e.target.getAttribute("child-key");

	const remRef = dbRef.child('reminders/' + userID);
	const remInUI = document.getElementById("rem-in");

	remInUI.innerHTML = ""

	remRef.on("child_added", snap => {

		var $p = document.createElement("p");
		$p.innerHTML = snap.key  + " - " +  snap.val()
		remInUI.append($p);

	});

}

const addUserBtnUI = document.getElementById("add-user-btn"); 
addUserBtnUI.addEventListener("click", addUserBtnClicked);

function addUserBtnClicked() {
    const usersRef = dbRef.child('users');
    const addUserInputsUI = document.getElementsByClassName("user-input");
    // this object will hold the new user information 
    let newUser = {};
    // loop through View to get the data for the model 
    for (let i = 0, len = addUserInputsUI.length; i < len; i++) {
        let key = addUserInputsUI[i].getAttribute('data-key');
        let value = addUserInputsUI[i].value;
        newUser[key] = value;
    };

    usersRef.push(newUser, function () {
        console.log("data has been inserted");
    })
};

function editButtonClicked (e) {
    // show the Edit User Form 
    document.getElementById('edit-user-module').style.display = "block";
    //set user id to the hidden input field 
    document.querySelector(".edit-userid").value = e.target.getAttribute("userid");
    const userRef = dbRef.child('users/' + e.target.getAttribute("userid"));
    // set data to the user field 
    const editUserInputsUI = document.querySelectorAll(".edit-user-input");
    userRef.on("value", snap => {
        for (var i = 0, len = editUserInputsUI.length; i < len; i++) {
            var key = editUserInputsUI[i].getAttribute("data-key");
            editUserInputsUI[i].value = snap.val()[key];
        }
    });
};

const saveBtn = document.querySelector("#edit-user-btn"); 
saveBtn.addEventListener("click", saveUserBtnClicked);

function saveUserBtnClicked() {
    const userID = document.querySelector(".edit-userid").value;
    const userRef = dbRef.child('users/' + userID);
    var editedUserObject = {};
    const editUserInputsUI = document.querySelectorAll(".edit-user-input");
    editUserInputsUI.forEach(function (textField) {
        let key = textField.getAttribute("data-key");
        let value = textField.value;
        editedUserObject[textField.getAttribute("data-key")] = textField.value
    });

	userRef.update(editedUserObject);
    document.getElementById('edit-user-module').style.display = "none";
}

function deleteButtonClicked(e) {
    e.stopPropagation();
    const userID = e.target.getAttribute("userid");
    const userRef = dbRef.child('users/' + userID);
    userRef.remove()
}