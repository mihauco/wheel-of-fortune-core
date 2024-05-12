import Player from "./types/Player.type"
import Round from "./types/Round.type"
import WordPuzzle from "./types/WordPuzzle.type"
import GameState from "./types/GameState.type"
import Wheel from "./types/Wheel.type"
import PlayerMove from "./types/PlayerMove.type"
import WheelField from "./types/WheelField.type"

class WheelOfFortune {
  private players: [Player, Player, ...Player[]]
  private rounds: [Round, Round, Round, Round, Round]
  private currentPlayerIndex: number
  private currentPlayerPossibleMoves: PlayerMove[]
  private currentRoundIndex: 0 | 1 | 2 | 3 | 4
  private isFinished: boolean
  private vowelPrice: number = 1000

  private wheel: Wheel = [
    0,
    25,
    50,
    75,
    100,
    150,
    200,
    250,
    300,
    350,
    400,
    450,
    500,
    1000,
    1500,
    2000,
    5000,
    'LOSE_TURN',
    'BANKRUPT',
    'PRIZE'
  ]

  constructor(playerNames: [string, string, ...string[]], wordPuzzleDictionary: WordPuzzle[]) {
    if (wordPuzzleDictionary.length < 5) {
      throw new Error('Wheel of Fortune requires dictionary of at least 5 word puzzles!')
    }

    this.players = this.createPlayers(playerNames)
    this.rounds = this.createRounds(wordPuzzleDictionary)
    this.currentPlayerIndex = 0
    this.currentPlayerPossibleMoves = ['SPIN']
    this.currentRoundIndex = 0
    this.isFinished = false
  }

  private createPlayers(playerNames: [string, string, ...string[]]): [Player, Player, ...Player[]] {
    const players: Player[] = playerNames
      .flatMap(name => {
        if (name) {
          return {
            name,
            points: 0,
            prizes: []
          }
        }

        return []
      })

    return players as [Player, Player, ...Player[]]
  }

  private createRounds(wordPuzzleDictionary: WordPuzzle[]): [Round, Round, Round, Round, Round] {
    const usedIndexes: number[] = []

    const rounds: Round[] = Array.from({ length: 5 }, (_, index) => {
      let wordPuzzleIndex: number = -1

      while (wordPuzzleIndex < 0) {
        const randomIndex = Math.floor(Math.random() * wordPuzzleDictionary.length)

        if (!usedIndexes.includes(randomIndex)) {
          wordPuzzleIndex = randomIndex
          usedIndexes.push(randomIndex)
        }
      }

      const wordPuzzle = wordPuzzleDictionary[wordPuzzleIndex]

      return {
        isFinished: false,
        winner: null,
        puzzle: wordPuzzle,
        displayWord: wordPuzzle.word.split('').map((char: string) => char === ' ' ? ' ' : '_').join(''),
        guesses: []
      }
    })

    return rounds as [Round, Round, Round, Round, Round]
  }

  private endTurn() {
    this.currentPlayerIndex = this.players.length - 1 === this.currentPlayerIndex ? 0 : this.currentPlayerIndex + 1
    this.currentPlayerPossibleMoves = ['SPIN']
  }

  private endRound() {
    // this.currentRound += 1
    // this.currentPlayer = 0
    // this.currentPlayerMove = 'SPIN'
  }

  private spinTheWheel(): WheelField {
    const randomIndex = Math.floor(Math.random() * this.wheel.length)
    return this.wheel[randomIndex]
  }

  private currentRoundPuzzleHasConosonants(): boolean {
    return !!this.rounds[this.currentRoundIndex].puzzle.word.match(/bcdfghjklmnprstwxz/i)
  }

  getState(): GameState {
    return {
      players: this.players,
      rounds: this.rounds,
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayerPossibleMoves: this.currentPlayerPossibleMoves,
      currentRoundIndex: this.currentRoundIndex,
      isFinished: this.isFinished,
      wheel: this.wheel
    }
  }

