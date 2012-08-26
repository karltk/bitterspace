
NOP               = 1 // opval1,2 = 0
FORWARD           = 2 // opval1,2 = 0
TURN              = 3 // opval1 = number of 90-degree clockwise steps, opval2 = 0
BRANCH            = 4 // opval1 = entity category, opval2 = addr
MAX_INSTR         = 4

OPCODE = 0
OPVAL1 = 1
OPVAL2 = 2

CATEGORY_FOOD = 1
CATEGORY_FRIEND = 2
CATEGORY_ENEMY = 3

MAX_OBSERVABLE_ID = 3 

var INSTRUCTION_PROBABILITIES = [
                                 [ NOP, 2 ],
                                 [ FORWARD, 40 ],
                                 [ TURN, 40 ],
                                 [ BRANCH, 20 ]
                                ];

// Mutation probabilities
PROB_MUTATION_OPVAL      = 35; // Mutate opval
PROB_MUTATION_OPCODE     = 35; // Mutate opcode (try to keep opval)
PROB_MUTATION_INSERT_OP  = 20; // Insert [ opcode, opval ]
PROB_MUTATION_DELETE_OP  = 10; // Delete op

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

//Logger
var GENERAL  = 0;
var GENOME   = 1;
var MUTATION = 2;
var debug = function() {
	var watching = [ GENERAL ];
	var red   = '\033[31m';
	var blue  = '\033[34m';
	var reset = '\033[0m';

	var watchingDomain = function(domain)
	{
		return domain in watching;
	}

	var log = function(domain, text) {
		if (watchingDomain(domain))
			console.log(text);
	}
	var warn = function(domain, text) {
		if (watchingDomain(domain))
			console.log(blue+text+reset);
	}
	var error = function(domain, text) {
		if (watchingDomain(domain))
			console.log(red+text+reset);
	}
	var watch = function(domain)
	{
		watching.push(domain);
	}

	return {
		log:   log,
		warn:  warn,
		error: error,
		watch: watch,
	};
}();


var Genome = function() {
	this.maxInstrCount = 8;
	this.instructions = new Array();

	this.asJson = function() {
		return this.instructions;
	}
	
	this.fromJson = function(newInstructions) {
		this.instructions = newInstructions;
		this.maxInstrCount = newInstructions.length;
	}

	this.clone = function() {
		var clone = new Genome();
		clone.maxInstrCount = this.maxInstrCount;
		clone.instructions = new Array();

		for(var i = 0; i < this.instructions.length; i++) {
			var x = this.instructions[i];
			clone.instructions[i] = [ x[OPCODE], x[OPVAL1], x[OPVAL2] ];
		}
		return clone;
	}

	this.pickRandomOpCode = function(probs) {
		var x = Math.floor(Math.random() * probs.maxProbability);
		for(var i = probs.length - 1; i >= 0; i--)
			if(x >= probs[i].probabilityCutoff)
				return probs[i].opcode;
		throw "Bogus probability " + x + " out of " + probs.maxProbability;
	}

	this.generateRandomInstruction = function(maxInstrCount) {
		var opcode = this.pickRandomOpCode(CUMULATIVE_PROBABILITIES);
		var opval1 = 0;
		var opval2 = 0;
		if(opcode == BRANCH) {
			opval1 = Math.floor(Math.random() * MAX_OBSERVABLE_ID);
			opval2 = Math.floor(Math.random() * maxInstrCount);
		} else if(opcode == TURN)
			opval1 = Math.floor(Math.random() * 6 - 3);
		return [opcode, opval1, opval2];
	}

	this.populateAtRandom = function() {
		for(var i = 0; i < this.maxInstrCount; i++) {
			this.instructions[i] = this.generateRandomInstruction(this.maxInstrCount);
		}
		return this;
	};


	this.cloneWithMutations = function() {
		var clone = this.clone();

		var i = Math.random() * clone.instructions.length;
		clone.instructions[i] = this.generateRandomInstruction(clone.maxInstrCount);

		return clone;
	}

	this.mutateGenome = function() {
		var mutator = new Mutator(this);
		mutator.mutateGenome(this.instructions);
	}
	
};

