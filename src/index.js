import { Communication, Goal } from "./objectTemplate";
import "./style.css";
import "../node_modules/firebaseui/dist/firebaseui.css" // Stylesheet for firbase ui
import moment from "moment";
import Swal from "sweetalert2";

// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from "firebase/app";

// If you enabled Analytics in your project, add the Firebase SDK for Analytics
import "firebase/analytics";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/database";
import "firebaseui";

/* basic service worker, will worry about this later 
window.onload = () => {
    'use strict';

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
                 .register('./sw.js');
    }
} */

let communication_types = ['Email', 'Text', 'Phone Call', 'Facebook', 'Instagram', 'Card', 'Handout', 'Poster','Other'];


/*------------------------*/ /* Initialize Firebase */ /*----------------------*/
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


/*---------------------*/ /* Initialize Firebase Auth */ /*--------------------*/
var uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      var user = authResult.user;
      var credential = authResult.credential;
      var isNewUser = authResult.additionalUserInfo.isNewUser;
      var providerId = authResult.additionalUserInfo.providerId;
      var operationType = authResult.operationType;
      console.log(user, '\ncredential', credential, '\n Is new user', isNewUser, '\nprovider id', providerId, '\noperation type', operationType)
      // Do something with the returned AuthResult.
      loadFromDatabase();
      // Return type determines whether we continue the redirect automatically
      // or whether we leave that to developer to handle.
      return true;
    },
    signInFailure: function(error) {
      // Some unrecoverable error occurred during sign-in.
      // Return a promise when error handling is completed and FirebaseUI
      // will reset, clearing any UI. This commonly occurs for error code
      // 'firebaseui/anonymous-upgrade-merge-conflict' when merge conflict
      // occurs. Check below for more details on this.
      return handleUIError(error);
    }
  },
  credentialHelper: firebaseui.auth.CredentialHelper.NONE,
  signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    //firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    //firebase.auth.TwitterAuthProvider.PROVIDER_ID,
    //firebase.auth.GithubAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    //firebase.auth.PhoneAuthProvider.PROVIDER_ID,
    //firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
  ],
  signInFlow: 'popup',
  // tosUrl and privacyPolicyUrl accept either url string or a callback
  // function.
  // Terms of service url/callback.
  tosUrl: '<your-tos-url>',
  // Privacy policy url/callback.
  privacyPolicyUrl: function() {
    window.location.assign('<your-privacy-policy-url>');
  }
};

// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());
// The start method will wait until the DOM is loaded.
//ui.start('#firebaseui-auth-container', uiConfig);
//if (ui.isPendingRedirect()) {
  //ui.start('#firebaseui-auth-container', uiConfig);
//}


/**
 * initApp handles setting up UI event listeners and registering Firebase auth listeners:
 *  - firebase.auth().onAuthStateChanged: This listener is called when the user is signed in or
 *    out, and that is where we update the UI.
 */

const initApp = function() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      var displayName = user.displayName;
      var email = user.email;
      var emailVerified = user.emailVerified;
      var photoURL = user.photoURL;
      var uid = user.uid;
      var phoneNumber = user.phoneNumber;
      var providerData = user.providerData;
      user.getIdToken().then(function(accessToken) {
        document.getElementById('sign-in-status').textContent = 'Signed in';
        document.getElementById('sign-in-screen').style.display = 'none';
        document.getElementById('app-content').style.display = 'flex';
        document.getElementById('account-details').textContent = JSON.stringify({
          displayName: displayName,
          email: email,
          emailVerified: emailVerified,
          phoneNumber: phoneNumber,
          photoURL: photoURL,
          uid: uid,
          accessToken: accessToken,
          providerData: providerData
        }, null, '  ');
      });
      
    } else {
      // User is signed out.
      document.getElementById('app-content').style.display = 'none';
      document.getElementById('sign-in-screen').style.display = 'flex';
      document.getElementById('sign-in-status').textContent = 'Signed out';
      document.getElementById('account-details').textContent = 'null';
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  }, function(error) {
    console.log(error);
  });

  /* Add event listenter to sign out button to sign out on click */
  document.getElementById("sign-out").addEventListener("click", function (){
    firebase.auth().signOut();
    document.getElementById('goal-in').innerHTML = '';
    document.getElementById('comm-in').innerHTML = '';
  })
};

