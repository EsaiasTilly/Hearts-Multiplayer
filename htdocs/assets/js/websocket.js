const serverHost = 'ws://127.0.0.1:4154';
let websocket;

setTimeout(() => {
    // Create A Websocket Connection To Server
    websocket = new WebSocket(serverHost);
    websocketIsOpen = false;
    updateStatusMessage('Connecting to server...');
    websocket.onopen = e => {
        console.info('Connection to server is now open!', e);
        websocketIsOpen = true;
    };

    websocket.onclose = e => {
        console.info('Connection to server is now closed!', e);
        websocketIsOpen = false;
        updateStatusMessage('Lost connection to server!');
    };

    websocket.onmessage = e => {
        if (!e.isTrusted) return;
        let data = JSON.parse(e.data.toString());
        console.info('Recieved data from server:', data);
        if (typeof data == typeof {} && Object.keys(data).indexOf('type') >= 0) {
            if (Object.keys(dataListeners).indexOf(data.type) >= 0) {
                dataListeners[data.type].forEach(callback => {
                    callback(data);
                });
            }
        }
    };
}, 200);

const sendData = data => {
    if (websocket.readyState !== 1) return;
    console.info('Sending data to server:', data);
    websocket.send(JSON.stringify(data));
};

const dataListeners = {};

const addDataListener = (type, callback) => {
    if (Object.keys(dataListeners).indexOf(type) < 0) dataListeners[type] = [];
    dataListeners[type].push(callback);
};
