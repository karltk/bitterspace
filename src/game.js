
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
                                 [ TURN, 40 ],
                                 [ BRANCH_IF_ENEMY, 5 ],
                                 [ BRANCH_IF_FRIEND, 5],
                                 [ BRANCH_IF_FOOD, 5 ],
                                 [ BRANCH, 5]
                                 ];

//FIXME prettify
MUTATION_OPCODE = 1;
MUTATION_OPVAL = 2;
MUTATION_INSERT_OP = 3;
MUTATION_DELTE_OP = 4;

var MUTATION_PROBABILITIES = [
                              [ MUTATION_OPCODE, 35 ],
                              [ MUTATION_OPVAL, 35]
                              [ MUTATION_INSERT_OP, 15 ],
                              [ MUTATION_DELTE_OP, 15]
                              ];

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

var CUMULATIVE_PROBABILITIES = prepareProbabilities();


var Genome = function() {
	this.maxInstrCount = 5;
	this.instructions = new Array();
	this.mutator = new Mutator();


	this.clone = function() {
		var clone = new Genome();
		clone.maxInstrCount = this.maxInstrCount;
		clone.instructions = new Array();

		for(var i = 0; i < this.instructions.length; i++) {
			var x = this.instructions[i];
			clone.instructions[i] = [ x[0], x[1] ];
		}
		return clone;
	}
	
	var pickRandomOpCode = function(probs) {
		var x = Math.floor(Math.random() * probs.maxProbability);
		for(var i = probs.length - 1; i >= 0; i--)
			if(x >= probs[i].probabilityCutoff)
				return probs[i].opcode;
		throw "Bogus probability " + x + " out of " + probs.maxProbability;
	}

	var generateRandomInstruction = function(maxInstrCount) {
		var opcode = pickRandomOpCode(CUMULATIVE_PROBABILITIES);
		var opval = 0;
		if(opcode >= BRANCH_IF_ENEMY && opcode <= BRANCH)
			opval = Math.floor(Math.random() * maxInstrCount);
		else if(opcode == TURN)
			opval = Math.floor(Math.random() * 6 - 3);
		return [opcode, opval];
	}

	this.populateAtRandom = function() {
		for(var i = 0; i < this.maxInstrCount; i++) {
			this.instructions[i] = generateRandomInstruction(this.maxInstrCount);
		}
		return this;
	};


	this.cloneWithMutations = function() {
		var clone = this.clone();
		
		var i = Math.random() * clone.instructions.length;
		clone.instructions[i] = generateRandomInstruction(clone.maxInstrCount);

		return clone;
	}

	this.mutateGenome = function() {
		// check mutation probabilities........
		this.mutateOpcode();
	}

	this.mutateOpcode = function() {
		console.log("Mutation!");
		console.dir({"Old genome": this.instructions})
		// Change opcode
		var index = Math.floor(Math.random() * (this.instructions.length - 1));
		console.log("Changing index " + index);
		var oldop = this.instructions[index];
		var probs = prepareProbabilities();
		var newopcode = pickRandomOpCode(probs);
		var newopval = 0;

		// Retain op val?
		if (newopcode <= FORWARD)
			newopval = 0;
		else if (newopcode == TURN)
			newopval = Math.floor(Math.random() * 6 - 3);
		else if (newopcode >= TURN) {
			// Keep old op val or not..
			if (oldop[0] >= TURN)
				newopval = oldop[1];
			else
				newopval = Math.floor(Math.random() * this.maxInstrCount);
		}

		this.instructions[index] = [newopcode, newopval];

		console.log("Changed " + oldop[0] + " to " + newopcode);
		console.dir({"New genome": this.instructions})
	}

	this.mutateOpval = function() {

	}

	this.mutateInsert = function() {

	}

	this.mutateDelete = function() {

	}
};

