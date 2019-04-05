var jobHelpers = require('jobHelpers')();

module.exports = function ()
{
	//declare base object
	var jobHarvest = function ()
	{
	};
	//-------------------------------------------------------------------------

	jobHarvest.work = function (creep)
	{
		//avoid hostiles
		if (jobHelpers.avoidHostile(creep))
		{
			return;
		}

		//continue if no nearby hostiles
		if (creep.carryCapacity === 0 || creep.carry.energy < creep.carryCapacity)
		{
			var sources = creep.pos.findClosestByPath(FIND_SOURCES, {
				filter: function (t)
				{
					return t.energy > 0
				}
			});
			creep.moveTo(sources);
			creep.harvest(sources);
			console.log(creep.name+" harvest");
		}
		else
		{
			var target = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
			console.log(creep.name+" withdraw:energy="+creep.carry.energy+",energyCapacity="+creep.carryCapacity+',target='+target);
			var ret = creep.transfer(target, RESOURCE_ENERGY);
			if(ret === ERR_NOT_IN_RANGE){
				console.log(creep.name+" not in range,move To:"+target);
                creep.moveTo(target, {visualizePathStyle: {stroke: 'blue'}});
                return;
            }
			else if(ret != OK)
			{
				console.log(creep.name+" withdraw fail:"+ret);
			}
			
		}
	};
	//-------------------------------------------------------------------------
	//return populated object
	return jobHarvest;
};