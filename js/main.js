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

/* TODO: add event listner and function to handle adding goal */

/* Add a new communication through modal popup */
// Get the modal and button that opens it from message manager tab
      // Note: on the initaitive tab the modal is opened via the beforeCreateSchedule event
const addCommBtnUI = document.getElementById("add-comm-btn"); 
const commModalUI = document.getElementById("comm-modal");  
addCommBtnUI.addEventListener("click", addCommModalLaunch);

// Launch the modal with basic settings. Can take in a date from calendar event to display on creation
function addCommModalLaunch (calEvent='', launchType='') {
// will need to handle displaying and editing commmunications later 
  // Display modal
  commModalUI.style.display = "block";
};
      
// Get the save button from modal 
document.getElementById('comm-save-modal').addEventListener("click", commModalSave );
      
// Save contents from the modal. Then update Initiative object, Message Manager tab and Initiative tab
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
  console.log('type', type.value, '\nsubject', subject.value, '\nto whom', toWhom.value, '\nfrom whom', fromWhom.value, '\ndate', date.value, '\nsent', sent.value);
  // Make sure date and description are filled out 
  if (date.value != '' && subject.value != ''){
    // Turn date into moment object to format for adding or updating avenue in initiative object and ui
    let momDate = moment(date.value, 'YYYY-MM-DD', true); 
    // If no id provided assume this is a new communication
          if (commId.value == '' || commId.value == undefined ){
            // Add avenue to initiative object, initative tab and message manager tab. 
            addAve('modalAdd', '', 'avenueIn', sent.checked, type.value, description.value, person.value, momDate.toString()); // use Moment date format
             // Save everything to main
             let ipcInit = currentInitiative.pack_for_ipc();
             ipc.send('save', currentInitiativeId, ipcInit);
          } else {
            // Update Initiative object 
            let initAve = currentInitiative.avenues.get(aveId.value); // Avenue object from the initiative object
            initAve.avenue_type = type.value;
            initAve.sent = sent.checked;
            initAve.description = description.value;
            initAve.person = person.value;
            initAve.change_date(momDate.toString());
            // Update Message manager tab
            let guiAve = document.getElementById(`avenue${aveId.value}`); // Avenue object from the ui
          
            guiAve.children[0].value = type.value; // Type
            guiAve.children[4].children[0].checked = sent.checked; // Sent
            guiAve.children[5].value = description.value; // Description
            guiAve.children[6].value = person.value; // Person
            guiAve.children[7].value = momDate.format('YYYY-MM-DD');
            // Update Schedule object on calendar 
            calendar.updateSchedule(aveId.value, '1', {
              title: description.value,
              start: momDate.format('ddd DD MMM YYYY HH:mm:ss'),
              end:  momDate.format('ddd DD MMM YYYY HH:mm:ss')
            });
            // Save everything to main
            let ipcInit = currentInitiative.pack_for_ipc();
            ipc.send('save', currentInitiativeId, ipcInit);
          };
          // Close modal
          commModalUI.style.display = "none";
          // Reset modal
          sent.checked = false;
          let i, L= type.options.length - 1;
          for(i = L; i >= 0; i--) {
            type.remove(i);
          };
          date.value = ''; 
          description.value = '';
          person.value = '';
          aveId.value = '';
          // Reset backgroup of date and description incase they had been changed on unfilled attempt to save
          date.style.backgroundColor = 'rgb(245, 245,230)';
          description.style.backgroundColor = 'rgb(245, 245,230)';
          // Reset modal if it was opened from an avenue connected with a goal 
          type.disabled = false;
          description.readOnly = false;
          date.readOnly = false;
          document.getElementById('aveDeleteModal').style.display = "block";
          document.getElementById('aveDeleteModal').style.position = "initial";
  } else { // Change backgroup of date or description if not filled out 
      if (date.value == ''){
        date.style.backgroundColor = 'rgb(225, 160, 140)';
      };
      if (subject.value == ''){
        subject.style.backgroundColor = 'rgb(225, 160, 140)';
      };
  };
};
    
// Get the delete button from modal 
document.getElementById('comm-delete-modal').addEventListener("click", commModalDelete );
  
