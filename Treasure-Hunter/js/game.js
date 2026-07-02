// UTILS
const Utils = {
    random: (min, max) => Math.random() * (max - min) + min,
    clamp: (val, min, max) => Math.max(min, Math.min(max, val)),
    dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    lerp: (start, end, t) => start + (end - start) * t
};

// INPUT
class Input {
    constructor() {
        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }
    isDown(code) {
        return this.keys[code] || false;
    }
}

// MAP
class GameMap {
    constructor() {
        this.tileSize = 64;
        this.data = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ];
    }
    getCollisions() {
        const colls = [];
        for (let y = 0; y < this.data.length; y++) {
            for (let x = 0; x < this.data[y].length; x++) {
                if (this.data[y][x] === 1) {
                    colls.push({ x: x * this.tileSize, y: y * this.tileSize, width: this.tileSize, height: this.tileSize });
                }
            }
        }
        return colls;
    }
    draw(ctx) {
        for (let y = 0; y < this.data.length; y++) {
            for (let x = 0; x < this.data[y].length; x++) {
                if (this.data[y][x] === 1) {
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    ctx.strokeStyle = '#5D2E0C';
                    ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }
    }
}

// PLAYER
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 48;
        this.height = 48;
        this.vx = 0;
        this.vy = 0;
        this.speed = 4;
        this.jumpForce = -12;
        this.gravity = 0.6;
        this.isGrounded = false;
        this.health = 100;
        this.maxHealth = 100;
        this.lives = 3;
        this.coins = 0;
        this.gems = 0;
        this.keys = 0;
        this.fragments = 0;
        this.score = 0;
        this.facing = 1;
        this.isAttacking = false;
        this.attackTimer = 0;
    }
    update(input, collisions) {
        this.vx = 0;
        if (input.isDown('ArrowRight') || input.isDown('KeyD')) {
            this.vx = this.speed;
            this.facing = 1;
        } else if (input.isDown('ArrowLeft') || input.isDown('KeyA')) {
            this.vx = -this.speed;
            this.facing = -1;
        }
        if ((input.isDown('Space') || input.isDown('ArrowUp') || input.isDown('KeyW')) && this.isGrounded) {
            this.vy = this.jumpForce;
            this.isGrounded = false;
        }
        this.vy += this.gravity;
        this.x += this.vx;
        this.handleCollision(collisions, 'x');
        this.y += this.vy;
        this.handleCollision(collisions, 'y');
        if (this.attackTimer > 0) this.attackTimer--;
        else this.isAttacking = false;
    }
    handleCollision(collisions, axis) {
        this.isGrounded = false;
        for (let col of collisions) {
            if (this.rectIntersect(this, col)) {
                if (axis === 'x') {
                    if (this.vx > 0) this.x = col.x - this.width;
                    else if (this.vx < 0) this.x = col.x + col.width;
                } else {
                    if (this.vy > 0) {
                        this.y = col.y - this.height;
                        this.vy = 0;
                        this.isGrounded = true;
                    } else if (this.vy < 0) {
                        this.y = col.y + col.height;
                        this.vy = 0;
                    }
                }
            }
        }
    }
    rectIntersect(r1, r2) {
        return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
    }
    attack() {
        this.isAttacking = true;
        this.attackTimer = 15;
    }
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            return 'DIE';
        }
        return 'HURT';
    }
}

// GAME
class TreasureHunter {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.input = new Input();
        this.map = new GameMap();
        this.player = new Player(100, 100);
        this.isRunning = false;
        this.score = 0;

        this.initUI();
        this.loop();
    }

    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    }

    initUI() {
        document.getElementById('play-btn').onclick = () => {
            this.isRunning = true;
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('hud').classList.remove('hidden');
        };
        document.getElementById('options-btn').onclick = () => {
            alert("SISTEMAS DE CONFIGURACIÓN\n\n- Sonido: 100%\n- Controles: WASD / Flechas\n- Resolución: Automática\n\n(En desarrollo)");
        };
        document.getElementById('credits-btn').onclick = () => {
            alert("TREASURE HUNTER\n\nDesarrollado por: Nova-X Studios\nArte: Cartoon Style\nMotor: Vanilla JS");
        };
        document.getElementById('exit-btn').onclick = () => {
            window.location.href = '../index.html';
        };
    }

    update() {
        if (!this.isRunning) return;
        this.player.update(this.input, this.map.getCollisions());
        document.getElementById('score-val').innerText = this.score;
        document.getElementById('health-bar').style.width = `${this.player.health}%`;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#87ceeb';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.map.draw(this.ctx);
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

new TreasureHunter();
