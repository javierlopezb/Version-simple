const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreValue = document.getElementById("scoreValue");
const attemptsValue = document.getElementById("attemptsValue");
const messageBox = document.getElementById("message");
const baseBtn = document.getElementById("baseBtn");
const resetShotBtn = document.getElementById("resetShotBtn");
const resetLevelBtn = document.getElementById("resetLevelBtn");

// Datos internos del caso de la monografía.
const MODEL = {
  y0: 1,
  baseSpeed: 14,
  baseAngle: Math.PI / 4,
  gravity: 9.8,
  target: { x: 18, y: 2.8, radius: 0.58 },
  obstacle: { x: 8, y: 0, width: 0.55, height: 3 }
};

const birdRadius = 0.34;
const maxStretchPx = 126;
const minManualSpeed = 6;
const maxManualSpeed = 18;

let scale = 45;
let originX = 165;
let groundY = 0;
let width = 0;
let height = 0;
let lastTime = performance.now();
let messageTimer = 0;

const game = {
  state: "ready",
  score: 0,
  attempts: 0,
  hitTarget: false,
  targetPulse: 0,
  drag: {
    active: false,
    x: 0,
    y: 0,
    speed: MODEL.baseSpeed,
    angle: MODEL.baseAngle
  },
  bird: {
    x: 0,
    y: MODEL.y0,
    vx: 0,
    vy: 0,
    startX: 0,
    startY: MODEL.y0,
    elapsed: 0,
    rotation: 0,
    mode: "projectile"
  },
  particles: [],
  blocks: []
};

function resizeCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  width = Math.max(760, Math.round(rect.width));
  height = Math.max(480, Math.round(rect.height));

  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  // La escala principal es 45 px por metro; baja suavemente si la pantalla no alcanza.
  scale = Math.min(45, Math.max(34, (width - 260) / 20));
  originX = Math.max(120, Math.min(180, width * 0.13));
  groundY = height - Math.max(82, Math.min(125, height * 0.16));

  if (game.state === "ready" && !game.drag.active) {
    resetBird();
  }
}

function screenFromWorld(point) {
  return {
    x: originX + point.x * scale,
    y: groundY - point.y * scale
  };
}

function worldFromScreen(point) {
  return {
    x: (point.x - originX) / scale,
    y: (groundY - point.y) / scale
  };
}

function createBlocks() {
  game.blocks = [
    {
      x: MODEL.obstacle.x - MODEL.obstacle.width / 2,
      y: MODEL.obstacle.y,
      width: MODEL.obstacle.width,
      height: MODEL.obstacle.height,
      color: "#b87939",
      kind: "obstacle",
      hit: false,
      falling: false,
      fall: 0,
      rotation: 0,
      scored: false
    },
    { x: 16.45, y: 0, width: 0.34, height: 2.1, color: "#c6843f", hit: false, falling: false, fall: 0, rotation: 0, scored: false },
    { x: 19.18, y: 0, width: 0.34, height: 2.1, color: "#c6843f", hit: false, falling: false, fall: 0, rotation: 0, scored: false },
    { x: 16.28, y: 2.1, width: 3.36, height: 0.28, color: "#d49348", hit: false, falling: false, fall: 0, rotation: 0, scored: false },
    { x: 17.02, y: 0.88, width: 0.26, height: 1.05, color: "#c98842", hit: false, falling: false, fall: 0, rotation: 0, scored: false },
    { x: 18.68, y: 0.88, width: 0.26, height: 1.05, color: "#c98842", hit: false, falling: false, fall: 0, rotation: 0, scored: false },
    { x: 17.18, y: 0.8, width: 1.62, height: 0.24, color: "#d99b50", hit: false, falling: false, fall: 0, rotation: 0, scored: false },
    { x: 17.55, y: 2.18, width: 0.86, height: 0.18, color: "#d99b50", hit: false, falling: false, fall: 0, rotation: 0, scored: false },
    { x: 17.34, y: 4.12, width: 1.24, height: 0.24, color: "#d99b50", hit: false, falling: false, fall: 0, rotation: 0, scored: false }
  ];
}

function resetBird() {
  game.state = "ready";
  game.hitTarget = false;
  game.targetPulse = 0;
  game.drag.active = false;
  game.bird = {
    x: 0,
    y: MODEL.y0,
    vx: 0,
    vy: 0,
    startX: 0,
    startY: MODEL.y0,
    elapsed: 0,
    rotation: 0,
    mode: "projectile"
  };
  hideMessage();
}