window.addEventListener('load', function() {
  initApp();
});


/* ----------------- */ /* Initialize Firebase Database */ /* --------------- */
// Grab references to database documents 
const dbRef = firebase.database().ref();

/* Get reference to Reminders document in database */
const remRef = dbRef.child('reminders');
const goalRef = dbRef.child('goals');
const commRef = dbRef.child('communications');

/* ---------- Common Database functions ---------- */

function loadFromDatabase () {
  /* Get all children from goals document and place in UI */
  goalRef.on("child_added", snap => {
    const goalIn = document.getElementById("goal-in");
    let goal = snap.val();
    //console.log("database snapshot of goals", goal);

    let goalUi = document.createElement("div");
    goalUi.innerHTML = goal.name;
    goalUi.setAttribute("id", snap.key);
    goalUi.addEventListener("click", goalClicked);

    goalIn.append(goalUi);
  });

  /* Get all children from communications document and place in UI */
  const comRef = dbRef.child('communications');
  comRef.on("child_added", snap => {
    let communication = snap.val();
    //console.log("database snapshot of communications", communication);

    generateComUi(snap.key, communication.subject)
  });
};


/* -------------- */ /* Goal Related Events and Functions */ /* -------------- */

/* ---------- Functions ---------- */

/*  Generate the ui object for a goal */
function generateGoalUi (key, subject) {
  const goalIn = document.getElementById("goal-in");

  let goalUi = document.createElement("div");
  goalUi.setAttribute("id", key);
  goalUi.addEventListener("click", goalClicked);

  let name = document.createElement('span');
  name.innerHTML = subject;
  goalUi.append(name);

  let arrow = document.createElement('span');
  arrow.innerHTML = '>';
  goalUi.append(arrow);

  goalIn.append(goalUi); 
};

/* When goal listed in UI is clicked get database reference and lauch modal */
function goalClicked(e) {
  /* Get database reference */
  var goalId = this.getAttribute("id");
  //console.log(goalId)
  const goalRef = dbRef.child('goals/' + goalId);

  /* Build goal object from database to send to modal */
  let goalObj = {};
  goalRef.on("child_added", snap => {
    goalObj[snap.key] = snap.val();
  });
  console.log('loaded goal', goalObj)
  /* launch the modal */
  goalModalLaunch("list_launch", goalId, goalObj);
};


/* ---------- Event Listeners ---------- */

/* Listen for new goals in database then update UI */
goalRef.on("child_added", snap => {
  const goalIn = document.getElementById("goal-in");
  let goal = snap.val();
  //console.log("database snapshot of goals", goal);

  generateGoalUi(snap.key, goal.name);

});

/* Listen for updates and update UI */
goalRef.on("child_changed", snap => {
  let updatedVal = snap.val();
  document.getElementById(snap.key).children[0].innerHTML = updatedVal.name;
});

/* Listen for deleted communications in database then update UI */
goalRef.on("child_removed", snap => {
  const removedGoalUI = document.getElementById(snap.key);
  removedGoalUI.remove(removedGoalUI);
});


/* ------------------------ */ /* Modal for Goals */ /* --------------------- */

// Set communication type dropdown options from list defined in communication_types variable
const goalTypeUI = document.getElementById("goal-type-modal");
for (let i in communication_types){
  let opElem = document.createElement("option");
  let opText = communication_types[i]
  opElem.setAttribute("value", `${opText}`);
  opElem.innerHTML = `${opText}`;
  goalTypeUI.appendChild(opElem);
};

