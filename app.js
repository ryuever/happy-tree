/**
	* Node.js happy-tree
    * website http://123.57.150.234:3000
	* Copyright (c) 2015 Liu Youchao
**/
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);

var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/app/server/views');
app.set('view engine', 'jade');
app.use(cookieParser());
app.use(session({
	secret: 'faeb4453e5d14fe6f6d04637f78077c76c73d1b4',
	proxy: true,
	resave: true,
	saveUninitialized: true,
	store: new MongoStore({ host: 'localhost', port: 27017, db: 'node-login'})
	})
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('stylus').middleware({ src: __dirname + '/app/public' }));
app.use(express.static(__dirname + '/app/public'));

require('./app/server/routes')(app);

if (app.get('env') == 'development') app.use(errorHandler());

// http.createServer(app).listen(app.get('port'), function(){
// 	console.log('Express server listening on port ' + app.get('port'));
// });

http.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

// usernames which are currently connected to the chat
var usernames = {};

// rooms which are currently available in chat
// var rooms = ['room1','room2','room3'];

io.on('connection', function (socket) {
    console.log("receive a socket request", socket.id);
	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(user){
        console.log('username', user);
        
		// store the username in the socket session for this client
		socket.username = user.username;
		// // // store the room name in the socket session for this client
		// socket.room = 'room1';

		// add the client's username to the global list
		usernames[socket.username] = socket.id;
        socket.join(user.username);
        console.log("online user", usernames);
	});

    socket.on("appendBuddyGroup", function(data){
        socket.online = {};        
        socket.friends = data.friends;
        socket.group = data.group;
        
        for(var i = 0; i<socket.friends.length; i++){
            if(usernames[socket.friends[i]]){
                console.log("user is online");
                socket.online[socket.friends[i]] = 1;
            }else{
                socket.online[socket.friends[i]] = 0;
            }
        }
        console.log("socket.online : ", socket.online);
        socket.emit("updateOnlineStatus", socket.online);
    });

    socket.on("message", function(data){
        // console.log("send message ",data,usernames[socket.username], usernames, socket.username);
        console.log("send message ",data.msg, data.username, data.rival_name );

        // io.socketes.in(data.username).emit("reply message", data);
        // socket.to('second')
        io.in(data.rival_name).emit("reply message", {rival_name : data.rival_name, data : data.msg, username : data.username});        
        // io.in('second').emit("reply message", {username : "reply", data:"nihao"});        
        // socket.emit("reply message", data);        
    });
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});

	socket.on('switchRoom', function(newroom){
		// leave the current room (stored in session)
		socket.leave(socket.room);
		// join new room, received as function parameter
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		socket.emit('updaterooms', rooms, newroom);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});
