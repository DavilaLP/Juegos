// engine/core.js
export class GameCore {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width = canvas.parentElement.clientWidth;
        this.height = canvas.height = canvas.parentElement.clientHeight;
        
        this.lastTime = 0;
        this.accumulator = 0;
        this.deltaTime = 1/60;
        
        this.state = 'MENU'; // MENU, PLAYING, PAUSED, SHOP, GAMEOVER
    }

    startLoop(updateFn, drawFn) {
        const loop = (time) => {
            if (this.state === 'MENU') {
                requestAnimationFrame(loop);
                return;
            }

            const dt = (time - this.lastTime) / 1000;
            this.lastTime = time;

            if (this.state === 'PLAYING') {
                this.accumulator += dt;
                while (this.accumulator >= this.deltaTime) {
                    updateFn(this.deltaTime);
                    this.accumulator -= this.deltaTime;
                }
            }

            drawFn(this.ctx);
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    resize() {
        this.width = this.canvas.width = this.canvas.parentElement.clientWidth;
        this.height = this.canvas.height = this.canvas.parentElement.clientHeight;
    }
}
