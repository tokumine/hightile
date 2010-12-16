require "rubygems"
require "sinatra/base"
require 'pg'
require 'cairo'
require "base64"
require 'stringio'

class AppCairo < Sinatra::Base

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
  
    format = Cairo::FORMAT_ARGB32
    width = 256
    height = 256  
    
    # prepare dot  
    gs = Cairo::ImageSurface.new(format, 9, 9)
    gc = Cairo::Context.new(gs)
    gc.arc(4, 4, 3, 0, 2 * Math::PI)
    gc.set_source_color("#ff6666")
    gc.fill_preserve
    gc.set_source_color(:black)
    gc.set_line_width(1)
    gc.stroke
    gpnt = Cairo::SurfacePattern.new(gs)
    
    # draw image
    surface = Cairo::ImageSurface.new(format, width, height)
    context = Cairo::Context.new(surface)  
    
    m = context.matrix
    x = 0
    y = 0
    res.each_with_index do |r,i|
      p_xy = meters_to_pixels(r['x'],r['y'],params[:z])
      m.translate!(-(p_xy[0]-x),-(p_xy[1]-y))
      gpnt.set_matrix(m)
      context.set_source(gpnt)
      context.paint      
      x = p_xy[0]
      y = p_xy[1]      
    end    
    output = StringIO.new
    surface.write_to_png(output)
    output.rewind
    content_type 'image/png'
    output.read
  end
end  