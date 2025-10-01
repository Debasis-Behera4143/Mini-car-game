// Canvas and UI Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const streakEl = document.getElementById('streak');
const speedLevelEl = document.getElementById('speedLevel');
const speedBar = document.getElementById('speedBar');
const livesEl = document.getElementById('lives');
const menuEl = document.getElementById('menu');
const instructionsEl = document.getElementById('instructions');
const gameoverEl = document.getElementById('gameover');
const finalScoreEl = document.getElementById('finalScore');
const bestStreakEl = document.getElementById('bestStreak');
const coinsCollectedEl = document.getElementById('coinsCollected');
const newHighScoreEl = document.getElementById('newHighScore');
const powerupNotif = document.getElementById('powerupNotif');

// Game State
let gameState = 'menu';
let score = 0;
let streak = 0;
let coinsCollected = 0;
let lives = 3;
let highScore = localStorage.getItem('highScore') || 0;
highScoreEl.textContent = highScore;

// Game Object
const game = {
    car: { 
        x: 175, 
        y: 480, 
        width: 50, 
        height: 80, 
        speed: 7,
        tilt: 0,
        targetTilt: 0
    },
    obstacles: [],
    particles: [],
    coins: [],
    powerups: [],
    keys: {},
    gameSpeed: 3,
    baseSpeed: 3,
    obstacleTimer: 0,
    coinTimer: 0,
    powerupTimer: 0,
    animationId: null,
    roadOffset: 0,
    shake: 0,
    shield: false,
    shieldTimer: 0,
    slowMo: false,
    slowMoTimer: 0,
    magnet: false,
    magnetTimer: 0
};

// Keyboard Controls
window.addEventListener('keydown', (e) => {
    game.keys[e.key] = true;
    if (e.key === ' ' && gameState === 'gameover') {
        startGame();
    }
});

window.addEventListener('keyup', (e) => {
    game.keys[e.key] = false;
});

// UI Functions
function showInstructions() {
    menuEl.classList.add('hidden');
    instructionsEl.classList.remove('hidden');
}

function hideInstructions() {
    instructionsEl.classList.add('hidden');
    menuEl.classList.remove('hidden');
}

function backToMenu() {
    gameoverEl.classList.add('hidden');
    menuEl.classList.remove('hidden');
    gameState = 'menu';
}

function updateLivesDisplay() {
    const hearts = livesEl.querySelectorAll('.heart');
    hearts.forEach((heart, index) => {
        heart.style.opacity = index < lives ? '1' : '0.3';
    });
}

function showPowerupNotification(message) {
    powerupNotif.textContent = message;
    powerupNotif.classList.remove('hidden');
    setTimeout(() => {
        powerupNotif.classList.add('hidden');
    }, 2000);
}

// Game Functions
function startGame() {
    // Reset game state
    game.car.x = 175;
    game.car.y = 480;
    game.car.tilt = 0;
    game.obstacles = [];
    game.particles = [];
    game.coins = [];
    game.powerups = [];
    game.obstacleTimer = 0;
    game.coinTimer = 0;
    game.powerupTimer = 0;
    game.gameSpeed = 3;
    game.baseSpeed = 3;
    game.roadOffset = 0;
    game.shield = false;
    game.slowMo = false;
    game.magnet = false;
    
    score = 0;
    streak = 0;
    coinsCollected = 0;
    lives = 3;
    
    scoreEl.textContent = score;
    streakEl.textContent = streak;
    speedLevelEl.textContent = '1.0';
    speedBar.style.width = '33%';
    updateLivesDisplay();
    
    menuEl.classList.add('hidden');
    instructionsEl.classList.add('hidden');
    gameoverEl.classList.add('hidden');
    gameState = 'playing';
    
    gameLoop();
}

function createObstacle() {
    const lanes = [75, 150, 225, 300];
    const availableLanes = lanes.filter(lane => {
        return !game.obstacles.some(obs => 
            Math.abs(obs.x - lane) < 60 && obs.y < 100
        );
    });
    
    if (availableLanes.length === 0) return;
    
    const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#e67e22'];
    
    game.obstacles.push({
        x: lane,
        y: -100,
        width: 45,
        height: 70,
        color: colors[Math.floor(Math.random() * colors.length)]
    });
}

