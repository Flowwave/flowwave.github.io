//
// API : https://awesome-chess.herokuapp.com/
// https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
//

var canvas = document.getElementById("canvas")

var mouseX = 0
var mouseY = 0
var mouseClick = false

var requestResult = {}
var busy = true

var checkmate = false
var currentPiece = null
var currentPieceIndex = null
var spellSelected = null

var char = ["a", "b", "c", "d", "e", "f", "g", "h"]

var nextSpell = 1
var spells = []

class Spell {
	constructor(_description, _place, _type, _icon) {
		this.description = _description // description
		this.place = _place // placement rules
		this.spawnType = _type // things to spawn
		this.icon = _icon // spell icon
	}
}

// Spell Definition
var spellData = {
	"Fortify": new Spell("Summon a Rook next to any of your pieces", "next", "R", "https://static.wikia.nocookie.net/onestepfromeden_gamepedia_en/images/1/11/ShieldsUp.png/revision/latest/scale-to-width-down/64?cb=20200502092813"),
	"Blink": new Spell("Teleport your King to any empty space", "empty", "K", "https://static.wikia.nocookie.net/onestepfromeden_gamepedia_en/images/1/16/Blink.png/revision/latest/scale-to-width-down/64?cb=20200501001000"),
	"Metamorphisis": new Spell("Morph any of your Pawns into a Knight", "P", "N", "https://static.wikia.nocookie.net/onestepfromeden_gamepedia_en/images/2/26/Anubis.png/revision/latest/scale-to-width-down/64?cb=20200430193912"),
	"Backstab": new Spell("Turn any Black Pawn White", "p", "P", "https://static.wikia.nocookie.net/onestepfromeden_gamepedia_en/images/7/7a/Backstab.png/revision/latest/scale-to-width-down/64?cb=20200430194017"),
	"Backup Request": new Spell("Summon a White Pawn on any empty space", "empty", "P", "https://static.wikia.nocookie.net/onestepfromeden_gamepedia_en/images/1/1d/ManaFusion.png/revision/latest/scale-to-width-down/64?cb=20200502131107"),
	"Devine Intervention": new Spell("Turn ANY Pawn into a White Bishop", "pP", "B", "https://static.wikia.nocookie.net/onestepfromeden_gamepedia_en/images/8/8a/HolyGround.png/revision/latest/scale-to-width-down/64?cb=20201226222638"),
	"Snipe": new Spell("Kill any piece infront of your rook", "rookSight", null, "https://static.wikia.nocookie.net/onestepfromeden_gamepedia_en/images/1/1e/BowSnipe.png/revision/latest/scale-to-width-down/64?cb=20200501122509"),
	"Combust": new Spell("Kill any Pawn", "pP", null, "https://static.wikia.nocookie.net/onestepfromeden_gamepedia_en/images/e/e7/Combust.png/revision/latest/scale-to-width-down/64?cb=20200501130509"),
	"Shadow Queen": new Spell("Summon a White Queen below any Black Peice", "belowEnemy", "Q", "https://static.wikia.nocookie.net/onestepfromeden_gamepedia_en/images/2/22/ShadowShift.png/revision/latest/scale-to-width-down/64?cb=20201226222747"),
	"Cripple": new Spell("Turn any Black Knight into a Black Pawn", "n", "p", "https://static.wikia.nocookie.net/onestepfromeden_gamepedia_en/images/c/cf/Pinch.png/revision/latest/scale-to-width-down/64?cb=20200502140202"),
	"Guillotine": new Spell("Kill any piece next to one of your pieces", "next", null, "https://static.wikia.nocookie.net/onestepfromeden_gamepedia_en/images/6/61/Guillotine.png/revision/latest/scale-to-width-down/64?cb=20200502114718"),
}



class Board {
	constructor() {
		this.spaces = []
		this.currentTurn = "w"
		for (let _i = 0; _i < 64; _i++) {
			this.spaces.push(null)
		}

		// filling board
		this.PlacePieceMirrored(0, 0, "R")
		this.PlacePieceMirrored(1, 0, "N")
		this.PlacePieceMirrored(2, 0, "B")
		this.PlacePieceMirrored(7, 0, "R")
		this.PlacePieceMirrored(6, 0, "N")
		this.PlacePieceMirrored(5, 0, "B")

		for (let _i = 0; _i < 8; _i++) {
			this.PlacePieceMirrored(_i, 1, "p")
		}
		this.PlacePieceMirrored(3, 0, "Q")
		this.PlacePieceMirrored(4, 0, "K")
	}

	PlacePiece(_x, _y, _p) {
		this.spaces[_x + _y * 8] = _p
	}
	PlacePieceMirrored(_x, _y, _p) {
		this.PlacePiece(_x, _y, _p.toLowerCase())
		this.PlacePiece(_x, 7 - _y, _p.toUpperCase())

	}

