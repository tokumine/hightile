var binding = require("binding");

var Connection = binding.Connection;

// postgres cannot handle multiple queries at the same time.
// thus we must queue them internally and dispatch them as
// others come in. 
Connection.prototype.maybeDispatchQuery = function () {
  if (!this._queries) return;
  // If not connected, do not dispatch. 
  if (this.readyState != "OK") return;
  if (!this.currentQuery && this._queries.length > 0) {
    this.currentQuery = this._queries.shift();
    this.dispatchQuery(this.currentQuery[0]);
  }
};

Connection.prototype.query = function (sql, callback) {
  this._queries = this._queries || [];
  this._queries.push([sql, callback, arguments]);
  this.maybeDispatchQuery();
};

exports.createConnection = function (conninfo) {
  var c = new Connection;

  c.addListener("connect", function () {
    c.maybeDispatchQuery();
  });

  c.addListener("result", function () {
    process.assert(c.currentQuery);
    var callback = c.currentQuery[1];
    var args = Array.prototype.slice.call(c.currentQuery[2]);
    args.shift();
    args.shift();
    c.currentQuery = null;
    if (callback) {
      var newArgs = Array.prototype.slice.call(arguments);

      for(var i = 0; i < args.length; i++) {
        newArgs.push(args[i]);
      }

      callback.apply(c, newArgs);
    }
  });

  c.addListener("ready", function () {
    c.maybeDispatchQuery();
  });

  c.connect(conninfo);

  return c;
};