function createCoin() {
    const lanes = [75, 150, 225, 300];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    game.coins.push({
        x: lane + 15,
        y: -50,
        radius: 12,
        collected: false,
        rotation: 0
    });
}

function createPowerup() {
    const lanes = [75, 150, 225, 300];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const types = [
        { type: 'shield', color: '#3498db', icon: '🛡️' },
        { type: 'slowmo', color: '#f1c40f', icon: '⚡' },
        { type: 'magnet', color: '#9b59b6', icon: '🧲' }
    ];
    const powerup = types[Math.floor(Math.random() * types.length)];
    
    game.powerups.push({
        x: lane + 15,
        y: -50,
        radius: 15,
        type: powerup.type,
        color: powerup.color,
        icon: powerup.icon,
        collected: false,
        rotation: 0
    });
}

function createParticle(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        game.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * (Math.random() * 4 + 2),
            vy: Math.sin(angle) * (Math.random() * 4 + 2),
            life: 1,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

// Drawing Functions
function drawCar() {
    ctx.save();
    ctx.translate(game.car.x + game.car.width / 2, game.car.y + game.car.height / 2);
    ctx.rotate(game.car.tilt * Math.PI / 180);
    
    // Shield effect
    if (game.shield) {
        ctx.strokeStyle = 'rgba(52,152,219,0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(52,152,219,0.3)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, 48, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Car shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(-game.car.width / 2 + 4, -game.car.height / 2 + 4, game.car.width, game.car.height);
    
    // Car body gradient
    const gradient = ctx.createLinearGradient(0, -game.car.height / 2, 0, game.car.height / 2);
    gradient.addColorStop(0, '#ff4757');
    gradient.addColorStop(0.5, '#ee5a6f');
    gradient.addColorStop(1, '#c23644');
    ctx.fillStyle = gradient;
    ctx.fillRect(-game.car.width / 2, -game.car.height / 2, game.car.width, game.car.height);
    
    // Car highlights
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(-game.car.width / 2 + 5, -game.car.height / 2 + 5, game.car.width - 10, 8);
    ctx.fillRect(-game.car.width / 2 + 5, -game.car.height / 2 + 15, game.car.width - 10, 3);
    
    // Windows
    ctx.fillStyle = 'rgba(20,30,40,0.9)';
    ctx.fillRect(-game.car.width / 2 + 5, -game.car.height / 2 + 10, game.car.width - 10, 25);
    
    // Wheels
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-game.car.width / 2 - 5, -game.car.height / 2 + 15, 8, 18);
    ctx.fillRect(game.car.width / 2 - 3, -game.car.height / 2 + 15, 8, 18);
    ctx.fillRect(-game.car.width / 2 - 5, game.car.height / 2 - 33, 8, 18);
    ctx.fillRect(game.car.width / 2 - 3, game.car.height / 2 - 33, 8, 18);
    
    // Headlights
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.fillRect(-game.car.width / 2 + 8, game.car.height / 2 - 10, 12, 6);
    ctx.fillRect(game.car.width / 2 - 20, game.car.height / 2 - 10, 12, 6);
    ctx.shadowBlur = 0;
    
    ctx.restore();
}

function drawObstacle(obs) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(obs.x + 3, obs.y + 3, obs.width, obs.height);
    
    // Body gradient
    const gradient = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.height);
    gradient.addColorStop(0, obs.color);
    gradient.addColorStop(1, shadeColor(obs.color, -40));
    ctx.fillStyle = gradient;
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    
    // Highlights
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(obs.x + 3, obs.y + 3, obs.width - 6, 5);
    
    // Windows
    ctx.fillStyle = 'rgba(20,30,40,0.8)';
    ctx.fillRect(obs.x + 5, obs.y + 5, obs.width - 10, 20);
    
    // Taillights
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 5;
    ctx.fillRect(obs.x + 5, obs.y + obs.height - 8, 12, 5);
    ctx.fillRect(obs.x + obs.width - 17, obs.y + obs.height - 8, 12, 5);
    ctx.shadowBlur = 0;
}

