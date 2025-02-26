const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const themeToggle = document.getElementById('themeToggle');
const resetButton = document.getElementById('resetButton');

// Load images with forced reload capability
const pikachuImg = new Image();
pikachuImg.src = 'pikachu.png' + '?t=' + new Date().getTime(); // Prevent caching issues
const treeImg = new Image();
treeImg.src = 'tree.png' + '?t=' + new Date().getTime(); // Prevent caching issues

// Load sounds
const jumpSound = new Audio('jump.mp3');
const gameOverSound = new Audio('gameover.mp3');

// Game objects
let pikachu = {
    x: 50,
    y: 150,
    width: 32,
    height: 32,
    dy: 0,
    gravity: 0.6,
    jumpPower: -12,
    isJumping: false,
    canJump: true
};

let tree = {
    x: 800,
    y: 150,
    width: 32,
    height: 48,
    dx: -3 // Base speed for tree movement
};

let score = 0;
let gameOver = false;
let frameCount = 0;
let isResetting = false; // Flag to prevent concurrent resets
let speed = 1.0; // Base speed multiplier (1x initial speed)

const maxSpeed = 5.0; // Maximum speed limit

// Reset game function with comprehensive state cleanup and focus handling
function resetGame() {
    if (isResetting) return; // Prevent multiple resets at once
    isResetting = true;
    console.log('Attempting to reset game...');

    // Reset all game objects and states completely
    pikachu = {
        x: 50,
        y: 150,
        width: 32,
        height: 32,
        dy: 0,
        gravity: 0.6,
        jumpPower: -12,
        isJumping: false,
        canJump: true
    };

    tree = {
        x: 800,
        y: 150,
        width: 32,
        height: 48,
        dx: -3 // Reset to base speed
    };

    score = 0;
    gameOver = false;
    frameCount = 0;
    speed = 1.0; // Reset speed to base

    // Update UI
    scoreDisplay.textContent = 'Score: ' + score;

    // Clear canvas and ensure context is valid
    if (!ctx) {
        console.error('Canvas context is invalid. Reinitializing...');
        ctx = canvas.getContext('2d');
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Force reload images if not loaded, and draw with fallbacks
    const checkAndDrawImages = () => {
        console.log('Checking image status for reset...');
        let pikachuLoaded = pikachuImg.complete && pikachuImg.naturalWidth > 0;
        let treeLoaded = treeImg.complete && treeImg.naturalWidth > 0;

        if (!pikachuLoaded || !treeLoaded) {
            console.log('One or both images not loaded. Attempting forced reload.');
            if (!pikachuLoaded) {
                pikachuImg.src = 'pikachu.png' + '?t=' + new Date().getTime(); // Force reload
                console.log('Forcing reload of Pikachu image.');
            }
            if (!treeLoaded) {
                treeImg.src = 'tree.png' + '?t=' + new Date().getTime(); // Force reload
                console.log('Forcing reload of Tree image.');
            }
            setTimeout(checkAndDrawImages, 500); // Retry after 500ms
            return;
        }

        console.log('Both images loaded. Drawing initial state.');
        ctx.drawImage(pikachuImg, pikachu.x, pikachu.y, pikachu.width, pikachu.height);
        ctx.drawImage(treeImg, tree.x, tree.y, tree.width, tree.height);

        // Restart the game loop after ensuring drawings are complete
        setTimeout(() => {
            console.log('Restarting game loop after reset...');
            isResetting = false;
            requestAnimationFrame(update);
            // Remove focus from the reset button after reset
            resetButton.blur();
        }, 200); // Increased delay to ensure assets are ready
    };

    // Start image check immediately
    checkAndDrawImages();
}

// Jump with spacebar (prevent rapid-fire jumps and manage focus)
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!gameOver && pikachu.canJump) {
            pikachu.dy = pikachu.jumpPower;
            pikachu.isJumping = true;
            pikachu.canJump = false;
            jumpSound.play().catch(err => console.log('Audio error:', err));
            // Remove focus from any element (e.g., reset button) to prevent accidental clicks
            document.activeElement.blur();
        } else if (gameOver) {
            // Restart game if spacebar is pressed after game over
            resetGame();
        }
    }
});

// Theme toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    document.body.classList.toggle('dark-theme');
    themeToggle.textContent = document.body.classList.contains('dark-theme') ? 'Light Mode' : 'Dark Mode';
    // Remove focus after toggle to prevent accidental resets
    themeToggle.blur();
});

