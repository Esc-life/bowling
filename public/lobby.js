document.addEventListener('DOMContentLoaded', () => {
    const playerName = localStorage.getItem('playerName');
    if (!playerName) {
        window.location.href = '/';
        return;
    }

    const ws = new WebSocket(`ws://${window.location.host}`);

    const lobbyControls = document.getElementById('lobby-controls');
    const lobbyWaitScreen = document.getElementById('lobby-wait-screen');
    const createLobbyBtn = document.getElementById('create-lobby-button');
    const joinLobbyBtn = document.getElementById('join-lobby-button');
    const startGameBtn = document.getElementById('start-game-button');
    const lobbyIdInput = document.getElementById('lobby-id-input');
    const lobbyIdDisplay = document.getElementById('lobby-id-display');
    const playerList = document.getElementById('player-list');

    ws.onopen = () => {
        console.log('Connected to WebSocket server');
    };

    createLobbyBtn.addEventListener('click', () => {
        sendMessage({ type: 'create_lobby', playerName });
    });

    joinLobbyBtn.addEventListener('click', () => {
        const lobbyId = lobbyIdInput.value.trim();
        if (lobbyId) {
            sendMessage({ type: 'join_lobby', lobbyId, playerName });
        } else {
            alert('참가할 로비의 ID를 입력해줘!');
        }
    });
    
    startGameBtn.addEventListener('click', () => {
        const lobbyId = lobbyIdDisplay.textContent;
        sendMessage({ type: 'start_game', lobbyId });
    });


    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data);

        switch(data.type) {
            case 'lobby_created':
            case 'lobby_joined':
                lobbyControls.style.display = 'none';
                lobbyWaitScreen.style.display = 'block';
                lobbyIdDisplay.textContent = data.lobbyId;
                updatePlayerList(data.players);
                break;
            case 'player_joined':
                updatePlayerList(data.players);
                break;
            case 'lobby_not_found':
                alert('해당 ID의 로비를 찾을 수 없어. ID를 다시 확인해줘!');
                break;
            case 'start_game':
                // Redirect to the multiplayer game screen
                window.location.href = `/game.html?lobbyId=${data.lobbyId}`;
                break;
            case 'error':
                alert(`오류가 발생했어: ${data.message}`);
                break;
        }
    };

    function sendMessage(message) {
        ws.send(JSON.stringify(message));
    }

    function updatePlayerList(players) {
        playerList.innerHTML = '';
        players.forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            playerList.appendChild(li);
        });
    }
});
