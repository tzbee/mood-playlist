'use strict';

var url = require('url');
var util = require('util');
var md5 = require('MD5');
var request = require('request');
var _ = require('lodash');
var exec = require('exec');

var config = require('./config.json');

var host = config.host;
var apiKey = config.apiKey;
var secret = config.secret;

var sessionKey = config.sessionKey;

function getAPICommandURL(method, options) {
	return url.format({
		protocol: 'http',
		hostname: host, 
		query: _.merge({ 
			method: method,
			api_key: apiKey,
		    format: 'json'
		}, options)
	});
}


function getAPIToken(callback) {
	var sign = util.format('api_key%smethodauth.getToken%s', apiKey, secret);
	var url = getAPICommandURL('auth.getToken', { api_sig: sign });

	request(url, function(error, data, body) {
		callback(JSON.parse(body).token);
	});
}

var browser = 'chromium-browser';

module.exports.userAuth = function(token) {
	var userAuthURL = util.format('http://www.last.fm/api/auth?api_key=%s&token=%s',apiKey, token);
	exec([browser, userAuthURL], function() {});
};

function getAPISig(method, params) {
	var allParams = _.merge(params, { method: method });
	var allParamsKeys = Object.keys(allParams).sort();

	var sign = allParamsKeys.map(function(paramKey) {
		return paramKey + allParams[paramKey];
	}).join('').concat(secret);

	return md5(sign);
}

function doLFMQuery(method, params, callback, authRequired, requestMethod) {

	params.api_key = apiKey;

	if (authRequired) {
   		params.sk = sessionKey;
		params.api_sig = getAPISig(method, params);
	}
	
	var url = getAPICommandURL(method, params);

	var rm = requestMethod === 'get' ? request.get : requestMethod === 'post' ? request.post : request.get;

	rm({
		url: url,
		form: params   
	}, callback);
}

module.exports.getAPIToken = getAPIToken;
module.exports.doLFMQuery = doLFMQuery;



