'use strict';



module.exports = function(Appuser) {

    Appuser.getUserDataDateRange = function(id, cb, startDate, endDate=null) {

        //if endDate is not passed, assume current date/time
        if (endDate === null) { endDate = new Date(); }

        Appuser.findById(id, {
            include: [{
                relation: 'idles',
                    scope: {
                    fields: ['idleState', 'timestamp'],
                    order: 'timestamp DESC',
                    where: {timestamp: {between: [startDate, endDate]}}
                    }
                },{
                relation: 'windows',
                    scope: {
                    order: 'timestamp DESC',
                    where: {timestamp: {between: [startDate, endDate]}}
                    }
                },{
                relation: 'displays',
                    scope: {
                    order: 'timestamp DESC',
                    where: {timestamp: {between: [startDate, endDate]}}
                    }
                },{
                relation: 'focuses',
                    scope: {
                    fields: ['tabId', 'url', 'startTime', 'endTime'],
                    order: 'startTime DESC',
                    where: {startTime: {between: [startDate.getTime(), endDate.getTime()]}}
                    }
            }]},
            function(err, user) {
                if (err) {
                    cb(err);
                } else {
                    var user = user.toObject(); //take model instance object and get back json
                    cb(null, user['idles'], user['windows'], user['focuses'], user['displays']);
                }
            }
        );

    };


    Appuser.getUserDataLimit = function(id, cb, window_limit=1, activity_limit=25) {

        Appuser.findById(id, {
            include: [{
                relation: 'idles',
                    scope: {
                    fields: ['idleState', 'timestamp'],
                    order: 'timestamp DESC',
                    limit: activity_limit
                    }
                },{
                relation: 'windows',
                    scope: {
                    order: 'timestamp DESC',
                    limit: window_limit
                    }
                },{
                relation: 'displays',
                    scope: {
                    order: 'timestamp DESC',
                    limit: window_limit
                    }
                },{
                relation: 'focuses',
                    scope: {
                    fields: ['tabId', 'url', 'startTime', 'endTime'],
                    order: 'startTime DESC',
                    limit: activity_limit
                    }
            }]},
            function(err, user) {
                if (err) {
                    cb(err);
                } else {
                    var user = user.toObject(); //take model instance object and get back json
                    cb(null, user['idles'], user['windows'], user['focuses'], user['displays']);
                }
            }
        );

    };


    Appuser.getUserDataPast = function(id, endDate, cb, window_limit=1, activity_min=120) {

        var startDate = new Date(endDate.getTime());
        startDate.setMinutes(startDate.getMinutes()-activity_min);

        Appuser.findById(id, {
            include: [{
                relation: 'idles',
                    scope: {
                    fields: ['idleState', 'timestamp'],
                    order: 'timestamp DESC',
                    where: {timestamp: {between: [startDate, endDate]}}
                    }
                },{
                relation: 'windows',
                    scope: {
                    order: 'timestamp DESC',
                    limit: window_limit,
                    where: {timestamp: {lte: endDate}}
                    }
                },{
                relation: 'displays',
                    scope: {
                    order: 'timestamp DESC',
                    limit: window_limit,
                    where: {timestamp: {lte: endDate}}
                    }
                },{
                relation: 'focuses',
                    scope: {
                    fields: ['tabId', 'url', 'startTime', 'endTime'],
                    order: 'startTime DESC',
                    where: {startTime: {between: [startDate.getTime(), endDate.getTime()]}}
                    }
            }]},
            function(err, user) {
                if (err) {
                    cb(err);
                } else {
                    var user = user.toObject(); //take model instance object and get back json
                    cb(null, user['idles'], user['windows'], user['focuses'], user['displays']);
                }
            }
        );

    };


    Appuser.getUserDataCurrent = function(id, cb, window_limit=1, activity_min=120) {

        var endDate = new Date();

        var startDate = new Date();
        startDate.setMinutes(startDate.getMinutes()-activity_min);

        Appuser.findById(id, {
            include: [{
                relation: 'idles',
                    scope: {
                    fields: ['idleState', 'timestamp'],
                    order: 'timestamp DESC',
                    where: {timestamp: {between: [startDate, endDate]}}
                    }
                },{
                relation: 'windows',
                    scope: {
                    order: 'timestamp DESC',
                    limit: window_limit
                    }
                },{
                relation: 'displays',
                    scope: {
                    order: 'timestamp DESC',
                    limit: window_limit
                    }
                },{
                relation: 'focuses',
                    scope: {
                    fields: ['tabId', 'url', 'startTime', 'endTime'],
                    order: 'startTime DESC',
                    where: {startTime: {between: [startDate.getTime(), endDate.getTime()]}}
                    }
            }]},
            function(err, user) {
                if (err) {
                    cb(err);
                } else {
                    var user = user.toObject(); //take model instance object and get back json
                    cb(null, user['idles'], user['windows'], user['focuses'], user['displays']);
                }
            }
        );

    };


    Appuser.getToday = function(id, cb) {

        var prevDate = new Date();
        prevDate.setDate(prevDate.getDate()-1);

        Appuser.getUserDataDateRange(id, cb, prevDate);

    };

    Appuser.remoteMethod('getToday', {
        http: {
            path: '/:id/getToday',
            verb: 'get'
        },
        accepts:[
            {arg: 'id', type: 'string', required: true}
        ],
        returns:[{arg:'idles', type:'object'},
                 {arg:'windows', type:'object'},
                 {arg:'focuses', type:'object'},
                 {arg:'displays', type:'object'}]
    });



    Appuser.getWeek = function(id, cb) {

        var prevDate = new Date();
        prevDate.setDate(prevDate.getDate()-7);

        Appuser.getUserDataDateRange(id, cb, prevDate);

    };

    Appuser.remoteMethod('getWeek', {
        http: {
            path: '/:id/getWeek',
            verb: 'get'
        },
        accepts:[
            {arg: 'id', type: 'string', required: true}
        ],
        returns:[{arg:'idles', type:'object'},
                 {arg:'windows', type:'object'},
                 {arg:'focuses', type:'object'},
                 {arg:'displays', type:'object'}]
    });



    Appuser.getPast = function(id, endDate, cb) {
        Appuser.getUserDataPast(id, endDate, cb);
    };

    Appuser.remoteMethod('getPast', {
        http: {
            path: '/:id/getPast/:endDate',
            verb: 'get'
        },
        accepts:[
            {arg: 'id', type: 'string', required: true},
            {arg: 'endDate', type: 'date', required: true}
        ],
        returns:[{arg:'idles', type:'object'},
                 {arg:'windows', type:'object'},
                 {arg:'focuses', type:'object'},
                 {arg:'displays', type:'object'}]
    });



    Appuser.getCurrent = function(id, cb) {
        Appuser.getUserDataCurrent(id, cb);
    };

    Appuser.remoteMethod('getCurrent', {
        http: {
            path: '/:id/getCurrent',
            verb: 'get'
        },
        accepts:[
            {arg: 'id', type: 'string', required: true}
        ],
        returns:[{arg:'idles', type:'object'},
                 {arg:'windows', type:'object'},
                 {arg:'focuses', type:'object'},
                 {arg:'displays', type:'object'}]
    });



    Appuser.getLast = function(id, cb) {
        Appuser.getUserDataLimit(id, cb);
    };

    Appuser.remoteMethod('getLast', {
        http: {
            path: '/:id/getLast',
            verb: 'get'
        },
        accepts:[
            {arg: 'id', type: 'string', required: true}
        ],
        returns:[{arg:'idles', type:'object'},
                 {arg:'windows', type:'object'},
                 {arg:'focuses', type:'object'},
                 {arg:'displays', type:'object'}]
    });
};