function resetLevel() {
  game.score = 0;
  game.attempts = 0;
  game.particles = [];
  createBlocks();
  resetBird();
  updateCounters();
}

function updateCounters() {
  scoreValue.textContent = String(game.score);
  attemptsValue.textContent = String(game.attempts);
}

function showMessage(text) {
  messageBox.textContent = text;
  messageBox.classList.add("is-visible");
  messageTimer = 3.2;
}

function hideMessage() {
  messageBox.classList.remove("is-visible");
  messageTimer = 0;
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function currentBirdScreenPosition() {
  if (game.drag.active) {
    return { x: game.drag.x, y: game.drag.y };
  }
  return screenFromWorld({ x: game.bird.x, y: game.bird.y });
}

function updateDragFromPointer(point) {
  const anchor = screenFromWorld({ x: 0, y: MODEL.y0 });
  let dx = point.x - anchor.x;
  let dy = point.y - anchor.y;

  if (dx > -10) {
    dx = -10;
  }

  const distance = Math.hypot(dx, dy);
  const limited = Math.min(distance, maxStretchPx);
  const ratio = distance > 0 ? limited / distance : 0;
  dx *= ratio;
  dy *= ratio;

  const stretch = Math.hypot(dx, dy);
  const rawAngle = Math.atan2(dy, -dx);
  const angle = Math.max(-0.1, Math.min(1.35, rawAngle));
  const power = stretch / maxStretchPx;

  game.drag.x = anchor.x + dx;
  game.drag.y = anchor.y + dy;
  game.drag.speed = minManualSpeed + (maxManualSpeed - minManualSpeed) * power;
  game.drag.angle = angle;
}

function launchBird(speed, angle) {
  if (game.state === "flying") {
    return;
  }

  game.attempts += 1;
  updateCounters();
  hideMessage();

  game.state = "flying";
  game.hitTarget = false;
  game.drag.active = false;
  game.bird.x = 0;
  game.bird.y = MODEL.y0;
  game.bird.startX = 0;
  game.bird.startY = MODEL.y0;
  game.bird.vx = speed * Math.cos(angle);
  game.bird.vy = speed * Math.sin(angle);
  game.bird.elapsed = 0;
  game.bird.mode = "projectile";
}

function launchBaseCase() {
  resetBird();
  launchBird(MODEL.baseSpeed, MODEL.baseAngle);
}

function calculateTrajectory(speed, angle, maxTime = 3.4) {
  const points = [];
  const vx = speed * Math.cos(angle);
  const vy = speed * Math.sin(angle);

  for (let t = 0; t <= maxTime; t += 0.08) {
    const x = vx * t;
    const y = MODEL.y0 + vy * t - 0.5 * MODEL.gravity * t * t;
    if (y < 0) {
      break;
    }
    points.push({ x, y });
  }

  return points;
}

function updatePhysics(dt) {
  if (game.state !== "flying") {
    return;
  }

  if (game.bird.mode === "projectile") {
    game.bird.elapsed += dt;
    const t = game.bird.elapsed;
    const vx = game.bird.vx;
    const vy = game.bird.vy;

    game.bird.x = game.bird.startX + vx * t;
    game.bird.y = game.bird.startY + vy * t - 0.5 * MODEL.gravity * t * t;
    game.bird.rotation += dt * 7;
  } else {
    game.bird.vy -= MODEL.gravity * dt;
    game.bird.x += game.bird.vx * dt;
    game.bird.y += game.bird.vy * dt;
    game.bird.rotation += dt * 10;
  }

  detectCollisions();

  if (game.bird.y <= birdRadius) {
    game.bird.y = birdRadius;
    endMiss();
  }

  if (game.bird.x > 24 || game.bird.x < -2) {
    endMiss();
  }
}

function detectCollisions() {
  if (game.hitTarget) {
    return;
  }

  const targetDistance = Math.hypot(game.bird.x - MODEL.target.x, game.bird.y - MODEL.target.y);
  if (targetDistance <= birdRadius + MODEL.target.radius) {
    hitTarget();
    return;
  }

  for (const block of game.blocks) {
    if (block.hit) {
      continue;
    }
    if (circleRectCollision(game.bird, birdRadius, block)) {
      hitBlock(block);
      break;
    }
  }
}

function circleRectCollision(circle, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const nearestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy <= radius * radius;
}

function hitBlock(block) {
  block.hit = true;
  block.falling = true;
  block.rotation = (Math.random() - 0.5) * 0.7;

  if (!block.scored) {
    block.scored = true;
    game.score += block.kind === "obstacle" ? 35 : 55;
    updateCounters();
  }

  if (game.bird.mode === "projectile") {
    const currentVy = game.bird.vy - MODEL.gravity * game.bird.elapsed;
    game.bird.vx *= 0.35;
    game.bird.vy = currentVy * 0.28 + 1.4;
    game.bird.mode = "free";
  } else {
    game.bird.vx *= 0.55;
    game.bird.vy = Math.max(1.2, game.bird.vy * -0.18);
  }
}

function hitTarget() {
  game.hitTarget = true;
  game.state = "ended";
  game.targetPulse = 1;
  game.score += 1000;
  updateCounters();
  createBurst(MODEL.target.x, MODEL.target.y);
  showMessage("¡Objetivo alcanzado!");
}

function endMiss() {
  if (game.state !== "flying") {
    return;
  }
  game.state = "ended";
  showMessage("Fallaste, ajusta la fuerza o el ángulo.");
}

function createBurst(x, y) {
  for (let i = 0; i < 26; i += 1) {
    const angle = (Math.PI * 2 * i) / 26;
    const speed = 1.4 + Math.random() * 2.4;
    game.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.9 + Math.random() * 0.35,
      color: i % 2 ? "#fff27a" : "#8ee55d"
    });
  }
}

