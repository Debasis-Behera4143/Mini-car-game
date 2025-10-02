// Canvas and UI Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const streakEl = document.getElementById('streak');
const speedLevelEl = document.getElementById('speedLevel');
const livesEl = document.getElementById('lives');
const menuEl = document.getElementById('menu');
const instructionsEl = document.getElementById('instructions');
const gameoverEl = document.getElementById('gameover');
const finalScoreEl = document.getElementById('finalScore');
const bestStreakEl = document.getElementById('bestStreak');
const coinsCollectedEl = document.getElementById('coinsCollected');
const coinsDisplayEl = document.getElementById('coinsDisplay');
const newHighScoreEl = document.getElementById('newHighScore');
const powerupNotif = document.getElementById('powerupNotif');
const speedValueEl = document.getElementById('speedValue');
const distanceEl = document.getElementById('distance');
const finalDistanceEl = document.getElementById('finalDistance');

// Responsive canvas setup
function resizeCanvas() {
  const container = canvas.parentElement;
  const maxWidth = Math.min(900, window.innerWidth - 40);
  const aspectRatio = 600 / 900;
  
  if (window.innerWidth <= 900) {
    canvas.style.width = maxWidth + 'px';
    canvas.style.height = (maxWidth * aspectRatio) + 'px';
  } else {
    canvas.style.width = '900px';
    canvas.style.height = '600px';
  }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game State
let gameState = 'menu';
let score = 0;
let streak = 0;
let bestStreak = 0;
let coinsCollected = 0;
let lives = 3;
let distance = 0;
let highScore = 0;

// Try to get highScore from localStorage
try {
  highScore = parseInt(localStorage.getItem('highScore')) || 0;
} catch (e) {
  highScore = 0;
}
highScoreEl.textContent = highScore;

// Game Object
const game = {
  car: { 
    x: 400, 
    y: 480, 
    width: 60, 
    height: 100, 
    speed: 8,
    tilt: 0, 
    targetTilt: 0,
    lanes: [150, 350, 550, 750] // 4 lanes for wider screen
  },
  obstacles: [],
  particles: [],
  coins: [],
  powerups: [],
  trees: [],
  keys: {},
  gameSpeed: 4,
  baseSpeed: 4,
  obstacleTimer: 0,
  coinTimer: 0,
  powerupTimer: 0,
  treeTimer: 0,
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
  if (e.key === ' ' && gameState === 'gameover') startGame();
});
window.addEventListener('keyup', (e) => game.keys[e.key] = false);

// Prevent scrolling on mobile
document.addEventListener('touchmove', (e) => {
  if (e.target.tagName !== 'BUTTON') {
    e.preventDefault();
  }
}, { passive: false });

// === UI Functions ===
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
    heart.style.transform = index < lives ? 'scale(1)' : 'scale(0.8)';
  });
}

function showPowerupNotification(message) {
  powerupNotif.textContent = message;
  powerupNotif.classList.remove('hidden');
  setTimeout(() => powerupNotif.classList.add('hidden'), 2000);
}

// === Game Functions ===
function startGame() {
  game.car.x = 400;
  game.car.y = 480;
  game.car.tilt = 0;
  game.obstacles = [];
  game.particles = [];
  game.coins = [];
  game.powerups = [];
  game.trees = [];
  game.obstacleTimer = 0;
  game.coinTimer = 0;
  game.powerupTimer = 0;
  game.treeTimer = 0;
  game.gameSpeed = 4;
  game.baseSpeed = 4;
  game.roadOffset = 0;
  game.shield = false;
  game.slowMo = false;
  game.magnet = false;
  game.shieldTimer = 0;
  game.slowMoTimer = 0;
  game.magnetTimer = 0;
  
  score = 0;
  streak = 0;
  bestStreak = 0;
  coinsCollected = 0;
  lives = 3;
  distance = 0;
  
  scoreEl.textContent = score;
  streakEl.textContent = streak;
  coinsDisplayEl.textContent = coinsCollected;
  speedLevelEl.textContent = '1.0x';
  speedValueEl.textContent = '120';
  distanceEl.textContent = '0m';
  updateLivesDisplay();
  
  menuEl.classList.add('hidden');
  instructionsEl.classList.add('hidden');
  gameoverEl.classList.add('hidden');
  gameState = 'playing';
  
  // Initialize some trees
  for (let i = 0; i < 10; i++) {
    createTree();
  }
  
  gameLoop();
}