// Delete contents from the modal. Then update Initiative object, Message Manager tab and Initiative tab
function commModalDelete (){
  swal({
    title: 'Deleting Avenue',
    text: 'Are you sure you want to delete your Avenue?', 
    icon: 'warning',
    buttons: ['Cancel', 'Yes'],
    dangerMode: true
  })
  .then(function (value) {
    if (value == null) { // Escape deletion 
      return
    } else { // Proceed with deletion 
      // Get id from DOM
      let aveId = document.getElementById('aveIdModal');
      // Remove avenue from message manager UI
      let messAve = document.getElementById(`avenue${aveId.value}`);
      messAve.parentElement.removeChild(messAve);
      // Delete Schedule object on calendar 
      calendar.deleteSchedule(aveId.value, '1');
      // Remove avenue from Initiative object 
      let id = aveId.value;
      currentInitiative.avenues.delete(id); // Take only the number off of the end of the ui id
      // Send updates to main
      let ipcInit = currentInitiative.pack_for_ipc();
      ipc.send('save', currentInitiativeId, ipcInit);
        
      // Close modal
      commModalUI.style.display = "none";
      // Reset modal
      aveId.value = '';
      document.getElementById('aveSentModal').checked = false; // Sent
      let types = document.getElementById('aveDropModal'); // Type
      let i, L= types.options.length - 1;
      for(i = L; i >= 0; i--) {
        types.remove(i);
      };
      document.getElementById('avePersModal').value = ''; // Person
      document.getElementById('aveDateModal').value = ''; // Date Value
      document.getElementById('aveDescModal').value = ''; // Description Value
      // Reset backgroup of date and description incase they had been changed on unfilled attempt to save
      document.getElementById('aveDateModal').style.backgroundColor = 'rgb(245, 245,230)'; // Date Style
      document.getElementById('aveDescModal').style.backgroundColor = 'rgb(245, 245,230)'; // Description Style
      return
    }; 
  });
};

// Get the <span> element that closes the modal and attach listener
document.getElementsByClassName("close")[0].addEventListener("click", function() {
  commModalUI.style.display = "none";
  // Refresh calendar 
  //calendar.render();
  // Reset modal
  let sent = document.getElementById('aveSentModal');
  let type = document.getElementById('aveDropModal');
  let date = document.getElementById('aveDateModal');
  let description = document.getElementById('aveDescModal');
  let person = document.getElementById('avePersModal');
  let aveId = document.getElementById('aveIdModal');
  sent.checked = false;
  let i, L= type.options.length - 1;
  for(i = L; i >= 0; i--) {
    type.remove(i);
  };
  date.value = ''; 
  description.value = '';
  person.value = '';
  aveId.value = '';
  // Reset backgroup of date and description incase they had been changed on unfilled attempt to save
  date.style.backgroundColor = 'rgb(245, 245,230)';
  description.style.backgroundColor = 'rgb(245, 245,230)';
  // Reset modal if it was opened from an avenue connected with a goal 
  type.disabled = false;
  description.readOnly = false;
  date.readOnly = false;
  document.getElementById('aveDeleteModal').style.display = "block";
  document.getElementById('aveDeleteModal').style.position = "initial";
});

// When the user clicks anywhere outside of the modal, close it
window.addEventListener('click', function(event) {
  if (event.target == commModalUI) {
    commModalUI.style.display = "none";
    // Refresh calendar 
    //calendar.render();
    // Reset modal
    let sent = document.getElementById('aveSentModal');
    let type = document.getElementById('aveDropModal');
    let date = document.getElementById('aveDateModal');
    let description = document.getElementById('aveDescModal');
    let person = document.getElementById('avePersModal');
    let aveId = document.getElementById('aveIdModal');
    sent.checked = false;
    let i, L= type.options.length - 1;
    for(i = L; i >= 0; i--) {
      type.remove(i);
    };
    date.value = ''; 
    description.value = '';
    person.value = '';
    aveId.value = '';
    // Reset backgroup of date and description incase they had been changed on unfilled attempt to save
    date.style.backgroundColor = 'rgb(245, 245,230)';
    description.style.backgroundColor = 'rgb(245, 245,230)';
    // Reset modal if it was opened from an avenue connected with a goal 
    type.disabled = false;
    description.readOnly = false;
    date.readOnly = false;
    document.getElementById('aveDeleteModal').style.display = "block";
    document.getElementById('aveDeleteModal').style.position = "initial";
  };
});  


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