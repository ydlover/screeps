/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('utils');
 * mod.thing == 'a thing'; // true
 */

module.exports = function () {
	var utils = function ()
	{
	};
    var getStackTrace = function () {
      var obj = {};
      Error.captureStackTrace(obj, getStackTrace);
      return obj.stack;
    };
    var getCodeFileAndLine = function (stackInfo) {
      var stack = stackInfo || ""
      var matchResult = stack.match(/\(.*?\)/g) || []
      var line = matchResult[1] || ""
      var index = line.lastIndexOf(":")
      if(index > -1){
        line = line.slice(0,index)
      }
      return line;
    };
    utils.logInit = function () {
        var log = console.log;
        console.log = function () {
          var line = getCodeFileAndLine(getStackTrace())
          arguments[arguments.length-1] += " "+ line + ")"
          log.apply(console, arguments)
        };
    };
    return utils;
};
