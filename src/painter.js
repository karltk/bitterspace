var Painter = function(canvas, board)
{
	var tilesize = 14;
	var sizex = board.maxX;
	var sizey = board.maxY;

	var clear = function()
	{
		var ctx = canvas.getContext('2d');
		canvas.width  = sizex * tilesize+1;
		canvas.height = sizey * tilesize+1;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.strokeStyle = '#ccc';
		ctx.strokeWidth = '1px';
		for (var y = 0; y < sizey; ++y)
			for (var x = 0; x < sizex; ++x)
			{
				ctx.strokeRect(x * tilesize+0.5, y * tilesize+0.5, tilesize, tilesize);
			}
	}
	
	var drawCreature = function(x, y, creature)
	{
		if (x != creature.x || y != creature.y)
			alert( "x != creature.x || y != creature.y");

		var color = creature.category == CATEGORY_FRIEND ? '#DEA863' : '#4E6A82';
		var orientation = creature.direction;

		var ctx = canvas.getContext('2d');
		var cx = tilesize * x + Math.floor(tilesize / 2);
		var cy = tilesize * y + Math.floor(tilesize / 2);

		//ctx.strokeStyle = color;
		ctx.save();
		ctx.translate(cx, cy);
		ctx.rotate(orientation * Math.PI/2);
		ctx.fillStyle = color;
		ctx.beginPath();
		var f = Math.floor(tilesize / 3);
		ctx.moveTo( f, -f);
		ctx.lineTo( f,  f);
		ctx.lineTo(-f,  0);
		ctx.closePath();
		//ctx.stroke();
		ctx.fill();
		ctx.restore();
	}

	var drawFood = function(x, y)
	{
		var ctx = canvas.getContext('2d');
		var cx = tilesize * x + Math.floor(tilesize / 2);
		var cy = tilesize * y + Math.floor(tilesize / 2);

		ctx.save();
		ctx.translate(cx, cy);
		ctx.fillStyle = '#C25C31';
		ctx.beginPath();
		var rad = Math.floor(tilesize / 3);
		ctx.arc(0, 0, rad, 0, 2*Math.PI, true);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}

	var paint = function()
	{
		clear();
		for (var y = 0; y < sizey; ++y)
		for (var x = 0; x < sizex; ++x)
		{
			var entity = board.cells[y][x];
			if (entity)
			{
				if (entity.category == CATEGORY_FOOD)
					drawFood(x, y);
				else if (entity.category == CATEGORY_FRIEND || entity.category == CATEGORY_ENEMY)
					drawCreature(x, y, entity);
				else 
					console.log("Unknown entity category " + entity.category);
			}
		}
	}

	return {
		clear: clear,
		drawCreature: drawCreature,
		drawFood: drawFood,
		paint: paint,
	};
};

