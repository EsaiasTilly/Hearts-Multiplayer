const Game = require('./game.js');

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 4154 });

wss.on('connection', ws => {
    let playerObject = false;
    ws.on('message', message => {
        let data = JSON.parse(message.toString());
        //console.log('Incoming message!', data);

        if (Object.keys(data).indexOf('type') >= 0) {
            if (data.type == 'request' && data.request == 'new-player') {
                playerObject = createPlayer(ws);
                sendData({ type: 'player-id', pid: playerObject.pid }, ws);
            }
        }

        // Relay To Game Object
        if (playerObject.onMessage != false) playerObject.onMessage(message);
    });

    ws.on('close', e => {
        removeFromQueue(playerObject.pid);
    });

    // Send A Welcome Message To The Client
    sendData({ type: 'welcome' }, ws);
});
console.log('Listening for connections on port ' + wss.options.port);

// Create Function To Send Data To A Client
const sendData = (data, ws) => {
    ws.send(JSON.stringify(data));
};

// Player Queue
const playerQueue = [];

// Create A Player
const createPlayer = ws => {
    let pid = Math.floor(Math.random() * 100000);
    let playerObject = { pid: pid, ws: ws, onMessage: false };
    playerQueue.push(playerObject);
    console.log('Currently there are', playerQueue.length, 'players in the queue.');
    return playerObject;
};

// Remove Player From Queue
const removeFromQueue = pid => {
    for (let i = 0; i < playerQueue.length; i++) {
        if (playerQueue[i].pid == pid) {
            playerQueue.splice(i, 1);
            break;
        }
    }
};

// Create A New Game
const newGameForQueue = () => {
    if (playerQueue.length >= 4) {
        let players = playerQueue.splice(0, 4);
        let game = new Game(players);
    }
};

setInterval(newGameForQueue, 500);
