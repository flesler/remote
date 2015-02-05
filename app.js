var app = require('express')();
var server = require('http').createServer(app);


// Socket IO

var io = require('socket.io').listen(server, {log:false});
io.sockets.on('connection', function(socket) {
	var channel;
	socket.on('join', function(data) {
		channel = data.channel;
		console.log(data.type, 'joined channel', channel);
		socket.join(channel);
		socket.broadcast.to(channel).emit('join', data);
	});
	socket.on('event', function(data){
		console.log('Broadcasting to channel', channel);
		socket.broadcast.to(channel).emit('event', data);
	});
});
 
// Utils

function send(res, name) {
	res.sendfile(__dirname + '/static/'+name);
}
// Routes

app.use(app.router);


app.get('/', function(req, res) {
	send(res, 'bookmarklet.html');
});

app.get('/_control', function(req, res){
	send(res, 'control.js');
});

app.get('/remote', function(req, res){
	send(res, 'remote.html');
});

app.get('/test', function(req, res) {
	send(res, 'test.html');
});

app.get('/favicon.ico', function(req, res) {
	// TODO
	res.send(200);
});

var port = process.env.PORT || 8787;
server.listen(port, function() {
	console.log('Remote server running on port', port);
});