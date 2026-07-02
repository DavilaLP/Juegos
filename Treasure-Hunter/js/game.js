// js/game.js
import { Input } from './input.js';
import { Player } from './player.js';
import { GameMap } from './map.js';

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
        document.getElementById('exit-btn').onclick = () => {
            window.location.href = '../index.html';
        };
    }

    update() {
        if (!this.isRunning) return;
        this.player.update(this.input, this.map.getCollisions());
        
        // Basic HUD sync
        document.getElementById('score-val').innerText = this.score;
        document.getElementById('health-bar').style.width = `${this.player.health}%`;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Background sky
        this.ctx.fillStyle = '#87ceeb';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.map.draw(this.ctx);

        // Draw Player
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
