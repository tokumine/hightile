// Configure app requirements
var express = require('express')
 , app = express.createServer()
 , Canvas = require('canvas')
 , size_x = 256
 , size_y = 256
 , canvas = new Canvas(size_x, size_y)
 , ctx = canvas.getContext('2d');

// Middleware
app.use(express.logger({ format: '\x1b[90m:remote-addr\x1b[0m - \x1b[33m:method\x1b[0m :url :status \x1b[90m:response-timems\x1b[0m' }));
app.use(express.bodyDecoder());
app.use(express.errorHandler({ showStack: true }));

//routes
app.get('/', function(req, res){
	ctx.fillStyle = '#ff6666';
	ctx.strokeStyle = "#000";
	ctx.clearRect(0,0,size_x,size_y)
	
	// Draw 20 circles at random within limits
	for (i=0;i<20;i++){
		x = rand(size_x);
		y = rand(size_y);
    ctx.beginPath();
    ctx.arc(x,y,4,0,6.28318531,true);
    ctx.fill();
		ctx.stroke();				
	}
	
	
	res.send('<img src="' + canvas.toDataURL() + '" />');
});

app.listen('3000');
console.log('Test server listening on port %d', app.address().port);



function rand ( n )
{
 return ( Math.floor ( Math.random ( ) * n + 1 ) );
}