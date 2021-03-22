'use strict'

function getRandomInt(min, max) {
  return (min + Math.floor(Math.random() * (max + 1 - min)));
}

function Figures(canvas) {
  this.colors = ["#008CF0", "#006633", "#E32636", "#6A5ACD", "#BD33A4"];
  this.count = {
    max: this.colors.length,
    current: 0,
  }
  this.canvas = canvas;
  this.stack = [];
}

Figures.prototype = {
  constructor: Figures,
  add: function() {
    this.count.current++;
    this.stack.push(new Circle(this.canvas.getContext("2d"), this.colors.pop()) );
  },
  delete: function() {
    this.count.current--;
    this.colors.push(this.stack.pop().color);
    if (this.count.current) return true;
  },
}

function Application() {
  this.canvas = null;
  this.getCanvas();
  this.nilCoor = {
    hor: canvas.width/2,
    ver: canvas.height/2
  }
  this.figures =  new Figures(this.canvas);
  this.drawIntervalId = null;
  this.eqMoveList = [];
}

Application.prototype = {
  constructor: Application,
  run: function() {
    let figures = this.figures;
    let eqMove = this.eqMoveList;


    this.drawIntervalId = setInterval(function() {
      for (let index = 0; index < figures.count.current;) {
        figures.stack[index].clear(eqMove[index].getCoor());
        figures.stack[index].draw(eqMove[index++].getNextCoor());
      }
    }, 40);
  },
  getCanvas: function() {
    this.canvas = document.getElementById("canvas");
  },
  stop: function() {
    let id = this.drawIntervalId;
    clearInterval(id);
    this.drawIntervalId = null;
  },
  isRun: function() {
    return (this.drawIntervalId)
  },
}

function Coordinate(hor, ver) {
  this.hor = (hor) ? hor : 0;
  this.ver = (ver) ? ver : 0;
}

Coordinate.prototype = {
  constructor: Coordinate,
  clone: function(other) {
    for (var field in other) {
      if (this.hasOwnProperty(field)) {
        this[field] = other[field];
      }
    }
  },
  getDifference: function(other) {
    let diff = {
      curr : 0,
      max : 0,
    };
    for (var field in other) {
      if (this.hasOwnProperty(field)) {
        diff.curr = Math.abs(Math.abs(this[field]) - Math.abs(other[field]));
        diff.max = (diff.curr > diff.max) ? diff.curr : diff.max;
      }
    }
    return diff.max;
  }
}

function EquationMove(anull) {
  this.null = new Coordinate(anull.hor, anull.ver);
  this.angle = Math.random();
  this.diffAngle = 0.005;
  this.multiplier = 100;
  this.coor = new Coordinate();
  this.direction = 1;
  this.coorList = [];
  this.currentNumber = 0;
}

EquationMove.prototype = {
  constructor: EquationMove,
  getNewCoor : function() {
    this.angle += this.diffAngle;
    if (this.angle == 1) (-this.diffAngle);
    this.coor.hor = Math.cos(Math.PI * this.angle) * this.multiplier;
    this.coor.ver = Math.sin(Math.PI * this.angle) * this.multiplier;
    this.coor.hor += this.null.hor;
    this.coor.ver += this.null.ver;
    return this.coor;
  },
  getNextCoor : function() {
    if (++this.currentNumber === this.coorList.length) {
      this.currentNumber = 0;
    }
    return this.coorList[this.currentNumber];
  },
  getCoor : function() {
    return this.coorList[this.currentNumber];
  },
  generateCoorList : function() {
    let coor = new Coordinate();
    let oldCoor = new Coordinate();
    for(let number = 0; number < Math.round(1/this.diffAngle)*2; number++) {
      coor.clone(this.getNewCoor());
      if (coor.getDifference(oldCoor) > .25) {
        this.coorList.push(coor);
      }
      oldCoor.clone(coor);
      coor = new Coordinate();
    }
  }
}

function Circle(cnt, color, name) {
  this.cnt = cnt;
  this.name = (name) ? name : color;
  this.radius = 15;
  this.color = (color) ? color : "grey";
}

Circle.prototype = {
  constructor: Circle,
  draw : function(coor) {
    this.cnt.strokeStyle = "grey";
    this.cnt.fillStyle = this.color;
    this.cnt.beginPath();
    this.cnt.arc(coor.hor, coor.ver, this.radius, 0, Math.PI * - 2, true);
    this.cnt.closePath();
    this.cnt.fill();
    this.cnt.stroke();
  },
  clear : function(coor) {
    let sideSquare = this.radius * 2 + this.cnt.lineWidth + 2;
    let startHor = coor.hor - this.radius - this.cnt.lineWidth;
    let startVer = coor.ver - this.radius - this.cnt.lineWidth;
    this.cnt.clearRect(startHor, startVer, sideSquare, sideSquare);
  },
}

function Main() {
  window.addEventListener('load', function() {
    app = new Application();
    window.addEventListener('click', function() {
      app.figures.add();
      if (!app.isRun()) app.run();
      let eqMove = new EquationMove(app.nilCoor);
      eqMove.generateCoorList()
      console.log(eqMove.coorList)
      app.eqMoveList.push(eqMove);

    });
    app.canvas.addEventListener('mouseover', function() {
      if(app.figures.count.current && !app.figures.delete()) app.stop();
    });
  });
}

let app = null;

Main();
