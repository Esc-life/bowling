document.addEventListener('DOMContentLoaded', () => {
    const playerName = localStorage.getItem('playerName');
    const urlParams = new URLSearchParams(window.location.search);
    const lobbyId = urlParams.get('lobbyId');
    const isMultiplayer = !!lobbyId;

    if (!playerName) {
        window.location.href = '/';
        return;
    }

    document.getElementById('player-name-display').textContent = `${playerName}의 신나는 볼링!`;

    // --- WebSocket Setup for Multiplayer ---
    let ws;
    if (isMultiplayer) {
        ws = new WebSocket(`ws://${window.location.host}`);
        ws.onopen = () => {
            console.log('Connected for game');
            ws.send(JSON.stringify({ type: 'join_game', lobbyId, playerName }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // Handle game state updates from server
            console.log("Game update:", data);
        };
    }
    
    // --- Game Logic (Simplified for brevity) ---
    // ... (The existing Game class and score calculation logic would go here)
    // For multiplayer, this logic would largely move to the server.
    // The client would primarily handle rendering and sending user actions.

    const throwButton = document.getElementById('throw-button');
    const spinControl = document.getElementById('spin-control');
    const positionControl = document.getElementById('position-control');
    const powerControl = document.getElementById('power-control');
    
    throwButton.addEventListener('click', () => {
        const throwDetails = {
            spin: spinControl.value,
            position: positionControl.value,
            power: powerControl.value,
            // For now, pins hit is still random
            pins: Math.floor(Math.random() * 11) 
        };

        if (isMultiplayer) {
            ws.send(JSON.stringify({ type: 'game_action', action: 'throw', details: throwDetails }));
            throwButton.disabled = true; 
        } else {
            // Animate ball for solo play
            animateBallThrow(throwDetails);
        }
    });

    function animateBallThrow(details) {
        const ball = document.getElementById('bowling-ball');
        // This is a placeholder for a more complex animation
        ball.style.transition = 'all 1.5s ease-in';
        
        // 1. Move to starting position
        const startX = 50 + (details.position * 10); // Simple position mapping
        ball.style.transform = `translateX(calc(${startX}% - 20px))`;
        
        // 2. Animate the throw
        setTimeout(() => {
            // A simple representation of spin affecting the final position
            const endX = startX + (details.spin * 5); 
            ball.style.transform = `translate(calc(${endX}% - 20px), -550px)`;
        }, 100);

        // 3. Reset after animation
        setTimeout(() => {
            ball.style.transition = 'none';
            ball.style.transform = 'translateX(calc(50% - 20px))';
            // Here you would handle pin falling logic & score update for solo
            // And then show celebration if needed
            // showCelebration("STRIKE!"); 
        }, 2000);
    }

    function showCelebration(text) {
        const celebrationElement = document.getElementById('celebration-animation');
        const celebrationText = document.getElementById('celebration-text');
        
        celebrationText.textContent = text;
        celebrationElement.classList.remove('hidden');
        celebrationElement.classList.add('show');

        setTimeout(() => {
            celebrationElement.classList.remove('show');
            setTimeout(() => {
                 celebrationElement.classList.add('hidden');
            }, 500);
        }, 1500);
    }
    
    // This is a simple simulation. A real game would have more complex state management.
    let pinsUp = 10;
    let currentFrame = 1;
    let isPlayerTurn = true;

    function resetGame() {
        pinsUp = 10;
        currentFrame = 1;
        isPlayerTurn = true;
        // Update UI to reflect new game state
    }

    // ... (rest of the file)
});
