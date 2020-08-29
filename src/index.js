import { Communication } from "./objectTemplate";
import "./style.css";
import moment from "moment";
import Swal from "sweetalert2";

// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from "firebase/app";

// If you enabled Analytics in your project, add the Firebase SDK for Analytics
import "firebase/analytics";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/database";

/* Initialize firebase */
const firebaseConfig = {
  apiKey: "AIzaSyAaFDkvt6AA7fvKOLI32ptXNgfkkOyDGN4",
  authDomain: "goldtone-793f5.firebaseapp.com",
  databaseURL: "https://goldtone-793f5.firebaseio.com",
  projectId: "goldtone-793f5",
  storageBucket: "goldtone-793f5.appspot.com",
  messagingSenderId: "269567687183",
  appId: "1:269567687183:web:e32eda4a67c39e83c8017a",
  measurementId: "G-313ZP19KY1"
};

firebase.initializeApp(firebaseConfig);
/* basic service worker, will worry about this later 
window.onload = () => {
    'use strict';

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
                 .register('./sw.js');
    }
} */
let communication_types = ['Email', 'Text', 'Phone Call', 'Facebook', 'Instagram', 'Card', 'Handout', 'Poster','Other'];

// Grab references to database documents 
const dbRef = firebase.database().ref();

/* Get reference to Reminders document in database */
const remRef = dbRef.child('reminders');


/* TODO: add event listner and function to handle adding goal */


/* --------- */ /* Communication Related Events and Functions */ /* --------- */

/* Get reference to Communications document in database */
const comRef = dbRef.child('communications');


/* ---------- Functions ---------- */

/* When communication listed in UI is clicked get database reference and lauch modal */
function comClicked(e) {
  /* Get database reference */
  var comId = e.target.getAttribute("id");
  const comRef = dbRef.child('communications/' + comId);

  /* Build communication object from database to send to modal */
  let comObj = {};
  comRef.on("child_added", snap => {
    comObj[snap.key] = snap.val();
  });

  /* launch the modal */
  commModalLaunch("list_launch", comId, comObj);
};


/* ---------- Event Listeners ---------- */

/* Listen for new communications in database then update UI */
comRef.on("child_added", snap => {
  const commIn = document.getElementById("comm-in");
  let communication = snap.val();
  //console.log("database snapshot of communications", communication);

	let $li = document.createElement("li");
	$li.innerHTML = communication.subject;
	$li.setAttribute("id", snap.key);
	$li.addEventListener("click", comClicked);

  commIn.append($li);
});

/* TODO: need to add on child updated listener to update ui on updates */

/* Listen for deleted communications in database then update UI */
comRef.on("child_removed", snap => {
  const removedComUI = document.getElementById(snap.key);
  removedComUI.remove(removedComUI);
});


/* ------------------- */ /* Modal for Communications */ /* ----------------- */

// Set communication type dropdown options from list defined in objectTemplate.js 
const comTypeUI = document.getElementById("comm-type-modal");
let options = communication_types;
for (let i in options){
  let opElem = document.createElement("option");
  let opText = options[i]
  opElem.setAttribute("value", `${opText}`);
  opElem.innerHTML = `${opText}`;
  comTypeUI.appendChild(opElem);
};

/* Get the modal element for easy access later */
      // Note: on tui calendar the modal is opened via the beforeCreateSchedule event
const commModalUI = document.getElementById("comm-modal"); 


/* ---------- Functions ---------- */

/* Function to Launch modal */
      // Note: Can take in an event from calendar
