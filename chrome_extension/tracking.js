function startTrackingActivity(onSessionStart, onSessionEnd) {
  var session = { tabId: -1 };

  function endSession() {
    if (session.tabId !== -1) {
      session.endTime = Date.now();
      onSessionEnd && onSessionEnd(session);
      session = { tabId: -1 };
    }
  }

  function startSession(tab) {
    endSession();
    session = {
      tabId: tab.id,
      url: tab.url,
      startTime: Date.now()
    };
    onSessionStart &&
      onSessionStart({
        tabId: session.tabId,
        url: session.url,
        startTime: session.startTime
      });
  }

  function trackWindowFocus(windowId) {
    if (windowId !== -1) {
      chrome.windows.getCurrent({ populate: true }, function(window) {
        var activeTab = window.tabs.filter(function(tab) {
          return tab.active;
        })[0];
        if (activeTab && activeTab.id !== session.tabId) {
          startSession(activeTab);
        }
      });
    } else {
      endSession();
    }
  }

  function trackActiveTab(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function(tab) {
      if (!chrome.runtime.lastError && tab.id !== session.tabId) {
        startSession(tab);
      }
    });
  }

  function trackTabUpdates(tabId, changeInfo, tab) {
    if (
      tab.active && changeInfo.status === "loading" && tab.url !== session.url
    ) {
      chrome.windows.get(tab.windowId, function(window) {
        if (!chrome.runtime.lastError && window.focused) {
          startSession(tab);
        }
      });
    }
  }

  chrome.windows.onFocusChanged.addListener(trackWindowFocus);
  chrome.tabs.onUpdated.addListener(trackTabUpdates);
  chrome.tabs.onActivated.addListener(trackActiveTab);

  return function stopTracking() {
    chrome.windows.onFocusChanged.removeListener(trackWindowFocus);
    chrome.tabs.onUpdated.removeListener(trackTabUpdates);
    chrome.tabs.onActivated.removeListener(trackActiveTab);
  };
}


//track if COMPUTER is idle, active, or locked
function startIdleTracking(onIdleChange, idleDurationSec = 60) {

  //listener function for idleChange, calls cb with new state
  function idleStateChange(idleState) {
    //nice shorthand to check existance of cb
    onIdleChange && onIdleChange({
        idleState: idleState
    });
  }

  //set duration of idle interval
  chrome.idle.setDetectionInterval(idleDurationSec);
  //register listener
  chrome.idle.onStateChanged.addListener(idleStateChange);

  //return a function to clean up listeners
  return function stopIdleTracking() {
    chrome.idle.onStateChanged.removeListener(idleStateChange);
  };

}


//get information about the static screen setup, nothing to do with the browser
//itself
function startDisplayTracking(onDisplayChange) {

  function displayState(){
     chrome.system.display.getInfo(function(info){
        onDisplayChange && onDisplayChange({
            info: info
        });
     });
  }

  displayState();
  chrome.system.display.onDisplayChanged.addListener(displayState);

  return function stopDisplayTracking() {
    chrome.system.display.onDisplayChanged.removeListener(displayState);
  };

}


//window tracking
function startWindowTracking(onWindowChange){


  function returnWindowState(action, winid) {

    chrome.windows.getAll(function(info){
        let parray = [];
        for (let i=0; i<info.length; i++){
            parray.push(new Promise((resolve, reject) => {
                var item = info[i];
                chrome.tabs.query({windowId:item.id}, function(tabinfo){
                    item['tabs'] = tabinfo;
                    resolve(item);
                });
            }));
        }

        Promise.all(parray).then(info => {
            onWindowChange && onWindowChange({
                action: action,
                actionWindowId: winid,
                info: info
            });
        }, error => {
            console.log(error);
        });

    });

  }


  function windowFocus(windowId){
    returnWindowState('FOCUS_CHANGE', windowId);
  }

  function windowCreated(window){
    returnWindowState('CREATED', window.id);
  }

  function windowRemoved(windowId){
    returnWindowState('REMOVED', windowId);
  }

  function tabCreated(tab){
    returnWindowState('TAB_CREATED', tab.windowId);
  }

  function tabDetached(tab, detachinfo){
    returnWindowState('TAB_DETACHED', detachinfo.oldWindowId);
  }

  function tabAttached(tabId, attachinfo){
    returnWindowState('TAB_ATTACHED', attachinfo.newWindowId);
  }

  function tabRemoved(tabId, removeinfo){
    returnWindowState('TAB_REMOVED', removeinfo.windowId);
  }

  function tabReplaced(oldTabId, newTabId){
    chrome.tabs.get(newTabId, function(tab){
        returnWindowState('TAB_REPLACED', tab.windowId);
    });
  }

  returnWindowState('INIT', null);
  chrome.windows.onFocusChanged.addListener(windowFocus);
  chrome.windows.onCreated.addListener(windowCreated);
  chrome.windows.onRemoved.addListener(windowRemoved);

  chrome.tabs.onCreated.addListener(tabCreated);
  chrome.tabs.onDetached.addListener(tabDetached);
  chrome.tabs.onAttached.addListener(tabAttached);
  chrome.tabs.onRemoved.addListener(tabRemoved);
  chrome.tabs.onReplaced.addListener(tabRemoved);

  return function stopWindowTracking() {
    chrome.windows.onFocusChanged.removeListener(windowFocus);
    chrome.windows.onCreated.removeListener(windowCreated);
    chrome.windows.onRemoved.removeListener(windowRemoved);

    chrome.tabs.onCreated.removeListener(tabCreated);
    chrome.tabs.onDetached.removeListener(tabDetached);
    chrome.tabs.onAttached.removeListener(tabAttached);
    chrome.tabs.onRemoved.removeListener(tabRemoved);
    chrome.tabs.onReplaced.removeListener(tabRemoved);
  };

}



if (typeof exports !== "undefined") {
  if (typeof module !== "undefined" && module.exports) {
    exports = module.exports = trackActivity;
  }
  exports.trackActivity = trackActivity;
}
