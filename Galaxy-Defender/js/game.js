// UTILS
const MathUtils = {
    random: (min, max) => Math.random() * (max - min) + min,
    clamp: (val, min, max) => Math.max(min, Math.min(max, val)),
    dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    lerp: (start, end, t) => start + (end - start) * t
};

// INPUT
class InputHandler {
    constructor() {
        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }

    isKeyDown(code) {
        return this.keys[code] || false;
    }
}

// CORE
class GameCore {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = this.canvas.width = canvas.parentElement.clientWidth;
        this.height = this.canvas.height = canvas.parentElement.clientHeight;
        
        this.lastTime = 0;
        this.accumulator = 0;
        this.deltaTime = 1/60;
        
        this.state = 'MENU'; 
    }

    startLoop(updateFn, drawFn) {
        const loop = (time) => {
            if (this.state === 'MENU') {
                requestAnimationFrame(loop);
                return;
            }

            const dt = (time - this.lastTime) / 1000;
            this.lastTime = time;

            if (this.state === 'PLAYING') {
                this.accumulator += dt;
                while (this.accumulator >= this.deltaTime) {
                    updateFn(this.deltaTime);
                    this.accumulator -= this.deltaTime;
                }
            }

            drawFn(this.ctx);
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

// ENTITIES
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = MathUtils.random(-2, 2);
        this.vy = MathUtils.random(-2, 2);
        this.life = 1.0;
        this.decay = MathUtils.random(0.01, 0.03);
        this.size = MathUtils.random(1, 3);
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class Projectile {
    constructor(x, y, vx, vy, color, damage, owner = 'player') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.damage = damage;
        this.owner = owner;
        this.radius = 3;
        this.life = 2000;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt * 1000;
    }
    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.dead = false;

        switch(type) {
            case 'fast':
                this.hp = 20; this.speed = 250; this.color = '#0ff'; this.points = 20;
                this.width = 30; this.height = 30;
                break;
            case 'heavy':
                this.hp = 100; this.speed = 80; this.color = '#bc13fe'; this.points = 50;
                this.width = 60; this.height = 60;
                break;
            default:
                this.hp = 50; this.speed = 150; this.color = '#ff0055'; this.points = 10;
                this.width = 40; this.height = 40;
        }
    }
    update(dt) { this.y += this.speed * dt; }
    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height/2);
        ctx.lineTo(this.x - this.width/2, this.y - this.height/2);
        ctx.lineTo(this.x + this.width/2, this.y - this.height/2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) this.dead = true;
    }
}

class Player {
    constructor(width, height) {
        this.width = 40;
        this.height = 40;
        this.x = width / 2;
        this.y = height - 100;
        this.speed = 300;
        this.hp = 100;
        this.maxHp = 100;
        this.shield = 0;
        this.maxShield = 100;
        this.invulnerable = 0;
        this.lastShot = 0;
        this.fireRate = 250;
    }
    update(dt, input, worldWidth, worldHeight) {
        if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) this.y -= this.speed * dt;
        if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) this.y += this.speed * dt;
        if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) this.x -= this.speed * dt;
        if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) this.x += this.speed * dt;
        this.x = MathUtils.clamp(this.x, this.width / 2, worldWidth - this.width / 2);
        this.y = MathUtils.clamp(this.y, this.height / 2, worldHeight - this.height / 2);
        if (this.invulnerable > 0) this.invulnerable -= dt;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const engineGlow = Math.sin(Date.now() * 0.01) * 5 + 10;
        ctx.shadowBlur = engineGlow;
        ctx.shadowColor = '#00f2ff';
        ctx.fillStyle = '#00f2ff';
        ctx.beginPath();
        ctx.moveTo(-5, 15); ctx.lineTo(0, 25 + engineGlow); ctx.lineTo(5, 15);
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f2ff';
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, -20); ctx.lineTo(20, 20); ctx.lineTo(0, 10); ctx.lineTo(-20, 20);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#bc13fe';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        if (this.shield > 0) {
            ctx.strokeStyle = '#bc13fe'; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = '#bc13fe';
            ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.stroke();
        }
        if (this.invulnerable > 0 && Math.floor(Date.now() * 0.01) % 2 === 0) {
            ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.strokeRect(-22, -22, 44, 44);
        }
        ctx.restore();
    }
    takeDamage(amount) {
        if (this.invulnerable > 0) return;
        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield < 0) { this.hp += this.shield; this.shield = 0; }
        } else { this.hp -= amount; }
        this.invulnerable = 2;
    }
}

