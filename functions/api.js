const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const serverless = require('serverless-http');

const app = express();
const router = express.Router();

// Use a temporary directory for the database file in a serverless environment
const DB_FILE = path.join('/tmp', 'scores.json');

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ players: {} }, null, 2));
}

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

router.get('/scores', (req, res) => {
    fs.readFile(DB_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading scores data.');
        }
        res.json(JSON.parse(data));
    });
});

router.post('/login', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).send('Player name is required.');
    }

    fs.readFile(DB_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading scores data.');
        }
        const db = JSON.parse(data);
        if (!db.players[name]) {
            db.players[name] = {
                highScore: 0,
                maxStrikes: 0,
                games: []
            };
        }
        fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error saving player data.');
            }
            res.json({ message: `Player ${name} logged in.` });
        });
    });
});

router.post('/scores', (req, res) => {
    const { name, score, strikes } = req.body;
    if (!name || score === undefined || strikes === undefined) {
        return res.status(400).send('Player name, score, and strikes are required.');
    }

    fs.readFile(DB_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading scores data.');
        }
        const db = JSON.parse(data);
        if (!db.players[name]) {
            return res.status(404).send('Player not found.');
        }

        const playerData = db.players[name];
        playerData.games.push({ score, strikes, date: new Date().toISOString() });
        playerData.highScore = Math.max(playerData.highScore, score);
        playerData.maxStrikes = Math.max(playerData.maxStrikes, strikes);

        fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error saving score data.');
            }
            res.json({ message: `Score for ${name} saved successfully.` });
        });
    });
});

app.use(bodyParser.json());
app.use('/api', router);

module.exports.handler = serverless(app);
