const express = require('express');
const path = require('path');
const http = require('http');
const PORT = process.env.PORT || 3000;
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketio(server);
// const connections = [null, null];

// set static folder

app.use(express.static(path.join(__dirname, "public")));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const connections = [null, null]; // moved here from up there, no diff

// Handling a socket connection requrest from web client

io.on('connection', socket => {
    // console.log('New WS Conn');
    let playerIndex = -1;
    for (const i in connections){
        if (connections[i] === null){
            playerIndex = i;
            break; 
        }
    }

    // Tell connecting client what number they are
    socket.emit('player-number', playerIndex);

    console.log(`Player ${playerIndex} has connected`);

    // Ignore player 3
    if (playerIndex === -1) return; // line order is very FUCKING important


    connections[playerIndex] = false;

    // Report what player number just connected
    socket.broadcast.emit('player-connection', playerIndex);

    // Handle Disconn
    socket.on('disconnect', () => {
        console.log(`Player ${playerIndex} disconnected`);
        connections[playerIndex] = null;
        // Tell EVERYONE
        socket.broadcast.emit('player-connection', playerIndex);
    })

    socket.on('player-ready', () => {
        socket.broadcast.emit('enemy-ready', playerIndex);
        connections[playerIndex] = true;      
    })

    // Check players connected
    socket.on('check-players', () => {
        const players = [];
        for (const i in connections){
            connections[i] === null? 
            players.push({connected: false, ready: false}):
            players.push({connected: true, ready: connections[i]});    
        }
        socket.emit('check-players', players);
    })

    // on fire received

    socket.on('fire', id => {
        console.log(`Shot fired from ${playerIndex}`, id);
        socket.broadcast.emit('fire', id);
    })

    // on fire reply

    socket.on('fire-reply', square => {
        console.log('fire-reply: \n');
        console.log(square);

        // if you console.log a string + 'square', coercion!

        socket.broadcast.emit('fire-reply', square);
    })

    // Timeout thing
    setTimeout(() => {
        connections[playerIndex] = null;
        socket.emit('timeout');
        socket.disconnect();
    }, 300000)




})

