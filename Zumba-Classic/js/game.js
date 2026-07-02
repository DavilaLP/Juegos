class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        this.score = 0;
        this.level = 1;
        this.isRunning = false;
        this.isGameOver = false;

        this.colors = ['#ff3333', '#33ff33', '#3333ff', '#ffff33', '#ff33ff', '#33ffff'];
        this.colorQueue = []; 
        this.refillQueue();

        this.path = [];
        this.marbles = [];
        this.projectiles = [];
        this.shooterAngle = 0;

        this.initEventListeners();
        this.createPath();
    }

    refillQueue() {
        while (this.colorQueue.length < 3) {
            this.colorQueue.push(this.colors[Math.floor(Math.random() * this.colors.length)]);
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.createPath();
    }

    initEventListeners() {
        window.addEventListener('resize', () => this.resize());
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            this.shooterAngle = Math.atan2(mouseY - this.canvas.height / 2, mouseX - this.canvas.width / 2);
        });

        this.canvas.addEventListener('mousedown', () => {
            if (this.isRunning) this.shoot();
        });

        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('restart-btn').addEventListener('click', () => this.reset());

        const shootBtn = document.getElementById('shoot-btn');
        if (shootBtn) {
            shootBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.isRunning) this.shoot();
            });
        }
    }

    createPath() {
        this.path = [];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) - 60;

        let currentRadius = maxRadius;
        const angleStep = 0.05;
        let currentAngle = 0;

        while (currentRadius > 30) {
            const x = centerX + Math.cos(currentAngle) * currentRadius;
            const y = centerY + Math.sin(currentAngle) * currentRadius;
            this.path.push({ x, y });

            currentAngle += angleStep;
            currentRadius -= 0.8; // Increased spacing
        }
        
        for (let i = 0; i < this.path.length; i++) {
            this.path[i].x += (Math.random() - 0.5) * 15;
            this.path[i].y += (Math.random() - 0.5) * 15;
        }
    }

    start() {
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('mobile-controls').classList.remove('hidden');
        this.isRunning = true;
        this.bgMusic = document.getElementById('bg-music');
        this.bgMusic.play().catch(() => console.log("Music play blocked"));
        this.gameLoop();
    }

    reset() {
        this.score = 0;
        this.level = 1;
        this.isGameOver = false;
        this.marbles = [];
        this.projectiles = [];
        this.colorQueue = [];
        this.refillQueue();
        this.createPath();
        document.getElementById('game-over-menu').classList.add('hidden');
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('mobile-controls').classList.remove('hidden');
        document.getElementById('final-score').innerText = `Score: ${this.score}`;
        document.getElementById('score-box').innerText = `Score: 0`;
        document.getElementById('level-box').innerText = `Level: 1`;
        this.isRunning = true;
        this.gameLoop();
    }

    shoot() {
        const color = this.colorQueue.shift();
        this.refillQueue();
        
        const speed = 12;
        this.projectiles.push({
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            vx: Math.cos(this.shooterAngle) * speed,
            vy: Math.sin(this.shooterAngle) * speed,
            color: color,
            radius: 15
        });
        const shootSound = document.getElementById('shoot-sound');
        if (shootSound) {
            shootSound.currentTime = 0;
            shootSound.play().catch(() => {});
        }
    }

    spawnMarble() {
        const spawnChance = 0.005 + (this.level * 0.002); 
        if (Math.random() < spawnChance) {
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            this.marbles.push({
                pathIndex: 0,
                color: color,
                radius: 15
            });
        }
    }

    update() {
        if (!this.isRunning) return;

        this.spawnMarble();

        for (let i = 0; i < this.marbles.length; i++) {
            const m = this.marbles[i];
            m.pathIndex += 0.03 + (this.level * 0.002);
            
            if (m.pathIndex >= this.path.length - 1) {
                this.gameOver();
                return;
            }

            const index1 = Math.floor(m.pathIndex);
            const index2 = Math.min(index1 + 1, this.path.length - 1);
            const t = m.pathIndex - index1;

            m.x = this.path[index1].x * (1 - t) + this.path[index2].x * t;
            m.y = this.path[index1].y * (1 - t) + this.path[index2].y * t;
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;
            p.y += p.vy;

            let hitIndex = -1;
            for (let j = 0; j < this.marbles.length; j++) {
                const m = this.marbles[j];
                const dx = p.x - m.x;
                const dy = p.y - m.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < p.radius + m.radius) {
                    hitIndex = j;
                    break;
                }
            }

            if (hitIndex !== -1) {
                this.handleHit(hitIndex, p.color);
                this.projectiles.splice(i, 1);
            } else if (p.x < 0 || p.x > this.canvas.width || p.y < 0 || p.y > this.canvas.height) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    handleHit(index, color) {
        this.marbles.splice(index, 0, {
            pathIndex: this.marbles[index].pathIndex,
            color: color,
            radius: 15
        });
        this.checkMatches(index);
    }

    checkMatches(index) {
        let start = index;
        let end = index;

        while (end + 1 < this.marbles.length && this.marbles[end + 1].color === this.marbles[index].color) {
            end++;
        }
        while (start - 1 >= 0 && this.marbles[start - 1].color === this.marbles[index].color) {
            start--;
        }

        const count = end - start + 1;
        if (count >= 3) {
            this.marbles.splice(start, count);
            this.score += count * 50;
            document.getElementById('score-box').innerText = `Score: ${this.score}`;
            if (this.score > this.level * 500) {
                this.levelUp();
            }
        }
    }

    gameOver() {
        this.isRunning = false;
        this.isGameOver = true;
        document.getElementById('game-over-menu').classList.remove('hidden');
        document.getElementById('mobile-controls').classList.add('hidden');
        document.getElementById('final-score').innerText = `Score: ${this.score}`;
        if (this.bgMusic) this.bgMusic.pause();
    }

    levelUp() {
        this.level++;
        document.getElementById('level-box').innerText = `Level: ${this.level}`;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 35;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            this.ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        this.ctx.stroke();

        this.marbles.forEach(m => this.drawMarble(m.x, m.y, m.color, m.radius));
        this.projectiles.forEach(p => this.drawMarble(p.x, p.y, p.color, p.radius));
        this.drawShooter();
    }

    drawMarble(x, y, color, radius) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = color;
        this.ctx.stroke();
        const grad = this.ctx.createRadialGradient(x - radius/3, y - radius/3, radius/10, x, y, radius);
        grad.addColorStop(0, 'rgba(255,255,255,0.6)');
        grad.addColorStop(1, 'rgba(0,0,0,0.3)');
        this.ctx.fillStyle = grad;
        this.ctx.fill();
        this.ctx.restore();
    }

    drawShooter() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(this.shooterAngle);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(45, -18);
        this.ctx.lineTo(45, 18);
        this.ctx.closePath();
        const grad = this.ctx.createLinearGradient(0, 0, 45, 0);
        grad.addColorStop(0, '#ffd700');
        grad.addColorStop(1, '#ff8c00');
        this.ctx.fillStyle = grad;
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
 
        // --- COLOR INDICATOR ---
        if (this.colorQueue && this.colorQueue.length >= 2) {
            // Current color - In the mouth
            this.drawMarble(40, 0, this.colorQueue[0], 12);
            // Next color - On the back
            this.drawMarble(-30, 0, this.colorQueue[1], 12);
        }
        this.ctx.restore();
 
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
        this.ctx.fillStyle = '#222';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
    }


    gameLoop() {
        if (!this.isRunning) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

const game = new Game();