	// fen string = defines what the current game state is in a string

	ToFEN() {

		let _str = ""
		let _count = 0
		for (let _y = 0; _y < 8; _y++) {
			for (let _x = 0; _x < 8; _x++) {
				let _ind = _x + _y * 8

				if (this.spaces[_ind] == null) {
					_count += 1
				} else {
					if (_count != 0) {
						_str += _count
						_count = 0
					}
					_str += this.spaces[_ind]
				}
			}
			if (_count != 0) {
				_str += _count
				_count = 0
			}
			if (_y < 7) {


				_str += "%2F" // slash
			}
		}
		_str += "+"
		_str += this.currentTurn
		_str += "+KQkq" // casteling
		_str += "+-" // en passant disabled
		_str += "+1+2"

		return _str
		// https://awesome-chess.herokuapp.com/game/temp?fen=rnbqkbnr%2Fpppppppp%2F8%2F8%2F8%2F8%2FPPPPPPPP%2FRNBQKBNR+w+KQkq+-+0+1&move=&format=json
		//    https://awesome-chess.herokuapp.com/game/temp?fen=
		// -> rnbqkbnr%2Fpppppppp%2F8%2F8%2F8%2F8%2FPPPPPPPP%2FRNBQKBNR+w+KQkq+-+0+1
		//    &move=&format=json
	}

	Request() {
		busy = true
		let _fen = board.ToFEN()
		var request = new XMLHttpRequest();
		let _title = document.getElementById("title")
		_title.textContent = "Thinking..."
		console.log('https://awesome-chess.herokuapp.com/game/temp?fen=' + _fen + '&move=&format=json')
		request.open('GET', 'https://awesome-chess.herokuapp.com/game/temp?fen=' + _fen + '&move=&format=json')
		request.send();
		request.onload = () => {
			if (request.status == 500) {
				_title.textContent = "Internal server error, Try again later"
				return
			}
			_title.textContent = "Playing..."

			requestResult = (JSON.parse(request.response));
			busy = false
			if (requestResult["isCheckmate"]) {
				checkmate = true
				if (this.currentTurn == "w") {
					document.getElementById('title').textContent = "You Lose!"
				} else {
					document.getElementById('title').textContent = "You Won!"

				}
			}
			if (board.currentTurn == "b") {
				board.Move(requestResult["turn"]["bestMove"])
				nextSpell -= 1
				if (nextSpell <= 0) {
					nextSpell = 4;
					let _all = Object.keys(spellData);
					board.AddSpell(_all[Math.floor(Math.random() * _all.length)])
				}

				document.getElementById("spellTitle").innerText = "Spells: (next in " + nextSpell + ")"
			}
		}
	}

