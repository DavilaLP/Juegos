// js/map.js
export class GameMap {
    constructor() {
        this.tileSize = 64;
        // Simple 2D array for the first level (Beach)
        // 0: Air, 1: Ground, 2: Coin, 3: Gem, 4: Fragment, 5: Key, 6: Door, 7: Hazard
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
