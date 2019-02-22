//login to loopback backend server, simple query API

request = require('request');
async = require('async');

'use strict';

module.exports = class TrackingAPI{

    constructor(){
        this.BASEAPI = 'https://feedback.media.mit.edu/api/appUsers/';
        this.id = null;
        this.token = null;
    }

    async login(email, pass) {

        var self = this;

        var options = {
            uri: this.BASEAPI + 'login',
            method: 'POST',
            json: {'email':email, 'password':pass}
        }

        return new Promise(function(resolve, reject){
            request(options, function(error, response, body){
                if(error) {console.log(error); reject(error);}
                else {
                    console.log('USERID:\t' + body.userId + '\nTOKEN:\t' + body.id);
                    self.id = body.userId;
                    self.token = body.id;
                    resolve();
                }
            });
        });
    }

    async getCurrent(){
        if (this.token == null) {console.log('MUST BE LOGGED IN.'); return null;}

        var options = {
            uri: this.BASEAPI + this.id + '/getCurrent' + '?access_token=' + this.token,
            method: 'GET',
            json:true
        };

        //console.log(options.uri);

        return new Promise(function(resolve, reject){
            request(options, function(error, response, body){
                if(error) {console.log(error); reject(error);}
                else {
                    resolve(body);
                }
            });
        });
    }

    async getPast(dateObj){
        if (this.token == null) {console.log('MUST BE LOGGED IN.'); return null;}

        var options = {
            uri: this.BASEAPI + this.id + '/getPast/' + dateObj.toISOString()  + '?access_token=' + this.token,
            method: 'GET',
            json:true
        };

        //console.log(options.uri);

        return new Promise(function(resolve, reject){
            request(options, function(error, response, body){
                if(error) {console.log(error); reject(error);}
                else {
                    resolve(body);
                }
            });
        });
    }

    async getItemOverTime(item, startTime, endTime){
        //item = [focuses, displays, windows, idles]
        //startTime and endTime are date objects

        if (this.token == null) {console.log('MUST BE LOGGED IN.'); return null;}

        var sort_var = 'timestamp';
        var start = startTime.toISOString();
        var end = endTime.toISOString();

        if (item=='focuses') {
            sort_var = 'startTime';
            start = startTime.getTime();
            end = endTime.getTime();
        }

        var filters = '?filter[order]=' + sort_var + ' DESC' +
                      '&filter[where][' + sort_var + '][between][0]=' + start  +
                      '&filter[where][' + sort_var + '][between][1]=' + end;

        var options = {
            uri: this.BASEAPI + this.id + '/' + item + filters + '&access_token=' + this.token,
            method: 'GET',
            json:true
        };

        //console.log(options.uri);

        return new Promise(function(resolve, reject){
            request(options, function(error, response, body){
                if(error) {console.log(error); reject(error);}
                else {
                    resolve(body);
                }
            });
        });
    }

    async getItemBeforeTimeLimit(item, beforeTime, limit=1){
        //item = [focuses, displays, windows, idles]
        //startTime and endTime are date objects

        if (this.token == null) {console.log('MUST BE LOGGED IN.'); return null;}

        var sort_var = 'timestamp';
        var end = beforeTime.toISOString();

        if (item=='focuses') {
            sort_var = 'startTime';
            end = beforeTime.getTime();
        }

        var filters = '?filter[order]=' + sort_var + ' DESC' +
                      '&filter[where][' + sort_var + '][lte]=' + end  +
                      '&filter[limit]=' + limit;

        var options = {
            uri: this.BASEAPI + this.id + '/' + item + filters + '&access_token=' + this.token,
            method: 'GET',
            json:true
        };

        //console.log(options.uri);

        return new Promise(function(resolve, reject){
            request(options, function(error, response, body){
                if(error) {console.log(error); reject(error);}
                else {
                    resolve(body);
                }
            });
        });
    }

}

