// entities/player.js
import { MathUtils } from '../utils/math.js';

export class Player {
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
        this.fireRate = 250; // ms
        this.weaponType = 'basic';
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

        // Engine glow
        const engineGlow = Math.sin(Date.now() * 0.01) * 5 + 10;
        ctx.shadowBlur = engineGlow;
        ctx.shadowColor = '#00f2ff';
        ctx.fillStyle = '#00f2ff';
        ctx.beginPath();
        ctx.moveTo(-5, 15);
        ctx.lineTo(0, 25 + engineGlow);
        ctx.lineTo(5, 15);
        ctx.fill();

        // Ship Body
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f2ff';
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(20, 20);
        ctx.lineTo(0, 10);
        ctx.lineTo(-20, 20);
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#bc13fe';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Shield
        if (this.shield > 0) {
            ctx.strokeStyle = '#bc13fe';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#bc13fe';
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Invulnerability flash
        if (this.invulnerable > 0 && Math.floor(Date.now() * 0.01) % 2 === 0) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.strokeRect(-22, -22, 44, 44);
        }

        ctx.restore();
    }

    takeDamage(amount) {
        if (this.invulnerable > 0) return;
        
        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield < 0) {
                this.hp += this.shield;
                this.shield = 0;
            }
        } else {
            this.hp -= amount;
        }
        
        this.invulnerable = 2; // 2 seconds
    }
}