function drawCoin(coin) {
    coin.rotation += 5;
    const scale = Math.abs(Math.sin(coin.rotation * Math.PI / 180));
    
    ctx.save();
    ctx.translate(coin.x, coin.y);
    
    // Coin glow
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, coin.radius + 8);
    glow.addColorStop(0, 'rgba(255,215,0,0.6)');
    glow.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, coin.radius + 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Coin body
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.ellipse(0, 0, coin.radius * scale, coin.radius, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Coin border
    ctx.strokeStyle = '#ffa500';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Coin symbol
    ctx.fillStyle = '#ff8c00';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.scale(scale, 1);
    ctx.fillText('$', 0, 0);
    
    ctx.restore();
}

function drawPowerup(powerup) {
    powerup.rotation += 3;
    
    ctx.save();
    ctx.translate(powerup.x, powerup.y);
    ctx.rotate(powerup.rotation * Math.PI / 180);
    
    // Powerup glow
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, powerup.radius + 10);
    glow.addColorStop(0, powerup.color + 'aa');
    glow.addColorStop(1, powerup.color + '00');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, powerup.radius + 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Powerup body
    ctx.fillStyle = powerup.color;
    ctx.beginPath();
    ctx.arc(0, 0, powerup.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Icon
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(powerup.icon, 0, 0);
    
    ctx.restore();
}

function drawParticles() {
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.size *= 0.98;
        
        if (p.life <= 0) {
            game.particles.splice(i, 1);
        }
    }
}

function shadeColor(color, percent) {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function drawRoad() {
    // Road background
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(50, 0, 300, canvas.height);
    
    // Road edges
    ctx.fillStyle = '#34495e';
    ctx.fillRect(50, 0, 10, canvas.height);
    ctx.fillRect(340, 0, 10, canvas.height);
    
    // Road lines
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 4;
    ctx.setLineDash([30, 20]);
    ctx.lineDashOffset = -game.roadOffset;
    
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(125 + i * 75, 0);
        ctx.lineTo(125 + i * 75, canvas.height);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    
    game.roadOffset += game.gameSpeed;
    if (game.roadOffset > 50) game.roadOffset = 0;
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < r1 + r2;
}

function handleCollision() {
    if (game.shield) {
        game.shield = false;
        game.shake = 8;
        showPowerupNotification('Shield Absorbed Hit!');
        return false;
    }
    
    lives--;
    updateLivesDisplay();
    game.shake = 15;
    createParticle(game.car.x + game.car.width / 2, game.car.y + game.car.height / 2, '#ff4757', 16);
    
    if (lives <= 0) {
        return true;
    }
    
    // Brief invincibility after hit
    setTimeout(() => {}, 1000);
    return false;
}

function endGame() {
    gameState = 'gameover';
    finalScoreEl.textContent = score;
    bestStreakEl.textContent = streak;
    coinsCollectedEl.textContent = coinsCollected;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreEl.textContent = highScore;
        newHighScoreEl.classList.remove('hidden');
    } else {
        newHighScoreEl.classList.add('hidden');
    }
    
    // Big explosion effect
    createParticle(game.car.x + game.car.width / 2, game.car.y + game.car.height / 2, '#ff4757', 20);
    createParticle(game.car.x + game.car.width / 2, game.car.y + game.car.height / 2, '#ffa502', 20);
    
    setTimeout(() => {
        gameoverEl.classList.remove('hidden');
    }, 500);
    
    cancelAnimationFrame(game.animationId);
}

