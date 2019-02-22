attention = require('./lib_attention.js');

a = new attention();

//get current state metadata
a.login().then(() =>
a.currentAttention()).then((results) => {
    console.log(results);
});

//get current state metadata
a.login().then(() =>
a.currentAttention()).then((results) => {
    console.log(results);
});

//get today's queries
a.login().then(() =>
a.getTodayQueries()).then((results) => {
    console.log(results);
});

//get today's full history
a.login().then(() =>
a.getDay()).then((results) => {
    console.log(results);
});

//get week's full history by day
a.login().then(() =>
a.getNDays(7)).then((results) => {
    console.log(results);
});

//get statistics over a week by day
a.login().then(() =>
a.getStatsOverNDays(7)).then((results) => {
    console.log(results);
});



