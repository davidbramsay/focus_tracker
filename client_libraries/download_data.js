request = require('request');
async = require('async');
fs = require('fs');
inquirer = require('inquirer');


BASEAPI = 'https://feedback.media.mit.edu/api/appUsers/'


function login(email, pass, cb) {
    //call callback with userid, token
    var options = {
        uri: BASEAPI + 'login',
        method: 'POST',
        json: {'email':email, 'password':pass}
    }

    request(options, function(error, response, body){
        if(error) {console.log(error); throw error;}
        else {
            console.log('USERID:\t' + body.userId + '\nTOKEN:\t' + body.id);
            cb(body.userId, body.id);
        }
    });
}


function getAllItems(item, page, userid, token){

    var sort_var = 'timestamp';
    if (item=='focuses') { sort_var = 'startTime'; }

    var resp_empty = false;

    var current_page = 0;

    var results = [];

    async.whilst(
        function(){ return !resp_empty; },
        function(cb) {

            var filters = '?filter[order]=' + sort_var + ' DESC' +
                '&filter[limit]=' + page +
                '&filter[skip]=' + (page*current_page);

            var options = {
                uri: BASEAPI + userid + '/' + item + filters + '&access_token=' + token,
                method: 'GET',
                json:true
            };

            request(options, function(error, response, body){
                if(error) {console.log(error); throw error;}
                else {
                    results.push(...body);

                    current_page += 1;
                    if(!body.length){ resp_empty = true; }

                    console.log(item + ' page ' + current_page + ' done.');

                    cb(null, results);
                }
            });

        },
        function(err, results){

            var savefile = './download_data/' + item + '.json';
            fs.writeFile(savefile, JSON.stringify(results));
            console.log('-'.repeat(50) + '\n' + results.length + ' final results saved to ' + savefile + '.\n' + '-'.repeat(50));

        });

}


function getAllItemsSplit(item, page, savepages, userid, token){

    var sort_var = 'timestamp';
    if (item=='focuses') { sort_var = 'startTime'; }

    var resp_empty = false;
    var new_loop = true;

    var current_page = 0;
    var current_save = 0;

    var results = [];

    async.whilst(
        function(){ return !resp_empty; },
        function(outer_cb){

            results = [];

            async.whilst(
                function(){ return !resp_empty && (current_page%savepages || new_loop); },
                function(cb) {

                    new_loop=false;

                    var filters = '?filter[order]=' + sort_var + ' DESC' +
                        '&filter[limit]=' + page +
                        '&filter[skip]=' + (page*current_page);

                    var options = {
                        uri: BASEAPI + userid + '/' + item + filters + '&access_token=' + token,
                        method: 'GET',
                        json:true
                    };

                    request(options, function(error, response, body){
                        if(error) {console.log(error); throw error;}
                        else {
                            results.push(...body);

                            current_page += 1;
                            if(!body.length){ resp_empty = true; }

                            console.log(item + ' page ' + current_page + ' done.');

                            cb(null, results);
                        }
                    });

                },
                function(err, results){

                    var savefile = './download_data/' + item + current_save + '.json';
                    current_save += 1;

                    fs.writeFileSync(savefile, JSON.stringify(results));
                    console.log('-'.repeat(50) + '\n' + results.length + ' final results saved to ' + savefile + '.\n' + '-'.repeat(50));

                    new_loop=true;

                    outer_cb(null);
                });
        },
        function(err){
            if (err){console.log(err);}
            console.log('finished all.');
        });

}



let getIdles = getAllItems.bind(null, 'idles', 500);
let getFocuses = getAllItems.bind(null, 'focuses', 500);
let getDisplays = getAllItems.bind(null, 'displays', 50);
let getWindows = getAllItemsSplit.bind(null, 'windows', 50, 100);

var questions = [{
    type: 'input',
    name: 'email',
    message: 'Enter email:'
},{
    type: 'password',
    name: 'password',
    message: 'Enter password:'
}];

inquirer.prompt(questions).then(answers=> {
    login(answers['email'], answers['password'], function(id, token){

        getIdles(id, token);
        getFocuses(id, token);
        getDisplays(id, token);
        getWindows(id, token);

    });
});