function commModalLaunch (event, comId='', comObj={}) {
  
  // If launching from an old communication fill the modal with values 
  if (comId != '') {
    const commId = document.getElementById("comm-id");
    const goalId = document.getElementById("linked-goal-id");
    const remId = document.getElementById("linked-reminders-id");
    const type = document.getElementById("comm-type-modal");
    const subject = document.getElementById("comm-subject-modal");
    const toWhom = document.getElementById("comm-to-whom-modal");
    const fromWhom = document.getElementById("comm-from-whom-modal");
    const date = document.getElementById("comm-date-modal");
    const sent = document.getElementById("comm-sent-modal");
        
    commId.value = comId;
    goalId.value = comObj["goal_key"];
    remId.value = comObj["reminder_keys"];
    type.value = comObj["com_type"];
    subject.value = comObj["subject"];
    toWhom.value = comObj["to_whom"];
    fromWhom.value = comObj["from_whom"];
    let momDate = moment(comObj["date"], 'ddd MMM DD YYYY HH:mm:ss'); // Adjust to current timezone from saved timezone
    date.value = momDate.format('YYYY-MM-DD'); // format for display in date chooser
    sent.value = comObj["sent"];
  } else if (comId == '') {
    /* Hide delete button because we are launching to add a new communication */
    document.getElementById('comm-delete-modal').style.display = "none";
    document.getElementById('comm-delete-modal').style.position = "absolute";
  }   
  // Display modal
  commModalUI.style.display = "block";
};

/* Function to Close modal */
function closeModal (){
  // Close modal
  commModalUI.style.display = "none";
  resetModal();
}

/* Function to reset Modal after closing */
function resetModal () {
  // Refresh calendar 
  //calendar.render();

  // Get modal fields
  const commId = document.getElementById("comm-id");
  const goalId = document.getElementById("linked-goal-id");
  const remId = document.getElementById("linked-reminders-id");
  const type = document.getElementById("comm-type-modal");
  const subject = document.getElementById("comm-subject-modal");
  const toWhom = document.getElementById("comm-to-whom-modal");
  const fromWhom = document.getElementById("comm-from-whom-modal");
  const date = document.getElementById("comm-date-modal");
  const sent = document.getElementById("comm-sent-modal");
   
  // Reset modal
  commId.value = '';
  goalId.value = '';
  remId.value = '';
  type.options.selectedIndex = 0;
  subject.value = '';
  toWhom.value = '';
  fromWhom.value = '';
  date.value = '';
  sent.options.selectedIndex = 0;       
  // Reset backgroup of date and description incase they had been changed on unfilled attempt to save
  date.style.backgroundColor = 'rgb(245, 245,230)';
  subject.style.backgroundColor = 'rgb(245, 245,230)';
  // Resent delete button if hidden when launching modal from add button
  document.getElementById('comm-delete-modal').style.display = "block";
  document.getElementById('comm-delete-modal').style.position = "initial";
  // Reset modal if it was opened from an communication connected with a goal 
  /*type.disabled = false;
  description.readOnly = false;
  date.readOnly = false;*/
};

/* Function to save communication from modal. Then update database. */
function commModalSave (){
  const commId = document.getElementById("comm-id");
  const goalId = document.getElementById("linked-goal-id");
  const remId = document.getElementById("linked-reminders-id");
  const type = document.getElementById("comm-type-modal");
  const subject = document.getElementById("comm-subject-modal");
  const toWhom = document.getElementById("comm-to-whom-modal");
  const fromWhom = document.getElementById("comm-from-whom-modal");
  const date = document.getElementById("comm-date-modal");
  const sent = document.getElementById("comm-sent-modal");
  // Grab reference to database document
  const comRef = dbRef.child('communications');
  console.log('type', type.value, '\nsubject', subject.value, '\nto whom', toWhom.value, '\nfrom whom', fromWhom.value, '\ndate', date.value, '\nsent', sent.value);
  // Make sure date and description are filled out 
  if (date.value != '' && subject.value != ''){
    // Turn date into moment object to format for adding or updating avenue in initiative object and ui
    let momDate = moment(date.value, 'YYYY-MM-DD', true); 
    // If no id provided assume this is a new communication
    if (commId.value == '' || commId.value == undefined ){
      // New Communication object 
      const newComm = new Communication(type.value, subject.value, toWhom.value, fromWhom.value, momDate.toString(), sent.value, goalId.value, remId.value); // Convert date to String to preserve timezone
      console.log("new communication", newComm);
      // Add communication to database 
      comRef.push(newComm, function () {
        console.log("data has been inserted");
      });
    } else {
      // Update communication in database 
      const updateComm = new Communication(type.value, subject.value, toWhom.value, fromWhom.value, momDate.toString(), sent.value, goalId.value, remId.value); // Convert date to String to preserve timezone
      console.log("communication to update", updateComm);
      const comDb = comRef.child(commId.value);
      comDb.update(updateComm);

      // Update Schedule object on calendar 
      /*calendar.updateSchedule(aveId.value, '1', {
        title: description.value,
        start: momDate.format('ddd DD MMM YYYY HH:mm:ss'),
        end:  momDate.format('ddd DD MMM YYYY HH:mm:ss')
      });*/
    }; 
    // Close modal
    commModalUI.style.display = "none";
    resetModal();
  } else { // Change backgroup of date or description if not filled out 
      if (date.value == ''){
        date.style.backgroundColor = 'rgb(225, 160, 140)';
      };
      if (subject.value == ''){
        subject.style.backgroundColor = 'rgb(225, 160, 140)';
      };
  };
};

