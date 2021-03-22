'use strict'

let alphabet = ["A", "B", "C", "D", "E", "F", "G"];
let doc = { //alias
	crt : function(arg) {
		return document.createElement(arg);
	},
}
function Stand() {
	this.divOuter = doc.crt("div");
	this.divOuter.id = "outer";
	this.divInner = doc.crt("div");
	this.divInner.id = "inner";
	this.divOuter.appendChild(this.divInner);
};

let view = {
	Field: function(id, col, row) {
		this.table = doc.crt("table");
		this.table.id = id;
		this.table.setAttribute("class", "field");
		this.tbody = doc.crt("tbody");
		this.trList = [doc.crt("tr")];
		this.td = doc.crt("td");
		this.table.appendChild(this.tbody);
		this.tbody.appendChild(this.trList[0]);

		for(let count = -1; count < col; count++) {
			this.td.setAttribute("number", "0" + count.toString());
			this.trList[0].appendChild(this.td);
			this.td = doc.crt("td");
		}

		for(let count = 1; count <= row; count++) {
			this.trList.push(this.trList[0].cloneNode(true));
			[].forEach.call(this.trList[count].children, function(td) {
				td.setAttribute("number", count + td.getAttribute("number")[1]);
			});
			this.tbody.appendChild(this.trList[count]);
		}
		let trLast = this.trList.pop();
		for(let index = 1, number = 0; index<trLast.children.length;){
			trLast.children[index++].innerHTML = "<span>" +
																					 (number++).toString() +
																					 "</span>";
		}
		this.trList[0].children[0].innerHTML = "<span>A</span>";
		for(let index = 1; index<alphabet.length;){
			this.trList[index].children[0].innerHTML = "<span>" +
																					 (alphabet[index++]).toString() +
																					 "</span>";
		}
	},
	stand: null,
	fields: [],
	target: null,
	displayMessage: function(msg) {
		//let messageArea = document.getElementById("messageArea");
		this.progressLog.innerHTML = msg;
	},
	setTarget: function(field, location) {
		this.target = field.querySelector('td[number="' + location +'"]');
	},
	displayShip: function() {
		this.target.setAttribute("class", "ship");
	},
	displayHit: function() {
		this.target.setAttribute("class", "hit");
	},
	displayMiss: function() {
		this.target.setAttribute("class", "miss");
	},
	displayStand: function(content) {
		view.stand = new Stand();
		if (typeof(content) === "string") {
			view.stand.divInner.classList.add(content.toLowerCase());
			view.stand.divInner.innerHTML = content;
			console.log("LLL");
		}else {
		view.stand.divInner.appendChild(content)
		}
		document.body.appendChild(view.stand.divOuter);
		// setTimeout(function() {
		// 	document.body.removeChild(stand);
		// }, 3000);
	},
	initial: function() {
		this.initialStand = doc.crt("div");
		this.initialStand.classList.add("stand");
		let button = doc.crt("div");
		button.classList.add("button");
		button.id = "start_game";
		button.innerHTML = "НАЧАТЬ ИГРУ";
		this.initialStand.appendChild(button);
		return this.initialStand;
	},
	displayBoard: function() {
		this.board = doc.crt("div");
		this.board.id = "board";
		this.progressLog = doc.crt("div");
		this.progressLog.id = "messageArea";
		let form = doc.crt("form");
		this.guessInput = doc.crt("input");
		this.guessInput.id = "guessInput";
		this.guessInput.setAttribute("type", "text");
		this.guessInput.setAttribute("placeholder", "A0");
		this.fireButton = doc.crt("input");
		this.fireButton.id = "fireButton";
		this.fireButton.value = "Fire!";
		this.fireButton.setAttribute("type", "button");
		form.appendChild(this.guessInput);
		form.appendChild(this.fireButton);
		this.board.appendChild(this.progressLog);
		this.board.appendChild(form);
		document.body.appendChild(this.board);
	},
	displayFields: function() {
		this.fields.push( new view.Field("playing_field_user", model.boardSize, model.boardSize));
		this.fields.push( new view.Field("playing_field", model.boardSize, model.boardSize));
		this.board.appendChild(this.fields[0].table);
		this.board.appendChild(this.fields[1].table);
	},
	soundShot: function() {
		let audio = new Audio();
		audio.src = "audio/93834_1386366-lq.mp3";
		audio.autoplay = true;
	},
	soundSea: function() {
		let audio = new Audio();
		audio.volume = 0.25;
		audio.src = "audio/mp3_47075.mp3";
		audio.autoplay = true;
		audio.preload = true;
		audio.loop = true;
	},
	bindHandlers: function() {
		this.fireButton.onclick = controller.handleFireButton;
		view.guessInput.onkeypress = controller.handleKeyPress;
		let trListUser = this.fields[1].trList;
		for (let indexRow = 0, indexCol = 1; indexRow !== 7 && indexCol !== 8; ){
			let td = trListUser[indexRow].children[indexCol++];
			td.addEventListener("mouseover",
			controller.handleSelectedCoor);
			if (indexCol === 8) {
				indexRow++;
				indexCol = 1;
			}
		}
	},
	initialStand: null,
	board: null,
	progressLog: null,
	guessInput: null,
	fireButton: null,
}

