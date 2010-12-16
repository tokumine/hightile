require "rubygems"
require "sinatra/base"
require 'pg'
require 'GD'
require "base64"
require 'stringio'

class AppGd < Sinatra::Base

  @@conn = PGconn.open(:dbname => 'test_points', :user => 'postgres')

  def meters_to_pixels (mx, my, zoom)
  	res = resolution( zoom );	
  	px = ((mx.to_f + 20037508.3427892) / res).to_i
  	py = 256-((my.to_f + 20037508.3427892) / res).to_i	
  	[px, py]
  end

  def resolution(zoom)
  	156543.033928041 / (2 ** zoom.to_i);
  end

  get '/tiles/:x/:y/:z' do
    res = @@conn.exec('select y(the_geom) as y,x(the_geom) as x from points9 where the_geom && v_get_tile($1, $2, $3)',[params[:x], params[:y], params[:z]])
  
    # prepare dot  
    im = GD::Image.new(256,256)
    white = im.colorAllocate(255,255,255)
    black = im.colorAllocate(0,0,0)
    im.transparent(white)
    
    res.each_with_index do |r,i|
      p_xy = meters_to_pixels(r['x'],r['y'],params[:z])
      im.arc(p_xy[0], p_xy[1], 9, 9, 0, 360, black)
    end    
    
    content_type 'image/png'
    im.pngStr
  end
end