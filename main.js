var jobManager = require('jobManager')();
var spawnManager = require('spawnManager')();
var utils = require('utils')();

utils.logInit();
console.log("------ new tick ------");
//assign jobs
jobManager.assignJobs();

//assign spawns
spawnManager.spawn();

//action jobs
jobManager.actionJobs();

utils.garbageCollection();