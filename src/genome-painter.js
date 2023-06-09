var GenomePainter = function(canvas, history)
{
	var sizeX = 500;
	var sizeY = 100;

	var INSTR_COLORS = new Array();
	INSTR_COLORS[NOP] = '#334433';
	INSTR_COLORS[FORWARD] = '#0055bb';
	INSTR_COLORS[TURN] = '#225533';
	INSTR_COLORS[BRANCH] = '#aacccc';
	
	var clear = function() {
		var ctx = canvas.getContext('2d');
		canvas.width  = sizeX;
		canvas.height = sizeY;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		ctx.strokeStyle = '#ccc';
		ctx.strokeWidth = '1px';
		ctx.strokeRect(0, 0, canvas.width, canvas.height);
	}
	
	var paint = function() {
		
		clear();
		
		var ctx = canvas.getContext('2d');
		ctx.save();
		ctx.strokeWidth = '1px';
		for(var g = 0; g < history.length; g++) {
			for(var i = 0; i < history[g].length; i++) {
				var c = history[g][i][OPCODE];
				ctx.fillStyle = INSTR_COLORS[c];
				ctx.fillRect(g*3 + 1, i * 4 + 1, 2, 1 * 4);
			}
		}
		ctx.restore();
	}
	
	return { paint: paint };
}