var Mutator = function() {


}

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
	
	this.clone = function() {
		var clone = new Board();
		clone.maxX = this.maxX;
		clone.maxY = this.maxY;
		clone.cells = new Array();
		for(var y = 0; y < maxY; y++) {
			clone.cells[y] = new Array();
			for(var x = 0; x < maxX; x++) {
				clone.cells[y][x] = this.cells[y][x];
			}
		}
		return clone;
	}
	
	this.placeEntity = function(x,y, entity) {
		this.cells[y][x] = entity;
	}

	this.getEntity = function(x, y) {
		return this.cells[y][x];
	}
	
	this.observe = function(x, y, direction) {
		switch(direction) {
		case WEST:
		case EAST: {
			var delta = direction == WEST ? -1 : 1; 
			for(var dx = 1; dx < this.maxX; dx++) {
				var ax = (dx * delta + x + this.maxX) % this.maxX;
				if(this.cells[y][ax]) {
					return this.cells[y][ax];
				}
			}
			break;
		}
		case NORTH:
		case SOUTH: {
			var delta = direction == NORTH ? -1 : 1; 
			for(var dy = 1; dy < this.maxY; dy++) {
				var ay = (dy * delta + y + this.maxY) % this.maxY;
				if(this.cells[ay][x]) {
					return this.cells[ay][x];
				}
			}
			break;
		}
		default:
			throw "!!! Weird direction " + direction;
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

var Creature = function(x, y, team) {
	this.type = "creature";
	this.x = x || 0;
	this.y = y || 0;
	this.direction = NORTH;
	this.generation = 0;
	this.genome = new Genome().populateAtRandom(); 
	this.ip = 0;
	this.team = team || 0;
	this.rank = 0;
	var board = null;

	this._lookFor = function(check, log) {
		var spotted = board.observe(this.x, this.y, this.direction);
		var found = false;
		if(spotted && check(spotted.type, spotted.team))
			found = true;
		console.log(log + " " + (found ? "taken" : "not taken"));
		return found;
	}

	// FIXME should not be on "this"
	this._wrapAroundXY = function() {
		if(this.x < 0)
			this.x += board.maxX;
		if(this.x >= board.maxX)
			this.x -= board.maxX;
		if(this.y < 0)
			this.y += board.maxY;
		if(this.y >= board.maxY)
			this.y -= board.maxY;
	}

	this.placeOnBoard = function(leBoard) {
		board = leBoard;
		board.placeEntity(this.x, this.y, this);
	}
	
	this.reset = function() {
		this.rank = 0;
		this.x = x;
		this.y = y;
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
		case FORWARD: {
			board.placeEntity(this.x, this.y, null);
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
			this._wrapAroundXY();
			var tenant = board.getEntity(this.x, this.y);
			if(tenant && tenant.type === "food") {
				this.rank += 1;
			} 
			board.placeEntity(this.x, this.y, this);
			console.log("FORWARD");
			break;
		}
		case BRANCH_IF_ENEMY: {
			if(this._lookFor(function(type, team) { return type == "creature" && team == this.team }, "BRANCH_IF_ENEMY"))
				this.ip = opval;
			break;
		}
		case BRANCH_IF_FRIEND: {
			if(this._lookFor(function(type, team) { return type == "creature" && team == this.team }, "BRANCH_IF_FRIEND"))
				this.ip = opval;
			break;
		}
		case BRANCH_IF_FOOD: {
			if(this._lookFor(function(type, team) { return type == "food" }, "BRANCH_IF_FOOD"))
				this.ip = opval;
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

var Simulator = function(foodCount, creatureCount, maxX, maxY) {

	var createRandomBoard = function(foodCount, maxX, maxY) {
		var b = new Board(maxX, maxY);
		for(var i = 0; i < foodCount; i++) {
			var x = Math.floor(Math.random() * maxX);
			var y = Math.floor(Math.random() * maxY);

			new Food(x, y, b);
		}
		return b;
	}

	var board = createRandomBoard(foodCount, maxX, maxY);
	var creatures = new Array();
	
	var createRandomCreature = function() {
		var x = Math.floor(Math.random() * maxX);
		var y = Math.floor(Math.random() * maxY);

		return new Creature(x, y);
	}

	var fillWithRandomCreatures = function(b) {
		for(var i = creatures.length; i < creatureCount; i++) {
			creatures[i] = createRandomCreature(b);
		}
	}
	
	var simulateAndRankOneGeneration = function(stepsPerGeneration) {
		
		for(var i = 0; i < creatureCount; i++) {
			var b = board.clone();
			var c = creatures[i];
			
			c.reset();
			c.placeOnBoard(b);
			
			for(var step = 0; step < stepsPerGeneration; step++) {
				c.step();
			}
		}
	}

	var nextGeneration = function() {
		creatures.sort(function(a, b) { return b.rank - a.rank; });
		var sz = Math.floor(creatureCount / 2)
		creatures = creatures.slice(1, sz);
		fillWithRandomCreatures();
	}
	
	var getCreaturesByRank = function() {
		var creatureCount = creatures.length;
		var ranked = new Array();
		for(var i = 0; i < creatureCount; i++) {
			ranked[i] = creatures[i];
		}
		ranked.sort(function(a, b) { return b.rank - a.rank; });
		return ranked;
	}

	fillWithRandomCreatures();
	
	return {
		getCreaturesByRank: getCreaturesByRank,
		simulateAndRankOneGeneration: simulateAndRankOneGeneration,
		nextGeneration: nextGeneration
	}
}

var s = new Simulator(300, 100, 100, 100);

var creaturePerformance = new Array(); 
var MAX_GENERATIONS = 2; //00;
for(var g = 0; g < MAX_GENERATIONS; g++) {
	s.simulateAndRankOneGeneration(100);
	s.nextGeneration();
}
//console.log(creaturePerformance);
var ranked = s.getCreaturesByRank();

console.log(ranked.slice(1, 10).map(function(a) { return a.rank; }));
