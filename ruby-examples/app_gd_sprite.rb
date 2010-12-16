require "rubygems"
require "sinatra/base"
require 'pg'
require 'GD'

class AppGdSprite < Sinatra::Base

  @@conn = PGconn.open(:dbname => 'test_points', :user => 'postgres')
  @@marker = GD::Image.new_from_png('../todo/images/google_point_8.png');

  get '/tiles/:x/:y/:z' do
    res = @@conn.exec('select y(the_geom) as y,x(the_geom) as x from points9 where the_geom && v_get_tile($1, $2, $3)',[params[:x], params[:y], params[:z]])
      
    # prepare image     
    im = GD::Image.new(256,256)
    white = im.colorAllocate(255,255,255)
    im.transparent(white)
    
    res.each_with_index do |r,i|
      re = 156543.033928041 / (2 ** params[:z].to_i);
    	px = ((r['x'].to_f + 20037508.3427892) / re).to_i
    	py = 256-((r['y'].to_f + 20037508.3427892) / re).to_i	
    	@@marker.copy(im, px, py, 0, 0, 9, 9)
    end    
    
    content_type 'image/png'
    im.pngStr
  end
end