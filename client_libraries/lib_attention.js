//query data and parse it for use

api = require('./lib_api.js');
parser = require('./lib_parser.js');
inquirer = require('inquirer');
async = require('async');
math = require('mathjs');

'use strict';

module.exports = class AttentionAPI{

    constructor(){
        this.api = new api();
    }

    async login(){
        var self = this;

        return new Promise(function(resolve, reject) {
            var questions = [{
                type: 'input',
                name: 'email',
                message: 'Enter email:'
            },{
                type: 'password',
                name: 'password',
                message: 'Enter password:'
            }];

            inquirer.prompt(questions).then( answers => {
                resolve(self.api.login(answers['email'], answers['password']));
            });
        });
    }

    async currentAttention(){
        //last two hours of attention
        var self = this;

        return new Promise(function(resolve, reject) {
            self.api.getCurrent().then((results) => {
                resolve(parser.all(results));
            });
        });
    }

    async attentionPast(day){
        //last two hours of attention given a specific time in the past
        var self = this;

        return new Promise(function(resolve, reject) {
            self.api.getPast(day).then((results) => {
                resolve(parser.all(results));
            });
        });
    }

    async getTodayQueries(){
        //grab all of the queries of the last 24 hours
        var self = this;

        var endTime = new Date();

        var startTime = new Date();
        startTime.setDate(startTime.getDate()-1);

        return new Promise(function(resolve, reject) {
            self.api.getItemOverTime('focuses', startTime, endTime).then((results) => {
                var parsed_results = parser.focuses(results);
                resolve(parsed_results.queries);
            });
        });
    }

    async getDay(day=null){
        //get totals (idles/focues) and avg window stats for 24 hour period.
        //day=null gets the immediate last 24 hours.
        var self = this;

        var endTime = day;
        if (endTime == null) { endTime = new Date(); }

        var startTime = new Date(endTime);
        startTime.setDate(startTime.getDate()-1);

        var NUM_WINDOW_SAMPLES = 4;

        var promises = [];

        //add a promise for a full day of focuses
        promises.push(new Promise(function(resolve, reject) {
            self.api.getItemOverTime('focuses', startTime, endTime).then((results) => {
                resolve(parser.focuses(results));
            });
        }));

        //add a promise for a full day of idles
        promises.push(new Promise(function(resolve, reject) {
            self.api.getItemOverTime('idles', startTime, endTime).then((results) => {
                resolve(parser.idles(results));
            });
        }));

        //add a promise for each of NUM_WINDOW_SAMPLES spaced throughout the
        //day (limit=1 on the API before a given time spaced throughout)
        var minsPerWindowSample = (24 / NUM_WINDOW_SAMPLES) * 60;
        var winTime = new Date(endTime);

        for (var i=0; i<NUM_WINDOW_SAMPLES; i++){

            promises.push(new Promise(function(resolve, reject) {
                self.api.getItemBeforeTimeLimit('windows', winTime).then((results) => {
                    resolve(parser.windows(results));
                });
            }));

            winTime.setMinutes(winTime.getMinutes() - minsPerWindowSample);
        }

        //evaluate all the promises, average the windows, and return
        return Promise.all(promises).then((results) => {

            var focuses = results[0];
            var idles = results[1];
            var w_array = results.slice(2);
            var w = w_array[0];

            //sum window statistics
            for (var i=1; i<w_array.length; i++) {
                for (var k in w_array[i]){
                    if (w[k] instanceof Array) { w[k].push(...w_array[i][k]); }
                    else { w[k] = w[k] + w_array[i][k]; }
                }
            }

            //divide by number of samples added, change name to avg
            for (var k in w){
                if (w[k] instanceof Array) { w[k] = [...new Set(w[k])]; }
                else {
                    w['avg' + k] = w[k] / w_array.length;
                    delete w[k];
                }
            }

            return Object.assign(focuses,idles,w);
        });
    }

    async getNDays(n=7){
        //get n days of data in an array
        var self = this;
        var promises = [];

        var d = new Date();

        for (var i=0; i<n; i++){
            promises.push(new Promise(function(resolve, reject) {
                var curr = new Date(d);
                curr.setDate(curr.getDate() - i);
                resolve(self.getDay(curr));
            }));
        }

        return Promise.all(promises).then((results) => {
            return results;
        });
    }

    async getStatsOverNDays(n=7){
        //get daily statistics over n days, show means and std-devs
        var self = this;

        return new Promise(function(resolve, reject) {
            self.getNDays(n).then((results) => {

                var temp = results[0];
                var avg_results = {};

                //step through each key
                for (var k in temp) {

                    //remove non-numeric vals
                    if (isNaN(temp[k])) { delete temp[k]; }
                    else {
                        //otherwise create an array of all values
                        temp[k] = [temp[k]];

                        //push extra values
                        for (var i=1; i<results.length; i++){
                            try {
                                temp[k].push(results[i][k]);
                            } catch (e){
                                console.log('FAILED TO PUSH ' + k + ' of index ' + i);
                            }
                        }

                        //statistics
                        console.log(temp[k]);
                        avg_results['avg_'+k] = math.mean(temp[k]);
                        avg_results['std_'+k] = math.std(temp[k]);
                        avg_results['quartiles_'+k] = math.quantileSeq(temp[k], [0.25, 0.75]);
                        avg_results['min_'+k] = math.min(temp[k]);
                        avg_results['max_'+k] = math.max(temp[k]);
                        avg_results['median_'+k] = math.median(temp[k]);
                    }
                }

                resolve(avg_results);
            });
        });
    }

}