/* Get the modal element for easy access later */
const goalModalUI = document.getElementById("goal-modal"); 


/* ---------- Functions ---------- */

/* Use goal frequency to generate dates only */
function generateDates(start, until, freq, denomination){
  let startManipulate = start.clone();
  let dates = [];
  while ( startManipulate.isBefore(until) || startManipulate.isSame(until)) {
     //console.log('start', start, '\nmanipulated start', startManipulate, '\nuntil', until);
     // Generate dates from the goal's frequency
     dates.push(startManipulate.toString());
     startManipulate.add(freq, denomination);
     //console.log('dates', dates);
  };
  return dates;
};

/* Use goal frequency to generate dates and add avenues to initiative object */
function generateCommunicationObjs(type, subject, to_whom, from_whom, dates, goal_key, reminder_key) {
  /* Take in list of dates and build communication objects */ 
  let communications = [];
  const sent = 'no'; // set progress to no 

  for (let date in dates) {
  let newCommunication = new Communication(type, subject, to_whom, from_whom, dates[date], sent, goal_key, reminder_key);
  
  communications.push(newCommunication);
  };

  return communications; // Return array of objects 
};

/* Function to Launch modal */
function goalModalLaunch (event, goalId='', goalObj={}) {
  
  // If launching from an old communication fill the modal with values 
  if (goalId != '') {
    const goalIdUi = document.getElementById("goal-id"); 
    const commId = document.getElementById("linked-comm-id");
    const remId = document.getElementById("goal-linked-reminders-id");  
    const name = document.getElementById("goal-name-modal");
    const type = document.getElementById("goal-type-modal");
    const subject = document.getElementById("goal-subject-modal");
    const toWhom = document.getElementById("goal-to-whom-modal");
    const fromWhom = document.getElementById("goal-from-whom-modal");
    const startDate = document.getElementById("goal-start-date-modal");
    const untilDate = document.getElementById("goal-until-date-modal");          
    const freq = document.getElementById("goal-frequency-modal");  
    const denomination = document.getElementById("goal-frequency-denomination-modal");            
    const reminder = document.getElementById("goal-reminder-modal");  
    const reminderDenomination = document.getElementById("goal-reminder-denomination-modal");           

    goalIdUi.value = goalId; 
    commId.value = goalObj["comm_keys"];
    remId.value = goalObj["reminder_keys"];
    name.value = goalObj["name"];
    type.value = goalObj["type"];
    subject.value = goalObj["subject"];
    toWhom.value = goalObj["to_Whom"];
    fromWhom.value = goalObj["from_whom"];
    let momStart = moment(goalObj["start_date"], 'ddd MMM DD YYYY HH:mm:ss'); // Adjust to current timezone from saved timezone
    startDate.value = momStart.format('YYYY-MM-DD');
    let momUntil = moment(goalObj["until_date"], 'ddd MMM DD YYYY HH:mm:ss');
    untilDate.value = momUntil.format('YYYY-MM-DD');          
    freq.value = goalObj["frequency"]; 
    denomination.value = goalObj["freq_denomination"];           
    reminder.value = goalObj["reminder"]; 
    reminderDenomination.value = goalObj["reminder_denomination"]; 
  } else if (goalId == '') {
    /* Hide delete button because we are launching to add a new goal */
    document.getElementById('goal-delete-modal').style.display = "none";
    document.getElementById('goal-delete-modal').style.position = "absolute";
  }   
  // Display modal
  goalModalUI.style.display = "block";
};

/* Function to Close modal */
function goalCloseModal (){
  // Close modal
  goalModalUI.style.display = "none";
  goalResetModal();
};

