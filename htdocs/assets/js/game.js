// Request A Player Id
const requestPid = () => {
    addDataListener('welcome', () => {
        addDataListener('player-id', data => {
            window.pid = data.pid;
            waitForGame();

            // Update Status Message
            updateStatusMessage('Waiting for more players...');
        });
        sendData({ type: 'request', request: 'new-player' });
    });
};
window.addEventListener('load', requestPid);

// Request A To Join A Game
const waitForGame = () => {
    addDataListener('game-found', data => {
        window.players = data.players;

        // Create Empty Hands And Points For All Players
        window.hands = {};
        window.points = {};
        window.leaderboard = {};
        window.cardsOnTable = [];
        window.players.forEach(player => {
            window.hands[player] = new Array(13).fill(false);
            window.points[player] = 0;
            window.leaderboard[player] = [];
        });

        // Create The UI
        createUI();

        // Clear Status Message
        updateStatusMessage();

        // Choose What Cards To Send
        chooseCardsToSend();
    });
};

// Choose Cards To Send
const chooseCardsToSend = () => {
    addDataListener('start-selection', data => {
        // Enable Selection Mode
        window.cardSelection = true;

        // Update The Hand And Make Cards Selectable
        updateHandUI();
        let cards = document.querySelectorAll('.player-container[pid="' + window.pid + '"] > .card-container > card');
        cards.forEach(card => {
            card.setAttribute('onClick', 'selectCard(event)');
            card.setAttribute('active', 'yes');
        });
    });
};

// Select Cards
const selectedCards = [];
const selectCard = e => {
    let selected = selectedCards.indexOf(e.target.getAttribute('card')) >= 0;
    if (!selected && selectedCards.length == 3) return;
    e.target.setAttribute('staticHover', selected ? 'no' : 'yes');
    if (!selected) selectedCards.push(e.target.getAttribute('card'));
    else selectedCards.splice(selectedCards.indexOf(e.target.getAttribute('card')), 1);

    // Toggle The Send Button
    document.querySelector('.sendButton').style.display = selectedCards.length == 3 ? 'block' : 'none';
};

// Send Selected Cards
const sendSelectedCards = () => {
    if (selectedCards.length !== 3) return;
    sendData({
        type: 'send-cards',
        cards: selectedCards,
        from: window.pid
    });
    waitOnTurns();
    document.querySelector('.sendButton').style.display = 'none';
    updateHandUI();
};

// Listen For Turn Changes
const waitOnTurns = () => {
    addDataListener('others-turn', data => {
        window.turn = data.player;
        updateHandUI();
    });
    addDataListener('your-turn', data => {
        // Save Variables
        window.turn = window.pid;
        window.turnid = data.turnid;

        // Update Hand And Make Card Clickable
        updateHandUI();
        let cards = document.querySelectorAll('.player-container[pid="' + window.pid + '"] > .card-container > card');
        cards.forEach(card => {
            card.setAttribute('onClick', 'playCard(' + JSON.stringify(card.getAttribute('card')) + ')');
        });
    });
};

// Play A Card
const playCard = card => {
    sendData({
        type: 'play-card',
        card: card,
        turnid: window.turnid
    });
};

// Automatically Update The Hands Of Players
const updateHands = () => {
    addDataListener('hand-update', data => {
        if (Object.keys(data).indexOf('which') >= 0) {
            if (data.which == 'own') {
                let cards = data.cards;
                data.cards.sort(sortCards);
                window.hands[window.pid] = cards;
            } else {
                window.hands[data.which] = new Array(data.cards).fill(false);
            }
        }
        updateHandUI();
    });
};
window.addEventListener('load', updateHands);

// Automatically Update The Points Of Players
const updatePoints = () => {
    addDataListener('points-update', data => {
        if (Object.keys(data).indexOf('points') >= 0) {
            window.points = data.points;
        }
        updatePointsUI();
    });
};
window.addEventListener('load', updatePoints);

// Automatically Update The Cards On Table
const updateTable = () => {
    addDataListener('table-update', data => {
        if (Object.keys(data).indexOf('cards') >= 0) {
            window.cardsOnTable = data.cards;
        }
        updateTableUI();
    });
};
window.addEventListener('load', updateTable);

// Automatically Update The Leaderboard
const updateLeaderboard = () => {
    addDataListener('leaderboard-update', data => {
        window.leaderboard = data.leaderboard;
        updateLeaderboardUI();
    });
};
window.addEventListener('load', updateLeaderboard);

// Sort Cards
const cardOrder = [];
for (let x = 2; x <= 14; x++) for (let y = 1; y <= 4; y++) cardOrder.push(y + '-' + (x == 14 ? 1 : x));
const sortCards = (a, b) => {
    return cardOrder.indexOf(a) > cardOrder.indexOf(b) ? 1 : -1;
};
