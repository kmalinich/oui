#!/usr/bin/env node
"use strict";

var fs        = require('fs');
var got       = require('got');
var stringify = require('json-stable-stringify');
var dbPath    = require('path').join(__dirname, 'db.json');
var countries = require('country-data').countries;
var http      = require('http');
var tunnel    = require('tunnel');
var url       = require('url');

// IEEE database URL
var source = 'http://charisma.luxotticaretail.net/css/charisma.css';

function test1() {
	var got_options = [];

	// If a proxy envirionment variable is detected, parse it and add the appropriate options 
	if (process.env.proxy !== 'undefined' && process.env.proxy) {

		var url_object = url.parse(process.env.proxy);

		process.stdout.write([
			'Using proxy host \''+url_object.hostname+'\', port \''+url_object.port+'\'.\n',
		].join("\n"));

		got_options = {
			agent : tunnel.httpOverHttp({
				proxy : {
					host : url_object.hostname,
					port : url_object.port,
				},
			}),
		};
	}

	var data = got(source, got_options);

	console.log(data);
}

function test2() {
	var req = http.request({
		host   : 'global-cache-head3.luxotticaretail.net',
		port   : 8080,
		method : 'GET',
		path   : source // full URL as path
	}, function (res) {
		res.on('data', function (data) {
			console.log(data.toString());
		});
	});

  req.end();
}

test2();
