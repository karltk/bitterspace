var Painter = function(sizex, sizey)
{
	var tilesize = 14;

	var clear = function(canvas)
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

	var drawCreature = function(canvas, creature) //x, y, color, orientation)
	{
		var x = creature.x;
		var y = creature.y;
		var color = creature.team == 0 ? '#DEA863' : '#4E6A82';
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

	var drawFood = function(canvas, x, y)
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

	return {
		clear: clear,
		drawCreature: drawCreature,
		drawFood: drawFood,
	};
};