  makeMove(playerIndex: 0 | 1 | 2 | 3, move: PlayerMove, guess?: string): any {
    if (this.isFinished) {
      throw new Error('Game is finished!')
    }

    if (!this.players[playerIndex]) {
      throw new Error(`Player ${playerIndex} doesn't exist!`)
    }

    if (this.currentPlayerIndex !== playerIndex) {
      throw new Error(`It's not player ${playerIndex}'s turn!`)
    }

    if (!this.currentPlayerPossibleMoves.includes(move)) {
      throw new Error(`Player ${playerIndex} can't make move ${move}!`)
    }

    switch (move) {
      case 'SPIN': {
        const wheelField = this.spinTheWheel()

        if (typeof wheelField === 'number') {
          this.players[playerIndex].points += wheelField
          this.currentPlayerPossibleMoves = [ 'GUESS_CONSONANT' ]
        } else if (wheelField === 'LOSE_TURN') {
          this.currentPlayerPossibleMoves = []
        } else if (wheelField === 'BANKRUPT') {
          this.players[playerIndex].points = 0
          this.currentPlayerPossibleMoves = []
        } else if (wheelField === 'PRIZE') {
          this.currentPlayerPossibleMoves = [ 'GUESS_CONSONANT' ]
        }

        return {}
      }
      
      case 'GUESS_CONSONANT': {
        if (!guess || guess.length !== 1 || !guess.match(/[a-z]/i)) {
          throw new Error('Invalid consonant guess!')
        }

        if (this.rounds[this.currentRoundIndex].puzzle.word.toUpperCase().includes(guess.toUpperCase())) {
          this.rounds[this.currentRoundIndex].displayWord = this.rounds[this.currentRoundIndex].puzzle.word
            .split('')
            .map((char: string, index: number) => {
              if (char === guess.toUpperCase()) {
                return this.rounds[this.currentRoundIndex].puzzle.word[index]
              }

              return this.rounds[this.currentRoundIndex].displayWord[index]
            })
            .join('')

          this.currentPlayerPossibleMoves = [ 'GUESS_PUZZLE', 'BUY_VOWEL', 'PASS' ]
        } else {
          this.currentPlayerPossibleMoves = []
        }

        return {}
      }

      case 'GUESS_VOWEL': {
        if (!guess || guess.length !== 1 || !guess.match(/[aeiouy]/i)) {
          throw new Error('Invalid vowel guess!')
        }

        if (this.rounds[this.currentRoundIndex].puzzle.word.toUpperCase().includes(guess.toUpperCase())) {
          this.rounds[this.currentRoundIndex].displayWord = this.rounds[this.currentRoundIndex].puzzle.word
            .split('')
            .map((char: string, index: number) => {
              if (char === guess.toUpperCase()) {
                return this.rounds[this.currentRoundIndex].puzzle.word[index]
              }

              return this.rounds[this.currentRoundIndex].displayWord[index]
            })
            .join('')

          this.currentPlayerPossibleMoves = [ 'GUESS_PUZZLE', 'BUY_VOWEL', 'PASS' ]
        } else {
          this.currentPlayerPossibleMoves = []
        }

        return {}
      }

      case 'BUY_VOWEL': {
        if (!guess || guess.length !== 1 || !guess.match(/[aeiouy]/i)) {
          throw new Error('Invalid vowel guess!')
        }

        if (this.players[playerIndex].points < this.vowelPrice) {
          throw new Error('Not enough points to buy a vowel!')
        }

        this.players[playerIndex].points -= this.vowelPrice
        return this.makeMove(playerIndex, 'GUESS_VOWEL', guess)
      }

      case 'GUESS_PUZZLE': {
        if (!guess) {
          throw new Error('Guess can\'t be empty!')
        }

        if (guess.toUpperCase() === this.rounds[this.currentRoundIndex].puzzle.word.toUpperCase()) {
          this.rounds[this.currentRoundIndex].displayWord = this.rounds[this.currentRoundIndex].puzzle.word
          this.rounds[this.currentRoundIndex].isFinished = true
          this.endRound()
        } else {
          this.currentPlayerPossibleMoves = []
        }

        return {}
      }
    }
  }
}

export default WheelOfFortune