var Mutator = function(genome) {
	
	this.genome = genome;

	this.mutateGenome = function(instructions) {
		var chance = Math.floor(Math.random() * 100);
				
		// FIXME: use probabilities above..
		if (chance < PROB_MUTATION_OPVAL) {
			var loc = this.mutateOpval(instructions);
			debug.log(MUTATION, "Mutated Opval at location: " + loc);
			
		} else if (chance < PROB_MUTATION_OPVAL + PROB_MUTATION_OPCODE) {
			var loc = this.mutateOpcode(instructions);
			debug.log(MUTATION, "Mutated Opcode at location: " + loc);
			
		} else if (chance < PROB_MUTATION_OPVAL + PROB_MUTATION_OPCODE + PROB_MUTATION_INSERT_OP) {
			var loc = this.insertOp(instructions);
			debug.log(MUTATION, "Inserted instruction at location: " + loc);
			
		} else {
			var loc = this.deleteOp(instructions);
			debug.log(MUTATION, "Deleted instruction at location: " + loc);
		}
	}

	this.randomLocation = function(instructions) {
		var loc = Math.floor(Math.random() * (instructions.length - 1));
		return loc;
	}

	this.mutateOpval = function(instructions) {
		var loc = this.randomLocation(instructions);
		this.mutateOpvalOnLocation(instructions, loc);
		return loc;
	}
	
	this.mutateOpvalOnLocation = function(instructions, loc) {
		var opcode = instructions[loc][OPCODE];
		var opval1 = 0;
		var opval2 = 0;
		
		if (opcode == TURN)
			opval1 = Math.floor(Math.random() * 6 - 3);
		else if (opcode == BRANCH) {
			opval1 = instructions[loc][OPVAL1]; // FIXME randomize
			opval2 = Math.floor(Math.random() * (instructions.length - 1));
		}
		
		instructions[loc][OPVAL1] = opval1;
		instructions[loc][OPVAL2] = opval2;
	}

	this.insertOp = function(instructions) {
		var loc = this.randomLocation(instructions);
		this.insertOpOnLocation(instructions, loc);
		return loc;
	}
	
	this.insertOpOnLocation = function(instructions, loc) {
		var newinstr = this.genome.generateRandomInstruction(instructions.length - 1);
		instructions.splice(loc, 0, newinstr);
		
		// Update pointers so that branching is unaffected:
		for (var i = 0; i < instructions.length; i++)
			if ((i != loc) && (instructions[i][OPCODE] == BRANCH) && (instructions[i][OPVAL2] >= loc))
				instructions[i][OPVAL2]++;
	}

	this.deleteOp = function(instructions) {
		
		// Don't delete last instruction..
		if (instructions.length == 1)
			return 0;
		
		var loc = this.randomLocation(instructions);
		this.deleteOpOnLocation(instructions, loc);
		return loc;
	}
	
	this.deleteOpOnLocation = function(instructions, loc) {
		instructions.splice(loc, 1);
		
		// Update pointers so that branching is unaffected:
		for (var i = 0; i < instructions.length; i++)
			if ((instructions[i][OPCODE] == BRANCH) && (instructions[i][OPVAL2] > loc))
				instructions[i][OPVAL2]--;
	}
	
	this.mutateOpcodeOnLocation = function(instructions, loc) {
		var oldinstr = instructions[loc];
		this.deleteOpOnLocation(instructions, loc);
		this.insertOpOnLocation(instructions, loc);
		
		var newinstr = instructions[loc];
		
		// Try to retain old OP val
		if (newinstr[OPCODE] <= FORWARD)
			instructions[loc][OPVAL2] = 0;
		else if (newinstr[OPCODE] == TURN)
			instructions[loc][OPVAL1] = Math.floor(Math.random() * 6 - 3);
		else if (newinstr[OPCODE] == BRANCH) {
			if (oldinstr[OPCODE] == BRANCH) {
				instructions[loc][OPVAL1] = oldinstr[OPVAL1];
				instructions[loc][OPVAL2] = oldinstr[OPVAL2];
			} else
				instructions[loc][OPVAL1] = this.randomLocation(instructions);
		}
	}
	
	this.mutateOpcode = function(instructions) {
		var loc = this.randomLocation(instructions);
		this.mutateOpcodeOnLocation(instructions, loc);
		return loc;
	}

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
	this.category = CATEGORY_FOOD;
	this.x = x;
	this.y = y;

	board.placeEntity(x, y, this);
}

