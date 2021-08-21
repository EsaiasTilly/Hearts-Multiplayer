class Game {
    constructor(players) {
        // Variables
        this.turn = 0;
        this.cardsOnTable = [];
        this.heartPlayed = false;
        this.firstCardPlayed = true;
        this.sendingCards = [];
        this.sendingDirection = 1;

        // Save Players
        this.players = players;
        this.pids = this.players.map(p => {
            return p.pid;
        });

        // Send Message About A Game Being Found
        this.sendToAll({ type: 'game-found', players: this.pids });

        // Create Points And Leaderboard Objects
        this.points = {};
        this.leaderboard = {};
        this.pids.forEach(pid => {
            this.points[pid] = 0;
            this.leaderboard[pid] = [];
        });

        // Start Listening
        this.startListening();

        // Start The Game
        this.startGame();
    }

    // Advance One Turn
    advanceTurn(firstTurn = false) {
        // Advance One Turn
        if (!firstTurn) {
            this.turn++;
            this.turn = this.turn % 4;
        }

        // Check If End Of Round Has Been Reached
        if (this.cardsOnTable.length == 4) this.endRound();

        // Send Information About It Being The Players Turn
        this.turnid = Math.floor(Math.random() * 100000000);
        this.sendData({ type: 'your-turn', turnid: this.turnid }, this.pids[this.turn]);

        // Send To All Other Player Whos Turn It Is
        this.sendToAllButOne({ type: 'others-turn', player: this.pids[this.turn] }, this.pids[this.turn]);
    }

    // End The Round
    endRound() {
        // Card Values In Order Of Value (Lowest To Highest)
        let values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '1'];

        // Find Player With Highest Card On Table
        let leaderPlayer = -1,
            leaderValue = -1;
        let firstType = 0;
        for (let i = 0; i < 4; i++) {
            let pid = this.pids[(this.turn + i) % 4];
            let card = this.cardsOnTable[i];
            let type = parseInt(card.split('-')[0]);
            let value = values.indexOf(card.split('-')[1]);

            if (i == 0) firstType = type;
            if (type == firstType && leaderValue < value) {
                leaderPlayer = pid;
                leaderValue = value;
            }
        }

        // Give Points To The Leading Player
        let pointsOnTable = 0;
        this.cardsOnTable.forEach(card => {
            if (card.indexOf('3-') == 0) pointsOnTable++;
            if (card == '4-12') pointsOnTable += 13;
        });
        this.points[leaderPlayer] += pointsOnTable;
        this.cardsOnTable = [];
        this.turn = this.pids.indexOf(leaderPlayer);

        // Send Updates
        this.sendToAll({ type: 'points-update', points: this.points });
        this.sendTableCards();

        // End Game
        this.endGame();
    }

    // Start Listening To All Players
    startListening() {
        this.players.forEach(player => {
            player.onMessage = message => {
                let data = JSON.parse(message.toString());
                let keys = Object.keys(data);
                let hasType = keys.indexOf('type') >= 0;

                // Player Requests To Play A Card
                if (hasType && data.type == 'play-card' && keys.indexOf('turnid') >= 0) {
                    if (data.turnid == this.turnid && player.pid === this.pids[this.turn]) {
                        if (keys.indexOf('card') >= 0 && this.playerCanPlayCard(this.pids[this.turn], data.card)) {
                            // Move Card From Hand To Table
                            let card = this.hands[this.pids[this.turn]].splice(this.hands[this.pids[this.turn]].indexOf(data.card), 1)[0];
                            this.cardsOnTable.push(card);

                            // Check If Card Is Hearts
                            if (card.indexOf('3-') == 0) this.heartPlayed = true;

                            // Set That The First Card Has Been Played
                            this.firstCardPlayed = false;

                            // Send Hand Updates
                            this.sendUpdatedHand(this.pids[this.turn]);
                            this.sendTableCards();
                            console.log(this.pids[this.turn], 'played', data.card);

                            // Advance One Turn
                            this.advanceTurn();
                        }
                    }
                }

                // Player Requests To Send A Card
                if (hasType && data.type == 'send-cards' && keys.indexOf('cards') >= 0 && keys.indexOf('from') >= 0) {
                    // Put Cards In Queue For Sending
                    this.sendingCards.push({
                        cards: data.cards,
                        from: data.from,
                        to: this.pids[(this.pids.indexOf(data.from) + this.sendingDirection) % 4]
                    });

                    // Finish Sending Cards
                    if (this.sendingCards.length === 4) {
                        this.sendingCards.forEach(pack => {
                            pack.cards.forEach(card => {
                                // Remove From Sender And Add To Reciver
                                let movedCard = this.hands[pack.from].splice(this.hands[pack.from].indexOf(card), 1)[0];
                                this.hands[pack.to].push(movedCard);
                            });
                        });

                        // Send Updated Hands
                        this.pids.forEach(pid => this.sendUpdatedHand(pid));

                        // Run The First Turn
                        this.turn = this.pids.indexOf(this.getCloverTwo());
                        this.advanceTurn(true);
                    }
                }
            };
        });
    }

    // Start Game
    startGame() {
        // Create Array Of A Full Deck Of Cards
        let fulldeck = [];
        for (let t = 1; t <= 4; t++) for (let c = 1; c <= 13; c++) fulldeck.push(t + '-' + c);

        // Shuffle Cards
        for (let t = 0; t < 10; t++) {
            for (let i = fulldeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [fulldeck[i], fulldeck[j]] = [fulldeck[j], fulldeck[i]];
            }
        }

        // Create Random Hands
        this.hands = {};
        for (let i = 0; i < 4; i++) {
            this.hands[this.pids[i]] = fulldeck.splice(0, 13);
            this.sendData(
                {
                    type: 'hand-update',
                    which: 'own',
                    cards: this.hands[this.pids[i]]
                },
                this.pids[i]
            );
        }

        // Ask Players To Select Cards And Wait Until They've Finished
        this.sendToAll({ type: 'start-selection' });
    }

    // End Game
    endGame() {
        // Check If All Cards Have Been Used And In Turn If The Game Is Over
        let allCardsUsed = true;
        this.pids.forEach(pid => (allCardsUsed = this.hands[pid].length > 0 ? false : allCardsUsed));
        if (!allCardsUsed) return;

        // Add Points To Overall Leaderboard
        this.pids.forEach(pid => {
            this.leaderboard[pid].push(this.points[pid]);
            this.points[pid] = 0;
        });

        // Send The Changed Leaderboard
        this.sendToAll({ type: 'leaderboard-update', leaderboard: this.leaderboard });

        // Tell Players To Reset
        this.sendToAll({ type: 'new-game-reset' });

        // Start The Next Game
        this.startGame();
    }

    // Send Data To A Player
    sendData(data, pid) {
        this.players[this.pids.indexOf(pid)].ws.send(JSON.stringify(data));
    }

    // Send Data To All Players
    sendToAll(data) {
        this.pids.forEach(pid => this.sendData(data, pid));
    }

    // Send Data To All Players But One
    sendToAllButOne(data, excluded) {
        this.pids.forEach(pid => {
            if (pid != excluded) this.sendData(data, pid);
        });
    }

    // Send Updated Hand To All Players
    sendUpdatedHand(pid) {
        let hand = this.hands[pid];
        this.sendToAllButOne({ type: 'hand-update', which: pid, cards: hand.length }, pid);
        this.sendData({ type: 'hand-update', which: 'own', cards: hand }, pid);
    }

    // Send The Current State Of The Table
    sendTableCards() {
        this.sendToAll({ type: 'table-update', cards: this.cardsOnTable });
    }

    // Check If A Player Can Play A Specific Card
    playerCanPlayCard(pid, card) {
        // Get The Type And Value Of Card
        const type = parseInt(card.split('-')[0]);
        const value = parseInt(card.split('-')[1]);

        // Check If It's The First Card Played And If It's A Clover Two
        if (this.firstCardPlayed && (type != 1 || value != 2)) return false;

        // Check If It's The First Card, And If So if It's A Heart And If So If Any Hearts Have Been Played Yet
        if (this.cardsOnTable.length == 0 && !this.heartPlayed && type == 3) return false;

        // Check If The Player Has The Card
        if (this.hands[pid].indexOf(card) < 0) return false;

        // Check If It's The Right Type Or If The Player Doesn't Have Any Of The Correct Type
        if (this.cardsOnTable.length > 0 && parseInt(this.cardsOnTable[0].split('-')[0]) !== type)
            if (this.getPlayerCardTypes(pid).indexOf(parseInt(this.cardsOnTable[0].split('-')[0])) >= 0) return false;

        // All Checks Passed
        return true;
    }

    // Get Player With Clover Two
    getCloverTwo() {
        let found_pid = false;
        this.pids.forEach(pid => {
            this.hands[pid].forEach(card => {
                if (card == '1-2') found_pid = pid;
            });
        });
        return found_pid;
    }

    // Get All Card Types A Player Has
    getPlayerCardTypes(pid) {
        let types = [];
        this.hands[pid].forEach(card => {
            let type = parseInt(card.split('-')[0]);
            if (types.indexOf(type) < 0) types.push(type);
        });
        return types;
    }
}

module.exports = Game;