/* Function to reset Modal after closing */
function goalResetModal () {
  // Refresh calendar 
  //calendar.render();

  // Get modal fields
  const goalId = document.getElementById("goal-id"); 
  const commId = document.getElementById("linked-comm-id");
  const remId = document.getElementById("goal-linked-reminders-id");  
  const name = document.getElementById("goal-name-modal");
  const type = document.getElementById("goal-type-modal");
  const subject = document.getElementById("goal-subject-modal");
  const toWhom = document.getElementById("goal-to-whom-modal");
  const fromWhom = document.getElementById("goal-from-whom-modal");
  const startDate = document.getElementById("goal-start-date-modal");
  const untilDate = document.getElementById("goal-until-date-modal");          
  const freq = document.getElementById("goal-frequency-modal");  
  const denomination = document.getElementById("goal-frequency-denomination-modal");            
  const reminder = document.getElementById("goal-reminder-modal");  
  const reminderDenomination = document.getElementById("goal-reminder-denomination-modal");    
   
  // Reset modal
  goalId.value = ''; 
  commId.value = '';
  remId.value = '';  
  name.value = ''; 
  type.options.selectedIndex = 0;
  subject.value = ''; 
  toWhom.value = ''; 
  fromWhom.value = ''; 
  startDate.value = ''; 
  untilDate.value = '';   
  freq.value = 1;   
  denomination.options.selectedIndex = 0;            
  reminder.value = 1;   
  reminderDenomination.options.selectedIndex = 0;
     
  // Reset backgroup of name, subject, start date, and until date incase they had been changed on unfilled attempt to save
  name.style.backgroundColor = 'rgb(245, 245,230)';
  subject.style.backgroundColor = 'rgb(245, 245,230)';
  startDate.style.backgroundColor = 'rgb(245, 245,230)';
  untilDate.style.backgroundColor = 'rgb(245, 245,230)';

  // Resent delete button if hidden when launching modal from add button
  document.getElementById('goal-delete-modal').style.display = "block";
  document.getElementById('goal-delete-modal').style.position = "initial";
  // Reset modal if it was opened from an communication connected with a goal 
  /*type.disabled = false;
  description.readOnly = false;
  date.readOnly = false;*/
};

