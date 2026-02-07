let score = 0;
let timeLeft = 30;
let gameActive = true;

const square = document.getElementById('square');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const gameArea = document.getElementById('game-area');

// Get random position within game area
function getRandomPosition() {
    const gameRect = gameArea.getBoundingClientRect();
    const maxX = gameRect.width - 50; // 50 is square width
    const maxY = gameRect.height - 50; // 50 is square height
    
    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);
    
    return { x, y };
}

// Move square to random position
function moveSquare() {
    if (!gameActive) return;
    
    const pos = getRandomPosition();
    square.style.left = pos.x + 'px';
    square.style.top = pos.y + 'px';
}

// Handle square click
square.addEventListener('click', () => {
    if (!gameActive) return;
    
    score++;
    scoreDisplay.textContent = score;
    
    // Move square immediately after click
    moveSquare();
    
    // Add click effect
    square.style.transform = 'scale(0.8)';
    setTimeout(() => {
        square.style.transform = 'scale(1)';
    }, 100);
});

// Timer countdown
const timerInterval = setInterval(() => {
    if (!gameActive) return;
    
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    
    if (timeLeft <= 0) {
        gameActive = false;
        clearInterval(timerInterval);
        clearInterval(moveInterval);
        endGame();
    }
}, 1000);

// Auto-move square every 1.5 seconds
const moveInterval = setInterval(() => {
    moveSquare();
}, 1500);

// End game
function endGame() {
    square.style.display = 'none';
    gameArea.innerHTML = `
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; font-size: 2rem;">
            <p>Game Over!</p>
            <p style="font-size: 3rem; color: #ffd700; margin: 20px 0;">Final Score: ${score}</p>
            <button onclick="location.reload()" style="padding: 15px 30px; font-size: 1.2rem; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">Play Again</button>
        </div>
    `;
}

// Initialize game - position square randomly at start
moveSquare();