	Draw() {
		let _tileSize = 500.0 / 8.0
		let _hoverX = Math.floor(mouseX / _tileSize)
		let _hoverY = Math.floor(mouseY / _tileSize)
		let _context = canvas.getContext("2d")
		let _targetSpots = []

		let _circle = document.getElementById("circle")

		if (spellSelected != null) { // Show spell placement positions when a spell is selected
			currentPiece = null
			for (let _i = 0; _i < 64; _i++) {
				if (board.spaces[_i] != null) {
					if (spellData[spellSelected].place == "rookSight") {
						if (board.spaces[_i] == "R") {
							for (let _n = 0; _n < 8; _n++) {
								_targetSpots.push(board.IndexToPos(_i + 8 * _n))
								_targetSpots.push(board.IndexToPos(_i - 8 * _n))
							}
						}
					}
					if (spellData[spellSelected].place == "next") {
						if (board.spaces[_i].toUpperCase() == board.spaces[_i]) {
							_targetSpots.push(board.IndexToPos(_i + 1))
							_targetSpots.push(board.IndexToPos(_i - 1))
							_targetSpots.push(board.IndexToPos(_i + 8))
							_targetSpots.push(board.IndexToPos(_i - 8))
						}
					}
					if (spellData[spellSelected].place == "belowEnemy") {
						if (board.spaces[_i].toLowerCase() == board.spaces[_i]) {
							_targetSpots.push(board.IndexToPos(_i + 8))
						}
					}
					if (spellData[spellSelected].place == board.spaces[_i]) {
						_targetSpots.push(board.IndexToPos(_i))
					}
					if (spellData[spellSelected].place == "pP" && board.spaces[_i].toLowerCase() == "p") {
						_targetSpots.push(board.IndexToPos(_i))

					}
				} else {
					if (spellData[spellSelected].place == "empty") {
						_targetSpots.push(board.IndexToPos(_i))

					}
				}

			}
		}


		if (currentPiece != null) { // Show potential piece moves when moving one
			for (let _i = 0; _i < requestResult["turn"]["legalMoves"].length; _i++) {
				let _move = requestResult["turn"]["legalMoves"][_i]
				if (_move.substring(0, 2) == currentPiece) {
					_targetSpots.push(_move.substring(2, 4))
				}
			}
		}


		for (let _i = 0; _i < 8; _i++) { // Drawing the actual board and piece manipulation
			for (let _j = 0; _j < 8; _j++) {
				let _index = _i + _j * 8
				let _spaceName = board.IndexToPos(_index)


				_context.fillStyle = "#EEEED2"

				if (((_i + _j) % 2) == 1) {
					_context.fillStyle = "#769656"
					if (checkmate) {
						_context.fillStyle = "#965676"
					}
					if (spellSelected) {
						_context.fillStyle = "#5E6BFF"
					}
				}


				if (_i == _hoverX && _j == _hoverY) {
					_context.fillStyle = "#969656" // highlight hovered

					if (_targetSpots.includes(_spaceName)) {
						if (currentPiece != null) {
							if (!mouseClick) {
								// let go on valid target spot
								board.Move(currentPiece + _spaceName)

							}
						}
					}

				}

				_context.fillRect(_i * _tileSize, _j * _tileSize, _tileSize, _tileSize)

				let _piece = ""
				if (board.spaces[_index] != undefined) { // if there is a piece there
					_piece = board.spaces[_index]

					let _team = "w"
					if (_piece == _piece.toLowerCase()) {
						_team = "b"
					}

					if (mouseClick) {
						if (currentPiece == null && spellSelected == null) {
							if (_hoverX == _i && _hoverY == _j) {
								currentPiece = _spaceName
								currentPieceIndex = _index
							}
						}
					}

					let _type = _team + _piece.toLowerCase()

					let _img = new Image();
					_img.src = "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/" + _type + ".png" // steal image

					_context.drawImage(_img, _i * _tileSize, _j * _tileSize, _tileSize, _tileSize)
				}

				if (_targetSpots.includes(_spaceName)) {
					if (_piece.toLowerCase() != "k") { // dont cast spells on kings
						_context.drawImage(_circle, _i * _tileSize, _j * _tileSize, _tileSize, _tileSize)
						if (spellSelected != null) {
							if (_hoverX == _i && _hoverY == _j) {
								if (mouseClick) {
									if (spellData[spellSelected].spawnType == "K") {
										for (let _c = 0; _c < 64; _c++) {
											if (board.spaces[_c] == "K") {
												board.spaces[_c] = null
												break
											}
										}
									}
									board.spaces[_index] = spellData[spellSelected].spawnType
									board.currentTurn = "b"
									board.RemoveSpell(spellSelected)
									spellSelected = null
									board.Request()
								}
							}
						}
					}
				}
			}
		}

		if (!mouseClick) {
			currentPiece = null;
		}
	}

	Move(_move) {
		let _from = _move.substring(0, 2)
		let _to = _move.substring(2, 4)
		let _fromIndex = board.PosToIndex(_from)
		let _toIndex = board.PosToIndex(_to)

		if (board.currentTurn == "w") {
			board.currentTurn = "b"
		} else {
			board.currentTurn = "w"
		}
		currentPiece = null
		board.spaces[_toIndex] = board.spaces[_fromIndex]
		board.spaces[_fromIndex] = null
		board.Request()

	}

	ReadySpell(_spell) {
		if (this.currentTurn == "w") {
			if (spellSelected == _spell) {
				spellSelected = null
				return
			}
			spellSelected = _spell
		}
	}

	PosToIndex(_pos) {
		return char.indexOf(_pos.substring(0, 1)) + (8 - parseInt(_pos.substring(1, 2))) * 8
	}
	IndexToPos(_pos) {
		return char[_pos % 8] + (8 - Math.floor(_pos / 8))
	}
	AddSpell(_name) {
		spells.push(_name)
		board.UpdateSpellList()
	}
	RemoveSpell(_name) {
		for (let _i = 0; _i < spells.length; _i++) {
			if (spells[_i] == _name) {
				spells.splice(_i, 1);
			}
		}
		board.UpdateSpellList()
	}
	UpdateSpellList() {
		const _element = document.getElementById("spells");
		_element.innerHTML = ''
		for (let _i = 0; _i < spells.length; _i++) {
			let _spell = spells[_i];
			_element.innerHTML += '<spell onclick="board.ReadySpell(\'' + _spell + '\')"><img src=' + spellData[_spell].icon + '><p><b>' + _spell + '</b><br>' + spellData[_spell].description + '</p></spell>'
		}
	}
}

var board = new Board();

// input
canvas.addEventListener('mousemove', function (event) {
	var rect = canvas.getBoundingClientRect();
	mouseX = event.clientX - rect.left
	mouseY = event.clientY - rect.top
})
canvas.addEventListener('mousedown', function (event) {
	mouseClick = true
})
canvas.addEventListener('mouseup', function (event) {
	mouseClick = false
})

window.setInterval(board.Draw, 16)

// start
board.Request()
board.UpdateSpellList()