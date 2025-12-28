document.addEventListener('DOMContentLoaded', () => {
    const playerName = localStorage.getItem('playerName');
    if (!playerName) {
        window.location.href = '/';
        return;
    }

    document.getElementById('player-name-display').textContent = `${playerName}의 신나는 볼링!`;

    const scoreboard = document.getElementById('scoreboard');
    const pinsContainer = document.getElementById('pins-container');
    const throwButton = document.getElementById('throw-button');

    let game;

    class Game {
        constructor() {
            this.rolls = [];
            this.currentRoll = 0;
            this.frames = Array(10).fill(null).map(() => ({ rolls: [], score: null, cumulativeScore: null }));
        }

        roll(pins) {
            this.rolls[this.currentRoll++] = pins;
        }

        calculateScore() {
            let score = 0;
            let rollIndex = 0;
            for (let frame = 0; frame < 10; frame++) {
                if (this.isStrike(rollIndex)) { // Strike
                    score += 10 + this.strikeBonus(rollIndex);
                    this.frames[frame].rolls = ['X'];
                    this.frames[frame].score = 10 + this.strikeBonus(rollIndex);
                    rollIndex++;
                } else if (this.isSpare(rollIndex)) { // Spare
                    score += 10 + this.spareBonus(rollIndex);
                    this.frames[frame].rolls = [this.rolls[rollIndex], '/'];
                    this.frames[frame].score = 10 + this.spareBonus(rollIndex);
                    rollIndex += 2;
                } else {
                    score += this.sumOfBallsInFrame(rollIndex);
                    this.frames[frame].rolls = [this.rolls[rollIndex] || '-', this.rolls[rollIndex + 1] || '-'];
                    this.frames[frame].score = this.sumOfBallsInFrame(rollIndex);
                    rollIndex += 2;
                }
                this.frames[frame].cumulativeScore = score;
            }
            return score;
        }
        
        isStrike(rollIndex) { return this.rolls[rollIndex] === 10; }
        isSpare(rollIndex) { return this.rolls[rollIndex] + this.rolls[rollIndex + 1] === 10; }
        strikeBonus(rollIndex) { return this.rolls[rollIndex + 1] + this.rolls[rollIndex + 2]; }
        spareBonus(rollIndex) { return this.rolls[rollIndex + 2]; }
        sumOfBallsInFrame(rollIndex) { return this.rolls[rollIndex] + this.rolls[rollIndex + 1]; }
    }


    function setupPins() {
        pinsContainer.innerHTML = '';
        const pinPositions = [
            { bottom: 0, left: '50%' }, // 1
            { bottom: 20, left: '40%' }, { bottom: 20, left: '60%' }, // 2, 3
            { bottom: 40, left: '30%' }, { bottom: 40, left: '50%' }, { bottom: 40, left: '70%' }, // 4, 5, 6
            { bottom: 60, left: '20%' }, { bottom: 60, left: '40%' }, { bottom: 60, left: '60%' }, { bottom: 60, left: '80%' } // 7, 8, 9, 10
        ];
        pinPositions.forEach((pos, i) => {
            const pin = document.createElement('div');
            pin.classList.add('pin');
            pin.style.bottom = `${pos.bottom}px`;
            pin.style.left = `calc(${pos.left} - 5px)`;
            pinsContainer.appendChild(pin);
        });
    }

    function updateScoreboard() {
        scoreboard.innerHTML = '';
        game.calculateScore(); // Calculate scores before rendering

        game.frames.forEach((frame, index) => {
            const frameDiv = document.createElement('div');
            frameDiv.classList.add('frame');

            const frameHeader = document.createElement('div');
            frameHeader.classList.add('frame-header');
            frameHeader.textContent = index + 1;
            frameDiv.appendChild(frameHeader);

            const frameScores = document.createElement('div');
            frameScores.classList.add('frame-scores');
            
            const roll1 = document.createElement('div');
            roll1.classList.add('frame-score');
            roll1.textContent = frame.rolls[0] === undefined ? '' : frame.rolls[0];
            
            const roll2 = document.createElement('div');
            roll2.classList.add('frame-score');
            roll2.textContent = frame.rolls[1] === undefined ? '' : frame.rolls[1];

            frameScores.appendChild(roll1);
            frameScores.appendChild(roll2);
            frameDiv.appendChild(frameScores);

            const frameTotal = document.createElement('div');
            frameTotal.classList.add('frame-total');
            frameTotal.textContent = frame.cumulativeScore === null ? '' : frame.cumulativeScore;
            frameDiv.appendChild(frameTotal);

            scoreboard.appendChild(frameDiv);
        });
    }

    function startGame() {
        game = new Game();
        setupPins();
        updateScoreboard();
    }
    
    // This is a simple simulation. A real game would have more complex state management.
    let pinsUp = 10;
    let frame = 0;
    let isFirstRoll = true;

    throwButton.addEventListener('click', async () => {
        if (frame >= 10) {
            const finalScore = game.frames[9].cumulativeScore;
            alert("게임 끝! 점수: " + finalScore);
            
            // Simple way to count consecutive strikes for this game
            let consecutiveStrikes = 0;
            let maxStrikes = 0;
            game.rolls.forEach(roll => {
                if (roll === 10) {
                    consecutiveStrikes++;
                } else {
                    maxStrikes = Math.max(maxStrikes, consecutiveStrikes);
                    consecutiveStrikes = 0;
                }
            });
            maxStrikes = Math.max(maxStrikes, consecutiveStrikes);

            try {
                await fetch('/api/scores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: playerName, score: finalScore, strikes: maxStrikes })
                });
                window.location.href = '/records.html'; // Redirect to records page
            } catch (error) {
                console.error('Failed to save score:', error);
                alert('점수 저장에 실패했어요.');
            }
            return;
        }

        const pinsHit = Math.floor(Math.random() * (pinsUp + 1));
        game.roll(pinsHit);
        
        pinsUp -= pinsHit;

        if (isFirstRoll) {
            if (pinsHit === 10) { // Strike
                // Move to next frame
                frame++;
                pinsUp = 10;
                // isFirstRoll remains true
            } else {
                isFirstRoll = false;
            }
        } else { // Second roll
            frame++;
            pinsUp = 10;
            isFirstRoll = true;
        }

        updateScoreboard();
        
        // Simple pin animation placeholder
        knockDownPins(pinsHit);
        
        if (pinsUp === 0 || !isFirstRoll) {
            setTimeout(() => {
                setupPins(); // Reset pins for next frame/roll
            }, 1000);
        }
    });

    function knockDownPins(count) {
        const allPins = pinsContainer.children;
        // This is a very basic visualization, not accurate pin fall.
        for(let i = 0; i < count; i++) {
            if (allPins[i] && !allPins[i].style.display) {
                 allPins[i].style.display = 'none';
            }
        }
    }


    startGame();
});
