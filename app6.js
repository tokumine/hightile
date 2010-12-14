// S. Tokumine 
// Highspeed tileserver using node.js and cairo. Configured as a replacement for Gmaps.
var p = function () {
    puts(sys.inspect.apply(this, arguments));
}

var pg      = require('pg')
 , http     = require('http')
 , d        = require('./global_mercator')
 , mercator = new GlobalMercator()
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

//DB pool
var poolModule = require('generic-pool');
var pool = poolModule.Pool({
    name     : 'pg',
    create   : function(callback) {
        var c = new pg.Client(db_str);
        c.connect();
        callback(c);
    },
    destroy  : function(client) { client.end(); },
    max      : 10,
    idleTimeoutMillis : 30000,
    log : false
});

//routes
http.createServer(function (req, res) {
  
  // Parse arguments
  x = 0//(req.query.x) ? parseFloat(req.query.x) : 0
  y = 0//(req.query.y) ? parseFloat(req.query.y) : 0
  z = 0//(req.query.z) ? parseInt(req.query.z) : 10
        
  pool.acquire(function(client) { 
    client.query(sql, [x,y,z], function(err, result) {
      if(err) throw err;

      canvas   = new Canvas(size_x, size_y)
      ctx      = canvas.getContext('2d')
              
      for (i=0;i<result.rows.length;i++){                        
        p_xy = mercator.MetersToPixels(result.rows[i].x, result.rows[i].y, z);
        x = p_xy[0] & (size_x - 1);
        y = size_y-(p_xy[1] & (size_y - 1));
        ctx.drawImage(imgd, x,y);                        
      }

      res.writeHead(200, {'Content-Type': 'image/png'});
      res.end(canvas.toBuffer());          
      pool.release(client);      
    });
  });            
}).listen(3000, "127.0.0.1");;

console.log('Test server listening on port 3000');