var stringifyDirection = function(direction)
{
	switch ((direction+3) % 4 + 1) { // +3 == -1 mod 4
		case WEST:  return "WEST";
		case EAST:  return "EAST";
		case NORTH: return "NORTH";
		case SOUTH: return "SOUTH";
	}
	return "<ILLEGAL DIRECTION>";
}

var stringifyCategory = function(category) {
	switch(category) {
	case 0: return "UNCONDITIONALLY"
	case CATEGORY_FOOD: return "FOOD";
	case CATEGORY_FRIEND: return "FRIEND";
	case CATEGORY_ENEMY: return "ENEMY";
	throw "Unknown category";
	}
}

var stringifyInstruction = function(instruction)
{
	var opcode = instruction[OPCODE];
	var opval1 = instruction[OPVAL1];
	var opval2 = instruction[OPVAL2];

	switch(opcode) {
	case NOP:              return "NOP";
	case TURN:             return "TURN " + opval1 + " CW";
	case FORWARD:          return "FORWARD";
	case BRANCH:           return "BRANCH " + stringifyCategory(opval1) + " TO " + opval2;
	}

	return "<ILLEGAL INSTRUCTION>";
}

var Creature = function(x, y, enemy) {
	this.category = enemy ? CATEGORY_ENEMY : CATEGORY_FRIEND;
	this.x = x || 0;
	this.y = y || 0;
	this.direction = NORTH;
	this.generation = 0;
	this.genome = new Genome().populateAtRandom(); 
	this.ip = 0;
	this.rank = 0;
	this.enemyhits = 0;
	this.stepcounter = 0;
	var board = null;

	this.asJson = function() {
		return { genome: this.genome.asJson(), generation: this.generation };
	}
	
	this.clone = function() {
		var clone = new Creature(x, y);
		clone.x = this.x;
		clone.y = this.y;
		clone.category = this.category;
		clone.direction = this.direction;
		clone.generation = this.generation + 1;
		clone.genome = this.genome.clone();
		clone.ip = this.ip;
		clone.rank = this.rank;
		clone.enemyhits = this.enemyhits;
		clone.stepcounter = this.stepcounter;
		return clone;
	}
	
	this._lookFor = function(check, log) {
		var spotted = board.observe(this.x, this.y, this.direction);
		var found = false;
		if(spotted && check(spotted.category))
			found = true;
		debug.log(GENOME, log + " " + (found ? "taken" : "not taken"));
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
		this.enemyhits = 0;
		this.stepcounter = 0;
		this.x = x;
		this.y = y;
		this.ip = 0;
		this.direction = NORTH;
	}

	this.step = function() {
		this.stepcounter++;
		var instr = this.genome.instructions[this.ip];
		debug.log(GENOME, stringifyInstruction(instr));

		this.ip = (this.ip + 1) % this.genome.instructions.length;
		var opcode = instr[OPCODE];
		var opval1 = instr[OPVAL1];
		var opval2 = instr[OPVAL2];
		switch(opcode) {
		case NOP: {
			break;
		}
		case TURN: {
			this.direction += opval1;
			if(this.direction > WEST)
				this.direction -= WEST;
			if(this.direction < NORTH)
				this.direction += WEST;
			break;
		}
		case FORWARD: {
			var oldX = this.x;
			var oldY = this.y;
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
				debug.error(GENOME, "WTF? " + this.direction + " is not a valid direction");
			}
			this._wrapAroundXY();
			var tenant = board.getEntity(this.x, this.y);
			if(tenant && tenant.category === CATEGORY_FOOD) {
				this.rank += 1;
			} else if(tenant && tenant.category === CATEGORY_ENEMY) {
				this.rank = 0;
				this.enemyhits++;
				this.x = oldX;
				this.y = oldY;
			}
			board.placeEntity(oldX, oldY, null);
			board.placeEntity(this.x, this.y, this);
			break;
		}
		case BRANCH: 
			if(opval1 == 0) {
				// unconditional branch
				this.ip = opval2;
			} else {
				// conditional branch
				if(this._lookFor(function(category) { return category == opval1; }))
					this.ip = opval2;
			}
			break;
		default:
			debug.warning(GENOME, "Unsupported instruction " + opcode);

		}

	}
}

