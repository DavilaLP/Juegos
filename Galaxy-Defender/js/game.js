// js/game.js
import { GameCore } from './engine/core.js';
import { InputHandler } from './engine/input.js';
import { Player } from './entities/player.js';
import { Projectile } from './entities/projectile.js';
import { Enemy } from './entities/enemy.js';
import { Particle } from './entities/particle.js';
import { MathUtils } from './utils/math.js';

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

        document.getElementById('restart-btn').onclick = () => {
            location.reload();
        };
    }

    spawnParticle(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    spawnEnemy() {
        const types = ['basic', 'fast', 'heavy'];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = MathUtils.random(50, this.core.width - 50);
        this.enemies.push(new Enemy(x, -50, type));
    }

    update(dt) {
        this.player.update(dt, this.input, this.core.width, this.core.height);
        
        // Shooting
        if (this.input.isKeyDown('Space')) {
            const now = Date.now();
            if (now - this.player.lastShot > this.player.fireRate) {
                this.projectiles.push(new Projectile(this.player.x, this.player.y - 20, 0, -600, '#00f2ff', 20));
                this.player.lastShot = now;
            }
        }

        // Enemy spawning
        this.enemySpawnTimer -= dt;
        if (this.enemySpawnTimer <= 0) {
            this.spawnEnemy();
            this.enemySpawnTimer = MathUtils.random(1, 3) / (1 + this.level * 0.1);
        }

        // Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(dt);
            if (p.life <= 0 || p.y < 0 || p.y > this.core.height) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Collision with enemies
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

        // Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(dt);
            
            if (e.y > this.core.height + 50) {
                this.enemies.splice(i, 1);
                continue;
            }

            // Collision with player
            if (MathUtils.dist(e.x, e.y, this.player.x, this.player.y) < (e.width/2 + this.player.width/2)) {
                this.player.takeDamage(20);
                this.spawnParticle(e.x, e.y, e.color);
                this.enemies.splice(i, 1);
            }
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }

        // HUD update
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

        // Background - stars
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
