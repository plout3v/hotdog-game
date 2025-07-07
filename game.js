const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// === Obrázky =============================================================
const playerImage = new Image();
playerImage.src = "hotdog-sad.png";

const bulletImage = new Image();
const enemyImage = new Image();
enemyImage.src = "enemy.png";
bulletImage.src = "parek.png"; // střela i ikona náboje

const shootSound = new Audio("mortar.mp3"); // nebo .wav
const explosionSound = new Audio("explosion.mp3"); // 💥 Zvuk výbuchu

// === Hráč ================================================================
const originalSpeed = 2;
const originalJumpForce = -10;
const originalWidth = 120;
const originalHeight = 170;

const player = {
  x: 50,
  y: 50,
  width: 120,
  height: 170,
  velX: 0,
  velY: 0,
  speed: 2,
  jumpForce: -10,
  gravity: 0.2, // 🆕 individuální gravitace
  grounded: false
};

// === Fyzika a platformy ==================================================
const gravity = 0.2;
const floorY = canvas.height - 10;

const platforms = [
  { x: 200, y: 450, width: 100, height: 20 },
  { x: 130, y: 100, width: 100, height: 20 },
  { x: 400, y: 350, width: 100, height: 20 },
  { x: 520, y: 175, width: 100, height: 20 }
];

let enemy = {
  x: 100,
  y: 50,
  baseX: 150,   // střed pohybu
  baseY: 150,
  width: 75,
  height: 75,
  alive: true,
  angle: 0,        // úhel v radiánech
  radiusX: 100,     // horizontální poloměr
  radiusY: 70,     // vertikální poloměr (elipsa)
  speed: 0.03      // rychlost otáčení
};

// === Střely ==============================================================
const bullets = [];
const bulletSpeed = 1.5;
const bulletWidth = 55;
const bulletHeight = 45;
let lastDir = 1;
let ammo = 5; // maximální počet nábojů

// === Ovládání ============================================================
const keys = {};

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  if (e.key === "ArrowLeft" || e.key === "a") lastDir = -1;
  if (e.key === "ArrowRight" || e.key === "d") lastDir = 1;

  if (e.key === "e" || e.key === "E") shootBullet();
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// === Logika hráče ========================================================
function updatePlayer() {
  if (keys["ArrowLeft"] || keys["a"]) {
    player.velX = -player.speed;
  } else if (keys["ArrowRight"] || keys["d"]) {
    player.velX = player.speed;
  } else {
    player.velX = 0;
  }

  if ((keys["ArrowUp"] || keys["w"]) && player.grounded) {
    player.velY = player.jumpForce;
    player.grounded = false;
  }

  player.velY += player.gravity;
  player.x += player.velX;
  player.y += player.velY;

  player.grounded = false;

  if (player.y + player.height >= floorY) {
    player.y = floorY - player.height;
    player.velY = 0;
    player.grounded = true;
  }

  platforms.forEach(p => {
    const withinX = player.x + player.width > p.x && player.x < p.x + p.width;
    const isFalling = player.velY >= 0;
    const hittingTop = player.y + player.height <= p.y + player.velY &&
                       player.y + player.height + player.velY >= p.y;

    if (withinX && isFalling && hittingTop) {
      player.y = Math.round(p.y - player.height);
      player.velY = 0;
      player.grounded = true;
    }
  });
}

// === Střely ==============================================================
function shootBullet() {
  if (ammo > 0) {
    bullets.push({
      x: player.x + (lastDir === 1 ? player.width : -bulletWidth),
      y: player.y + player.height / 2 - bulletHeight / 2,
      velX: bulletSpeed * lastDir
    });
    ammo--;

    shootSound.currentTime = 0; // resetuj při rychlém stisknutí
    shootSound.play();
  }
}

function updateEnemy() {
  if (!enemy.alive) return;

  enemy.angle += enemy.speed;

  enemy.x = enemy.baseX + Math.cos(enemy.angle) * enemy.radiusX;
  enemy.y = enemy.baseY + Math.sin(enemy.angle) * enemy.radiusY;
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].x += bullets[i].velX;
  // Kontrola kolize střel s nepřítelem
  let b = bullets[i];
if (enemy.alive &&
    b.x < enemy.x + enemy.width &&
    b.x + bulletWidth > enemy.x &&
    b.y < enemy.y + enemy.height &&
    b.y + bulletHeight > enemy.y) {
  
  enemy.alive = false;
  bullets.splice(i, 1);

  // 🌟 Změna výrazu hráče
  playerImage.src = "hotdog-happy.png";
  player.speed = 1;
  player.jumpForce = -5;     // vyšší a svižnější skok
  player.gravity = 0.05;      // pomalejší pád = "šťastný" skok
  player.width = originalWidth;
  player.height = originalHeight;

  // 💥 Zahraj zvuk výbuchu
  explosionSound.currentTime = 0;
  explosionSound.play();

  continue;
}


    if (bullets[i].x > canvas.width || bullets[i].x + bulletWidth < 0) {
      bullets.splice(i, 1);
    }
  }
}

function drawBullets() {
  bullets.forEach(b => {
    if (bulletImage.complete && bulletImage.naturalWidth) {
      ctx.drawImage(bulletImage, b.x, b.y, bulletWidth, bulletHeight);
    } else {
      ctx.fillStyle = "red";
      ctx.fillRect(b.x, b.y, bulletWidth, bulletHeight);
    }
  });
}

// === UI: Ikonky munice ===================================================
function drawUI() {
  const iconSize = 60;
  for (let i = 0; i < ammo; i++) {
    ctx.drawImage(bulletImage, 20 + i * (iconSize + 5), 20, iconSize, iconSize);
  }
}

// === Kreslení ============================================================
function drawPlayer() {
  ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
}

function drawGround() {
  ctx.fillStyle = "#555";
  ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);
}

function drawPlatforms() {
  ctx.fillStyle = "#888";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));
}

// === Herní smyčka ========================================================
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  updatePlayer();
  updateEnemy();
  updateBullets();

  drawGround();
  drawPlatforms();
  drawBullets();
  drawPlayer();
  drawEnemy();
  drawUI();
  drawHUDText();
  drawEndText();

  requestAnimationFrame(gameLoop);
}

playerImage.onload = () => gameLoop();


function drawEnemy() {
  if (enemy.alive) {
    ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
  }
}

function drawHUDText() {
  const text = "Gašpiho hra - zpárkovaný tábor";
  ctx.fillStyle = "#000";
  ctx.font = "20px sans-serif";
  ctx.textBaseline = "bottom";
  ctx.fillText(text, 20, canvas.height - 50);
}


function drawEndText() {
  if (!enemy.alive) {
    const text = "KONEC";
    ctx.fillStyle = "#b00";
    ctx.font = "30px sans-serif";
    ctx.textBaseline = "bottom";
    const textWidth = ctx.measureText(text).width;
    ctx.fillText(text, canvas.width - textWidth - 20, canvas.height - 10);
  }
}
