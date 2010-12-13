// S. Tokumine 
// Highspeed tileserver using node.js and cairo. Configured as a replacement for Gmaps.

// Configure app
var express = require('express')
 , pg       = require('pg')
 , d        = require('./global_mercator')
 , mercator = new GlobalMercator()
 , sys      = require('sys')
 , app      = express.createServer()
 , puts     = sys.puts
 , size_x   = 256
 , size_y   = 256
 , Canvas   = require('canvas')
 , canvas   = new Canvas(size_x, size_y)
 , ctx      = canvas.getContext('2d')
 , db_str   = "pg://postgres@localhost:5432/test_points"
 , sql      = "select y(the_geom) as y,x(the_geom) as x from points9 where the_geom && v_get_tile($1, $2, $3) group by y, x";

// Configure Canvas Google Dot style    
ctx.patternQuality = 'fast';
ctx.antialias      = 'none';
var imgd = new Canvas.Image();
imgd.src = 'todo/images/google_point_8.png'

// Middleware
app.use(express.logger({ format: '\x1b[90m:remote-addr\x1b[0m - \x1b[33m:method\x1b[0m :url :status \x1b[90m:response-timems\x1b[0m' }));
app.use(express.bodyDecoder());
app.use(app.router);
app.use(express.errorHandler({ showStack: true }));

//DB
var client = new Client(db_str);
client.connect();

//routes
app.get('/', function(req, res){
  
  // Clear canvas for render
  ctx.clearRect(0,0,size_x,size_y)

  // Parse arguments
  x = (req.query.x) ? req.query.x : "0"
  y = (req.query.y) ? req.query.y : "0"
  z = (req.query.z) ? req.query.z : "10"
        
  // Call SQL
	query = client.query({
	    text: sql,
	    name: 'generate_points',
	    values: [x,y,z]
	});
  
	// Configure SQL callbacks
	query.on('row', function(row) {
    p_xy = mercator.MetersToPixels(parseFloat(row[i].x),parseFloat(row[i].y),parseInt(z)) 
    x = p_xy[0]%size_x;
    y = size_y-(p_xy[1]%size_y);
    ctx.drawImage(imgd, x,y);       		
	});

	query.on('end', function(){
		res.send("<img src='" + canvas.toDataURL() + "'>");
	});
    
});

app.listen('3000');
console.log('Test server listening on port %d', app.address().port);