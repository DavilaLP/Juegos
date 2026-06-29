class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.score = 0;
        this.currentLevel = 1;
        this.isRunning = false;

        this.player = new Player();
        this.map = new MapData();
        this.enemies = [];
        this.collectibles = [];
        this.hazards = [];
        this.camera = { x: 0, y: 0 };

        this.keys = {};
        this.initEventListeners();
        this.syncEntitiesFromMap();
    }

    syncEntitiesFromMap() {
        this.enemies = this.map.enemies;
        this.collectibles = this.map.collectibles;
        this.hazards = this.map.hazards;
    }

    initEventListeners() {
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        window.addEventListener('resize', () => this.handleResize());

        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.resetGame());

        // Mobile controls
        const jumpBtn = document.getElementById('jump-btn');
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys['Space'] = true;
            });
            jumpBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys['Space'] = false;
            });
        }

        const joystick = document.getElementById('move-joystick');
        const stick = document.getElementById('move-stick');
        if (joystick) {
            joystick.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = joystick.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                let dx = touch.clientX - centerX;
                let dy = touch.clientY - centerY;
                const dist = Math.min(Math.hypot(dx, dy), 50);
                const angle = Math.atan2(dy, dx);

                const moveX = Math.cos(angle) * dist;
                const moveY = Math.sin(angle) * dist;

                stick.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;

                this.keys['ArrowRight'] = dx > 20;
                this.keys['ArrowLeft'] = dx < -20;
                this.keys['ArrowUp'] = dy < -20;
                this.keys['ArrowDown'] = dy > 20;
            });

            joystick.addEventListener('touchend', () => {
                stick.style.transform = `translate(-50%, -50%)`;
                this.keys['ArrowRight'] = false;
                this.keys['ArrowLeft'] = false;
                this.keys['ArrowUp'] = false;
                this.keys['ArrowDown'] = false;
            });
        }
    }

    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    startGame() {
        document.getElementById('start-menu').classList.add('hidden');
        if (window.innerWidth <= 768) {
            document.getElementById('mobile-controls').style.display = 'flex';
        }
        this.isRunning = true;
        this.gameLoop();
    }

    resetGame() {
        this.player = new Player();
        this.map = new MapData();
        this.syncEntitiesFromMap();
        this.score = 0;
        this.currentLevel = 1;
        this.isRunning = true;
        document.getElementById('game-over-menu').classList.remove('hidden');
        this.gameLoop();
    }

    gameOver() {
        this.isRunning = false;
        document.getElementById('game-over-menu').classList.remove('hidden');
    }

    update(dt) {
        if (!this.isRunning) return;

        this.player.update(this.keys, this.map, dt);
        
        this.enemies.forEach(enemy => {
            enemy.update();
            if (this.rectIntersect(this.player, enemy)) {
                this.gameOver();
            }
        });

        this.collectibles.forEach(item => {
            if (!item.collected && this.rectIntersect(this.player, item)) {
                item.collected = true;
                this.score += item.value;
            }
        });

        this.hazards.forEach(hazard => {
            if (this.rectIntersect(this.player, hazard)) {
                this.gameOver();
            }
        });

        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;

        if (this.player.y > this.map.height * this.map.tileSize + 500) {
            this.gameOver();
        }

        if (this.player.x > this.map.width * this.map.tileSize - 100) {
            this.nextLevel();
        }
    }

    rectIntersect(r1, r2) {
        return r1.x < r2.x + r2.width &&
               r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height &&
               r1.y + r1.height > r2.y;
    }

    nextLevel() {
        this.currentLevel++;
        if (this.currentLevel > 10) {
            alert("¡VICTORIA! Has conquistado el mundo de Vortex!");
            this.resetGame();
        } else {
            this.map = new MapData(this.currentLevel);
            this.syncEntitiesFromMap();
            this.player.x = 100;
            this.player.y = 100;
            this.player.vx = 0;
            this.player.vy = 0;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawBackground();

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        this.map.draw(this.ctx);
        this.enemies.forEach(e => e.draw(this.ctx));
        this.collectibles.forEach(c => c.draw(this.ctx));
        this.hazards.forEach(h => h.draw(this.ctx));
        this.player.draw(this.ctx);

        this.ctx.restore();

        document.getElementById('score-box').innerText = `Score: ${this.score}`;
        document.getElementById('level-box').innerText = `Level: ${this.currentLevel}`;
    }

    drawBackground() {
        const time = Date.now() * 0.001;
        this.ctx.fillStyle = '#050510';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 100; i++) {
            const x = (Math.sin(i * 123.4) * 0.5 + 0.5) * this.canvas.width;
            const y = (Math.cos(i * 456.7) * 0.5 + 0.5) * this.canvas.height;
            const speed = 0.1 + (i % 5) * 0.05;
            const offset = (this.camera.x * speed) % this.canvas.width;
            this.ctx.beginPath();
            this.ctx.arc((x + offset + this.canvas.width) % this.canvas.width, y, 1, 0, Math.PI * 2);
            this.ctx.fill();
        }

        const grad = this.ctx.createRadialGradient(
            this.canvas.width/2 - this.camera.x * 0.2, this.canvas.height/2 - this.camera.y * 0.2, 0,
            this.canvas.width/2 - this.camera.x * 0.2, this.canvas.height/2 - this.camera.y * 0.2, this.canvas.width
        );
        grad.addColorStop(0, 'rgba(188, 19, 254, 0.1)');
        grad.addColorStop(1, 'transparent');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);
    }

    gameLoop() {
        if (!this.isRunning) return;
        this.update(1/60);
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

class Player {
    constructor() {
        this.width = 34;
        this.height = 34;
        this.x = 100;
        this.y = 100;
        this.vx = 0;
        this.vy = 0;
        this.speed = 1.2;
        this.maxSpeed = 15;
        this.friction = 0.88;
        this.gravity = 0.7;
        this.jumpForce = -16;
        this.grounded = false;
        this.color = '#00d2ff';
    }

    update(keys, map, dt) {
        this.grounded = false;

        if (keys['ArrowRight'] || keys['KeyD']) {
            this.vx += this.speed;
        } else if (keys['ArrowLeft'] || keys['KeyA']) {
            this.vx -= this.speed;
        } else {
            this.vx *= this.friction;
        }

        if (this.vx > this.maxSpeed) this.vx = this.maxSpeed;
        if (this.vx < -this.maxSpeed) this.vx = -this.maxSpeed;

        this.vy += this.gravity;

        if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && this.grounded) {
            this.vy = this.jumpForce;
            this.grounded = false;
        }

        this.x += this.vx;
        this.checkCollision(map, 'x');
        
        this.y += this.vy;
        this.checkCollision(map, 'y');
    }

    checkCollision(map, axis) {
        const tileSize = map.tileSize;
        const left = Math.floor(this.x / tileSize);
        const right = Math.floor((this.x + this.width - 0.1) / tileSize);
        const top = Math.floor(this.y / tileSize);
        const bottom = Math.floor((this.y + this.height - 0.1) / tileSize);

        for (let row = top; row <= bottom; row++) {
            for (let col = left; col <= right; col++) {
                if (map.isSolid(col, row)) {
                    if (axis === 'x') {
                        if (this.vx > 0) {
                            this.x = col * tileSize - this.width;
                        } else if (this.vx < 0) {
                            this.x = (col + 1) * tileSize;
                        }
                        this.vx = 0;
                    } else {
                        if (this.vy >= 0) {
                            this.y = row * tileSize - this.height;
                            this.grounded = true;
                        } else {
                            this.y = (row + 1) * tileSize;
                        }
                        this.vy = 0;
                    }
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        this.roundRect(ctx, this.x, this.y, this.width, this.height, 8);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        const eyeX = this.vx >= 0 ? this.x + 20 : this.x + 5;
        ctx.fillRect(eyeX, this.y + 10, 8, 8);
        ctx.restore();
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

class Enemy {
    constructor(x, y, range) {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 35;
        this.startPosX = x;
        this.range = range;
        this.speed = 2.5;
        this.direction = 1;
        this.color = '#ff003c';
    }

    update() {
        this.x += this.speed * this.direction;
        if (Math.abs(this.x - this.startPosX) > this.range) {
            this.direction *= -1;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

class Collectible {
    constructor(x, y, value = 10) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.value = value;
        this.collected = false;
        this.color = '#ffff00';
    }

    draw(ctx) {
        if (this.collected) return;
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Hazard {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = '#ff4400';
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

class MapData {
    constructor(level = 1) {
        this.tileSize = 50;
        this.width = 60 + (level * 10);
        this.height = 20;
        this.grid = [];
        this.enemies = [];
        this.collectibles = [];
        this.hazards = [];
        this.generate(level);
    }

    generate(level) {
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill(0));

        for (let x = 0; x < this.width; x++) {
            this.grid[this.height - 1][x] = 1;
            
            if (x > 10 && x < this.width - 10) {
                const rand = Math.random();
                if (rand < 0.12) {
                    let platY = this.height - 4 - Math.floor(Math.random() * 6);
                    if (platY > 4) {
                        for (let i = 0; i < 3; i++) {
                            if (x + i < this.width) this.grid[platY][x + i] = 1;
                        }
                    }
                } else if (rand < 0.18) {
                    let platY = this.height - 2 - Math.floor(Math.random() * 5);
                    if (platY > 4) {
                        for (let i = 0; i < 3; i++) {
                            if (x + i < this.width) this.grid[platY][x + i] = 1;
                        }
                    }
                }
            }
        }

        this.grid[this.height - 2][this.width - 2] = 2; 
        
        this.enemies = this.getEnemies();
        this.collectibles = this.getCollectibles();
        this.hazards = this.getHazards();
    }

    getEnemies() {
        const enemies = [];
        const count = 5 + Math.floor(this.width/10);
        for (let i = 0; i < count; i++) {
            let ex = 200 + Math.random() * (this.width * this.tileSize - 400);
            let ey = (this.height - 3) * this.tileSize;
            enemies.push(new Enemy(ex, ey, 100 + Math.random() * 200));
        }
        return enemies;
    }

    getCollectibles() {
        const collectibles = [];
        const count = 10 + Math.floor(this.width/5);
        for (let i = 0; i < count; i++) {
            let cx = 100 + Math.random() * (this.width * this.tileSize - 200);
            let cy = (this.height - 5 - Math.floor(Math.random() * 10)) * this.tileSize;
            collectibles.push(new Collectible(cx, cy, 10));
        }
        return collectibles;
    }

    getHazards() {
        const hazards = [];
        const count = 5 + Math.floor(this.width/8);
        for (let i = 0; i < count; i++) {
            let hx = 300 + Math.random() * (this.width * this.tileSize - 400);
            let hy = (this.height - 2) * this.tileSize;
            hazards.push(new Hazard(hx, hy, 40, 20));
        }
        return hazards;
    }

    isSolid(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return true;
        return this.grid[y][x] === 1;
    }

    draw(ctx) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === 1) {
                    ctx.fillStyle = '#111122';
                    ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    ctx.strokeStyle = '#222244';
                    ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                } else if (this.grid[y][x] === 2) {
                    ctx.fillStyle = '#00ffaa';
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#00ffaa';
                    ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    ctx.shadowBlur = 0;
                }
            }
        }
    }
}

const game = new Game();
