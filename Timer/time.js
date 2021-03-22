'use strict'

//<ModelTimeSTART>	

function Counter(maxVal, start) {
	this.maxVal = maxVal;
	this.setCurrentVal((start) ? start : 0);
}
Counter.prototype =  {
	constructor: Counter,
	next: function() {
		this.current--;
		if (this.current === -1) this.current = this.maxVal;//  this.current ;
		return this.current;
	},
	getCurrentVal: function() {return this.current;},
	setCurrentVal: function(val) { this.current = val;},
}


function UnitOfTime(timeLitInMs, maxVal, start, rightUnit) {
	this.start = start;
	this.timeLitInMs = timeLitInMs;
	this.maxVal = maxVal;
	this.partialTimeoutId = 0;
	this.intervalId = 0;
	this.list = [];
	this.counter = new Counter(this.maxVal - 1, this.start);
	this.setList();
	this.rightUnit = rightUnit;
}
UnitOfTime.prototype = {
	constructor: UnitOfTime,
	setList: function() {
		for(var index=0;index<this.maxVal; index++) {
			if (index < 10) this.list.push("0" + index.toString())
			else this.list.push(index.toString());
		}
	},
	getCurrentVal: function() {
		return this.list[this.counter.getCurrentVal()];
	},
	getNewVal: function() {
		return this.list[this.counter.next()];
	},
	run: function() {
		let thisUnitOfTime = this;
			this.counter.next();
		this.intervalId = setInterval(function() {
			thisUnitOfTime.counter.next();
		}, thisUnitOfTime.timeLitInMs);
	},
	stop: function() {
		let thisUnitOfTime = this;
		clearTimeout(thisUnitOfTime.partialTimeoutId);
		clearInterval(thisUnitOfTime.intervalId);
	},
	resetToStart: function() {
		this.counter.setCurrentVal(this.start);
	},
	getStartValInMs: function() {return this.start * this.timeLitInMs},
	getStartValInMsForRight: function() {
		let totalMs = 0, current = this;
		while (current.rightUnit !== null) {
			current = current.rightUnit;
			totalMs += current.getStartValInMs();
		}
		return totalMs
	},
	getCurrentValInMs: function() {
		return (this.counter.getCurrentVal()) * this.timeLitInMs;
	},
	getCurrentValInMsForRight: function() {
		let totalMs = 0, current = this;
		while (current.rightUnit !== null) {
			current = current.rightUnit;
			totalMs += current.getCurrentValInMs();
		}
		return totalMs
	},
	
}

let timeParams =
	[ { name : "dsec", litInMs : 100, lim : 10, start : 0},
		{ name : "sec", litInMs : 1000, lim : 60, start : 3},
		{ name : "min", litInMs : 60000, lim : 60, start : 0},
		{ name : "hour", litInMs : 3600000, lim : 24, start : 0} ]
		
function TotalTime(timeParams) {
	this.Units = new Map();
	for(
			let index = 0, prm = timeParams[index],
			prevUnit = null,
			unit = new UnitOfTime(prm.litInMs, prm.lim, prm.start, prevUnit),
			map = this.Units;
			index < timeParams.length &&
			(unit = new UnitOfTime(prm.litInMs, prm.lim, prm.start, prevUnit));
			prm = timeParams[++index]
			)
	{		
		map.set(prm.name, unit);
		prevUnit = unit;
	}
	
	this.startValInMs = this.getStartValInMs();
	this.currentValInMs = 0;
	this.timeoutId = null;
	this.minDiff = this.Units.get("dsec").timeLitInMs;
}

TotalTime.prototype = {
	constructor: TotalTime,
	getStartValInMs: function() {
		let total = 0;
		for(let unit of this.Units.values()) {
			total += unit.getStartValInMs();
		}
		return total
	},
	getCurrentValInMs: function() {
		let total = 0;
		for(let unit of this.Units.values()) {
			total += unit.getCurrentValInMs();
		}
		return total
	},
	resetToStart: function() {
		for(let index = 0, unitOfTime = null; index < timeParams.length;) {
			unitOfTime = this.Units.get(timeParams[index++].name);
			unitOfTime.resetToStart();
		}
	},
	run: function() {
		for(let index = 0, unitOfTime = null; index < timeParams.length;) {
			unitOfTime = this.Units.get(timeParams[index++].name);
			unitOfTime.partialTimeoutId = setTimeout(function() {
				unitOfTime.run();
			}, unitOfTime.getCurrentValInMsForRight());
		}
	},
	stop: function() {
		for(let index = 0, unitOfTime = null; index < timeParams.length;) {
			unitOfTime = this.Units.get(timeParams[index++].name);
			unitOfTime.stop();
		}
	}
}

//<modelTimeEND>