var Simulator = function(config) {

	var foodCount = config.foodCount;
	var enemyCount = config.enemyCount;
	var creatureCount = config.creatureCount;
	var maxX = config.width;
	var maxY = config.height;
	var newBoardEachGeneration = config.newBoardEachGeneration;
	
	var createRandomBoard = function() {
		var b = new Board(maxX, maxY);
		for(var i = 0; i < foodCount; i++) {
			var x = Math.floor(Math.random() * maxX);
			var y = Math.floor(Math.random() * maxY);

			new Food(x, y, b);
		}
		
		for(var i = 0; i < enemyCount; i++) {
			var x = Math.floor(Math.random() * maxX);
			var y = Math.floor(Math.random() * maxY);

			var c = new Creature(x, y, true);
			c.placeOnBoard(b);
		}
		
		return b;
	}

	var creatures = new Array();
	var enemies = new Array();
	var board = createRandomBoard();

	var getBoard = function() {
		return board.clone();
	}
	
	var createRandomCreature = function() {
		var x = Math.floor(Math.random() * maxX);
		var y = Math.floor(Math.random() * maxY);

		return new Creature(x, y);
	}

	var fillWithRandomCreatures = function() {
		for(var i = creatures.length; i < creatureCount; i++) {
			creatures[i] = createRandomCreature();
		}
	}
	
	var pushWithMutatedClones = function(target, creature, mutatedSiblingCount) {
		target.push(creature);
		for(var i = 0; i < mutatedSiblingCount; i++) {
			var c = creature.clone();
			c.genome.mutateGenome();
			target.push(c);
		}
	}

	var nextGeneration = function() {
		if (newBoardEachGeneration)
			board = createRandomBoard();

		var generationNext = new Array();
		
		creatures.sort(function(a, b) { return b.rank - a.rank; });
		
		var eliteCount = Math.floor(creatureCount * 10/100); 
		var trashCount = Math.floor(creatureCount * 20/100);
		
		creatures.slice(0, eliteCount).forEach(function(e) {
			pushWithMutatedClones(generationNext, e, 3);
		});
		
		creatures.slice(creatureCount - trashCount, trashCount).forEach(function (e) {
			pushWithMutatedClones(generationNext, e, 3);
		});
		
		creatures = generationNext;
		fillWithRandomCreatures();
	}

	var simulateAndRankOneGeneration = function(stepsPerGeneration) {
		nextGeneration();
		
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

	var getCreaturesByRank = function() {
		var creatureCount = creatures.length;
		var ranked = new Array();
		for(var i = 0; i < creatureCount; i++) {
			ranked[i] = creatures[i];
		}
		ranked.sort(function(a, b) { return b.rank - a.rank; });
		return ranked;
	}

	return {
		createRandomCreature: createRandomCreature,
		getCreaturesByRank: getCreaturesByRank,
		simulateAndRankOneGeneration: simulateAndRankOneGeneration,
		getBoard: getBoard
	}
}

var isNodeJS = (typeof window === 'undefined') && (typeof module !== 'undefined');

if (isNodeJS)
{
	//debug.watch(GENOME);

	var s = new Simulator({
		foodCount: 300,
		enemyCount: 100,
		creatureCount: 100,
		width: 100,
		height: 100,
		newBoardEachGeneration: false });
	
	var MAX_GENERATIONS = 10;
	for(var g = 0; g < MAX_GENERATIONS; g++) {
		s.simulateAndRankOneGeneration(100);
		var ranked = s.getCreaturesByRank();
		//console.log("" + ranked[0].genome.instructions);
		console.log(ranked.slice(0, 10).map(function(a) { return a.rank; }));
	}
	var ranked = s.getCreaturesByRank();
	console.log(ranked[0].asJson());
	
} else {

	var s = null;
	
	self.addEventListener("message", function(e) {

		var msg = e.data;

		if(msg.cmd == "init") {
			self.postMessage("Initializing simulator");
			s = new Simulator(msg);
			self.postMessage("Simulator initialized");
		} else if(msg.cmd == "new") {
			self.postMessage("Evolving new creature");
			for(var g = 0; g < msg.generations; g++) {
				s.simulateAndRankOneGeneration(msg.stepsPerGeneration);
			}
			
			var ranked = s.getCreaturesByRank();
			self.postMessage("New creature evolved")
			self.postMessage({cmd:"new", result: ranked[0].asJson()});
		}
	});

}