function createObstacle() {
  const lanes = game.car.lanes;
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  const types = ['car', 'truck', 'cone'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  let width, height, color;
  
  switch(type) {
    case 'truck':
      width = 70;
      height = 120;
      color = '#ff6b6b';
      break;
    case 'cone':
      width = 30;
      height = 40;
      color = '#ff9900';
      break;
    default: // car
      width = 55;
      height = 90;
      color = '#4ecdc4';
  }
  
  game.obstacles.push({
    x: lane - width/2,
    y: -height,
    width,
    height,
    type,
    color
  });
}

function createCoin() {
  const lanes = game.car.lanes;
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  
  game.coins.push({
    x: lane,
    y: -30,
    radius: 15,
    angle: 0,
    value: 10
  });
}

function createPowerup() {
  const lanes = game.car.lanes;
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  const types = ['shield', 'slowmo', 'magnet'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  game.powerups.push({
    x: lane,
    y: -30,
    radius: 20,
    type,
    angle: 0
  });
}

function createTree() {
  const side = Math.random() > 0.5 ? 'left' : 'right';
  const x = side === 'left' ? 50 + Math.random() * 50 : 800 + Math.random() * 50;
  
  game.trees.push({
    x,
    y: Math.random() * canvas.height,
    size: 40 + Math.random() * 30,
    type: Math.random() > 0.5 ? 'pine' : 'round'
  });
}

function createParticle(x, y, color, count = 10) {
  if (window.innerWidth < 600) count = Math.floor(count / 2);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    game.particles.push({
      x, y,
      vx: Math.cos(angle) * (Math.random() * 5 + 3),
      vy: Math.sin(angle) * (Math.random() * 5 + 3),
      life: 1,
      color,
      size: Math.random() * 5 + 2
    });
  }
}

// === Drawing Functions ===
function drawRoad() {
  // Road background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(100, 0, 700, canvas.height);
  
  // Road edges
  ctx.fillStyle = '#333';
  ctx.fillRect(100, 0, 20, canvas.height);
  ctx.fillRect(780, 0, 20, canvas.height);
  
  // Lane markings
  ctx.strokeStyle = '#ffff00';
  ctx.lineWidth = 4;
  ctx.setLineDash([30, 20]);
  
  const lanes = [250, 450, 650];
  lanes.forEach(lane => {
    ctx.beginPath();
    ctx.moveTo(lane, 0);
    ctx.lineTo(lane, canvas.height);
    ctx.stroke();
  });
  
  ctx.setLineDash([]);
  
  // Side road lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(100, 0);
  ctx.lineTo(100, canvas.height);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(800, 0);
  ctx.lineTo(800, canvas.height);
  ctx.stroke();
}

function drawTrees() {
  game.trees.forEach(tree => {
    if (tree.type === 'pine') {
      // Pine tree
      ctx.fillStyle = '#2d5016';
      ctx.beginPath();
      ctx.moveTo(tree.x, tree.y - tree.size);
      ctx.lineTo(tree.x - tree.size * 0.4, tree.y);
      ctx.lineTo(tree.x + tree.size * 0.4, tree.y);
      ctx.closePath();
      ctx.fill();
      
      // Trunk
      ctx.fillStyle = '#4a3728';
      ctx.fillRect(tree.x - tree.size * 0.1, tree.y, tree.size * 0.2, tree.size * 0.3);
    } else {
      // Round tree
      ctx.fillStyle = '#2d5016';
      ctx.beginPath();
      ctx.arc(tree.x, tree.y - tree.size * 0.3, tree.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      
      // Trunk
      ctx.fillStyle = '#4a3728';
      ctx.fillRect(tree.x - tree.size * 0.08, tree.y, tree.size * 0.16, tree.size * 0.3);
    }
  });
}

function drawCar() {
  const car = game.car;
  
  ctx.save();
  ctx.translate(car.x + car.width / 2, car.y + car.height / 2);
  ctx.rotate(car.tilt);
  
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(-car.width / 2 + 5, car.height / 2 - 5, car.width - 10, 8);
  
  // Car body
  const gradient = ctx.createLinearGradient(-car.width / 2, 0, car.width / 2, 0);
  gradient.addColorStop(0, '#00ffff');
  gradient.addColorStop(0.5, '#0099ff');
  gradient.addColorStop(1, '#00ffff');
  ctx.fillStyle = gradient;
  
  ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
  
  // Car details
  ctx.fillStyle = '#222';
  ctx.fillRect(-car.width / 2 + 8, -car.height / 2 + 10, car.width - 16, 25); // windshield
  ctx.fillRect(-car.width / 2 + 8, car.height / 2 - 25, car.width - 16, 15); // back window
  
  // Headlights
  ctx.fillStyle = '#ffff00';
  ctx.fillRect(-car.width / 2 + 5, -car.height / 2, 8, 5);
  ctx.fillRect(car.width / 2 - 13, -car.height / 2, 8, 5);
  
  // Tail lights
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(-car.width / 2 + 5, car.height / 2 - 5, 8, 5);
  ctx.fillRect(car.width / 2 - 13, car.height / 2 - 5, 8, 5);
  
  // Shield effect
  if (game.shield) {
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.arc(0, 0, car.width * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  
  ctx.restore();
}

function drawObstacle(obs) {
  ctx.save();
  
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(obs.x + 3, obs.y + obs.height - 3, obs.width - 6, 5);
  
  if (obs.type === 'cone') {
    // Traffic cone
    ctx.fillStyle = obs.color;
    ctx.beginPath();
    ctx.moveTo(obs.x + obs.width / 2, obs.y);
    ctx.lineTo(obs.x, obs.y + obs.height);
    ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
    ctx.closePath();
    ctx.fill();
    
    // Stripe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(obs.x + 5, obs.y + obs.height * 0.4, obs.width - 10, 5);
  } else {
    // Car/Truck body
    ctx.fillStyle = obs.color;
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    
    // Windows
    ctx.fillStyle = '#444';
    ctx.fillRect(obs.x + 5, obs.y + obs.height - 30, obs.width - 10, 20);
    ctx.fillRect(obs.x + 5, obs.y + 5, obs.width - 10, 20);
    
    // Details
    ctx.fillStyle = '#fff';
    ctx.fillRect(obs.x + 3, obs.y + obs.height - 5, 6, 4);
    ctx.fillRect(obs.x + obs.width - 9, obs.y + obs.height - 5, 6, 4);
  }
  
  ctx.restore();
}

function drawCoin(coin) {
  ctx.save();
  ctx.translate(coin.x, coin.y);
  ctx.rotate(coin.angle);
  
  // Outer glow
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coin.radius + 5);
  gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
  gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(-coin.radius - 5, -coin.radius - 5, (coin.radius + 5) * 2, (coin.radius + 5) * 2);
  
  // Coin
  const coinGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coin.radius);
  coinGradient.addColorStop(0, '#ffed4e');
  coinGradient.addColorStop(0.5, '#ffd700');
  coinGradient.addColorStop(1, '#daa520');
  ctx.fillStyle = coinGradient;
  ctx.beginPath();
  ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner circle
  ctx.strokeStyle = '#daa520';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, coin.radius - 4, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.restore();
}

function drawPowerup(powerup) {
  ctx.save();
  ctx.translate(powerup.x, powerup.y);
  ctx.rotate(powerup.angle);
  
  // Glow
  let glowColor;
  switch(powerup.type) {
    case 'shield': glowColor = '#00ffff'; break;
    case 'slowmo': glowColor = '#9b59b6'; break;
    case 'magnet': glowColor = '#ff00ff'; break;
  }
  
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, powerup.radius + 10);
  gradient.addColorStop(0, glowColor + 'cc');
  gradient.addColorStop(1, glowColor + '00');
  ctx.fillStyle = gradient;
  ctx.fillRect(-powerup.radius - 10, -powerup.radius - 10, (powerup.radius + 10) * 2, (powerup.radius + 10) * 2);
  
  // Box
  ctx.fillStyle = glowColor;
  ctx.fillRect(-powerup.radius, -powerup.radius, powerup.radius * 2, powerup.radius * 2);
  
  // Border
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(-powerup.radius, -powerup.radius, powerup.radius * 2, powerup.radius * 2);
  
  // Symbol
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let symbol = powerup.type === 'shield' ? '🛡️' : powerup.type === 'slowmo' ? '⏰' : '🧲';
  ctx.fillText(symbol, 0, 0);
  
  ctx.restore();
}

function drawParticles() {
  game.particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

// === Update Functions ===
function updateCar() {
  const car = game.car;
  
  // Movement
  if (game.keys['ArrowLeft'] || game.keys['a'] || game.keys['A']) {
    car.x -= car.speed;
    car.targetTilt = -0.1;
  } else if (game.keys['ArrowRight'] || game.keys['d'] || game.keys['D']) {
    car.x += car.speed;
    car.targetTilt = 0.1;
  } else {
    car.targetTilt = 0;
  }
  
  // Smooth tilt
  car.tilt += (car.targetTilt - car.tilt) * 0.1;
  
  // Keep within bounds (with lane positions)
  car.x = Math.max(120, Math.min(780 - car.width, car.x));
}

function updateObstacles() {
  const effectiveSpeed = game.slowMo ? game.gameSpeed * 0.5 : game.gameSpeed;
  
  game.obstacles = game.obstacles.filter(obs => {
    obs.y += effectiveSpeed;
    
    // Check collision
    if (checkCollision(game.car, obs)) {
      if (game.shield) {
        game.shield = false;
        createParticle(obs.x + obs.width / 2, obs.y + obs.height / 2, '#00ffff', 15);
        showPowerupNotification('Shield Absorbed Hit!');
        return false;
      } else {
        lives--;
        updateLivesDisplay();
        game.shake = 10;
        streak = 0;
        streakEl.textContent = streak;
        createParticle(obs.x + obs.width / 2, obs.y + obs.height / 2, '#ff0000', 20);
        
        if (lives <= 0) {
          endGame();
        }
        return false;
      }
    }
    
    // Score points for avoiding
    if (obs.y > canvas.height && !obs.scored) {
      obs.scored = true;
      score += 5;
      streak++;
      if (streak > bestStreak) bestStreak = streak;
      scoreEl.textContent = score;
      streakEl.textContent = streak;
    }
    
    return obs.y < canvas.height + 50;
  });
}

function updateCoins() {
  const effectiveSpeed = game.slowMo ? game.gameSpeed * 0.5 : game.gameSpeed;
  
  game.coins = game.coins.filter(coin => {
    coin.y += effectiveSpeed;
    coin.angle += 0.1;
    
    // Magnet effect
    if (game.magnet) {
      const dx = (game.car.x + game.car.width / 2) - coin.x;
      const dy = (game.car.y + game.car.height / 2) - coin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 150) {
        coin.x += dx * 0.1;
        coin.y += dy * 0.1;
      }
    }
    
    // Check collection
    const dx = coin.x - (game.car.x + game.car.width / 2);
    const dy = coin.y - (game.car.y + game.car.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < coin.radius + game.car.width / 3) {
      score += coin.value;
      coinsCollected++;
      streak += 2;
      if (streak > bestStreak) bestStreak = streak;
      scoreEl.textContent = score;
      streakEl.textContent = streak;
      coinsDisplayEl.textContent = coinsCollected;
      createParticle(coin.x, coin.y, '#ffd700', 12);
      return false;
    }
    
    return coin.y < canvas.height + 50;
  });
}

function updatePowerups() {
  const effectiveSpeed = game.slowMo ? game.gameSpeed * 0.5 : game.gameSpeed;
  
  game.powerups = game.powerups.filter(powerup => {
    powerup.y += effectiveSpeed;
    powerup.angle += 0.05;
    
    // Check collection
    const dx = powerup.x - (game.car.x + game.car.width / 2);
    const dy = powerup.y - (game.car.y + game.car.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < powerup.radius + game.car.width / 2) {
      activatePowerup(powerup.type);
      createParticle(powerup.x, powerup.y, '#ff00ff', 15);
      return false;
    }
    
    return powerup.y < canvas.height + 50;
  });
}

function updateTrees() {
  const effectiveSpeed = game.slowMo ? game.gameSpeed * 0.5 : game.gameSpeed;
  
  game.trees = game.trees.filter(tree => {
    tree.y += effectiveSpeed * 0.5;
    return tree.y < canvas.height + 100;
  });
}

function updateParticles() {
  game.particles = game.particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2; // gravity
    p.life -= 0.02;
    return p.life > 0;
  });
}

