document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    const nameInput = document.getElementById('name-input');

    loginButton.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        if (name === '') {
            alert('이름을 꼭! 입력해줘야 해!');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            });

            if (response.ok) {
                // For now, just store name and move to a placeholder game screen
                localStorage.setItem('playerName', name);
                alert(`안녕, ${name}! 이제 게임을 시작하자!`);
                window.location.href = '/game.html'; // To be created
            } else {
                alert('로그인에 실패했어. 다시 시도해줘!');
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('오류가 발생했어. 서버가 켜져 있는지 확인해줘!');
        }
    });
});
