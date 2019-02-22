var state = {
    username: null,
    userid: null,
    token: null,
    tokenCreated: null,
    tokenExpire: null
};

var session_active = {};

var registered_trackers = [];

function formatTime(t) {
  var time = new Date(t);
  return time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
}

function onSessionStart(session) {
  $.post('https://feedback.media.mit.edu/api/appUsers/' + state.userid + '/focuses',
    session,
    function (data, textStatus, jqXHR) {
      console.log('Focus-State push ' + jqXHR.status);
      console.log(jqXHR);
      session_active = JSON.parse(jqXHR.responseText);

  }).fail(function() {
    console.log("FAILED FOCUSSTART UPDATE");
  });
}

function onSessionEnd(session) {
  if (session.url == session_active.url && session.tabId == session_active.tabId){
        $.ajax({
        url: 'https://feedback.media.mit.edu/api/appUsers/' + state.userid + '/focuses/' + session_active.id,
        type: 'PUT',
        contentType: "application/json",
        data: JSON.stringify(session),
        success: function(result) {
            console.log('Focus-State update ' + result);
            console.log(result);
        }
        }).fail(function() {
            console.log("FAILED FOCUSEND UPDATE");
        });
  }
}

function onIdleChange(idleState){

  $.post('https://feedback.media.mit.edu/api/appUsers/' + state.userid + '/idles',
    idleState,
    function (data, textStatus, jqXHR) {
      console.log('Idle-State push ' + jqXHR.status);

  }).fail(function() {
    console.log("FAILED IDLESTATE UPDATE");
  });
}

function onDisplayChange(displayState){

  $.post('https://feedback.media.mit.edu/api/appUsers/' + state.userid + '/displays',
    displayState,
    function (data, textStatus, jqXHR) {
      console.log('Display-State push ' + jqXHR.status);

  }).fail(function() {
    console.log("FAILED DISPLAYSTATE UPDATE");
  });
}

function onWindowChange(windowState){

  $.post('https://feedback.media.mit.edu/api/appUsers/' + state.userid + '/windows',
    windowState,
    function (data, textStatus, jqXHR) {
      console.log('Window-State push ' + jqXHR.status);

  }).fail(function() {
    console.log("FAILED WINDOWSTATE UPDATE");
  });
}


function popupLoginView(){
//edit popup view to be login view
    var views = chrome.extension.getViews({
        type: "popup"
    });
    for (var i = 0; i < views.length; i++) {
        views[i].document.getElementById('loginbox').classList.remove("visuallyhidden");
        views[i].document.getElementById('logoutbox').classList.add("visuallyhidden");
        views[i].document.getElementById('username').innerHTML = "unknown";
    }
}


function popupLoggedInView(email){
//edit popup view to be logged in status
    var views = chrome.extension.getViews({
        type: "popup"
    });
    for (var i = 0; i < views.length; i++) {
        console.log(views[i]);
        views[i].document.getElementById("loginbox").classList.add("visuallyhidden");
        views[i].document.getElementById("logoutbox").classList.remove("visuallyhidden");
        views[i].document.getElementById("username").innerHTML = email;
        views[i].document.getElementById("email").value = 'email';
        views[i].document.getElementById("password").value = 'email';
    }
}

function login_setup(){
//assumes global var state is up to date and sets things up accordingly

    //save it to local storage
    chrome.storage.local.set({'state': state});

    //add token into header for ajax
    $.ajaxSetup({ headers:{'X-Access-Token': state.token} });

    //print 'logged in as ...' instead of login screen, give a logout button
    popupLoggedInView(state.username);

    //initiate tracking with callbacks, push the returned function (to unregister
    //handler) onto registered_trackers
    registered_trackers.push(startTrackingActivity(onSessionStart, onSessionEnd));
    registered_trackers.push(startIdleTracking(onIdleChange, 15));
    registered_trackers.push(startDisplayTracking(onDisplayChange));
    registered_trackers.push(startWindowTracking(onWindowChange));

}


function login_success(data, email_address){
//main cb on login

    //store state
    var expire = new Date(data.created);

    state.username = email_address;
    state.userid = data.userId;
    state.token = data.id;
    state.tokenCreated = data.created;
    state.tokenExpire = expire.setSeconds(expire.getSeconds() + data.ttl);

    login_setup();
}


function logout_click(){
//main cb on logout

    //stop tracking
    for (var f in registered_trackers) { registered_trackers[f](); }

    //call logout api and revoke token
    $.post('https://feedback.media.mit.edu/api/appUsers/logout', null, function (data, textStatus, jqXHR) {
        console.log('logout request: ' + jqXHR.status);
    });

    //delete state
    state.username = null;
    state.userid = null;
    state.token = null;
    state.tokenCreated = null;
    state.tokenExpire = null;

    //overwrite in local storage
    chrome.storage.local.set({'state': state});

    //remove cached ajax header
    $.ajaxSetup({ headers:{'X-Access-Token': null} });

    //reset popup to login screen
    popupLoginView();

}


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    if (request.message == "login_success"){
        login_success(request.data, request.email);
    }
    if (request.message == "logout_click"){
        logout_click();
    }
});


//on start, try to load token etc from memory, if fail loginscreen/reminder
$( document ).ready( function() {
    console.log('startup');
    chrome.storage.local.get({'state':null}, function(storage_state){

        if (storage_state.state === null || Date.now() > storage_state.state.tokenExpire){
            console.log('nothing in memory OR token expired');

            //warn with notification
            chrome.notifications.create('ft_reminder', {
                type: 'basic',
                iconUrl: 'eye_icon.png',
                title: 'Focus Tracker',
                message: 'Focus Tracker is not recording.  Please log in.'
            });

        } else {
            console.log('found state');
            state = storage_state.state;
            login_setup();
        }

    });
});