// Function to delete communication from modal. Then update database */
function commModalDelete (){
  // Launch confirmation popup
  Swal.fire({
    title: 'Are you sure?',
    text: 'You won\'t be able to undo this!?', 
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#8bcbe0',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'No, Cancel!',
    cancelButtonColor: '#d33'
  })
  .then(function (value) {
    if (value.isConfirmed == false) { // Escape deletion 
      return
    } else { // Proceed with deletion 
      // Get id from DOM
      const commId = document.getElementById("comm-id");
      // Remove communication from UI
      /*let messAve = document.getElementById(`avenue${aveId.value}`);
      messAve.parentElement.removeChild(messAve);*/

      // Delete Schedule object on calendar 
      /*calendar.deleteSchedule(aveId.value, '1');*/
      
      // Remove communication from database 
      const commRef = dbRef.child('communications/' + commId.value);
      commRef.remove();
      
      // Close modal
      commModalUI.style.display = "none";
      resetModal();
  
      return
    }; 
  });
};

/* ---------- Event listeners ---------- */

/* Attach event listener to X button to close modal */
document.getElementsByClassName("close")[0].addEventListener("click", closeModal);

/* When the user clicks anywhere outside of the modal, close it */
window.addEventListener('click', function(event) {
  if (event.target == commModalUI) {
    // Close modal
    closeModal();
  };
});

/* When the user clicks anywhere outside of the modal, close it */
window.addEventListener('touchend', function(event) {
  if (event.target == commModalUI) {
    // Close modal
    closeModal();
  };
});

/* Event listener on modal save button */
document.getElementById('comm-save-modal').addEventListener("click", commModalSave );
      
/* Event listener on modal delete button */
document.getElementById('comm-delete-modal').addEventListener("click", commModalDelete );

/* Event listener on add button */
document.getElementById("add-comm-btn").addEventListener("click", commModalLaunch);



/* ------------ */ /* Reminder Related Events and Functions */ /* ----------- */

/* Access reminders document */
remRef.on("child_added", snap => {
  const userListUI = document.getElementById("userList");
	let reminder = snap.val();
  //console.log("database snapshot of reminders", reminder);

	let $li = document.createElement("li");
	$li.innerHTML = reminder.time_before;
	$li.setAttribute("id", snap.key);
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

	var userID = e.target.getAttribute("id");

	const remRef = dbRef.child('reminders/' + userID);
	const remInUI = document.getElementById("rem-in");

	remInUI.innerHTML = ""

	remRef.on("child_added", snap => {

		var $p = document.createElement("p");
		$p.innerHTML = snap.key  + " - " +  snap.val()
		remInUI.append($p);

	});

}





/* Example functions from tutoral, need removed later */
function addCommBtnClicked() {
    const comRef = dbRef.child('communications');
    const addComInputsUI = document.getElementsByClassName("user-input");
    // this object will hold the new user information 
    let newUser = {};
    // loop through View to get the data for the model 
    for (let i = 0, len = addComInputsUI.length; i < len; i++) {
        let key = addComInputsUI[i].getAttribute('data-key');
        let value = addComInputsUI[i].value;
        newUser[key] = value;
    };

    comRef.push(newUser, function () {
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

/*
 const commRef = dbRef.child('communications/' + commId.value);
      // set data to the user field 
const comInputsUI = document.getElementsByClassName("comm-modal-input");

commRef.on("value", snap => {
  for (var i = 0, len = comInputsUI.length; i < len; i++) {
      var key = comInputsUI[i].getAttribute("data-key");
      console.log(key)
      comInputsUI[i].value = snap.val()[key];
  }
});*/