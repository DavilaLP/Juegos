// js/player.js
import { Utils } from './utils.js';

export class Player {
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
        this.facing = 1; // 1: right, -1: left
        this.isAttacking = false;
        this.attackTimer = 0;
    }

    update(input, collisions) {
        // Movement
        this.vx = 0;
        if (input.isDown('ArrowRight') || input.isDown('KeyD')) {
            this.vx = this.speed;
            this.facing = 1;
        } else if (input.isDown('ArrowLeft') || input.isDown('KeyA')) {
            this.vx = -this.speed;
            this.facing = -1;
        }

        // Jump
        if ((input.isDown('Space') || input.isDown('ArrowUp') || input.isDown('KeyW')) && this.isGrounded) {
            this.vy = this.jumpForce;
            this.isGrounded = false;
        }

        // Gravity
        this.vy += this.gravity;

        // Apply velocity
        this.x += this.vx;
        this.handleCollision(collisions, 'x');
        this.y += this.vy;
        this.handleCollision(collisions, 'y');

        // Attack state
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
