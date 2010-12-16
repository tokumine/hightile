require "rubygems"
require 'pg'
require 'GD'

class AppGdSpriteRack

  @@conn = PGconn.open(:dbname => 'test_points', :user => 'postgres')
  @@marker = GD::Image.new_from_png('../todo/images/google_point_8.png');

  def call(env)
    req = Rack::Request.new(env)    
    x = req.params["x"]
    y = req.params["y"]
    z = req.params["z"]
    
    res = @@conn.exec('select y(the_geom) as y,x(the_geom) as x from points9 where the_geom && v_get_tile($1, $2, $3)',[x,y,z])    
      
    # prepare image     
    im = GD::Image.new(256,256)
    white = im.colorAllocate(255,255,255)
    im.transparent(white)
    
    res.each_with_index do |r,i|
      re = 156543.033928041 / (2 ** z.to_i); 
    	px = ((r['x'].to_f + 20037508.3427892) / re).to_i
    	py = 256-((r['y'].to_f + 20037508.3427892) / re).to_i	
    	@@marker.copy(im, px, py, 0, 0, 9, 9)
    end    
    
    ["200",{"Content-Type" => "image/png"}, [im.pngStr]]
  end
end