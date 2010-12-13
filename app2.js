// S. Tokumine 
// Highspeed tileserver using node.js and cairo. Configured as a replacement for Gmaps.

// Helpers
var p = function () {
    puts(sys.inspect.apply(this, arguments));
}

function rand ( n )
{
 return ( Math.floor ( Math.random ( ) * n + 1 ) );
}


// Configure app
var express = require('express')
 , pg				= require('pg')
 , d				= require('./global_mercator')
 , mercator = new GlobalMercator()
 , sys 			= require('sys')
 , app 			= express.createServer()
 , puts 		= sys.puts
 , size_x 	= 256
 , size_y 	= 256
 , Canvas 	= require('canvas')
 , canvas 	= new Canvas(size_x, size_y)
 , ctx 			= canvas.getContext('2d');

// Configure Canvas Google Dot style		
// ctx.fillStyle 		 = '#ff6666';
// ctx.strokeStyle 	 = "#000";
ctx.patternQuality = 'fast';
ctx.antialias 		 = 'none';

// Draw point image
//imgd = ctx.createImageData(9,9);
// pix = imgd.data;				

// for (var i = 0; n = pix.length, i < n; i += 4) {
//   pix[i  ] = 255; // red channel
//   pix[i+3] = 127; // alpha channel
// }

var imgd = new Canvas.Image();
imgd.src = 'todo/images/google_point.png'

// DB connection
// var c = postgres.createConnection("host='' dbname=test_points user=postgres");

// Middleware
app.use(express.logger({ format: '\x1b[90m:remote-addr\x1b[0m - \x1b[33m:method\x1b[0m :url :status \x1b[90m:response-timems\x1b[0m' }));
app.use(express.bodyDecoder());
app.use(app.router);
app.use(express.errorHandler({ showStack: true }));

//routes
app.get('/', function(req, res){
	start    = new Date;
	
	// Parse arguments
	x = (req.query.x) ? req.query.x : "0"
	y = (req.query.y) ? req.query.y : "0"
	z = (req.query.z) ? req.query.z : "10"
	
	// Build SQL
	sql = "select y(the_geom) as y,x(the_geom) as x from points9 where the_geom && v_get_tile($1, $2, $3) group by y, x"
			
	console.log('Pre SQL: %dms', new Date - start);			
	start = new Date
	// Call SQL and pass off callback for render
	pg.connect("pg://postgres@localhost:5432/test_points", function(err, client) {
	  if(err) {
	    //handle connection error
	  }
	  else {
			client.query(sql,[x,y,z], function (err, result) {		
			  if (err) throw err;	
				rows = result.rows;
				// Clear canvas for render
				ctx.clearRect(0,0,size_x,size_y)
				console.log('SQL (' + rows.length + ' rows): %dms', new Date - start);	
			 	start = new Date

				// Draw google circles on tile
				// grid = [];
				pnt  = 0;
				
				for (i=0;i<rows.length;i++){
					p_xy = mercator.MetersToPixels(parseFloat(rows[i].x),parseFloat(rows[i].y),parseInt(z))	
					//if(!grid[p_xy[0] + ' ' + p_xy[1]]){
						x = p_xy[0]%size_x;
						y = size_y-(p_xy[1]%size_y);
//				    ctx.beginPath();
//				    ctx.arc(x,y,4,0,6.28318531,true);
//				    ctx.fill();
//						ctx.stroke();
						ctx.drawImage(imgd, x,y);				
					//	grid[p_xy[0] + ' ' + p_xy[1]] = true;
						pnt++;
					//}	
				}
				console.log('rendered ' + pnt + ' points %dms', new Date - start);	

				// Sent to browser				
				// res.header('Content-Type', "image/png");
				res.send("<img src='" + canvas.toDataURL() + "'>");
			});
		}
	});
	// c.query(sql, function (err, rows) {		
	//   if (err) throw err;	
	// 	
	// 	// Clear canvas for render
	// 	ctx.clearRect(0,0,size_x,size_y)
	// 	console.log('SQL (' + rows.length + ' rows): %dms', new Date - start);	
	//  	start = new Date
	// 
	// 	// Draw google circles on tile
	// 	// grid = [];
	// 	pnt  = 0;
	// 	for (i=0;i<rows.length;i++){
	// 		p_xy = mercator.MetersToPixels(parseFloat(rows[i][1]),parseFloat(rows[i][0]),parseInt(z))	
	// 		//if(!grid[p_xy[0] + ' ' + p_xy[1]]){
	// 			x = p_xy[0]%size_x;
	// 			y = size_y-(p_xy[1]%size_y);
	// 	    ctx.beginPath();
	// 	    ctx.arc(x,y,4,0,6.28318531,true);
	// 	    ctx.fill();
	// 		//	ctx.stroke();				
	// 		//	grid[p_xy[0] + ' ' + p_xy[1]] = true;
	// 			pnt++;
	// 		//}	
	// 	}
	// 	console.log('rendered ' + pnt + ' points %dms', new Date - start);	
	// 			
	// 	// Sent to browser				
	// 	// res.header('Content-Type', "image/png");
	// 	res.send("<img src='" + canvas.toDataURL() + "'>");
	// });
});

app.listen('3000');
console.log('Test server listening on port %d', app.address().port);