/*
	GlobalMapTiles - part of Aggregate Map Tools
	Version 1.0
	Copyright (c) 2009 The Bivings Group
	All rights reserved.
	Author: John Bafford
	
	http://www.bivings.com/
	http://bafford.com/softare/aggregate-map-tools/
	
	Based on GDAL2Tiles / globalmaptiles.py
	Original python version Copyright (c) 2008 Klokan Petr Pridal. All rights reserved.
	http://www.klokan.cz/projects/gdal2tiles/
	
	Permission is hereby granted, free of charge, to any person obtaining a
	copy of this software and associated documentation files (the "Software"),
	to deal in the Software without restriction, including without limitation
	the rights to use, copy, modify, merge, publish, distribute, sublicense,
	and/or sell copies of the Software, and to permit persons to whom the
	Software is furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included
	in all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
	THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
	DEALINGS IN THE SOFTWARE.
*/

GlobalMercator = function()
{
	this.tileSize = 256;
	this.initialResolution = 2 * Math.PI * 6378137 / this.tileSize;
	this.originShift = 2 * Math.PI * 6378137 / 2.0;

	//Converts given lat/lon in WGS84 Datum to XY in Spherical Mercator EPSG:900913
	this.LatLonToMeters = function(lat, lon)
	{
		mx = lon * this.originShift / 180.0;
		my = Math.log( Math.tan((90 + lat) * Math.PI / 360.0 )) / (Math.PI / 180.0);
	
		my *= this.originShift / 180.0;
		
		return [mx, my];
	}
	
	//Converts XY point from Spherical Mercator EPSG:900913 to lat/lon in WGS84 Datum
	this.MetersToLatLon = function(mx, my)
	{
		lon = (mx / this.originShift) * 180.0;
		lat = (my / this.originShift) * 180.0;
	
		lat = 180 / Math.PI * (2 * Math.atan( Math.exp( lat * Math.PI / 180.0)) - Math.PI / 2.0);
		
		return [lat, lon];
	}
	
	//Converts pixel coordinates in given zoom level of pyramid to EPSG:900913
	this.PixelsToMeters = function(px, py, zoom)
	{
		res = this.Resolution(zoom);
		mx = px * res - this.originShift;
		my = py * res - this.originShift;
		
		return [mx, my];
	}
	
	//Converts EPSG:900913 to pyramid pixel coordinates in given zoom level
	this.MetersToPixels = function(mx, my, zoom)
	{
		res = this.Resolution( zoom );
		
		px = (mx + this.originShift) / res;
		py = (my + this.originShift) / res;
		
		return [px, py];
	}

	//Returns a tile covering region in given pixel coordinates
	this.PixelsToTile = function (px, py)
	{
		tx = Math.ceil( px / this.tileSize ) - 1;
		ty = Math.ceil( py / this.tileSize ) - 1;
		
		return [tx, ty];
	}
	
	//Returns tile for given mercator coordinates
	this.MetersToTile = function(mx, my, zoom)
	{
		p = this.MetersToPixels(mx, my, zoom);
		
		return this.PixelsToTile(p[0], p[1]);
	}
	
	//Returns bounds of the given tile in EPSG:900913 coordinates
	this.TileBounds = function(tx, ty, zoom)
	{
		min = this.PixelsToMeters( tx*this.tileSize, ty*this.tileSize, zoom );
		max = this.PixelsToMeters( (tx+1)*this.tileSize, (ty+1)*this.tileSize, zoom );
		
		return [min[0], min[1], max[0], max[1]];
	}
	
	//Returns bounds of the given tile in latutude/longitude using WGS84 datum
	this.TileLatLonBounds = function(tx, ty, zoom)
	{
		bounds = this.TileBounds(tx, ty, zoom);
		
		min = this.MetersToLatLon(bounds[0], bounds[1]);
		max = this.MetersToLatLon(bounds[2], bounds[3]);
		 
		return [min[0], min[1], max[0], max[1]];
	}
	
	//Resolution (meters/pixel) for given zoom level (measured at Equator)
	this.Resolution = function(zoom)
	{
		return this.initialResolution / (1 << zoom);
	}
	
	//Converts TMS tile coordinates to Microsoft QuadTree
	this.QuadTree = function(tx, ty, zoom)
	{
		quadtree = '';
		
		ty = ((1 << zoom) - 1) - ty;
		for(i = zoom; i >= 1; i--)
		{
			digit = 0;
			
			mask = 1 << (i-1);
			
			if((tx & mask) != 0)
				digit += 1;
			
			if((ty & mask) != 0)
				digit += 2;
			
			quadtree += digit;
		}
		
		return quadtree;
	}
	
	//Converts a quadtree to tile coordinates
	this.QuadTreeToTile = function(quadtree, zoom)
	{
		tx = 0;
		ty = 0;
		
		for(i = zoom; i >= 1; i--)
		{
			ch = quadtree[zoom - i];
			mask = 1 << (i-1);
			
			digit = ch - '0';
			
			if(digit & 1)
				tx += mask;
			
			if(digit & 2)
				ty += mask;
		}
		
		ty = ((1 << zoom) - 1) - ty;
		
		return [tx, ty];
	}
	
	//Converts a latitude and longitude to quadtree at the specified zoom level 
	this.LatLonToQuadTree = function(lat, lon, zoom)
	{
		m = this.LatLonToMeters(lat, lon);
		t = this.MetersToTile(m[0], m[1], zoom);
		
		return this.QuadTree(t[0], t[1], zoom);
	}
	
	//Converts a quadtree location into a latitude/longitude bounding rectangle
	this.QuadTreeToLatLon = function(quadtree)
	{
		zoom = quadtree.length;
		
		t = this.QuadTreeToTile(quadtree, zoom);
		
		return this.TileLatLonBounds(t[0], t[1], zoom);
	}
	
	//Returns a list of all of the quadtree locations at a given zoom level within a latitude/longude box
	this.GetQuadTreeList = function(zoom, latLon, latLonMax)
	{
		lat = latLon[0];
		lon = latLon[1];
		latMax, lonMax;
		
		if(latLonMax)
		{
			latMax = latLonMax[0];
			lonMax = latLonMax[1];
			
			if(latMax < lat || lonMax < lon)
				return false;
		}
		
		m = this.LatLonToMeters(latLon[0], latLon[1]);
		tmin = this.MetersToTile(m[0], m[1], zoom);
		tmax;
		
		if(latLonMax)
		{
			m = this.LatLonToMeters(latLonMax[0], latLonMax[1]);
			tmax = this.MetersToTile(m[0], m[1], zoom);
		}
		else
			tmax = tmin;
		
		arr = {};
		for(ty = tmin[1]; ty <= tmax[1]; ty++)
			for(tx = tmin[0]; tx <= tmax[0]; tx++)
			{
				quadtree = this.QuadTree(tx, ty, zoom);
				
				arr[quadtree] = this.TileLatLonBounds(tx, ty, zoom);
			}
		
		return arr;
	}
}