/* Function to save communication from modal. Then update database. */
function goalModalSave (){
  const goalId = document.getElementById("goal-id"); 
  const commId = document.getElementById("linked-comm-id");
  const remId = document.getElementById("goal-linked-reminders-id");  
  const name = document.getElementById("goal-name-modal");
  const type = document.getElementById("goal-type-modal");
  const subject = document.getElementById("goal-subject-modal");
  const toWhom = document.getElementById("goal-to-whom-modal");
  const fromWhom = document.getElementById("goal-from-whom-modal");
  const startDate = document.getElementById("goal-start-date-modal");
  const untilDate = document.getElementById("goal-until-date-modal");          
  const freq = document.getElementById("goal-frequency-modal");  
  const denomination = document.getElementById("goal-frequency-denomination-modal");            
  const reminder = document.getElementById("goal-reminder-modal");  
  const reminderDenomination = document.getElementById("goal-reminder-denomination-modal");    

  console.log('goal id', goalId.value, '\ncomm id', commId.value, '\nreminder id', remId.value, 
              '\nname', name.value, '\ntype', type.value, '\nsubject', subject.value, '\nto whom', toWhom.value, 
              '\nfrom whom', fromWhom.value, '\nstart date', startDate.value, '\nuntil date', untilDate.value, 
              '\nfrequancy', freq.value, '\nfrequancy denomination', denomination.value, '\nreminder', reminder.value,
              '\nreminder denomination', reminderDenomination.value);
  // Make sure name, subject, start date, and until date are filled out 
  if (name.value != '' && subject.value != '' && startDate.value != '' &&  untilDate.value != ''){
    // Turn dates into moment object to save time stamp and for evaluation before being placed in database 
    let momStart = moment(startDate.value, 'YYYY-MM-DD', true); 
    let momUntil = moment(untilDate.value, 'YYYY-MM-DD', true);
    // Make sure that until date is not before start date
    if ( momStart.isSameOrBefore(momUntil) ) {
      // If no id provided assume this is a new goal
      if (goalId.value == '' || goalId.value == undefined ){ 
        // Make sure that id values are not undefined for initial storage in database 
        if (remId.value == undefined) {
          remId.value = '';
        };
        if (commId.value == undefined) {
          commId.value = '';
        };

        /* Create goal object */
        const newGoal = new Goal(name.value, commId.value, remId.value, type.value, subject.value,
                                 toWhom.value, fromWhom.value, momStart.toString(), momUntil.toString(),// Convert date to String to preserve timezone
                                 freq.value, denomination.value, reminder.value, reminderDenomination.value); 
        console.log('new goal obj', newGoal)
        /* Add goal to database */
        let goal = goalRef.push(newGoal, function () {
          console.log("data has been inserted");
        });
        console.log("goal in database", goal);

        /* Generate array of dates for communications */
        const dates = generateDates(momStart, momUntil, freq.value, denomination.value);
        console.log(dates);

        /* Generate communications and then save to database */
        let communications = generateCommunicationObjs(type.value, subject.value, toWhom.value, fromWhom.value, dates, goal.key, remId.value);
        console.log('generated communications', communications);

        let comRefs = [];
        communications.forEach(function (comm) {
          let communication = commRef.push(comm, function () { // Save to database
            //console.log('communications saved');
          });
          comRefs.push(communication.key); // save keys from each communication 
        });

        /* update goal with new communication keys */
        goal.update( {"comm_keys": comRefs} ); 
    
        /* TODO: generate reminders */

      } else { // Update goal in database 
        const updateGoal = new Goal(name.value, commId.value, remId.value, type.value, subject.value,
          toWhom.value, fromWhom.value, momStart.toString(), momUntil.toString(),// Convert date to String to preserve timezone
          freq.value, denomination.value, reminder.value, reminderDenomination.value); 
        console.log("goal to update", updateGoal);
        const goalDb = goalRef.child(goalId.value);
        goalDb.update(updateGoal);

        /* Updated dates from goal frequency */
        const newDates = generateDates(momStart, momUntil, freq.value, denomination.value);
        console.log(newDates);
        console.log(commId.value.length, newDates.length)

        /* If there are more dates than communications add new ones */
        if (commId.value.length < newDates.length) { 
          let dif = newDates.length - commId.value.length; // Get the difference between number of current Avenues and new generated dates
          //console.log('difference of comms and dates', dif);

          /* Update linked communications */
          let i = 0; // To access new dates in proper order from newDates array
          for (let comm in commId.value) { // Update each Communication by id 
            let date = newDates.shift();
            let ref = commRef.child( commId.value[comm] );
            ref.update({            
              "com_type": type.value,
              "subject": subject.value,
              "to_whom": toWhom.value,
              "from_whom": fromWhom.value,
              "date": date, 
              "reminder_keys": reminder.value
            });
    
            // Update Schedule object on calendar 
            /*calendar.updateSchedule(aveId, '2', {
              title: guiGoal.children[3].value,
              start: newDate.format('ddd DD MMM YYYY HH:mm:ss'),
              end:  newDate.format('ddd DD MMM YYYY HH:mm:ss')
            });*/
            ++i;
          };

          /* Add additional Communications and then save to database */  
          i = 0;
          for (dif; dif >0; dif--) {
            let comm = new Communication(type.value, subject.value, toWhom.value, fromWhom.value, newDates[i], goalId.value, remId.value);
  
            let ref = commRef.push(comm, function () { // Save to database
              //console.log('communications saved');
              });
            commId.value.push(ref.key); // save keys from each communication 
            ++i;
          };

          /* Update goal with new linked communications keys */
          goalDb.update({
            "comm_keys": commId.value
          });
          console.log("updated with less comms than needed");

        } else if (commId.value.length > newDates.length) { // If there are more communications than new dates remove the extras 
          // Remove extra Avenues 
          let dif = commId.value.length - newDates.length; // Get the difference between number of current Avenues and new generated dates 
          console.log('difference of comms and dates', dif);

          console.log('before', commId.value);
          // Remove extra linked communications from database 
          for (dif; dif > 0; dif--) {
            let id = commId.value.pop();
            let ref = commRef.child( id );
            ref.remove();
          };
          console.log('after', commId.value);

          /* Update linked communications */
          let i = 0; // To access new dates in proper order from newDates array
          for (let comm in commId.value) { // Update each Communication by id 
            let ref = commRef.child( commId.value[comm] );
            ref.update({            
              "com_type": type.value,
              "subject": subject.value,
              "to_whom": toWhom.value,
              "from_whom": fromWhom.value,
              "date": newDates[i], 
              "reminder_keys": reminder.value
            });

            // Update Schedule object on calendar 
            /*calendar.updateSchedule(aveId, '2', {
              title: guiGoal.children[3].value,
              start: newDate.format('ddd DD MMM YYYY HH:mm:ss'),
              end:  newDate.format('ddd DD MMM YYYY HH:mm:ss')
            });*/
            ++i;
          };

          /* Update goal with new linked communications keys */
          goalDb.update({
            "comm_keys": commId.value
          });
          console.log("updated with more comms than needed");

        } else { // Else if they are equal just update all avenues with new input from ui 
          /* Update linked communications */
          let i = 0; // To access new dates in proper order from newDates array
          for (let comm in commId.value) { // Update each Communication by id 
            let ref = commRef.child( commId.value[comm] );
            ref.update({            
              "com_type": type.value,
              "subject": subject.value,
              "to_whom": toWhom.value,
              "from_whom": fromWhom.value,
              "date": newDates[i], 
              "reminder_keys": reminder.value
            });
            ++i;
          };
          console.log("updated with same number of comms")
        }; 

        // Update Schedule object on calendar 
        /*calendar.updateSchedule(aveId.value, '1', {
          title: description.value,
          start: momDate.format('ddd DD MMM YYYY HH:mm:ss'),
          end:  momDate.format('ddd DD MMM YYYY HH:mm:ss')
        });*/
      }; 
      // Close modal
      goalModalUI.style.display = "none";
      goalResetModal();
    } else { // If dates are incorrect flag it on UI
      startDate.style.backgroundColor = 'rgb(225, 160, 140)';
      untilDate.style.backgroundColor = 'rgb(225, 160, 140)';
    };
  } else { // Change backgroup of name, subject, start date, or until date if not filled out 
      if (name.value == ''){
        name.style.backgroundColor = 'rgb(225, 160, 140)';
      };
      if (subject.value == ''){
        subject.style.backgroundColor = 'rgb(225, 160, 140)';
      };
      if (startDate.value == ''){
        startDate.style.backgroundColor = 'rgb(225, 160, 140)';
      };
      if (untilDate.value == ''){
        untilDate.style.backgroundColor = 'rgb(225, 160, 140)';
      };
  };
};

