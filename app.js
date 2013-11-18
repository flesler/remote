var static = require('node-static'),
	http = require('http'),
	util = require('util'),
	url = require('url'),
	fs = require('fs');

var app = require('express')();

app.configure(function(){
  app.use('/', express.static(__dirname + '/static'));

  app.use(app.router);
});

app.get('/:channel', function(req, res, next){
	
});

app.listen(process.env.PORT || 8787);
console.log('Running...');

var io = require('socket.io').listen(server);
io.sockets.on('connection', function(socket){

	socket.on('message', function(message){
		socket.broadcast.emit('message', message);
	});

	socket.on('key down', function(data){
		socket.broadcast.emit('key down', data);
	});

	socket.on('key up', function(data){
		socket.broadcast.emit('key up', data);
	});

	socket.on('flowtime minimap complete', function(data){
		socket.broadcast.emit('flowtime minimap complete', data);
	});

	socket.on('navigate', function(data){
		socket.broadcast.emit('navigate', data);
	});

	socket.on('disconnect', function(){
		console.log("Connection " + socket.id + " terminated.");
	});
});
 
