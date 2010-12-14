// S. Tokumine 
// Highspeed tileserver using node.js and cairo. Configured as a replacement for Gmaps.

// Configure app
var p = function () {
    puts(sys.inspect.apply(this, arguments));
}

var express = require('express')
 , pg       = require('pg')
 , d        = require('./global_mercator')
 , mercator = new GlobalMercator()
 , app      = express.createServer()
 , sys      = require('sys')
 , puts     = sys.puts
 , size_x   = 256
 , size_y   = 256
 , Canvas   = require('canvas')
 , imgd     = new Canvas.Image()
 , db_str   = "pg://postgres@localhost:5432/test_points"
 , sql      = "select y(the_geom) as y,x(the_geom) as x from points9 where the_geom && v_get_tile($1, $2, $3) group by y, x";

// Configure Canvas Google Dot style    
imgd.src = 'todo/images/google_point_8.png';

// Middleware
app.use(express.logger({ format: '\x1b[90m:remote-addr\x1b[0m - \x1b[33m:method\x1b[0m :url :status \x1b[90m:response-timems\x1b[0m' }));
app.use(express.bodyDecoder());
app.use(app.router);
app.use(express.errorHandler({ showStack: true }));

// DB: Create a connection pool with
// a max of 10 connections and a 30 second max idle time
var poolModule = require('generic-pool');
var pool = poolModule.Pool({
    name     : 'pg',
    create   : function(callback) {
        var c = new pg.Client(db_str);
        c.connect();
        callback(c);
    },
    destroy  : function(client) { client.end(); },
    max      : 20,
    idleTimeoutMillis : 30000,
    log : false
});

//routes
app.get('/', function(req, res){
    
  // Parse arguments
  x = (req.query.x) ? parseFloat(req.query.x) : 0
  y = (req.query.y) ? parseFloat(req.query.y) : 0
  z = (req.query.z) ? parseInt(req.query.z) : 10
       
  // acquire connection - callback function is called
  // once a resource becomes available
  pool.acquire(function(client) {    
    client.query(sql, [x,y,z], function(err, result) {
      //Rev up the canvas
      canvas   = new Canvas(size_x, size_y)
      ctx      = canvas.getContext('2d')
      ctx.patternQuality = 'fast';
      ctx.antialias      = 'none';
      
      if(err) {
        console.log("query failed");
      }
      else {         
        for (i=0;i<result.rows.length;i++){                        
          p_xy = mercator.MetersToPixels(result.rows[i].x, result.rows[i].y, z);
          x = p_xy[0]%size_x;
          y = size_y-(p_xy[1]%size_y);
          ctx.drawImage(imgd, x,y);                        
        }
       res.send("<img src='" + canvas.toDataURL() + "'>");                  
      }      
      pool.release(client);
    });
    
  });          
});

app.listen('3000');
console.log('Test server listening on port %d', app.address().port);