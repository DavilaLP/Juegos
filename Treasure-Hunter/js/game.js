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
    isDown(code) { return this.keys[code] || false; }
}

// CAMERA
class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
    }
    follow(target) {
        const targetX = target.x - this.width / 2;
        const targetY = target.y - this.height / 2;
        this.x += (targetX - this.x) * 0.1;
        this.y += (targetY - this.y) * 0.1;
    }
}

// ENTITIES
class Entity {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
    }
    get midX() { return this.x + this.width / 2; }
    get midY() { return this.y + this.height / 2; }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 40, 60, '#ffcc00');
        this.speed = 5;
        this.jumpForce = -15;
        this.gravity = 0.8;
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
        this.state = 'idle'; // idle, walk, jump, attack
        this.animFrame = 0;
        this.attackTimer = 0;
    }

    update(input, collisions) {
        this.vx = 0;
        if (input.isDown('ArrowRight') || input.isDown('KeyD')) {
            this.vx = this.speed;
            this.facing = 1;
            this.state = 'walk';
        } else if (input.isDown('ArrowLeft') || input.isDown('KeyA')) {
            this.vx = -this.speed;
            this.facing = -1;
            this.state = 'walk';
        } else {
            this.state = 'idle';
        }

        if ((input.isDown('Space') || input.isDown('ArrowUp') || input.isDown('KeyW')) && this.isGrounded) {
            this.vy = this.jumpForce;
            this.isGrounded = false;
            this.state = 'jump';
        }

        if (input.isDown('KeyF')) this.attack();

        this.vy += this.gravity;
        this.x += this.vx;
        this.handleCollision(collisions, 'x');
        this.y += this.vy;
        this.handleCollision(collisions, 'y');

        if (this.attackTimer > 0) this.attackTimer--;
        else if (this.state === 'attack') this.state = 'idle';

        this.animFrame += 0.15;
    }

    attack() {
        if (this.attackTimer <= 0) {
            this.state = 'attack';
            this.attackTimer = 20;
        }
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

    draw(ctx, cam) {
        ctx.save();
        ctx.translate(this.x - cam.x, this.y - cam.y);
        
        // Detailed Character Drawing (No simple rects)
        ctx.scale(this.facing, 1);
        
        // Body/Shirt
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.roundRect(-20, 10, 40, 30, 10);
        ctx.fill();
        ctx.strokeStyle = '#d35400';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Head
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Hat (Explorer Hat)
        ctx.fillStyle = '#c2b280';
        ctx.beginPath();
        ctx.ellipse(0, -15, 25, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -15, 12, Math.PI, 0);
        ctx.fill();
        ctx.stroke();

        // Legs (Animated)
        const walkOffset = this.state === 'walk' ? Math.sin(this.animFrame) * 10 : 0;
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(-15, 40, 12, 15 + walkOffset);
        ctx.fillRect(3, 40, 12, 15 - walkOffset);

        // Attack Effect
        if (this.state === 'attack') {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(20, 20, 30, -Math.PI/2, Math.PI/2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

class Enemy extends Entity {
    constructor(x, y, type = 'snake') {
        super(x, y, 40, 40, 'red');
        this.type = type;
        this.hp = type === 'guardian' ? 200 : 40;
        this.speed = type === 'bat' ? 3 : 1.5;
        this.dir = 1;
        this.range = 100;
        this.startX = x;
    }

    update() {
        this.x += this.speed * this.dir;
        if (Math.abs(this.x - this.startX) > this.range) this.dir *= -1;
    }

    draw(ctx, cam) {
        ctx.save();
        ctx.translate(this.x - cam.x, this.y - cam.y);
        
        if (this.type === 'snake') {
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.ellipse(0, 20, 20, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#27ae60';
            ctx.beginPath();
            ctx.arc(this.dir * 15, 15, 8, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'bat') {
            ctx.fillStyle = '#34495e';
            ctx.beginPath();
            ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            // Wings
            const wingY = Math.sin(Date.now() * 0.01) * 10;
            ctx.beginPath();
            ctx.moveTo(-15, 0); ctx.lineTo(-30, wingY); ctx.lineTo(-15, 10);
            ctx.moveTo(15, 0); ctx.lineTo(30, wingY); ctx.lineTo(15, 10);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(-20, -20, 40, 60);
        }
        ctx.restore();
    }
}

class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // coin, gem, key, fragment
        this.width = 30;
        this.height = 30;
        this.collected = false;
    }
    draw(ctx, cam) {
        if (this.collected) return;
        ctx.save();
        ctx.translate(this.x - cam.x, this.y - cam.y);
        
        if (this.type === 'coin') {
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#f39c12';
            ctx.stroke();
        } else if (this.type === 'gem') {
            ctx.fillStyle = '#3498db';
            ctx.beginPath();
            ctx.moveTo(0, -12); ctx.lineTo(10, 0); ctx.lineTo(0, 12); ctx.lineTo(-10, 0);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'fragment') {
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(-8, -8, 16, 16);
            ctx.strokeStyle = '#bdc3c7';
            ctx.strokeRect(-8, -8, 16, 16);
        }
        ctx.restore();
    }
}

// GAME ENGINE
class TreasureHunter {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.input = new Input();
        this.player = new Player(100, 100);
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        
        this.isRunning = false;
        this.score = 0;
        this.level = 1;
        
        this.platforms = [];
        this.enemies = [];
        this.items = [];
        this.decorations = [];

        this.initUI();
        this.loadLevel(1);
        this.loop();
    }

    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.camera.width = this.canvas.width;
        this.camera.height = this.canvas.height;
    }

    loadLevel(lvl) {
        this.platforms = [];
        this.enemies = [];
        this.items = [];
        this.decorations = [];

        // Floor
        this.platforms.push({ x: 0, y: 600, width: 5000, height: 120 });
        
        // Platforms
        const platformData = [
            {x: 300, y: 450, w: 200, h: 40},
            {x: 600, y: 350, w: 200, h: 40},
            {x: 900, y: 450, w: 200, h: 40},
            {x: 1200, y: 300, w: 300, h: 40},
        ];
        platformData.forEach(p => this.platforms.push({ x: p.x, y: p.y, width: p.w, height: p.h }));

        // Items
        for(let i=0; i<20; i++) this.items.push(new Item(MathUtils.random(100, 2000), 550, 'coin'));
        this.items.push(new Item(1300, 250, 'fragment'));

        // Enemies
        this.enemies.push(new Enemy(500, 560, 'snake'));
        this.enemies.push(new Enemy(1000, 560, 'snake'));
        this.enemies.push(new Enemy(700, 200, 'bat'));

        // Decorations (Trees)
        for(let i=0; i<15; i++) {
            this.decorations.push({ x: MathUtils.random(0, 2000), y: 600, type: 'palm' });
        }
    }

    initUI() {
        document.getElementById('play-btn').onclick = () => {
            this.isRunning = true;
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('hud').classList.remove('hidden');
        };
        document.getElementById('options-btn').onclick = () => alert("Configuración: Sonido 100%");
        document.getElementById('credits-btn').onclick = () => alert("Treasure Hunter - Nova-X Studios");
        document.getElementById('exit-btn').onclick = () => window.location.href = '../index.html';
    }

    update() {
        if (!this.isRunning) return;
        
        this.player.update(this.input, this.platforms);
        this.camera.follow(this.player);

        this.enemies.forEach(e => e.update());
        
        // Item Collection
        this.items.forEach(item => {
            if (!item.collected && this.player.rectIntersect(this.player, item)) {
                item.collected = true;
                if (item.type === 'coin') this.player.coins++;
                if (item.type === 'fragment') this.player.fragments++;
                this.score += 10;
            }
        });

        // Enemy Collision
        this.enemies.forEach(e => {
            if (this.player.rectIntersect(this.player, e)) {
                if (this.player.state === 'attack') {
                    e.hp -= 20;
                    if (e.hp <= 0) e.dead = true;
                } else {
                    this.player.takeDamage(10);
                }
            }
        });
        this.enemies = this.enemies.filter(e => !e.dead);

        // HUD Update
        document.getElementById('score-val').innerText = this.score;
        document.getElementById('coins').innerText = this.player.coins;
        document.getElementById('fragments').innerText = `${this.player.fragments}/5`;
        document.getElementById('health-bar').style.width = `${this.player.health}%`;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Parallax Background (Sky & Clouds)
        this.ctx.fillStyle = '#87ceeb';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for(let i=0; i<5; i++) {
            this.ctx.beginPath();
            this.ctx.arc((i * 400 - this.camera.x * 0.2) % (this.canvas.width + 400), 100 + i*50, 50, 0, Math.PI*2);
            this.ctx.fill();
        }

        // Decorations
        this.decorations.forEach(d => {
            this.ctx.save();
            this.ctx.translate(d.x - this.camera.x, d.y);
            if (d.type === 'palm') {
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(-10, -100, 20, 100);
                ctx.fillStyle = '#2ecc71';
                ctx.beginPath();
                ctx.arc(0, -100, 50, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.restore();
        });

        // Platforms
        this.ctx.fillStyle = '#8B4513';
        this.platforms.forEach(p => {
            this.ctx.fillRect(p.x - this.camera.x, p.y - this.camera.y, p.width, p.height);
            this.ctx.strokeStyle = '#5D2E0C';
            this.ctx.strokeRect(p.x - this.camera.x, p.y - this.camera.y, p.width, p.height);
        });

        // Items
        this.items.forEach(item => item.draw(this.ctx, this.camera));
        
        // Enemies
        this.enemies.forEach(e => e.draw(this.ctx, this.camera));

        // Player
        this.player.draw(this.ctx, this.camera);
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

new TreasureHunter();