function gameLoop() {
    if (gameState !== 'playing') return;
    
    // Apply slow-mo effect
    const currentSpeed = game.slowMo ? game.baseSpeed * 0.5 : game.baseSpeed;
    game.gameSpeed += (currentSpeed - game.gameSpeed) * 0.1;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply screen shake
    if (game.shake > 0) {
        ctx.save();
        ctx.translate(
            Math.random() * game.shake - game.shake / 2,
            Math.random() * game.shake - game.shake / 2
        );
        game.shake *= 0.85;
    }
    
    drawRoad();
    drawParticles();
    
    // Move car with smooth tilt
    if (game.keys['ArrowLeft'] && game.car.x > 60) {
        game.car.x -= game.car.speed;
        game.car.targetTilt = -10;
    } else if (game.keys['ArrowRight'] && game.car.x < 290) {
        game.car.x += game.car.speed;
        game.car.targetTilt = 10;
    } else {
        game.car.targetTilt = 0;
    }
    
    game.car.tilt += (game.car.targetTilt - game.car.tilt) * 0.2;
    
    drawCar();
    
    // Create obstacles
    game.obstacleTimer++;
    if (game.obstacleTimer > Math.max(70 - score, 35)) {
        createObstacle();
        game.obstacleTimer = 0;
    }
    
    // Create coins
    game.coinTimer++;
    if (game.coinTimer > 120) {
        createCoin();
        game.coinTimer = 0;
    }
    
    // Create powerups
    game.powerupTimer++;
    if (game.powerupTimer > 400) {
        createPowerup();
        game.powerupTimer = 0;
    }
    
    // Handle powerups
    for (let i = game.powerups.length - 1; i >= 0; i--) {
        const powerup = game.powerups[i];
        powerup.y += game.gameSpeed;
        drawPowerup(powerup);
        
        const carCenterX = game.car.x + game.car.width / 2;
        const carCenterY = game.car.y + game.car.height / 2;
        
        if (checkCircleCollision(carCenterX, carCenterY, 40, powerup.x, powerup.y, powerup.radius) && !powerup.collected) {
            powerup.collected = true;
            createParticle(powerup.x, powerup.y, powerup.color, 12);
            game.powerups.splice(i, 1);
            
            if (powerup.type === 'shield') {
                game.shield = true;
                game.shieldTimer = 300;
                showPowerupNotification('Shield Activated!');
            } else if (powerup.type === 'slowmo') {
                game.slowMo = true;
                game.slowMoTimer = 200;
                showPowerupNotification('Slow Motion!');
            } else if (powerup.type === 'magnet') {
                game.magnet = true;
                game.magnetTimer = 250;
                showPowerupNotification('Coin Magnet!');
            }
        }
        
        if (powerup.y > canvas.height) {
            game.powerups.splice(i, 1);
        }
    }
    
    // Handle coins
    for (let i = game.coins.length - 1; i >= 0; i--) {
        const coin = game.coins[i];
        coin.y += game.gameSpeed;
        drawCoin(coin);
        
        const carCenterX = game.car.x + game.car.width / 2;
        const carCenterY = game.car.y + game.car.height / 2;
        const attractRadius = game.magnet ? 80 : 30;
        
        if (game.magnet) {
            const dx = carCenterX - coin.x;
            const dy = carCenterY - coin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < attractRadius) {
                coin.x += dx / dist * 3;
                coin.y += dy / dist * 3;
            }
        }
        
        if (checkCircleCollision(carCenterX, carCenterY, 35, coin.x, coin.y, coin.radius) && !coin.collected) {
            coin.collected = true;
            score += 5;
            coinsCollected++;
            scoreEl.textContent = score;
            createParticle(coin.x, coin.y, '#ffd700', 10);
            game.coins.splice(i, 1);
        }
        
        if (coin.y > canvas.height) {
            game.coins.splice(i, 1);
        }
    }
    
    // Handle obstacles
    for (let i = game.obstacles.length - 1; i >= 0; i--) {
        const obs = game.obstacles[i];
        obs.y += game.gameSpeed;
        drawObstacle(obs);
        
        if (checkCollision(game.car, obs)) {
            if (handleCollision()) {
                endGame();
                return;
            }
            game.obstacles.splice(i, 1);
        }
        
        if (obs.y > canvas.height) {
            game.obstacles.splice(i, 1);
            score++;
            streak++;
            scoreEl.textContent = score;
            streakEl.textContent = streak;
            
            if (score % 10 === 0) {
                game.baseSpeed += 0.5;
                const speedMultiplier = (game.baseSpeed / 3).toFixed(1);
                speedLevelEl.textContent = speedMultiplier + 'x';
                speedBar.style.width = Math.min(100, (speedMultiplier - 1) * 50 + 33) + '%';
            }
        }
    }
    
    // Update powerup timers
    if (game.shieldTimer > 0) {
        game.shieldTimer--;
        if (game.shieldTimer === 0) game.shield = false;
    }
    
    if (game.slowMoTimer > 0) {
        game.slowMoTimer--;
        if (game.slowMoTimer === 0) game.slowMo = false;
    }
    
    if (game.magnetTimer > 0) {
        game.magnetTimer--;
        if (game.magnetTimer === 0) game.magnet = false;
    }
    
    if (game.shake > 0) {
        ctx.restore();
    }
    
    game.animationId = requestAnimationFrame(gameLoop);
}