var model = {
	initializate : function() {
		model.time = new TotalTime(timeParams);
	},
	time: null,
	state: {
		type: ["ready", "launched", "pause", "timeout"],
		value: 0,
		get: function() {
			return this.type[this.value];
		},
		timeout: function() {
			this.value = this.type.indexOf("timeout");
		},
		launched: function() {
			this.value = this.type.indexOf("launched");
		},
		pause: function() {
			this.value = this.type.indexOf("pause");
		},
		ready: function() {
			this.value = this.type.indexOf("ready");
		},
	}
};

var view = {
	time : null,
	intervalId : 0,
	controlPanel : null,
	buttonRun : null,
	buttonReset : null,
	audio : new Audio(),
	initializate: function() {
		view.time = document.getElementById("time_view");
		view.time.onclick = controller.handleOnClickTime;
		document.body.onkeydown = controller.handleHotKeySpace;
		view.controlPanel = document.getElementById("control_panel");
		view.command = document.getElementById("command");
		view.interval = document.getElementById("interval");
		
		let nodeList = view.command.getElementsByTagName("li");
		view.buttonRun = nodeList[0];
		view.buttonReset = nodeList[1];
		view.buttonRun.innerHTML = "Старт";
		view.buttonRun.id = "run";
		view.buttonReset.innerHTML = "Сброс";
		view.buttonReset.id = "reset";
		nodeList = view.interval.getElementsByTagName("li");
		nodeList[0].innerHTML = "15 мин";
		nodeList[0].id = "min15";
		nodeList[1].innerHTML = "30 мин";
		nodeList[1].id = "min30";
		nodeList[2].innerHTML = "45 мин";
		nodeList[2].id = "min45";
		for(let index = 0, node = null; index < nodeList.length;){
			node = nodeList[index++];
			node.onclick = function() { //move to controller
				timeParams[0].start = 0;
				timeParams[1].start = 0;
				timeParams[2].start = index*15;
				timeParams[3].start = 0;
				controller.pause();
				model.initializate();
				controller.displayTime();
			}
		}
		view.buttonRun.onclick = controller.run
		view.buttonReset.onclick = controller.handleReset;
	},
	timeout: function() {
		view.time.innerHTML = "TIMEOUT!";
	},
	runPauseSwitch : function() {
		if (this.buttonRun.id === "run") { 
			this.buttonRun.id = "pause";
			this.buttonRun.innerHTML = "Пауза";
		} else {
			this.buttonRun.id = "run";
			this.buttonRun.innerHTML = "Старт";
		}
	},
	soundTimeout: function() {
		this.audio.volume = 0.8;
		//this.audio.src = "audio/146734_2437358-lq.mp3";//https://freesound.org/data/previews/146/146734_2437358-lq.mp3
		this.audio.src = "https://freesound.org/data/previews/146/146734_2437358-lq.mp3";
		this.audio.autoplay = true;
		this.audio.preload = true;
		this.audio.loop = true;
	},
};

var controller = {
	initializate : function() {
		model.initializate();
		view.initializate();
	},
	displayTime : function() {
		let units = model.time.Units;
		view.time.innerHTML = units.get("hour").getCurrentVal() + ":" +
													units.get("min").getCurrentVal() + ":" +
													units.get("sec").getCurrentVal() + ":" +
													units.get("dsec").getCurrentVal();	
	},
	startCountdown : function() {
		console.log("startCountdown");
		let m = model;
		m.time.run();
		m.time.timeoutId = setTimeout(function() {
			controller.timeout();
			},m.time.getCurrentValInMs());
		view.intervalId = setInterval(function() {
			controller.displayTime();
		}, m.time.Units.get("dsec").timeLitInMs);
	},
	pause : function() {
		console.log("pause");
		model.time.stop();
		clearInterval(model.time.timeoutId);
		clearInterval(view.intervalId);
	},
	timeout : function() {
		model.state.timeout();
		model.time.stop();
		model.time.resetToStart();
		clearInterval(view.intervalId);
	  view.timeout();
		view.soundTimeout();
		setTimeout(function() {
			view.audio.pause();
		}, 30000);
	},
	handleHotKeySpace: function(e) {
		if (e.keyCode == 32) {
			controller.handleOnClickTime();
		}
	},
	handleReset: function() {
		model.state.ready();
		controller.pause();
		model.initializate();
		controller.displayTime();
	},
	handleOnClickTime: function() {
		switch (model.state.get()) {
		case "ready":
			controller.startCountdown();
			model.state.launched();
			break;
		case "launched":
			controller.pause();
			model.state.pause();
			break;
		case "pause":
			controller.startCountdown();
			model.state.launched();
			break;
		case "timeout":
			model.state.ready();
			view.audio.pause();
			controller.handleReset();
			break;
		}
	},
  handleSelectInterval: function() {
		
	}
};

function Main() {
	window.onload = controller.initializate;
}
Main();