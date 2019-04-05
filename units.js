module.exports =
{
	"worker": {
		"jobId": 4 ,
		1: {
			"parts": [WORK, WORK, CARRY, MOVE],
			"memory": {
				"name": "worker",
				"level": 1
			}
		}
	},
	"collector": {
		"jobId": 2 ,
		1: {
			"parts": [WORK, CARRY, MOVE],
			"memory": {
				"name": "collector" ,
				"level": 1
			}
		}
	},
	"guard": {
		"jobId": 3 ,
		1: {
			"parts": [TOUGH, ATTACK, ATTACK, ATTACK, MOVE],
			"memory": {
				"name": "guard",
				"level": 1
			}
		}
	},
	"healer": {
		"jobId": 5 ,
		1: {
			"parts": [TOUGH, HEAL, HEAL, HEAL, MOVE],
			"memory": {
				"name": "healer",
				"level": 1
			}
		}
	},
	"archer": {
		"jobId": 6 ,
		1: {
			"parts": [RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, MOVE],
			"memory": {
				"name": "archer",
				"level": 1
			}
		}
	}
};