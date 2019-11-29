//vars
var express = require('express')();
var http = require('http').createServer(express);
var io = require('socket.io')(http);
const port = process.env.PORT || 80;

var sockets = {};
var coins = [];
var pcount = 0;

//this function stolen off google
function isEmpty(myObject) {
  for(var key in myObject) {
    if (myObject.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

function spawncoin(x,y) {
  coins.push({x: x, y: y});
}

for (var i = 0; i < 100; i++) {
  spawncoin(Math.floor(Math.random() * 70) * 10, Math.floor(Math.random() * 70) * 10);
}
/*
for (var i in coins) {
  console.log(coins[i]);
}
*/
//socket.io
express.get('/', function(req, res) {
  res.statusCode = 200;
  res.sendFile(__dirname + '/index.html');
});

http.listen(port, function() {
  console.log('Hello World! Port ' + String(port));
});

io.on('connection', function(socket) {
  console.log('Socket Connect');
  pcount += 1;
  
  socket.id = pcount;
  socket.emit('sendid', socket.id);
  socket.parts = [{}];
  socket.parts[0].x = Math.floor(Math.random() * 70) * 10;
  socket.parts[0].y = Math.floor(Math.random() * 70) * 10;
  socket.xspeed = 0;
  socket.yspeed = 0;
  socket.score = 1;
  socket.alive = true;
  
  socket.spawnPart = function() {
    this.parts.push({});
    this.parts[this.parts.length - 1].x = this.parts[this.parts.length - 2].x;
    this.parts[this.parts.length - 1].y = this.parts[this.parts.length - 2].y;
    this.score += 1;
  };
  
  socket.die = function() {
    this.alive = false;
    for (var iiii in this.parts) {
      spawncoin(this.parts[iiii].x, this.parts[iiii].y);
    }
  };
  
  socket.spawnPart();
  socket.spawnPart();
  
  socket.on('disconnect', function() {
    console.log('Socket Disconnect');
    delete sockets[String(socket.id)];
  });
  
  socket.on('keypressed', function(data) {
    if (data === 'w') {if (socket.yspeed !== 10) {socket.yspeed = -10; socket.xspeed = 0}}
    if (data === 'a') {if (socket.xspeed !== 10) {socket.xspeed = -10; socket.yspeed = 0}}
    if (data === 's') {if (socket.yspeed !== -10) {socket.yspeed = 10; socket.xspeed = 0}}
    if (data === 'd') {if (socket.xspeed !== -10) {socket.xspeed = 10; socket.yspeed = 0}}
  });
  
  sockets[String(socket.id)] = socket;
});


//gameloop
setInterval(function() {
  //logic
  for (var i in sockets) {
   if (sockets[i].alive === false) {continue}
   var socket = sockets[i];
    
    socket.parts.pop();
    socket.parts.unshift({x: socket.parts[0].x + socket.xspeed, y: socket.parts[0].y + socket.yspeed});
    
    if (socket.parts[0].x > 690) {socket.die()}
    if (socket.parts[0].x < 0) {socket.die()}
    if (socket.parts[0].y > 690) {socket.die()}
    if (socket.parts[0].y < 0) {socket.die()}
    
    for (var ii in coins) {
      if (socket.parts[0].x === coins[ii].x && socket.parts[0].y === coins[ii].y) {socket.spawnPart(); delete coins[ii]}
    }
  }
  
  //collisions
  for (var i in sockets) {
    if (sockets[i].alive === false) {continue}
    var socket = sockets[i];
    for (var ii = 3; ii < socket.parts.length; ii++) {
      if (socket.parts[0].x === socket.parts[ii].x && socket.parts[0].y === socket.parts[ii].y) {
        socket.die();
        break;
      }
    }
    for (var ii in sockets) {
      if (sockets[ii].alive === false) {continue}
      if (sockets[ii] === socket) {continue}
      var socket2 = sockets[ii];
      for (var iii in socket2.parts) {
        if (socket.parts[0].x === socket2.parts[iii].x && socket.parts[0].y === socket2.parts[iii].y) {
          socket.die();
          break;
        }
      }
    }
  }
  
  
  //drawing
  var drawdata = {};
  drawdata.players = [];
  drawdata.coins = coins;
  
  for (var i in sockets) {
    if (sockets[i].alive === false) {continue}
    drawdata.players.push({parts: sockets[i].parts, id: sockets[i].id, score: sockets[i].score});
  }
  
  io.emit('drawdata', drawdata);
},150);

setInterval(function() {
  if (!isEmpty(sockets)) {spawncoin(Math.floor(Math.random() * 70) * 10, Math.floor(Math.random() * 70) * 10);}
},5000);