function updateEffects(dt) {
  if (messageTimer > 0) {
    messageTimer -= dt;
    if (messageTimer <= 0 && game.state !== "ended") {
      hideMessage();
    }
  }

  for (const block of game.blocks) {
    if (block.falling) {
      block.fall += dt;
      block.rotation += dt * 1.4;
    }
  }

  game.particles = game.particles.filter((particle) => {
    particle.life -= dt;
    particle.vy -= MODEL.gravity * 0.22 * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    return particle.life > 0;
  });

  if (game.targetPulse > 0) {
    game.targetPulse = Math.max(0, game.targetPulse - dt * 1.8);
  }
}

function drawScene() {
  ctx.clearRect(0, 0, width, height);
  drawSky();
  drawHills();
  drawGround();
  drawBlocks();
  drawTarget();
  drawSling();
  drawTrajectoryGuide();
  drawBird();
  drawParticles();
  drawDragInfo();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, groundY);
  gradient.addColorStop(0, "#92d7e4");
  gradient.addColorStop(0.65, "#c9eff7");
  gradient.addColorStop(1, "#effbff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  drawCloud(width * 0.18, height * 0.2, 1);
  drawCloud(width * 0.54, height * 0.16, 1.2);
  drawCloud(width * 0.82, height * 0.23, 0.9);
}

function drawCloud(x, y, size) {
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = "#ffffff";
  ellipse(x, y + 10 * size, 52 * size, 18 * size);
  ellipse(x - 28 * size, y + 10 * size, 28 * size, 14 * size);
  ellipse(x + 26 * size, y + 8 * size, 34 * size, 16 * size);
  ellipse(x - 5 * size, y, 34 * size, 20 * size);
  ctx.restore();
}

function drawHills() {
  ctx.save();
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = "#83a5d4";
  ctx.beginPath();
  ctx.moveTo(0, groundY - 54);
  for (let x = 0; x <= width + 100; x += 120) {
    ctx.quadraticCurveTo(x + 55, groundY - 92, x + 120, groundY - 55);
  }
  ctx.lineTo(width, groundY);
  ctx.lineTo(0, groundY);
  ctx.fill();

  ctx.globalAlpha = 0.27;
  ctx.fillStyle = "#6f8cc5";
  for (let i = 0; i < 8; i += 1) {
    const x = i * 190 + 40;
    drawSimpleTree(x, groundY - 54, 0.7 + (i % 3) * 0.15);
  }
  ctx.restore();
}

function drawSimpleTree(x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.fillRect(-6, -62, 12, 62);
  for (let i = 0; i < 5; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(0, -28 - i * 8);
    ctx.quadraticCurveTo(side * 28, -46 - i * 8, side * 34, -76 - i * 8);
    ctx.quadraticCurveTo(side * 10, -64 - i * 8, 0, -58 - i * 8);
    ctx.fill();
  }
  ctx.restore();
}

