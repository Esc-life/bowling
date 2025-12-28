document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('solo-mode-button').addEventListener('click', () => {
        window.location.href = '/game.html';
    });

    document.getElementById('multi-mode-button').addEventListener('click', () => {
        // This will lead to the lobby, to be created
        window.location.href = '/lobby.html'; 
    });
});
