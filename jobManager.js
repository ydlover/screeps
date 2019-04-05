//-----------------------------------------------------------------------------

var _ = require('lodash');

var C = require('C');
var jobs = require('jobs');
var jobBuild = require('jobBuild')();
var jobCollect = require('jobCollect')();
var jobGuard = require('jobGuard')();
var jobHarvest = require('jobHarvest')();
var jobHeal = require('jobHeal')();
var jobRangedGuard = require('jobRangedGuard')();

module.exports = function ()
{
	//declare base object
	var jobManager = function ()
	{
	};
	//-------------------------------------------------------------------------

	jobManager.actionJobs = function ()
	{
		for (var i in Game.creeps)
		{
			var creep = Game.creeps[i];

			if(creep.room.memory.isUpdateController && creep.carry.energy > 0)
			{
				if(creep.room.controller) {
					var ret = creep.upgradeController(creep.room.controller);
					if(ret === ERR_NOT_IN_RANGE){
						console.log(creep.name+" ->controller not in range,move To:"+creep.room.controller);
		                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: 'blue'}});
		                continue;
		            }
					else if(ret != OK)
					{
						console.log(creep.name+" update fail:"+ret);
					}
				}
				
				continue;
			}
			console.log('creep['+creep.name+'] action job:'+creep.memory.job);
			switch (creep.memory.job)
			{
				case C.JOB_BUILD:
					jobBuild.work(creep);
					break;
				case C.JOB_COLLECT:
					jobCollect.work(creep);
					break;
				case C.JOB_GUARD:
					jobGuard.work(creep);
					break;
				case C.JOB_HARVEST:
					jobHarvest.work(creep);
					break;
				case C.JOB_HEAL:
					jobHeal.work(creep);
					break;
				case C.JOB_RANGED_GUARD:
					jobRangedGuard.work(creep);
					break;
			}
		}
	};

	jobManager.assignJobs = function ()
	{
		for (var i in Game.creeps)
		{
			var creep = Game.creeps[i];
			if (jobManager.creepHasMeans(creep, C.JOB_HARVEST))
			{
				creep.memory.job = C.JOB_HARVEST;
			}

			if (jobManager.creepHasMeans(creep, C.JOB_COLLECT))
			{
				var spawns = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
				var isNeedCollect = false;
				for(var index in spawns)
				{
					if(spawns.memory.energyCollection.length>0)
					{
						isNeedCollect = true;
						break;
					}
				}
				if (isNeedCollect)
				{
					creep.memory.job = C.JOB_COLLECT;
				}
			}

			if (jobManager.creepHasMeans(creep, C.JOB_GUARD))
			{
				creep.memory.job = C.JOB_GUARD;
			}

			if (jobManager.creepHasMeans(creep, C.JOB_RANGED_GUARD))
			{
				creep.memory.job = C.JOB_RANGED_GUARD;
			}

			if (jobManager.creepHasMeans(creep, C.JOB_BUILD))
			{
				if (creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES))
				{
					creep.memory.job = C.JOB_BUILD;
				}
			}
			if (jobManager.creepHasMeans(creep, C.JOB_HEAL))
			{
				creep.memory.job = C.JOB_HEAL;
			}
			
			console.log('creep['+creep.name+'] assign job:'+creep.memory.job);
		}
	};

	jobManager.creepHasMeans = function (creep, mean)
	{
		var creepParts = [];
		for (var x in creep.body)
		{
			creepParts[x] = creep.body[x].type;
		}

		var result = _.difference(jobs[mean].means, creepParts);
		console.log('job('+creep.name+') means['+mean+']: ['+jobs[mean].means+']-['+creepParts+']->['+result+']');

		return !result.length;
	};

	jobManager.countUnitWithMeans = function (mean, spawnName, roomName)
	{
		if (typeof(spawnName) === 'undefined')
		{
			spawnName = '*';
		}
		if (typeof(roomName) === 'undefined')
		{
			roomName = '*';
		}
		var result = 0;
		for (var i in Game.creeps)
		{
			var creep = Game.creeps[i];
			if (jobManager.creepHasMeans(creep, mean))
			{
				//test spawn
				if ((creep.memory.spawn == spawnName || spawnName == '*')
					&& (creep.room.name == roomName || roomName == '*'))
				{
					result++;
				}
			}

		}
		return result;
	};

	jobManager.countUnitsWithJob = function (job, spawnName, roomName)
	{
		if (typeof(spawnName) === 'undefined')
		{
			spawnName = '*';
		}
		if (typeof(roomName) === 'undefined')
		{
			roomName = '*';
		}
		var result = 0;
		for (var i in Game.creeps)
		{
			var creep = Game.creeps[i];
			if (creep.memory.job == job)
			{
				if ((creep.memory.spawn == spawnName || spawnName == '*')
					&& (creep.room.name == roomName || roomName == '*'))
				{
					result++;
				}
			}
		}
		return result;
	};

	//-------------------------------------------------------------------------
	//return populated object
	return jobManager;
};