function activatePowerup(type) {
  switch(type) {
    case 'shield':
      game.shield = true;
      game.shieldTimer = 300;
      showPowerupNotification('🛡️ Shield Activated!');
      break;
    case 'slowmo':
      game.slowMo = true;
      game.slowMoTimer = 200;
      showPowerupNotification('⏰ Slow Motion!');
      break;
    case 'magnet':
      game.magnet = true;
      game.magnetTimer = 250;
      showPowerupNotification('🧲 Coin Magnet!');
      break;
  }
}

function checkCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

function endGame() {
  gameState = 'gameover';
  
  finalScoreEl.textContent = score;
  bestStreakEl.textContent = bestStreak;
  coinsCollectedEl.textContent = coinsCollected;
  finalDistanceEl.textContent = Math.floor(distance) + 'm';
  
  if (score > highScore) {
    highScore = score;
    try {
      localStorage.setItem('highScore', highScore);
    } catch (e) {
      // localStorage not available
    }
    highScoreEl.textContent = highScore;
    newHighScoreEl.classList.remove('hidden');
  } else {
    newHighScoreEl.classList.add('hidden');
  }
  
  gameoverEl.classList.remove('hidden');
  cancelAnimationFrame(game.animationId);
}

// === Main Game Loop ===
function gameLoop() {
  if (gameState !== 'playing') return;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Apply screen shake
  if (game.shake > 0) {
    ctx.save();
    ctx.translate(
      Math.random() * game.shake - game.shake / 2,
      Math.random() * game.shake - game.shake / 2
    );
    game.shake *= 0.9;
    if (game.shake < 0.5) game.shake = 0;
  }
  
  // Draw background
  ctx.fillStyle = '#0a2a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw trees
  drawTrees();
  
  // Draw road
  drawRoad();
  
  // Update and draw game objects
  updateCar();
  updateObstacles();
  updateCoins();
  updatePowerups();
  updateTrees();
  updateParticles();
  
  drawParticles();
  game.obstacles.forEach(drawObstacle);
  game.coins.forEach(drawCoin);
  game.powerups.forEach(drawPowerup);
  drawCar();
  
  if (game.shake > 0) ctx.restore();
  
  // Spawn objects
  game.obstacleTimer++;
  game.coinTimer++;
  game.powerupTimer++;
  game.treeTimer++;
  
  const spawnRate = Math.max(30, 80 - Math.floor(score / 100));
  
  if (game.obstacleTimer > spawnRate) {
    createObstacle();
    game.obstacleTimer = 0;
  }
  
  if (game.coinTimer > 60) {
    if (Math.random() > 0.5) createCoin();
    game.coinTimer = 0;
  }
  
  if (game.powerupTimer > 400) {
    if (Math.random() > 0.7) createPowerup();
    game.powerupTimer = 0;
  }
  
  if (game.treeTimer > 40) {
    createTree();
    game.treeTimer = 0;
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
  
  // Increase game speed gradually
  game.baseSpeed = 4 + score / 200;
  game.gameSpeed = game.baseSpeed;
  
  // Update UI
  const speedMultiplier = (game.gameSpeed / 4).toFixed(1);
  speedLevelEl.textContent = speedMultiplier + 'x';
  
  const speedKmh = Math.floor(80 + game.gameSpeed * 10);
  speedValueEl.textContent = speedKmh;
  
  distance += game.gameSpeed * 0.1;
  distanceEl.textContent = Math.floor(distance) + 'm';
  
  game.animationId = requestAnimationFrame(gameLoop);
}

// === Expose functions globally for HTML buttons ===
window.game = game;
window.startGame = startGame;
window.showInstructions = showInstructions;
window.hideInstructions = hideInstructions;
window.backToMenu = backToMenu;