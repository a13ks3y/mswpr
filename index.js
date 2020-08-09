class Cell {
    isHidden = true
    isMine = false
    isFlag = false
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.v = 0;
    }
    getN(field) {
        return [
            { x: this.x - 1, y: this.y - 1 }, // left top
            { x: this.x + 0, y: this.y - 1 }, // top
            { x: this.x + 1, y: this.y - 1 }, // right top
            { x: this.x + 1, y: this.y + 0 }, // right
            { x: this.x + 1, y: this.y + 1 }, // right bottom
            { x: this.x + 0, y: this.y + 1 }, // bottom
            { x: this.x - 1, y: this.y + 1 }, // bottom left
            { x: this.x - 1, y: this.y + 0 }, // left
        ].map(n => {
            return field.getCell(n.x, n.y);
        });
    }
    getNN(field) {
        return this.getN(field).filter(n => !!n);
    }
    getNM(field) {
        return this.getN(field).filter(n => !!n && n.isMine);
    }
    toString() {                
        const html = this.isHidden ?
             `<button class="cell cell-${this.v} ${this.isFlag ? 'cell-is-flag' : ''}" onclick="app.click(${this.x}, ${this.y})" oncontextmenu="app.context(event, ${this.x}, ${this.y})"></button>` : 
             `<span class="cell cell-${this.v} ${this.isFlag ? 'cell-is-flag' : ''} ${this.isMine ? 'cell-is-mine' : ''}">${this.v || '&nbsp;'}</span>`;
        return `<div class="cell cell-${this.x}_${this.y}">${html}</div>`;
    }
}
class Field {
    constructor(W, H, MC) {
        this.W = W;
        this.H = H;
        this.MC = MC;
        this.cells = Array(this.W);
        
        for (let x = 0; x < this.W; x++) {
            this.cells[x] = Array(H);
            for (let y = 0; y < this.H; y++) {
                const cell = new Cell(x, y);                         
                this.cells[x][y] = cell;                       
            }
        }
        this.mineCells = Array(this.MC).fill(0).map(() => {
            return {x: ~~(Math.random()*this.W), y: ~~(Math.random() * this.H)};
        });
        this.mineCells.forEach(mineCell => this.cells[mineCell.x][mineCell.y].isMine = true);
        this.cells.forEach(col => col.forEach(cell => !cell.isMine && (cell.v = cell.getNM(this).length || 0)));
    }
    getCell(x, y) {
        return this.cells[x] && this.cells[x][y];
    }
    toString() {
        let html = this.cells.map(col => `<div class="row">${col.map(c => c.toString()).join('\n')}</div>`).join('\n');
        return html;
    }
}
class App {
    constructor(CI, W, H, MC) {
        this.fieldEl = document.getElementById('app.field');
        this.CI = CI;            
        this.W = W;
        this.H = H;
        this.MC = MC;  
        this.init();
    }
    init() {
        this.field = new Field(this.W, this.H, this.MC);
        this.render();
    }
    render() {
        //this.fieldEl.style.width = (this.W) * 64 + 'px';
        Object.keys(this).forEach(key => {
            if (!(this[key] instanceof Function)) {
                const el = document.getElementById(`app.${key}`);
                if (el) {
                    el.innerHTML = this[key].toString();
                }
            }
        });
    }
    context(e, x, y) {
        const cell = this.field.getCell(x, y);
        if (cell) {
            cell.isFlag = true;
            this.render();
            this.checkWin();
            e.preventDefault();
            return false;
        }
    }
    click(x, y) {
        const cell = this.field.getCell(x, y);               
        if (cell) {
            cell.isHidden = false;
            if (cell.isMine) {
                this.gameOver();
            } else if (cell.v == 0) {
                const field = this.field;
                var visited = [];
                (function recursion(cell, maxRecursion) {
                    const nn = cell.getNN(field);
                    nn.forEach(n => { 
                        if (!visited.find(v => v.x == n.x && v.y == n.y)) {
                            visited.push(n);
                            !n.isMine && (n.isHidden = false);
                            !n.isMine && maxRecursion > 0 && recursion(n, maxRecursion - 1);
                        }
                    });
                }(cell, 100));

            }
            this.render();

            this.checkWin();
        }
    }
    checkWin() {
        const atLeastOneHiddenCell = this.field.cells.find(col => col.find(cell => cell.isHidden && !cell.isMine));
            if (!atLeastOneHiddenCell) {
                setTimeout(this.win.bind(this), 1000);
            }
    }
    gameOver() {
        this.field.mineCells.forEach(mineCell => this.field.cells[mineCell.x][mineCell.y].isHidden = false);
        this.render();
        setTimeout(() => {
            alert('Game Over!');
            this.init();
        }, 1000);
    }
    win() {
        this.CI ++;
        this.longSide = this.W > this.H ? 'W' : 'H';
        this.shortSide = this.longSide == 'W' ? 'H' : 'W';
        if (this.CI % 2 == 0) {
            this[this.longSide] += 1;
        } else if (this.CI % 3 == 0) {
            this[this.shortSide] += 1;
        }
        this.MC +=  ~~Math.PI;
        localStorage.setItem('W', this.W);
        localStorage.setItem('H', this.H);
        localStorage.setItem('CI', this.CI);
        localStorage.setItem('MC', this.MC);
        alert('You win!');
        this.init();
    }
}
const CI = parseInt(localStorage.getItem('CI')) || 1;
const W = parseInt(localStorage.getItem('W')) || ~~(window.screen.availWidth / 64);
const H = parseInt(localStorage.getItem('H')) || ~~(window.screen.availHeight / 64);
const MC = parseInt(localStorage.getItem('MC') || 10);
const app = new App(CI, W, H, MC);