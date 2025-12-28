document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/scores');
        const data = await response.json();
        const players = data.players;

        // 점수 랭킹
        const scoreRankingList = document.getElementById('score-ranking');
        const sortedByScore = Object.entries(players).sort(([,a],[,b]) => b.highScore - a.highScore);
        
        sortedByScore.forEach(([name, data]) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="player-name">${name}</span> <span class="player-score">${data.highScore}점</span>`;
            scoreRankingList.appendChild(li);
        });

        // 최다 연속 스트라이크 랭킹
        const strikeRankingList = document.getElementById('strike-ranking');
        const sortedByStrikes = Object.entries(players).sort(([,a],[,b]) => b.maxStrikes - a.maxStrikes);

        sortedByStrikes.forEach(([name, data]) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="player-name">${name}</span> <span class="player-score">${data.maxStrikes}회</span>`;
            strikeRankingList.appendChild(li);
        });

    } catch (error) {
        console.error('Error fetching scores:', error);
        alert('기록을 불러오는 데 실패했어요.');
    }

    document.getElementById('play-again-button').addEventListener('click', () => {
        window.location.href = '/'; // Go back to login
    });
});
