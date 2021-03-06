var _ = require('lodash');
var jobManager = require('jobManager')();
var C = require('C');
var units = require('units');

var WORKER_THRESHOLD_MIN = 2;
var GUARD_THRESHOLD_MIN = 2;
var RANGED_GUARD_THRESHOLD_MIN = 1;
var HEALER_THRESHOLD_MIN = 1;

module.exports = function ()
{
	//declare base object
	var spawnManager = function ()
	{
	};
	//-------------------------------------------------------------------------
	// Declarations

	// game costs for spawning parts
	spawnManager.costs = {};
	spawnManager.costs[MOVE] = BODYPART_COST[MOVE];
	spawnManager.costs[WORK] = BODYPART_COST[WORK];
	spawnManager.costs[CARRY] = BODYPART_COST[CARRY];
	spawnManager.costs[ATTACK] = BODYPART_COST[ATTACK];
	spawnManager.costs[RANGED_ATTACK] = BODYPART_COST[RANGED_ATTACK];
	spawnManager.costs[HEAL] = BODYPART_COST[HEAL];
	spawnManager.costs[TOUGH] = BODYPART_COST[TOUGH];

	//declare needs
	spawnManager.needs = [7];

	//-------------------------------------------------------------------------
	// top level functions
	//-------------------------------------------------------------------------

	// spawn, should be called form main() every tick
	// this loops over all spawns and calls their management functions as needed
	spawnManager.spawn = function ()
	{
		//get some global unit counts
		var workerCount = jobManager.countUnitWithMeans(C.JOB_HARVEST);
		var collectorCount = jobManager.countUnitWithMeans(C.JOB_COLLECT);
		var guardCount = jobManager.countUnitWithMeans(C.JOB_GUARD);
		var rangedGuardCount = jobManager.countUnitWithMeans(C.JOB_RANGED_GUARD);
		var healerCount = jobManager.countUnitWithMeans(C.JOB_HEAL);

		console.log('==Total Unit Count - Worker: ' + workerCount + ' Collector: ' + collectorCount + ' Guard: ' + guardCount + '/' + rangedGuardCount + ' Healer: ' + healerCount);

		//loop over spawns
		for (var x in Game.spawns)
		{
			//init local reference
			var spawn = Game.spawns[x];

			//-----------------------------------------------------------------
			// init manage spawning units, this should be called first
			spawnManager.manageSpawningInit(spawn);

			//-----------------------------------------------------------------
			// all individual task management functions and such should be called here in the middle

			// handle generic spawning needs
			spawnManager.manageSpawning(spawn);

			// manage energy collection
			spawnManager.manageCollection(spawn);

			//-----------------------------------------------------------------
			// TODO: UPDATE THIS! This will no longer work, needs to be extracted and rewritten
			//if spawnpoint has less than WORKER_THRESHOLD_MIN and there are builders around, then assign them to this spawn
			countJob=jobManager.countUnitsWithJob('build', '*', spawn.room.name)
			if (workerCount < WORKER_THRESHOLD_MIN && countJob)
			{
				var workers = spawn.room.find(FIND_MY_CREEPS);
				for (var y in workers)
				{
					var worker = workers[y];
					if (worker.memory.spawn != spawn.name && worker.memory.job == 'build')
					{
						worker.memory.spawn = spawn.name;
						worker.memory.job = C.JOB_HARVEST;
						console.log("+*+" + spawn.name + " assumed control of " + worker.name);
					}
				}
			 }

			//-----------------------------------------------------------------
			// sort and spawn spawn units - this should be called after all management functions
			if(Object.keys(Game.creeps).length<8)
			{
				spawnManager.sortAndSpawn(spawn);
				spawn.room.memory.isUpdateController = false;
			}
			else
			{
				spawn.room.memory.isUpdateController = true;
			}

		} // end looping over spawns
	};

	//-------------------------------------------------------------------------
	// top level helper functions

	// returns cost for an array of parts
	spawnManager.getCostParts = function (parts)
	{
		var result = 0;
		if (parts.length)
		{
			for (var x in parts)
			{
				result += spawnManager.costs[parts[x]];
			}
		}
		return result;
	};

	// get the first available spawn owned by player
	spawnManager.getAvailableSpawn = function ()
	{
		for (var x in Game.spawns)
		{
			if (!Game.spawns[x].spawning)
			{
				return Game.spawns[x];
			}
		}
		return false;
	};

	// spawn a unit
	spawnManager.spawnUnit = function (name, spawn)
	{
		if (spawn)
		{

			var spawnLevel = spawnManager.getSpawnLevel(spawn.room);
			var parts = units[name][spawnLevel].parts;
			var cost = spawnManager.getCostParts(parts);
			console.log('+Spawn(level ' + spawnLevel + ' ' + name + '): ' + spawn + ' Energy: ' + spawn.energy + '/' + cost);
			if (spawn.energy >= cost)
			{
				//set up the spawn
				var creepName = spawnManager.generateName(name);
				var m = units[name][spawnLevel].memory;
				m.spawn = spawn.name;
				//call creating the creep
				var ret = spawn.spawnCreep(parts, creepName, m);
				console.log('++Creating level ' + spawnLevel + ' creep ' + name + ' : ' + creepName+",parts="+parts+",ret="+ret);
			}
		}
		else
		{
			console.log('No available spawn');
		}
	};

	// generate a name for a spawn
	spawnManager.generateName = function (name)
	{
		var result = false;
		var x = 1;
		while (!result)
		{
			var found = false;
			var nameTry = name + '-' + x;
			for (var i in Game.creeps)
			{
				if (Game.creeps[i].name == nameTry)
				{
					found = true;
				}
			}
			if (!found)
			{
				return nameTry;
			}
			x++;
		}
	};

	// get level of units to spawn
	spawnManager.getSpawnLevel = function (room)
	{
		return 1;
		/*
		 var numSpawns = room.find(Game.MY_SPAWNS).length;
		 var numHarvester = jobManager.countUnitWithMeans(C.JOB_HARVEST, '*', room.name);
		 var numWarrior = jobManager.countUnitWithMeans(C.JOB_GUARD, '*', room.name);
		 numWarrior += jobManager.countUnitWithMeans(C.JOB_RANGED_GUARD, '*', room.name);

		 if (numSpawns < 2)
		 {
		 if (numHarvester <= WORKER_THRESHOLD_MIN && numWarrior <= GUARD_THRESHOLD_MIN)
		 return 1;
		 else
		 return 2;
		 }
		 else
		 {
		 if (numHarvester <= WORKER_THRESHOLD_MIN * 2 && numWarrior <= GUARD_THRESHOLD_MIN * 2)
		 return 2;
		 else
		 return 3;
		 }
		 */
	};

	//-------------------------------------------------------------------------
	// Spawn managing functions, these are called by .spawn()
	//-------------------------------------------------------------------------

	// this should be called first
	spawnManager.manageSpawningInit = function (spawn)
	{
		spawnManager.needs = [7];
		spawnManager.needs[C.JOB_NOTHING] = {'job': C.JOB_NOTHING , 'need': 0};
		spawnManager.needs[C.JOB_BUILD] = {'job': C.JOB_BUILD , 'need': 0};
		spawnManager.needs[C.JOB_COLLECT] = {'job': C.JOB_COLLECT , 'need': 0};
		spawnManager.needs[C.JOB_GUARD] = {'job': C.JOB_GUARD , 'need': 0};
		spawnManager.needs[C.JOB_HARVEST] = {'job': C.JOB_HARVEST , 'need': 0};
		spawnManager.needs[C.JOB_HEAL] = {'job': C.JOB_HEAL , 'need': 0};
		spawnManager.needs[C.JOB_RANGED_GUARD] = {'job': C.JOB_RANGED_GUARD , 'need': 0};
	};

	// Determines unit needs for spawn spawns units
	spawnManager.manageSpawning = function (spawn)
	{
		var sWorkerCount = jobManager.countUnitWithMeans(C.JOB_HARVEST , spawn.name);
		var sCollectorCount = jobManager.countUnitWithMeans(C.JOB_COLLECT , spawn.name);
		var sGuardCount = jobManager.countUnitWithMeans(C.JOB_GUARD , spawn.name);
		var sRangedGuardCount = jobManager.countUnitWithMeans(C.JOB_RANGED_GUARD , spawn.name);
		var sHealerCount = jobManager.countUnitWithMeans(C.JOB_HEAL , spawn.name);
		var sWarriorCount = sGuardCount + sRangedGuardCount;
		var sEnemyCount = spawn.room.find(FIND_HOSTILE_CREEPS).length;

		console.log('=' + spawn.name + ' Unit Count - Worker: ' + sWorkerCount + ' Collector: ' + sCollectorCount + ' Guard: ' + sGuardCount + '/' + sRangedGuardCount + ' Healer: ' + sHealerCount);

		//determine spawning needs

		//worker need
		if (sWorkerCount < WORKER_THRESHOLD_MIN)
		{
			spawnManager.needs[C.JOB_HARVEST].need = spawnManager.needs[C.JOB_HARVEST].need + (C.NEED_WEIGHT_CRITICAL * (WORKER_THRESHOLD_MIN - sWorkerCount));
		}

		//collector need
		spawnManager.needs[C.JOB_COLLECT].need = ((sWorkerCount * 2) - sCollectorCount) * C.NEED_WEIGHT_CRITICAL;

		//Guard need
		if (sGuardCount < GUARD_THRESHOLD_MIN)
		{
			spawnManager.needs[C.JOB_GUARD].need = spawnManager.needs[C.JOB_GUARD].need + (C.NEED_WEIGHT_HIGH * GUARD_THRESHOLD_MIN);
		}
		else
		{
			if (sGuardCount <= sRangedGuardCount)
			{
				spawnManager.needs[C.JOB_GUARD].need = spawnManager.needs[C.JOB_GUARD].need + C.NEED_WEIGHT_HIGH;
			}
			else
			{
				spawnManager.needs[C.JOB_GUARD].need = spawnManager.needs[C.JOB_GUARD].need + C.NEED_WEIGHT_MEDIUM;
			}
		}

		//rangedGuard need
		if (sGuardCount >= GUARD_THRESHOLD_MIN)
		{
			spawnManager.needs[C.JOB_RANGED_GUARD].need = spawnManager.needs[C.JOB_RANGED_GUARD].need + (C.NEED_WEIGHT_HIGH * RANGED_GUARD_THRESHOLD_MIN);
		}
		else
		{
			if (sRangedGuardCount <= sGuardCount)
			{
				spawnManager.needs[C.JOB_RANGED_GUARD].need = spawnManager.needs[C.JOB_RANGED_GUARD].need + C.NEED_WEIGHT_HIGH;
			}
		}

		//healer need
		if (sHealerCount < HEALER_THRESHOLD_MIN && sGuardCount >= GUARD_THRESHOLD_MIN)
		{
			spawnManager.needs[C.JOB_HEAL].need = spawnManager.needs[C.JOB_HEAL].need + (C.NEED_WEIGHT_CRITICAL * HEALER_THRESHOLD_MIN);
		}
		else
		{
			if (sHealerCount <= (sWarriorCount / 6))
			{
				spawnManager.needs[C.JOB_HEAL].need = spawnManager.needs[C.JOB_HEAL].need + C.NEED_WEIGHT_CRITICAL;
			}
		}

		//getting attacked need
		if ((sWarriorCount / 2) <= sEnemyCount)
		{
			if (sGuardCount < sRangedGuardCount)
			{
				spawnManager.needs[C.JOB_GUARD].need = spawnManager.needs[C.JOB_GUARD].need + (C.NEED_WEIGHT_CRITICAL * (2 * (sEnemyCount - sGuardCount)));
			}
			else
			{
				spawnManager.needs[C.JOB_RANGED_GUARD].need = spawnManager.needs[C.JOB_RANGED_GUARD].need + (C.NEED_WEIGHT_CRITICAL * (2 * (sEnemyCount - sRangedGuardCount)));
			}
		}
	};

	spawnManager.sortAndSpawn = function (spawn)
	{
		//sort needs and spawn based on what is highest
		var spawnLevel = spawnManager.getSpawnLevel(spawn.room);
		var sortedNeeds = spawnManager.needs;
		sortedNeeds.sort(function (a , b)
		{
			return b.need - a.need;
		});

		//console.log("job: " + sortedNeeds[0].job);

		var findunits = _.filter(units , function (f)
			{
				return f.jobId == sortedNeeds[0].job;
			}
		);

		//spawn the unit
		if (findunits && _.isArray(findunits) && findunits.length)
		{
			spawnManager.spawnUnit(findunits[0][spawnLevel].memory.name , spawn);
		}
		else
		{
			console.log('ERROR: failed to spawn!');
		}
	};

	spawnManager.manageSources = function (spawn)
	{
		//
	};

	// assigns collectors that are assigned to the collection job to specific pieces of energy to pick up
	spawnManager.manageCollection = function (spawn)
	{
		//Make sure the spawn.memory.energyCollection is an array
		if (!spawn.memory.energyCollection || !_.isArray(spawn.memory.energyCollection))
		{
			spawn.memory.energyCollection = [];
		}

		// make sure there is a spawn.memory.energyCollection record for all existing dropped energy pieces
		var droppedEnergy = spawn.room.find(FIND_DROPPED_RESOURCES);
		console.log('manageCollection:'+droppedEnergy);
		if (droppedEnergy && _.isArray(droppedEnergy))
		{
			
			// validate and update droppedEnergy vs energyCollection
			for (var x = 0; x < droppedEnergy.length; x++)
			{
				var de = droppedEnergy[x];
				console.log('Collection target:'+de.pos);
				var ei = _.findIndex(spawn.memory.energyCollection , function (e)
				{
					return e.id == de.id;
				});

				//console.log('EI: ' + ei);
				if (ei > 0)
				{ //update ec object
					var ec = spawn.memory.energyCollection[ei];
					if (ec)
					{
						ec.energy = de.energy;
						ec.time = Game.time;
					}
				}
				else
				{ //create ecobject
					var e = {};
					e.id = de.id;
					e.energy = de.energy;
					e.time = Game.time;
					spawn.memory.energyCollection.push(e);
				}
			}

			// clear out spawn.memory.energyCollection records that no longer have an associated dropped energy piece
			// either they were picked up or have despawned
			for (var x = spawn.memory.energyCollection.length - 1; x >= 0; x--)
			{
				if (spawn.memory.energyCollection[x].time != Game.time)
				{
					spawn.memory.energyCollection.splice(x , 1);
				}
			}

			//remove assignments for harvesters that do not exist or are not assigned to this spawn (they could have
			// been killed and the name reused)
			for (var x = 0; x < spawn.memory.energyCollection.length; x++)
			{
				var ec = spawn.memory.energyCollection[x];
				if (ec.collector)
				{
					var creep = Game.creeps[ec.collector];
					if (!creep)
					{
						spawn.memory.energyCollection[x].collector = null;
					}
					else if (creep.memory.collect != ec.id)
					{
						spawn.memory.energyCollection[x].collector = null;
					}
				}
			}

			//assign collectors ----------------------------------------------------------------------------------------

			// find collectors assigned to this spawn and not assigned to an energy drop and has energy capacity
			var collectors = spawn.room.find(FIND_MY_CREEPS , {
				filter: function (c)
				{
					return c.memory.spawn == spawn.name && !c.memory.collect && c.energy < c.energyCapacity;
				}
			});

			// loop over unassigned dropped energy units and assign them to unassigned collectors
			var next = 0;
			for (var e = 0; e < spawn.memory.energyCollection.length; e++)
			{
				if (!spawn.memory.energyCollection[e].collector && collectors[next])
				{
					collectors[next].memory.collect = spawn.memory.energyCollection[e].id;
					spawn.memory.energyCollection[e].collector = collectors[next].name;
					next++;
				}
			}

		}
		else
		{   //no dropped energy, clear spawn collection memory
			spawn.memory.energyCollection = [];
		}
	};

	//-------------------------------------------------------------------------
	//return populated object
	return spawnManager;
};