function drawGround() {
  ctx.fillStyle = "#5ab336";
  ctx.fillRect(0, groundY - 12, width, 22);

  ctx.fillStyle = "#193164";
  ctx.fillRect(0, groundY + 8, width, height - groundY);

  ctx.fillStyle = "#122454";
  for (let y = groundY + 22; y < height; y += 30) {
    for (let x = (y % 2) * 22; x < width; x += 54) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(((x + y) % 7 - 3) * 0.08);
      roundedRect(-14, -8, 28, 16, 5);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.strokeStyle = "#2c802d";
  ctx.lineWidth = 3;
  for (let x = 0; x < width; x += 12) {
    const blade = 8 + ((x * 17) % 12);
    ctx.beginPath();
    ctx.moveTo(x, groundY - 10);
    ctx.quadraticCurveTo(x + 5, groundY - blade - 10, x + 10, groundY - 10);
    ctx.stroke();
  }
}

function drawSling() {
  const base = screenFromWorld({ x: 0, y: 0 });
  const anchor = screenFromWorld({ x: 0, y: MODEL.y0 });
  const leftFork = { x: anchor.x - 18, y: anchor.y - 22 };
  const rightFork = { x: anchor.x + 18, y: anchor.y - 22 };
  const birdPosition = currentBirdScreenPosition();

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = "#70421e";
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(base.x, base.y + 8);
  ctx.lineTo(anchor.x - 12, anchor.y - 35);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(base.x, base.y + 8);
  ctx.lineTo(anchor.x + 18, anchor.y - 35);
  ctx.stroke();

  ctx.strokeStyle = "#a66a32";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(base.x, base.y + 8);
  ctx.lineTo(anchor.x - 12, anchor.y - 35);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(base.x, base.y + 8);
  ctx.lineTo(anchor.x + 18, anchor.y - 35);
  ctx.stroke();

  if (game.drag.active || game.state === "ready") {
    ctx.strokeStyle = "#4b2f25";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(leftFork.x, leftFork.y);
    ctx.lineTo(birdPosition.x, birdPosition.y);
    ctx.lineTo(rightFork.x, rightFork.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawTrajectoryGuide() {
  if (!game.drag.active) {
    return;
  }

  const points = calculateTrajectory(game.drag.speed, game.drag.angle);
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  points.forEach((point, index) => {
    if (index % 2 === 0) {
      const p = screenFromWorld(point);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();
}

function drawBird() {
  const position = currentBirdScreenPosition();
  const radius = birdRadius * scale;

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(game.bird.rotation);

  ctx.fillStyle = "#d51f2a";
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#a61320";
  ctx.beginPath();
  ctx.moveTo(-radius * 0.72, -radius * 0.08);
  ctx.lineTo(-radius * 1.2, -radius * 0.28);
  ctx.lineTo(-radius * 0.9, radius * 0.18);
  ctx.fill();

  ctx.fillStyle = "#f3b31f";
  ctx.beginPath();
  ctx.moveTo(radius * 0.75, -radius * 0.08);
  ctx.lineTo(radius * 1.34, radius * 0.08);
  ctx.lineTo(radius * 0.72, radius * 0.28);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(radius * 0.15, -radius * 0.2, radius * 0.24, 0, Math.PI * 2);
  ctx.arc(radius * 0.5, -radius * 0.18, radius * 0.21, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#172030";
  ctx.beginPath();
  ctx.arc(radius * 0.21, -radius * 0.18, radius * 0.08, 0, Math.PI * 2);
  ctx.arc(radius * 0.55, -radius * 0.15, radius * 0.07, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawTarget() {
  const target = screenFromWorld(MODEL.target);
  const radius = MODEL.target.radius * scale;
  const pulse = game.targetPulse * 22;

  ctx.save();
  if (game.targetPulse > 0) {
    ctx.strokeStyle = `rgba(255, 239, 87, ${game.targetPulse})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(target.x, target.y, radius + pulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = game.hitTarget ? "#92de55" : "#68c943";
  ctx.beginPath();
  ctx.arc(target.x, target.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#2d8d29";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(target.x - radius * 0.28, target.y - radius * 0.15, radius * 0.18, 0, Math.PI * 2);
  ctx.arc(target.x + radius * 0.28, target.y - radius * 0.15, radius * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#203540";
  ctx.beginPath();
  ctx.arc(target.x - radius * 0.25, target.y - radius * 0.13, radius * 0.07, 0, Math.PI * 2);
  ctx.arc(target.x + radius * 0.25, target.y - radius * 0.13, radius * 0.07, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#24592b";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(target.x, target.y + radius * 0.15, radius * 0.28, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawBlocks() {
  for (const block of game.blocks) {
    drawWoodBlock(block);
  }
}

function drawWoodBlock(block) {
  const bottomLeft = screenFromWorld({ x: block.x, y: block.y });
  const w = block.width * scale;
  const h = block.height * scale;
  const x = bottomLeft.x;
  const y = bottomLeft.y - h;
  const fallPx = block.falling ? block.fall * block.fall * 70 : 0;
  const alpha = block.falling ? Math.max(0, 1 - block.fall * 0.65) : 1;

  if (alpha <= 0.04) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + w / 2, y + h / 2 + fallPx);
  ctx.rotate(block.rotation);

  ctx.fillStyle = block.color;
  roundedRect(-w / 2, -h / 2, w, h, 4);
  ctx.fill();

  ctx.strokeStyle = "#7b4b25";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 228, 158, 0.42)";
  ctx.lineWidth = 2;
  if (w > h) {
    for (let line = -h / 4; line <= h / 4; line += Math.max(12, h / 3)) {
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 8, line);
      ctx.lineTo(w / 2 - 8, line);
      ctx.stroke();
    }
  } else {
    for (let line = -w / 4; line <= w / 4; line += Math.max(10, w / 2)) {
      ctx.beginPath();
      ctx.moveTo(line, -h / 2 + 8);
      ctx.lineTo(line, h / 2 - 8);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawParticles() {
  ctx.save();
  for (const particle of game.particles) {
    const p = screenFromWorld(particle);
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDragInfo() {
  if (!game.drag.active) {
    return;
  }

  const angle = Math.round(game.drag.angle * 180 / Math.PI);
  const powerRatio = (game.drag.speed - minManualSpeed) / (maxManualSpeed - minManualSpeed);
  const powerText = powerRatio < 0.34 ? "baja" : powerRatio < 0.7 ? "media" : "alta";
  const text = `Ángulo: ${angle}° | Potencia: ${powerText}`;

  ctx.save();
  ctx.font = "700 18px 'Trebuchet MS', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const textWidth = ctx.measureText(text).width + 32;
  const x = width / 2;
  const y = 78;

  ctx.fillStyle = "rgba(33, 83, 112, 0.38)";
  roundedRect(x - textWidth / 2, y - 20, textWidth, 40, 8);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 2;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function ellipse(x, y, radiusX, radiusY) {
  ctx.beginPath();
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundedRect(x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
}

function frame(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  updatePhysics(dt);
  updateEffects(dt);
  drawScene();

  requestAnimationFrame(frame);
}

canvas.addEventListener("pointerdown", (event) => {
  if (game.state === "flying") {
    return;
  }

  const pointer = pointerPosition(event);
  const birdPosition = currentBirdScreenPosition();
  const distance = Math.hypot(pointer.x - birdPosition.x, pointer.y - birdPosition.y);

  if (distance <= birdRadius * scale + 18) {
    hideMessage();
    game.state = "ready";
    game.drag.active = true;
    canvas.setPointerCapture(event.pointerId);
    updateDragFromPointer(pointer);
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (!game.drag.active) {
    return;
  }
  updateDragFromPointer(pointerPosition(event));
});

canvas.addEventListener("pointerup", (event) => {
  if (!game.drag.active) {
    return;
  }
  canvas.releasePointerCapture(event.pointerId);
  const speed = game.drag.speed;
  const angle = game.drag.angle;
  game.drag.active = false;
  launchBird(speed, angle);
});

canvas.addEventListener("pointercancel", () => {
  game.drag.active = false;
});

baseBtn.addEventListener("click", launchBaseCase);
resetShotBtn.addEventListener("click", resetBird);
resetLevelBtn.addEventListener("click", resetLevel);
window.addEventListener("resize", resizeCanvas);

resizeCanvas();
resetLevel();
requestAnimationFrame((now) => {
  lastTime = now;
  frame(now);
});
