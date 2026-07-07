// UTILS
const Utils = {
    random: (min, max) => Math.random() * (max - min) + min,
    clamp: (val, min, max) => Math.max(min, Math.min(max, val)),
    dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1)
};

// ENTITIES
class Player {
    constructor(w, h) {
        this.w = 40;
        this.h = 40;
        this.x = w / 2;
        this.y = h - 100;
        this.color = '#00f2ff';
        this.score = 0;
    }
    update(targetX, targetY, w, h) {
        this.x += (targetX - this.x) * 0.15;
        this.y += (targetY - this.y) * 0.15;
        this.x = Utils.clamp(this.x, this.w / 2, w - this.w / 2);
        this.y = Utils.clamp(this.y, this.h / 2, h - this.h / 2);
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(-20, 15);
        ctx.lineTo(20, 15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 4;
        this.speed = 10;
    }
    update() { this.y -= this.speed; }
    draw(ctx) {
        ctx.fillStyle = '#00f2ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f2ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Enemy {
    constructor(w, h) {
        this.w = 40;
        this.h = 40;
        this.x = Utils.random(50, w - 50);
        this.y = -50;
        this.speed = Utils.random(2, 5);
        this.color = '#ff0055';
    }
    update() { this.y += this.speed; }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 20);
        ctx.lineTo(this.x - 15, this.y - 15);
        ctx.lineTo(this.x + 15, this.y - 15);
        ctx.closePath();
        ctx.fill();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = Utils.random(-2, 2);
        this.vy = Utils.random(-2, 2);
        this.life = 1.0;
        this.decay = Utils.random(0.02, 0.05);
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 3, 3);
        ctx.globalAlpha = 1.0;
    }
}

// MAIN GAME
class SkyShooter {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('game-container');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.player = new Player(this.canvas.width, this.canvas.height);
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.score = 0;
        this.isRunning = false;
        this.lastShot = 0;
        this.lastEnemySpawn = 0;

        this.targetX = this.player.x;
        this.targetY = this.player.y;

        this.setupInput();
        this.setupUI();
        this.loop();
    }

    resize() {
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
    }

    setupInput() {
        const move = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            this.targetX = clientX - rect.left;
            this.targetY = clientY - rect.top;
        };
        this.canvas.addEventListener('mousemove', move);
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            move(e);
        }, { passive: false });
    }

    setupUI() {
        document.getElementById('start-btn').onclick = () => this.start();
        document.getElementById('retry-btn').onclick = () => location.reload();
        document.getElementById('options-btn').onclick = () => alert("Configuración en desarrollo");
        document.getElementById('credits-btn').onclick = () => alert("Sky Shooter - Nova-X Studios");
        document.getElementById('exit-btn').onclick = () => window.location.href = '../index.html';
    }

    start() {
        this.isRunning = true;
        this.score = 0;
        this.enemies = [];
        this.bullets = [];
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 100;
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('game-over').classList.add('hidden');
    }

    gameOver() {
        this.isRunning = false;
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('final-score').innerText = this.score;
    }

    spawnExplosion(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    update() {
        if (!this.isRunning) return;

        this.player.update(this.targetX, this.targetY, this.canvas.width, this.canvas.height);

        if (Date.now() - this.lastShot > 200) {
            this.bullets.push(new Bullet(this.player.x, this.player.y - 20));
            this.lastShot = Date.now();
        }

        if (Date.now() - this.lastEnemySpawn > 1000) {
            this.enemies.push(new Enemy(this.canvas.width, this.canvas.height));
            this.lastEnemySpawn = Date.now();
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update();
            if (this.bullets[i].y < 0) {
                this.bullets.splice(i, 1);
                continue;
            }
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (Utils.dist(this.bullets[i].x, this.bullets[i].y, e.x, e.y) < 25) {
                    this.spawnExplosion(e.x, e.y, e.color);
                    this.enemies.splice(j, 1);
                    this.bullets.splice(i, 1);
                    this.score += 10;
                    document.getElementById('score').innerText = this.score;
                    break;
                }
            }
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update();
            if (e.y > this.canvas.height) {
                this.enemies.splice(i, 1);
                continue;
            }
            if (Utils.dist(e.x, e.y, this.player.x, this.player.y) < 35) {
                this.gameOver();
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }
    }

    draw() {
        this.ctx.fillStyle = '#00050a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 30; i++) {
            const x = (Math.sin(i * 123.4) * 0.5 + 0.5) * this.canvas.width;
            const y = ((Math.cos(i * 456.7) * 0.5 + 0.5) * this.canvas.height + Date.now() * 0.02) % this.canvas.height;
            this.ctx.fillRect(x, y, 2, 2);
        }

        this.bullets.forEach(b => b.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        this.player.draw(this.ctx);
        this.particles.forEach(p => p.draw(this.ctx));
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

window.onload = () => {
    new SkyShooter();
};
