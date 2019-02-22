# ![Focus Tracker](https://github.com/dramsay9/focus_tracker/blob/master/chrome_extension/eye_icon.png "Focus Tracker") Focus Tracker 

This is a project to start tracking attentional states throughout the day based on computer usage patterns.  It has three parts:

### A Chrome Extension
*found in chrome_extension*

This extension can be installed in any chrome browser, and allows the user to log-in and send their usage statistics back to a server.  It logs *computer* idle/active state, information about windows/tabs, current browsing, and display settings. 

### A Backend Server
*found in server, but utilizing code in COMMON as well*

This is a loopback server which securely manages login through the chrome extension, allows users to post their browsing data, and presents some custom endpoints to get filtered data (getToday, getWeek, getCurrent, getLast).

### A Custom API Query Tool and Library
*found in client_libraries*

This is javascript/node code to query the database, and parse raw activity behavior into useful metrics (like # sessions, average durations, time spent on time-wasting sites, task-switches, number of tabs open, etc).
