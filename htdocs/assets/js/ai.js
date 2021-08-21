const startAI = () => {
    const AIEnabled = false;
    let placementSuccess = false;
    let lastTurnid = null;
    setInterval(() => {
        placementSuccess = false;
        if (Object.keys(window).indexOf('players') >= 0) {
            if (AIEnabled && selectedCards.length == 0) {
                window.hands[window.pid].splice(5, 3).forEach(card => selectedCards.push(card));
                sendSelectedCards();
            }

            if (AIEnabled && lastTurnid != window.turnid) {
                for (let i = window.hands[window.pid].length - 1; i >= 0; i--) {
                    playCard(window.hands[window.pid][i]);
                    if (placementSuccess) {
                        placementSuccess = false;
                        break;
                    }
                }
            }
            lastTurnid = window.turnid;
        }
    }, 500 + Math.random() * 150);

    addDataListener('hand-update', data => {
        if (data.which == 'own') {
            placementSuccess = true;
        }
    });
};
window.addEventListener('load', startAI);