// GAME
class GalaxyDefender {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.core = new GameCore(this.canvas);
        this.input = new InputHandler();
        this.player = new Player(this.core.width, this.core.height);
        this.particles = [];
        this.projectiles = [];
        this.enemies = [];
        this.score = 0;
        this.credits = 0;
        this.level = 1;
        this.enemySpawnTimer = 0;
        this.initUI();
        this.core.startLoop(this.update.bind(this), this.draw.bind(this));
    }

    initUI() {
        document.getElementById('play-btn').onclick = () => {
            this.core.state = 'PLAYING';
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('hud').classList.remove('hidden');
        };
        document.getElementById('restart-btn').onclick = () => location.reload();
    }

    spawnParticle(x, y, color) {
        for (let i = 0; i < 10; i++) this.particles.push(new Particle(x, y, color));
    }

    spawnEnemy() {
        const types = ['basic', 'fast', 'heavy'];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = MathUtils.random(50, this.core.width - 50);
        this.enemies.push(new Enemy(x, -50, type));
    }

    update(dt) {
        this.player.update(dt, this.input, this.core.width, this.core.height);
        if (this.input.isKeyDown('Space')) {
            const now = Date.now();
            if (now - this.player.lastShot > this.player.fireRate) {
                this.projectiles.push(new Projectile(this.player.x, this.player.y - 20, 0, -600, '#00f2ff', 20));
                this.player.lastShot = now;
            }
        }
        this.enemySpawnTimer -= dt;
        if (this.enemySpawnTimer <= 0) {
            this.spawnEnemy();
            this.enemySpawnTimer = MathUtils.random(1, 3) / (1 + this.level * 0.1);
        }
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(dt);
            if (p.life <= 0 || p.y < 0 || p.y > this.core.height) {
                this.projectiles.splice(i, 1); continue;
            }
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (MathUtils.dist(p.x, p.y, e.x, e.y) < e.width / 2 + p.radius) {
                    e.takeDamage(p.damage);
                    this.projectiles.splice(i, 1);
                    if (e.dead) {
                        this.score += e.points;
                        this.credits += Math.floor(e.points / 2);
                        this.spawnParticle(e.x, e.y, e.color);
                        this.enemies.splice(j, 1);
                    }
                    break;
                }
            }
        }
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(dt);
            if (e.y > this.core.height + 50) { this.enemies.splice(i, 1); continue; }
            if (MathUtils.dist(e.x, e.y, this.player.x, this.player.y) < (e.width/2 + this.player.width/2)) {
                this.player.takeDamage(20);
                this.spawnParticle(e.x, e.y, e.color);
                this.enemies.splice(i, 1);
            }
        }
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }
        document.getElementById('score').innerText = this.score;
        document.getElementById('credits').innerText = this.credits;
        document.getElementById('level').innerText = this.level;
        document.getElementById('hp-value').innerText = Math.max(0, Math.floor(this.player.hp));
        document.getElementById('health-bar').style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
        document.getElementById('shield-bar').style.width = `${(this.player.shield / this.player.maxShield) * 100}%`;
        if (this.player.hp <= 0) {
            this.core.state = 'GAMEOVER';
            document.getElementById('game-over-menu').classList.remove('hidden');
            document.getElementById('final-stats').innerText = `Puntaje Final: ${this.score}`;
        }
    }

    draw(ctx) {
        ctx.clearRect(0, 0, this.core.width, this.core.height);
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 50; i++) {
            const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * this.core.width;
            const y = ((Math.cos(i * 678.9) * 0.5 + 0.5) * this.core.height + Date.now() * 0.05) % this.core.height;
            ctx.fillRect(x, y, 1, 1);
        }
        this.projectiles.forEach(p => p.draw(ctx));
        this.enemies.forEach(e => e.draw(ctx));
        this.player.draw(ctx);
        this.particles.forEach(p => p.draw(ctx));
    }
}

new GalaxyDefender();
