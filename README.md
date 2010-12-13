# hightile

A first draft proof of concept high speed tiler that generates map tiles suitable for openlayers/gmaps using node.js, cairo & postgis.

Currently only renders points in the Google Fusion Tables style

## dependencies

* node.js (v3+)
* npm
* node_postgres
* node-cairo
* expressjs


## Possible optimisations

I think it can be further optimised in the following spots:

1) use sprites for circles instead of drawing procedurally
2) send png as binary
3) upgrade the V8 interpreter periodically ;)
4) probably a bunch of places - it's pretty crude. 
