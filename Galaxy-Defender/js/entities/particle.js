// entities/particle.js
import { MathUtils } from '../utils/math.js';

export class Particle {
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
