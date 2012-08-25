
// 1 - NOP
// 2 - FORWARD
// 3 - TURN_LEFT
// 4 - 

NOP               = 1 // opval = 0
FORWARD           = 2 // opval = 0
TURN_LEFT         = 3 // opval = 0
BRANCH_IF_ENEMY   = 4 // opval = addr
BRANCH_IF_FRIEND  = 5 // opval = addr
BRANCH_IF_FOOD    = 6 // opval = addr
BRANCH            = 7 // opval = addr
MAX_INSTR         = 7

var Genome = function() {
	this.maxInstrCount = 5;
	this.instructions = new Array();
	
	this.populateAtRandom = function() {
		for(var i = 0; i < this.maxInstrCount; i++) {
			var opcode = Math.floor(Math.random() * MAX_INSTR + 1);
			var opval = 0;
			if(opcode >= BRANCH_IF_ENEMY && opcode <= BRANCH)
				opval = Math.floor(Math.random() * this.maxInstrCount);
			this.instructions[i] = [opcode, opval];
		}
		return this;
	};
};

NORTH = 1;
EAST = 2;
SOUTH = 3;
WEST = 4;

var Creature = function(x, y, maxX, maxY) {
	this.x = x || 0;
	this.y = y || 0;
	this.maxX = maxX || 100;
	this.maxY = maxY || 100;
	this.direction = WEST;
	this.generation = 0;
	this.genome = new Genome().populateAtRandom(); 
	this.ip = 0;

	// FIXME should not be on "this"
	this._clampXY = function() {
		if(this.x < 0)
			this.x += this.maxX;
		if(this.x > this.maxX)
			this.x -= this.maxX;
		if(this.y < 0)
			this.y += this.maxY;
		if(this.y > this.maxY)
			this.maxY += this.maxY;
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
		  case TURN_LEFT: {
			  this.direction -= 1;
			  if(this.direction == 0)
				  this.direction = WEST;
			  console.log("TURN_LEFT");
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
		  case BRANCH_IF_ENEMY:
			  	console.log("BRANCH_IF_ENEMY not implemented");
			  	break;
		  case BRANCH_IF_FRIEND:
			  	console.log("BRANCH_IF_FRIEND not implemented");
			  	break;
		  case BRANCH_IF_FOOD:
		  	console.log("BRANCH_IF_FOOD not implemented");
			break;
		  case BRANCH: 
			  console.log("BRANCH");
			  this.ip = opval;
			  break;
  		default:
  			console.log("Unsupported instruction " + opcode);
			  
		}
		
	}
}

var c = new Creature();
console.log(c)
for(var i = 0; i < 10; i++)
	c.step();
console.log(c)