// Function to delete communication from modal. Then update database */
function goalModalDelete (){
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

      /* Get id from DOM */
      const goalId = document.getElementById( "goal-id" );

      /* Remove linked communications from database */
      const comIds = document.getElementById( 'linked-comm-id' ).value;
      console.log(comIds);
      comIds.forEach(function (id){
        const goalRef = dbRef.child( 'communications/' + id );
        goalRef.remove();
      })

      /* Delete Schedule object on calendar */
      /*calendar.deleteSchedule(aveId.value, '1');*/

      // Remove goal from database 
      const goalRef = dbRef.child('goals/' + goalId.value);
      goalRef.remove();
      
      // Close modal
      goalModalUI.style.display = "none";
      goalResetModal();
  
      return
    }; 
  });
};

/* ---------- Event listeners ---------- */

/* Attach event listener to X button to close modal */
document.getElementsByClassName("close")[0].addEventListener("click", goalCloseModal);

/* When the user clicks anywhere outside of the modal, close it */
window.addEventListener('click', function(event) {
  if (event.target == goalModalUI) {
    // Close modal
    goalCloseModal();
  };
});

/* When the user clicks anywhere outside of the modal, close it */
window.addEventListener('touchend', function(event) {
  if (event.target == goalModalUI) {
    // Close modal
    goalCloseModal();
  };
});