// Reset button with focus management
resetButton.addEventListener('click', (e) => {
    console.log('Reset button clicked. Focus state:', document.activeElement === resetButton);
    resetGame();
    // Prevent default if needed, and remove focus
    e.preventDefault();
    resetButton.blur();
});

// Game loop with enhanced debugging and speed
function update() {
    if (gameOver || isResetting) {
        if (gameOver) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.font = '28px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
            ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
        }
        console.log('Update paused due to gameOver or resetting:', gameOver, isResetting);
        return;
    }

    console.log('Updating game state - Pikachu:', pikachu.x, pikachu.y, 'Tree:', tree.x, tree.y, 'Speed:', speed);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pikachu physics with bounds checking
    pikachu.dy += pikachu.gravity;
    pikachu.y += pikachu.dy;

    if (pikachu.y > 150) {
        pikachu.y = 150;
        pikachu.dy = 0;
        pikachu.isJumping = false;
        pikachu.canJump = true;
    } else if (pikachu.y < 0) {
        pikachu.y = 0;
        pikachu.dy = 0;
    }

    // Draw Pikachu with bounce effect
    frameCount++;
    const bounce = pikachu.y === 150 ? Math.sin(frameCount * 0.1) * 2 : 0;
    if (pikachuImg.complete && pikachuImg.naturalWidth > 0) {
        ctx.drawImage(pikachuImg, pikachu.x, pikachu.y + bounce, pikachu.width, pikachu.height);
    } else {
        console.log('Pikachu image not loaded or invalid. Drawing placeholder.');
        ctx.fillStyle = 'gray';
        ctx.fillRect(pikachu.x, pikachu.y + bounce, pikachu.width, pikachu.height);
    }

    // Move and draw tree with speed multiplier
    tree.x += tree.dx * speed;
    if (tree.x < -tree.width) {
        tree.x = 800 + Math.random() * 200;
        score++;
        scoreDisplay.textContent = 'Score: ' + score;
        // Gradually increase base tree speed (optional, for additional difficulty)
        tree.dx = Math.max(tree.dx - 0.1, -6);
    }
    if (treeImg.complete && treeImg.naturalWidth > 0) {
        ctx.drawImage(treeImg, tree.x, tree.y, tree.width, tree.height);
    } else {
        console.log('Tree image not loaded or invalid. Drawing placeholder.');
        ctx.fillStyle = 'green';
        ctx.fillRect(tree.x, tree.y, tree.width, tree.height);
    }

    // Update speed based on score milestones
    updateSpeed();

    // Collision detection
    if (
        pikachu.x < tree.x + tree.width &&
        pikachu.x + pikachu.width > tree.x &&
        pikachu.y < tree.y + tree.height &&
        pikachu.y + pikachu.height > tree.y
    ) {
        gameOver = true;
        gameOverSound.play().catch(err => console.log('Audio error:', err));
    }

    // Draw score on canvas
    ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#fff' : '#000';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.fillText(`Speed: ${speed.toFixed(1)}x`, 10, 50); // Display current speed

    requestAnimationFrame(update);
}

// Update speed based on score
function updateSpeed() {
    if (score >= 5 && score < 10 && speed < maxSpeed) {
        speed = 1.5;
    } else if (score >= 10 && score < 15 && speed < maxSpeed) {
        speed = 2.0;
    } else if (score >= 15 && score < 20 && speed < maxSpeed) {
        speed = 2.5;
    } else if (score >= 20 && score < 25 && speed < maxSpeed) {
        speed = 3.0;
    } else if (score >= 25 && score < 30 && speed < maxSpeed) {
        speed = 3.5;
    } else if (score >= 30 && score < 35 && speed < maxSpeed) {
        speed = 4.0;
    }
    // Continue this pattern for higher scores (e.g., 35, 40, etc.) in increments of 5
    // Add more conditions or use a loop for scalability if needed
}

// Start game and handle image loading errors
let assetsLoaded = 0;
const startGame = () => {
    assetsLoaded++;
    if (assetsLoaded === 2) update();
};
pikachuImg.onload = startGame;
treeImg.onload = startGame;

pikachuImg.onerror = () => {
    console.log('Pikachu image failed to load. Using fallback.');
    pikachuImg.src = 'pikachu.png' + '?t=' + new Date().getTime(); // Force reload
};
treeImg.onerror = () => {
    console.log('Tree image failed to load. Using fallback.');
    treeImg.src = 'tree.png' + '?t=' + new Date().getTime(); // Force reload
};

// Debug: Log positions for troubleshooting
console.log('Initial Pikachu position:', pikachu.x, pikachu.y);
console.log('Initial Tree position:', tree.x, tree.y);