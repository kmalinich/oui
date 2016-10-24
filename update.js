#!/usr/bin/env node
"use strict";

var fs        = require('fs');
var got       = require('got');
var stringify = require('json-stable-stringify');
var dbPath    = require('path').join(__dirname, 'db.json');
var countries = require('country-data').countries;

var http   = require('http');
var tunnel = require('tunnel');
var url    = require('url');

// IEEE database URL
var source = 'http://standards-oui.ieee.org/oui/oui.txt';

module.exports = function update(isCLI, cb) {
  var req_options = {};

  // If a proxy envirionment variable is detected, parse it and add the appropriate options 
  if (process.env.proxy !== 'undefined' && process.env.proxy) {
    var proxy_url_object = url.parse(process.env.proxy);

    process.stdout.write([
      'Using proxy host \''+proxy_url_object.hostname+'\', port \''+proxy_url_object.port+'\'.\n',
    ].join("\n"));

    req_options = {
      host   : proxy_url_object.hostname,
      port   : proxy_url_object.port,
      method : 'GET',
      path   : source // Full URL as path when using a proxy
    };
  }
  else {
    // No proxy
    var source_url_object = url.parse(source);
    console.log(source_url_object);

    req_options = {
      host   : source_url_object.hostname,  
      port   : 80,
      method : 'GET',
      path   :  // Full URL as path when using a proxy
    };
  }

  console.log(req_options);

  // var req = http.request(req_options, function (res) {
  // 	res.on('data', function (data) {
  // 		console.log(data.toString());
  // 	});
  // });

  var req = http.request(req_options).catch(cb).then(function(res) {
    parse(res.body.split("\n"), function(result) {

      var str = stringify(result, {space: 1, cmp: function(a, b) {
        return parseInt(a.key, 16) > parseInt(b.key, 16) ? 1 : -1;
      }});

      if (!isCLI) {
        cb(null, result);
        fs.writeFile(dbPath, str);
      }
      else {
        fs.writeFile(dbPath, str, cb);
      }
    });
  });

  req.end();
}

function isStart(firstLine, secondLine) {
  if (firstLine === undefined || secondLine === undefined) return false;
  return firstLine.trim().length === 0 && /([0-9A-F]{2}[-]){2}([0-9A-F]{2})/.test(secondLine);
}

function parse(lines, cb) {
  var result = {}, i = 3;

  while (i !== lines.length) {
    if (isStart(lines[i], lines[i + 1])) {
      var oui   = lines[i + 2].substring(0, 6).trim();
      var owner = lines[i + 1].replace(/\((hex|base 16)\)/, "").substring(10).trim();

      i += 3;
      while (!isStart(lines[i], lines[i + 1]) && i < lines.length) {
        if (lines[i] && lines[i].trim()) owner += "\n" + lines[i].trim();
        i++;
      }

      // ensure upper case on hex digits
      oui = oui.toUpperCase();

      // remove excessive whitespace
      owner = owner.replace(/[ \t]+/gm, " ");

      // replace country shortcodes
      var shortCode = (/\n([A-Z]{2})$/.exec(owner) || [])[1];
      if (shortCode && countries[shortCode]) {
        owner = owner.replace(/\n.+$/, "\n" + countries[shortCode].name);
      }

      result[oui] = owner;
    }
  }

  if (cb) cb(result);
}