/* Event listener on modal save button */
document.getElementById('goal-save-modal').addEventListener("click", goalModalSave );
      
/* Event listener on modal delete button */
document.getElementById('goal-delete-modal').addEventListener("click", goalModalDelete );

/* Event listener on add button */
document.getElementById("add-goal-btn").addEventListener("click", goalModalLaunch);


/* --------- */ /* Communication Related Events and Functions */ /* --------- */

/* Get reference to Communications document in database */
const comRef = dbRef.child('communications');


/* ---------- Functions ---------- */


/* When communication listed in UI is clicked get database reference and lauch modal */
function comClicked(e) {
  /* Get database reference */
  var comId = this.getAttribute("id");
  console.log(comId)
  const comRef = dbRef.child('communications/' + comId);

  /* Build communication object from database to send to modal */
  let comObj = {};
  comRef.on("child_added", snap => {
    comObj[snap.key] = snap.val();
  });

  /* launch the modal */
  commModalLaunch("list_launch", comId, comObj);
};

/*  Generate the ui object for a communication */
function generateComUi (key, subject) {
  const commIn = document.getElementById("comm-in");

  let commUi = document.createElement("div");
  commUi.setAttribute("id", key);
  commUi.addEventListener("click", comClicked);

  let subj = document.createElement('span');
  subj.innerHTML = subject;
  commUi.append(subj);

  let arrow = document.createElement('span');
  arrow.innerHTML = '>';
  commUi.append(arrow);

  commIn.append(commUi); 
};


/* ---------- Event Listeners ---------- */

/* Listen for new communications in database then update UI */
comRef.on("child_added", snap => {
  let communication = snap.val();
  //console.log("database snapshot of communications", communication);
  generateComUi(snap.key, communication.subject)
});

/* Listen for updates and update UI */
comRef.on("child_changed", snap => {
  let updatedVal = snap.val();
  document.getElementById(snap.key).children[0].innerHTML = updatedVal.subject;
});

/* Listen for deleted communications in database then update UI */
comRef.on("child_removed", snap => {
  const removedComUI = document.getElementById(snap.key);
  removedComUI.remove(removedComUI);
});


/* ------------------- */ /* Modal for Communications */ /* ----------------- */

// Set communication type dropdown options from list defined in communication_types variable 
const comTypeUI = document.getElementById("comm-type-modal");
for (let i in communication_types){
  let opElem = document.createElement("option");
  let opText = communication_types[i]
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
    const remId = document.getElementById("comm-linked-reminders-id");
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
function comCloseModal (){
  // Close modal
  commModalUI.style.display = "none";
  comResetModal();
}

/* Function to reset Modal after closing */
function comResetModal () {
  // Refresh calendar 
  //calendar.render();

  // Get modal fields
  const commId = document.getElementById("comm-id");
  const goalId = document.getElementById("linked-goal-id");
  const remId = document.getElementById("comm-linked-reminders-id");
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
  const remId = document.getElementById("comm-linked-reminders-id");
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
    comResetModal();
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
      comResetModal();
  
      return
    }; 
  });
};

/* ---------- Event listeners ---------- */

/* Attach event listener to X button to close modal */
document.getElementsByClassName("close")[1].addEventListener("click", comCloseModal);

/* When the user clicks anywhere outside of the modal, close it */
window.addEventListener('click', function(event) {
  if (event.target == commModalUI) {
    // Close modal
    comCloseModal();
  };
});

/* When the user clicks anywhere outside of the modal, close it */
window.addEventListener('touchend', function(event) {
  if (event.target == commModalUI) {
    // Close modal
    comCloseModal();
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