let model = {
	boardSize: 7,
	numShips: 3,
	shipLength: 4,
	playerNames: ["User", "AI"],
	players: [],
	getRandomInt: function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},
	Ship : function() {
		this.locations = [];
		this.hits = [];

		for(let index = 0; index< model.shipLength; index++) {
			this.locations.push(0);
			this.hits.push(false);
		};

		this.isLocatedOn = function(location) {
			return (this.locations.indexOf(location) >= 0);
		};
		this.hitting = function(location) {
			this.hits[this.locations.indexOf(location)]=true;
		};
		this.isSunk = function() {
			let hit = false;
			for(let index = 0; index < this.hits.length; index++) {
				hit = this.hits[index];
				if (!hit) return hit;
			}
			return true;
		};
	},

	Player : function(name, field) {
		this.name = name;
		this.guessingResult = {
			hit: false,
			isSunk: false
		};
		this.shipsSunk = 0;
		this.ships = [];
		for(let index = 0; index < model.numShips; index++) {
			this.ships.push(new model.Ship());
		};
		this.guesses = 0;
		this.field = field;
		this.fire = function(attacked, guess) {
			this.guesses++;
			let ship;
			for (let index=0; index< model.numShips; index++) {
				ship = attacked.ships[index];
				if (ship.isLocatedOn(guess)) {
					this.guessingResult.hit = true;
					index = model.numShips;
					ship.hitting(guess);
					if (ship.isSunk()) {
						this.guessingResult.isSunk = true;
						attacked.shipsSunk++;
					}
				} else {
					this.guessingResult.hit = false;
					this.guessingResult.isSunk = false;
				}
			}
		return this.guessingResult;
		};
	},

	createPlayers: function() {
		for (let index = 0; index < model.playerNames.length; index++) {
			this.players.push(new this.Player(model.playerNames[index],
														view.fields[index].table));
		}
	},
	AI: {
		letters : ["a", "b", "c", "d", "e", "f", "g"],
		currentGuess : null,
		guesses : function() {
			let result = model.players[1].guessingResult;
			let field = {
				locations : [],
				create_locations : function() {
					let row_ = 0;
					let col_ = -1;
					let val_ = 1;
					for(let index = 0; index < 49; index++) {
						col_++;
						if ((index+1)%model.shipLength === 0) val_ = 1
						else val_ = 0;
						if (col_ === model.boardSize) {
							row_++;
							col_ = 0;
						}
						this.locations.push({ row : row_,
											  col : col_,
											  val : val_});
					}
				},
				addRelevant: function(row, col, val) {
					let loc = this.locations.find(function(element, index, array) {
						if (element.row === row && element.col === col) {
							element.val = element.val + val;
							return true;
						}
						return false;
					});
				},
				getRelevantLoc: function() {
					this.locations.sort(function(locA, locB) {
							if (locA.val < locB.val) {
								return 1;
							} else if (locA.val === locB.val) {
								return 0;
							} else {
								return -1;
							}
					});
					return this.locations.shift();
				},
			};
			let row = -1;
			let col = -1;
			field.create_locations();
			return function() {
				if (result.hit && !result.isSunk) {
					field.addRelevant(row-1,col, 2);
					field.addRelevant(row, col-1, 2);
					field.addRelevant(row+1, col, 2);
					field.addRelevant(row, col+1, 2);
				}
				let loc = field.getRelevantLoc();
				loc.val--;
				row = loc.row;
				col = loc.col;
				return model.AI.letters[row] + col
			}
		},
	},

	generateShipLocations: function(player) {
		let locations;
		for (let index=0; index < this.numShips; index++) {
			do {
				locations = this.generateShip();
			} while (this.collision(locations, player));
			player.ships[index].locations = locations;
		}
	},

	generateShip: function() {
		let direction = Math.floor(Math.random()*2);
		let row, col;

		if (direction === 1) {
			row = Math.floor(Math.random() * this.boardSize);
			col = Math.floor(Math.random() * (this.boardSize - this.shipLength));
		} else {
			row = Math.floor(Math.random() * (this.boardSize - this.shipLength));
			col = Math.floor(Math.random() * this.boardSize);
		}

		let newShipLocations = [];
		for (let count = 0; count < this.shipLength; count++) {
			if (direction ===1) {
				newShipLocations.push(row +"" + (col+count));
			}else{
				newShipLocations.push((row+count)+ "" +col);
			}
		}
		return newShipLocations;
	},

	collision: function(locations, player) {
		for (let index = 0; index<this.numShips; index++) {
			let ship = player.ships[index];
			for (let index_loc = 0; index_loc<locations.length; index_loc++) {
				if (ship.locations.indexOf(locations[index_loc]) >=0) {
					return true;
				}
			}
		}
		return false;
	},
	displayUserShips: function() {
		let counterShips = 0;
		let counterSection = 0;
		let total = model.numShips*model.shipLength;

		for( let index = 0; index< total;index++) {
			if (counterSection === model.shipLength) {
				counterSection = 0;
				counterShips++;
			}
			view.setTarget(view.fields[0].table,
				model.players[0].ships[counterShips].locations[counterSection]);
			view.displayShip();
			counterSection++;
		}
	}
};

