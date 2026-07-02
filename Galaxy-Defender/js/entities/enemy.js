// entities/enemy.js
import { MathUtils } from '../utils/math.js';

export class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.dead = false;

        switch(type) {
            case 'fast':
                this.hp = 20;
                this.speed = 250;
                this.color = '#0ff';
                this.points = 20;
                this.width = 30;
                this.height = 30;
                break;
            case 'heavy':
                this.hp = 100;
                this.speed = 80;
                this.color = '#bc13fe';
                this.points = 50;
                this.width = 60;
                this.height = 60;
                break;
            default: // basic
                this.hp = 50;
                this.speed = 150;
                this.color = '#ff0055';
                this.points = 10;
                this.width = 40;
                this.height = 40;
        }
    }

    update(dt) {
        this.y += this.speed * dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        
        // Draw simple enemy ship shape
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
