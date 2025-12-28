const http = require('http');
const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'scores.json');

// --- DATABASE ---
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ players: {} }, null, 2));
}

// --- EXPRESS MIDDLEWARE ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// --- HTTP API ROUTES ---
app.post('/api/login', (req, res) => {
    // ... (logic from old server.js, adapted for simplicity)
    const { name } = req.body;
    if (!name) return res.status(400).send('Name required.');
    
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!db.players[name]) {
        db.players[name] = { highScore: 0, maxStrikes: 0, games: [] };
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    }
    res.json({ message: 'Logged in' });
});

app.post('/api/scores', (req, res) => {
    // ... (logic from old server.js)
    const { name, score, strikes } = req.body;
     if (!name || score === undefined || strikes === undefined) {
        return res.status(400).send('Player name, score, and strikes are required.');
    }
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!db.players[name]) return res.status(404).send('Player not found.');

    const playerData = db.players[name];
    playerData.games.push({ score, strikes, date: new Date().toISOString() });
    playerData.highScore = Math.max(playerData.highScore, score);
    playerData.maxStrikes = Math.max(playerData.maxStrikes, strikes);
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    res.json({ message: 'Score saved.' });
});

app.get('/api/scores', (req, res) => {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    res.json(JSON.parse(data));
});


// --- WEBSOCKET LOGIC ---
const lobbies = {}; // Stores lobby state: { lobbyId: { players: [ws, ...], game: GameState } }

function generateLobbyId() {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function broadcastToLobby(lobbyId, message) {
    if (lobbies[lobbyId]) {
        lobbies[lobbyId].players.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(message));
            }
        });
    }
}

wss.on('connection', (ws) => {
    console.log('Client connected');
    let currentLobbyId = null;
    let currentPlayerName = null;

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        console.log('received:', data);

        switch (data.type) {
            case 'create_lobby':
                const lobbyId = generateLobbyId();
                lobbies[lobbyId] = { players: [{ ws, name: data.playerName }] };
                currentLobbyId = lobbyId;
                currentPlayerName = data.playerName;
                ws.send(JSON.stringify({ type: 'lobby_created', lobbyId, players: [data.playerName] }));
                break;

            case 'join_lobby':
                const lobby = lobbies[data.lobbyId];
                if (lobby) {
                    lobby.players.push({ ws, name: data.playerName });
                    currentLobbyId = data.lobbyId;
                    currentPlayerName = data.playerName;
                    const playerNames = lobby.players.map(p => p.name);

                    // Notify all players in the lobby about the new player
                    broadcastToLobby(data.lobbyId, { type: 'player_joined', players: playerNames });
                    
                    // Confirm join for the new player
                    ws.send(JSON.stringify({ type: 'lobby_joined', lobbyId: data.lobbyId, players: playerNames }));

                } else {
                    ws.send(JSON.stringify({ type: 'lobby_not_found' }));
                }
                break;

            case 'start_game':
                if (lobbies[data.lobbyId]) {
                    // Initialize game state here if needed
                    lobbies[data.lobbyId].game = new BowlingGame(lobbies[data.lobbyId].players.map(p => p.name));
                    broadcastToLobby(data.lobbyId, { type: 'start_game', lobbyId: data.lobbyId, gameState: lobbies[data.lobbyId].game.getState() });
                }
                break;

            case 'game_action':
                const currentLobby = lobbies[currentLobbyId];
                if (currentLobby && currentLobby.game) {
                    // Server-side game logic updates
                    currentLobby.game.handleAction(currentPlayerName, data.action);
                    // Broadcast updated game state to all players in the lobby
                    broadcastToLobby(currentLobbyId, { type: 'game_update', gameState: currentLobby.game.getState() });
                }
                break;
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        if (currentLobbyId && currentPlayerName) {
            const lobby = lobbies[currentLobbyId];
            if (lobby) {
                // Remove player from lobby
                lobbies[currentLobbyId].players = lobby.players.filter(p => p.name !== currentPlayerName);
                
                if (lobbies[currentLobbyId].players.length === 0) {
                    // Delete lobby if empty
                    delete lobbies[currentLobbyId];
                    console.log(`Lobby ${currentLobbyId} closed.`);
                } else {
                    // Notify remaining players
                    const playerNames = lobbies[currentLobbyId].players.map(p => p.name);
                    broadcastToLobby(currentLobbyId, { type: 'player_left', players: playerNames });
                }
            }
        }
    });
});


// --- START SERVER ---
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
