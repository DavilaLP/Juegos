class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.gridSize = 20;
        this.canvasSize = 400;
        this.canvas.width = this.canvasSize;
        this.canvas.height = this.canvasSize;

        this.score = 0;
        this.highScore = localStorage.getItem('neonSnakeBest') || 0;
        this.isRunning = false;
        this.speed = 150; // ms per move

        this.snake = [];
        this.food = { x: 0, y: 0 };
        this.direction = 'right';
        this.nextDirection = 'right';

        this.updateBestScore();
        this.initEventListeners();
    }

    updateBestScore() {
        document.getElementById('best').innerText = this.highScore;
    }

    initEventListeners() {
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp': this.setDirection('up'); break;
                case 'ArrowDown': this.setDirection('down'); break;
                case 'ArrowLeft': this.setDirection('left'); break;
                case 'ArrowRight': this.setDirection('right'); break;
            }
        });

        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('restart-btn').addEventListener('click', () => this.start());

        // Mobile controls
        const controls = {
            'up': 'up', 'down': 'down', 'left': 'left', 'right': 'right'
        };
        Object.entries(controls).forEach(([id, dir]) => {
            document.getElementById(id).addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.setDirection(dir);
            });
        });
    }

    setDirection(dir) {
        const opposites = { 'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left' };
        if (dir !== opposites[this.direction]) {
            this.nextDirection = dir;
        }
    }

    start() {
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.speed = 150;
        this.isRunning = true;
        
        document.getElementById('score').innerText = this.score;
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('game-over-menu').classList.add('hidden');
        
        this.spawnFood();
        this.gameLoop();
    }

    spawnFood() {
        this.food = {
            x: Math.floor(Math.random() * (this.canvasSize / this.gridSize)),
            y: Math.floor(Math.random() * (this.canvasSize / this.gridSize))
        };
        // Ensure food doesn't spawn on snake
        if (this.snake.some(seg => seg.x === this.food.x && seg.y === this.food.y)) {
            this.spawnFood();
        }
    }

    update() {
        this.direction = this.nextDirection;
        const head = { ...this.snake[0] };

        if (this.direction === 'up') head.y--;
        if (this.direction === 'down') head.y++;
        if (this.direction === 'left') head.x--;
        if (this.direction === 'right') head.x++;

        // Wall collision
        if (head.x < 0 || head.x >= this.canvasSize / this.gridSize || 
            head.y < 0 || head.y >= this.canvasSize / this.gridSize) {
            this.gameOver();
            return;
        }

        // Self collision
        if (this.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // Food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            document.getElementById('score').innerText = this.score;
            this.spawnFood();
            this.increaseDifficulty();
        } else {
            this.snake.pop();
        }
    }

    increaseDifficulty() {
        // Progressive speed: reduce delay by 2ms per food, minimum 60ms
        this.speed = Math.max(60, 150 - Math.floor(this.score / 20) * 5);
    }

    gameOver() {
        this.isRunning = false;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('neonSnakeBest', this.highScore);
            this.updateBestScore();
        }
        document.getElementById('final-score').innerText = this.score;
        document.getElementById('game-over-menu').classList.remove('hidden');
    }

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Food
        this.ctx.fillStyle = '#f0f';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#f0f';
        this.ctx.fillRect(this.food.x * this.gridSize + 2, this.food.y * this.gridSize + 2, this.gridSize - 4, this.gridSize - 4);

        // Draw Snake
        this.snake.forEach((seg, index) => {
            const isHead = index === 0;
            this.ctx.fillStyle = isHead ? '#0ff' : '#0aa';
            this.ctx.shadowBlur = isHead ? 20 : 10;
            this.ctx.shadowColor = isHead ? '#0ff' : '#0aa';
            this.ctx.fillRect(seg.x * this.gridSize + 1, seg.y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
        });
        this.ctx.shadowBlur = 0;
    }

    gameLoop() {
        if (!this.isRunning) return;

        this.update();
        this.draw();

        setTimeout(() => this.gameLoop(), this.speed);
    }
}

const game = new SnakeGame();