let controller = {
	processGuess: function(attacking, attacked, guess) {
		let location = this.parseGuess(guess);
		if (location) {
			view.setTarget(attacked.field, location);
			let result = attacking.fire(attacked, location);
			view.soundShot();
			if (result.hit) {
				view.displayHit();
				if (result.isSunk) {
					view.displayMessage(attacked.name + " lost ship.");
					if (result.hit && attacked.shipsSunk === model.numShips) {
						return true;
					}
				}
			} else {
				 view.displayMiss();
				 view.displayMessage(attacking.name + " misses.");
			}
		}
		return false;
		},
	parseGuess: function(guess) {
		if ((guess === null) || !(guess.length === 2)) {
			alert("Oops, please enter a letter and a number on the board");
			return null;
		}

		let row = alphabet.indexOf(guess.charAt(0).toUpperCase());
		let column = guess.charAt(1);

		if (isNaN(row) || isNaN(column)) {
			alert("Oops, that isn't on the board." );
		} else if (row<0 || row > model.boardSize ||
							 column < 0 || column >= model.boardSize) {
			alert("Oops, that's off the board!");
		} else {
			return row + column
		}
	return null;
	},

	initialize: function() {
		view.displayStand(view.initial());
		view.soundSea();
		view.initialStand.children[0].addEventListener("click",
		controller.handleStartGame);
	},
	handleStartGame : function() {
		view.stand.divOuter.remove();
		view.displayBoard();
		view.guessInput = document.getElementById("guessInput");
		view.displayFields();
		view.bindHandlers();
		model.createPlayers();
		model.generateShipLocations(model.players[0]);
		model.generateShipLocations(model.players[1]);
		model.displayUserShips(); //Включает отображение пользовательских кораблей
		model.AI.currentGuess = model.AI.guesses(); //Создаёт AI
	},
	handleFireButton : function() {
		let guess = view.guessInput.value;
		guessInput.value = "";
		setTimeout(function() {
			if (controller.processGuess(model.players[0],
																	model.players[1],
																	guess)) {
				view.displayStand("VICTORY");
				return;
			}
			setTimeout(function() {
				if (controller.processGuess(model.players[1],
																		model.players[0],
																		model.AI.currentGuess())) {
					view.displayStand("DEFEAT");
				}
			}, model.getRandomInt(1000, 3000));
		}, 250);
	},
	handleKeyPress : function(e) {
		let fireButton = document.getElementById("fireButton");
		if (e.keyCode === 13) {
			fireButton.click();
			return false;
		}
	},
	handleSelectedCoor : function(eventObject) {
		let td = eventObject.target;
		if ((td.classList.contains("miss")) ||
				(td.classList.contains("hit"))) return null

		let coordinate = td.getAttribute("number");
		view.guessInput.value =  alphabet[coordinate.charAt(0)] +
														 coordinate.charAt(1);
		td.classList.add("selected_cell");
		td.addEventListener("click", controller.handleFireButton);
		td.addEventListener("mouseout", controller.handleClearCoor);
	},
	handleClearCoor : function(eventObject) {
		let td = eventObject.target;
		view.guessInput.value = "";
		td.classList.remove("selected_cell");
		td.removeEventListener("click", controller.handleFireButton);
		td.removeEventListener("mouseout", controller.handleFireButton);
	}
};

function Main() {
	window.onload = controller.initialize;
}

Main();
