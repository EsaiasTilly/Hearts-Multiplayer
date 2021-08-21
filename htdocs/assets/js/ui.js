// Set The Current Status Message
const updateStatusMessage = (msg = '') => {
    // Create The Status Message
    if (document.querySelectorAll('.gameStatus').length == 0) {
        let gameStatusLabel = document.createElement('h1');
        gameStatusLabel.style.position = 'absolute';
        gameStatusLabel.style.top = '50%';
        gameStatusLabel.style.left = '50%';
        gameStatusLabel.style.transform = 'translate(-50%, -50%)';
        gameStatusLabel.classList.add('gameStatus');
        document.body.append(gameStatusLabel);
    }

    // Update The Text
    document.querySelector('.gameStatus').innerText = msg;
};

// Create All UI Elements
const createUI = () => {
    // Create Player Hands
    window.players.forEach(pid => {
        let playerContainer = document.createElement('div');
        playerContainer.classList.add('player-container');
        playerContainer.setAttribute('pid', pid);
        playerContainer.setAttribute('owned', pid == window.pid ? 'yes' : 'no');
        playerContainer.innerHTML = '<h3>' + pid + ' - 0p</h3><div class="card-container"></div>';
        document.body.append(playerContainer);
    });

    // Create Table
    let table = document.createElement('div');
    table.classList.add('table');
    table.classList.add('card-container');
    document.body.append(table);

    // Create Send Cards Button
    let sendButton = document.createElement('button');
    sendButton.classList.add('sendButton');
    sendButton.style.display = 'none';
    sendButton.addEventListener('click', sendSelectedCards);
    sendButton.innerText = 'Send Cards';
    document.body.append(sendButton);

    // Create Leaderboard
    let leaderbaord = document.createElement('table');
    leaderbaord.classList.add('leaderboard');
    document.body.append(leaderbaord);

    updateHandUI();
};

// Update Points In UI
const updatePointsUI = () => {
    window.players.forEach(pid => {
        let playerHeader = document.querySelector('.player-container[pid="' + pid + '"] > h3');
        playerHeader.innerText = pid + ' - ' + window.points[pid] + 'p';
    });
};

// Update Card Containers
const updateHandUI = () => {
    document.body.style.boxShadow = window.turn == window.pid ? '0px 0px 0px 4px #FF4128' : '';

    window.players.forEach(pid => {
        let cards = window.hands[pid];
        let cardContainer = document.querySelector('.player-container[pid="' + pid + '"] > .card-container');
        let cardsHtml = '';
        let cardsActive = window.pid == pid && pid == window.turn;
        cards.forEach(card => {
            if (card == false) cardsHtml += '<card empty="yes"></card>';
            else cardsHtml += '<card style="background-image: url(\'./assets/images/cards/' + card + '.png\')" active="' + (cardsActive ? 'yes' : 'no') + '" card="' + card + '"></card>';
        });
        cardContainer.innerHTML = cardsHtml;
    });
};

// Update Table
const updateTableUI = () => {
    let cards = window.cardsOnTable;
    let cardsContainer = document.querySelector('.table');
    let cardsHtml = '';
    cards.forEach(card => {
        cardsHtml += '<card style="background-image: url(\'./assets/images/cards/' + card + '.png\')" card="' + card + '"></card>';
    });
    cardsContainer.innerHTML = cardsHtml;
};

// Update Leaderboard
const updateLeaderboardUI = () => {
    let tableHtml = '<tr>';
    window.players.forEach(player => {
        tableHtml += '<th>' + player + '</th>';
    });
    tableHtml += '</tr>';
    for (let i = 0; i < window.leaderboard[window.players[0]].length; i++) {
        tableHtml += '<tr>';
        window.players.forEach(player => {
            tableHtml += '<td>' + window.leaderboard[player][i] + 'p</td>';
        });
        tableHtml += '</tr>';
    }

    document.querySelector('.leaderboard').innerHTML = tableHtml;
};
