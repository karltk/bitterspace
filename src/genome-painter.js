var GenomePainter = function(canvas, history)
{
	var sizeX = 200;
	var sizeY = 100;

	var clear = function() {
		var ctx = canvas.getContext('2d');
		canvas.width  = sizeX;
		canvas.height = sizeY;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}
	
	var paint = function() {
		
		clear();
		
		var ctx = canvas.getContext('2d');
		ctx.save();
		ctx.strokeWidth = '1px';
		for(var g = 0; g < history.length; g++) {
			for(var i = 0; i < history[g].length; i++) {
				var c = String.fromCharCode("a".charCodeAt(0) + history[g][i][OPCODE]);
				
				ctx.strokeStyle = '#' + c + c + c;
				console.log(ctx.strokeStyle);
				ctx.fillRect(g, i * 2, 1, 1 * 2);
			}
		}
		ctx.restore();
	}
	
	return { paint: paint };
}