// ---------------- GAME STATE ----------------
const state = {
    score: 0,
    timeLeft: 60,
    isPlaying: false,
    gameLoopId: null,
    timerId: null,
    targetX: 0,
    targetY: 0,
    targetSpeedX: 3,
    targetSpeedY: 2,
    targetSize: 80,
    difficultyMultiplier: 1
};

// ---------------- DOM ELEMENTS ----------------
const elements = {
    gameArea: document.getElementById("game-area"),
    target: document.getElementById("target"),
    bow: document.getElementById("bow"),
    arrowsContainer: document.getElementById("arrows-container"),
    scoreDisplay: document.getElementById("score-display"),
    timeDisplay: document.getElementById("time-display"),
    menuScreen: document.getElementById("menu-screen"),
    menuTitle: document.getElementById("menu-title"),
    menuDesc: document.getElementById("menu-desc"),
    startBtn: document.getElementById("start-btn"),
    statsContainer: document.getElementById("stats-container"),
    finalScore: document.getElementById("final-score")
};

// ---------------- EVENTS ----------------
elements.startBtn.addEventListener("click", startGame);

elements.gameArea.addEventListener("mousedown", (e) => {
    if (state.isPlaying && !elements.menuScreen.contains(e.target)) {
        shootArrow(e);
    }
});

elements.gameArea.addEventListener("contextmenu", e => e.preventDefault());

// ---------------- GAME FUNCTIONS ----------------
function startGame() {
    resetState();
    elements.menuScreen.classList.add("hidden");
    state.isPlaying = true;
    resetTargetPosition();
    state.gameLoopId = requestAnimationFrame(gameLoop);
    state.timerId = setInterval(updateTimer, 1000);
}

function resetState() {
    state.score = 0;
    state.timeLeft = 60;
    state.targetSize = 80;
    state.difficultyMultiplier = 1;
    elements.arrowsContainer.innerHTML = "";
    updateUI();
}

function gameOver() {
    state.isPlaying = false;
    cancelAnimationFrame(state.gameLoopId);
    clearInterval(state.timerId);
    elements.finalScore.textContent = state.score;
    elements.statsContainer.classList.remove("hidden");
    elements.menuScreen.classList.remove("hidden");
}

// ---------------- LOOP ----------------
function gameLoop() {
    if (!state.isPlaying) return;
    moveTarget();
    moveArrows();
    checkCollisions();
    requestAnimationFrame(gameLoop);
}

// ---------------- TARGET ----------------
function resetTargetPosition() {
    state.targetX = Math.random() * (window.innerWidth - state.targetSize);
    state.targetY = Math.random() * (window.innerHeight * 0.6);
    updateTarget();
}

function moveTarget() {
    state.targetX += state.targetSpeedX * state.difficultyMultiplier;
    state.targetY += state.targetSpeedY * state.difficultyMultiplier;
    updateTarget();
}

function updateTarget() {
    elements.target.style.width = state.targetSize + "px";
    elements.target.style.height = state.targetSize + "px";
    elements.target.style.left = state.targetX + "px";
    elements.target.style.top = state.targetY + "px";
}

// ---------------- ARROWS ----------------
function shootArrow(event) {
    const gameRect = elements.gameArea.getBoundingClientRect();
    const bowRect = elements.bow.getBoundingClientRect();

    // Bow center (relative to game area)
    const startX = bowRect.left + bowRect.width / 2 - gameRect.left;
    const startY = bowRect.top + bowRect.height / 2 - gameRect.top;

    // Mouse position (relative to game area)
    const mouseX = event.clientX - gameRect.left;
    const mouseY = event.clientY - gameRect.top;

    // Direction vector
    const dx = mouseX - startX;
    const dy = mouseY - startY;
    const angle = Math.atan2(dy, dx);

    const speed = 15;

    // Create arrow
    const arrow = document.createElement("div");
    arrow.className = "arrow";

    arrow.style.left = `${startX}px`;
    arrow.style.top = `${startY}px`;
    arrow.style.transform = `rotate(${angle * 180 / Math.PI}deg)`;

    // Store motion data
    arrow.dataset.x = startX;
    arrow.dataset.y = startY;
    arrow.dataset.vx = Math.cos(angle) * speed;
    arrow.dataset.vy = Math.sin(angle) * speed;

    elements.arrowsContainer.appendChild(arrow);
}


function moveArrows() {
    const bounds = elements.gameArea.getBoundingClientRect();

    document.querySelectorAll(".arrow").forEach(arrow => {
        let x = parseFloat(arrow.dataset.x);
        let y = parseFloat(arrow.dataset.y);

        x += parseFloat(arrow.dataset.vx);
        y += parseFloat(arrow.dataset.vy);

        arrow.dataset.x = x;
        arrow.dataset.y = y;

        arrow.style.left = `${x}px`;
        arrow.style.top = `${y}px`;

        // Remove arrow if out of bounds
        if (x < -50 || x > bounds.width + 50 || y < -50 || y > bounds.height + 50) {
            arrow.remove();
        }
    });
}


// ---------------- COLLISION ----------------
function checkCollisions() {
    const targetRect = elements.target.getBoundingClientRect();
    document.querySelectorAll(".arrow").forEach(arrow => {
        const arrowRect = arrow.getBoundingClientRect();
        if (
            arrowRect.right > targetRect.left &&
            arrowRect.left < targetRect.right &&
            arrowRect.bottom > targetRect.top &&
            arrowRect.top < targetRect.bottom
        ) {
            arrow.remove();
            state.score += 10;
            increaseDifficulty();
            updateUI();
            resetTargetPosition();
        }
    });
}

function increaseDifficulty() {
    state.difficultyMultiplier += 0.1;
    state.targetSize = Math.max(40, state.targetSize - 2);
}

// ---------------- TIMER ----------------
function updateTimer() {
    state.timeLeft--;
    updateUI();
    if (state.timeLeft <= 0) gameOver();
}

function updateUI() {
    elements.scoreDisplay.textContent = state.score;
    elements.timeDisplay.textContent = state.timeLeft;
}
