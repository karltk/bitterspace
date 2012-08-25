
NOP               = 1 // opval = 0
FORWARD           = 2 // opval = 0
TURN              = 3 // opval = number of 90-degree clockwise steps
BRANCH_IF_ENEMY   = 4 // opval = addr
BRANCH_IF_FRIEND  = 5 // opval = addr
BRANCH_IF_FOOD    = 6 // opval = addr
BRANCH            = 7 // opval = addr
MAX_INSTR         = 7

var INSTRUCTION_PROBABILITIES = [
                                 [ NOP, 2 ],
                                 [ FORWARD, 40 ],
                                 [ TURN, 30 ],
                                 [ BRANCH_IF_ENEMY, 5 ],
                                 [ BRANCH_IF_FRIEND, 5],
                                 [ BRANCH_IF_FOOD, 5 ],
                                 [ BRANCH, 5]
                                 ];

var Genome = function() {
	this.maxInstrCount = 5;
	this.instructions = new Array();

	var prepareProbabilities = function() {
		var ls = new Array();
		var cum = 0;
		for(var i = 0; i < INSTRUCTION_PROBABILITIES.length; i++) {
			var opcode = INSTRUCTION_PROBABILITIES[i][0];
			var prob = INSTRUCTION_PROBABILITIES[i][1];
			ls[i] = { "probabilityCutoff" : cum, "opcode" : opcode };
			cum += prob;
		}
		ls.maxProbability = cum;
		return ls;
	} 

	var pickRandomOpCode = function(probs) {
		var x = Math.floor(Math.random() * probs.maxProbability);
		for(var i = probs.length - 1; i >= 0; i--)
			if(x >= probs[i].probabilityCutoff)
				return probs[i].opcode;
		throw "Bogus probability " + x + " out of " + probs.maxProbability;
	}
	
	this.populateAtRandom = function() {
		var probs = prepareProbabilities();
		console.log(probs);
		for(var i = 0; i < this.maxInstrCount; i++) {
			var opcode = pickRandomOpCode(probs);;
			var opval = 0;
			if(opcode >= BRANCH_IF_ENEMY && opcode <= BRANCH)
				opval = Math.floor(Math.random() * this.maxInstrCount);
			else if(opcode == TURN)
				opval = Math.floor(Math.random() * 6 - 3);
			this.instructions[i] = [opcode, opval];
		}
		return this;
	};
};

NORTH = 1;
EAST = 2;
SOUTH = 3;
WEST = 4;

var Board = function(maxX, maxY) {
	this.maxX = maxX;
	this.maxY = maxY;
	this.cells = new Array();
	
	for(var y = 0; y < maxY; y++) {
		this.cells[y] = new Array();
		for(var x = 0; x < maxX; x++) {
			this.cells[y][x] = null;
		}
	}
	
	this.placeEntity = function(x,y, entity) {
		this.cells[y][x] = entity;
	}
	
	this.observe = function(x, y, direction) {
		switch(direction) {
		case WEST:
		case EAST:
			var delta = direction == WEST ? -1 : 1; 
			for(var dx = 1; dx < this.maxX; dx++) {
				var ax = (dx * delta + x + this.maxX) % this.maxX;
				if(this.cells[y][ax]) {
					return this.cells[y][ax];
				}
			}
		}
		return null;
	}
}

var Food = function(x, y, board) {
	this.type = "food";
	this.x = x;
	this.y = y;
	
	board.placeEntity(x, y, this);
}

var Creature = function(x, y, board, team) {
	this.type = "creature";
	this.x = x || 0;
	this.y = y || 0;
	this.direction = WEST;
	this.generation = 0;
	this.genome = new Genome().populateAtRandom(); 
	this.ip = 0;
	this.team = team || 0;

	board.placeEntity(x, y, this);
	
	// FIXME should not be on "this"
	this._clampXY = function() {
		if(this.x < 0)
			this.x += board.maxX;
		if(this.x >= board.maxX)
			this.x -= board.maxX;
		if(this.y < 0)
			this.y += board.maxY;
		if(this.y >= board.maxY)
			this.y += board.maxY;
	}

	this.step = function() {
		var instr = this.genome.instructions[this.ip];
		this.ip = (this.ip + 1) % (this.genome.instructions.length - 1);
		var opcode = instr[0];
		var opval = instr[1];
		switch(opcode) {
		case NOP: {
			console.log("NOP");
			break;
		}
		case TURN: {
			this.direction += opval;
			if(this.direction > WEST)
				this.direction -= WEST;
			if(this.direction < NORTH)
				this.direction += WEST;
			console.log("TURN " + opval);
			break;
		}
		case FORWARD:
			switch(this.direction) {
			case WEST: { 
				this.x -= 1;
				break;
			}
			case EAST: {
				this.x += 1;
				break;
			}
			case NORTH: {
				this.y -= 1;
				break;
			}
			case SOUTH: { 
				this.y += 1;
				break;
			}
			default:
				console.log("WTF? " + this.direction + " is not a valid direction");
			}
			this._clampXY();
			console.log("FORWARD");
			break;
		case BRANCH_IF_ENEMY: {
			var spotted = board.observe(this.x, this.y, this.direction);
			var oldip = this.ip;
			if(spotted && spotted.type == "creature" && spotted.team != this.team) 
				this.ip = opval;
			console.log("BRANCH_IF_ENEMY " + (oldip != this.ip ? "taken" : "not taken"));
			break;
		}
		case BRANCH_IF_FRIEND:
			console.log("BRANCH_IF_FRIEND not implemented");
			break;
		case BRANCH_IF_FOOD: {
			var spotted = board.observe(this.x, this.y, this.direction);
			var oldip = this.ip;
			if(spotted && spotted.type == "food" && spotted.team != this.team) 
				this.ip = opval;
			console.log("BRANCH_IF_FOOD " + (oldip != this.ip ? "taken" : "not taken"));
			break;
		}
		case BRANCH: 
			console.log("BRANCH");
			this.ip = opval;
			break;
		default:
			console.log("Unsupported instruction " + opcode);

		}

	}
}

var b = new Board(100, 100);
var f = new Food(10, 10, b);
var c = new Creature(11, 10, b);
console.log(c)
for(var i = 0; i < 10; i++)
	c.step();
console.log(c)
