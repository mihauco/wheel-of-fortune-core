import Player from "./types/Player.type"
import Round from "./types/Round.type"
import WordPuzzle from "./types/WordPuzzle.type"
import GameState from "./types/GameState.type"
import Wheel from "./types/Wheel.type"
import PlayerMove from "./types/PlayerMove.type"
import WheelField from "./types/WheelField.type"
import { h } from "vue"


type Config = {
  playerNames: [string, string, ...string[]]
  wordPuzzleDictionary: WordPuzzle[]
  wheel?: Wheel,
  vowelPrice?: number
}

class WheelOfFortune {
  private players: [Player, Player, ...Player[]]
  private rounds: [Round, Round, Round, Round, Round]
  private currentPlayerIndex: number
  private currentPlayerPossibleMoves: PlayerMove[]
  private currentRoundIndex: 0 | 1 | 2 | 3 | 4
  private isFinished: boolean
  private pointsToWin: number = 0
  private vowelPrice: number = 10
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

  constructor({
    playerNames,
    wordPuzzleDictionary,
    wheel,
    vowelPrice
  }: Config) {
    if (wordPuzzleDictionary.length < 5) {
      throw new Error('Wheel of Fortune requires dictionary of at least 5 word puzzles!')
    }

    this.players = this.createPlayers(playerNames)
    this.rounds = this.createRounds(wordPuzzleDictionary)
    this.currentPlayerIndex = 0
    this.currentPlayerPossibleMoves = ['SPIN']
    this.currentRoundIndex = 0
    this.isFinished = false

    if (wheel) {
      this.wheel = wheel
    }

    if (vowelPrice) {
      this.vowelPrice = vowelPrice
    }
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

  private endRound(wonPlayerIndex: number) {
    this.rounds[this.currentRoundIndex].winner = wonPlayerIndex
    this.rounds[this.currentRoundIndex].isFinished = true

    if (this.currentRoundIndex === 4) {
      this.isFinished = true
    } else {
      this.currentRoundIndex += 1
      this.currentPlayerIndex = wonPlayerIndex
      this.currentPlayerPossibleMoves = ['SPIN']
    }
  }

  private spinTheWheel(successfullSpinProbability: number = 1): number | null {
    const successfullSpin = Math.random() < successfullSpinProbability

    if (successfullSpin) {
      return Math.floor(Math.random() * this.wheel.length)
    }

    return null
  }

  private currentRoundPuzzleHasConosonants(): boolean {
    return !!this.rounds[this.currentRoundIndex].puzzle.word.match(/bcdfghjklmnprstwxz/i)
  }

  private guessLetter(letter: string): number | null {
    if (this.rounds[this.currentRoundIndex].guesses.includes(letter)) {
      return null
    }

    this.rounds[this.currentRoundIndex].guesses.push(letter)

    let hits = 0;

    this.rounds[this.currentRoundIndex].displayWord = this.rounds[this.currentRoundIndex].puzzle.word
      .split('')
      .map((char: string, index: number) => {
        if (char.toUpperCase() === letter.toUpperCase()) {
          hits += 1
          return this.rounds[this.currentRoundIndex].puzzle.word[index]
        }

        return this.rounds[this.currentRoundIndex].displayWord[index]
      })
      .join('')

    return hits
  }

  getState(): GameState {
    return {
      players: this.players,
      rounds: this.rounds,
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayerPossibleMoves: this.currentPlayerPossibleMoves,
      currentRoundIndex: this.currentRoundIndex,
      isFinished: this.isFinished,
      wheel: this.wheel,
      vowelPrice: this.vowelPrice
    }
  }

  makeMove(playerIndex: number, move: 'SPIN', payload: {successfullSpinProbability: number}): number;
  makeMove(playerIndex: number, move: 'GUESS_CONSONANT', payload: {guess: string}): number | null;
  makeMove(playerIndex: number, move: 'BUY_VOWEL', payload: {guess: string}): number | null;
  makeMove(playerIndex: number, move: 'SOLVE', payload: {guess: string}): boolean;
  makeMove(playerIndex: number, move: 'PASS'): void;
  makeMove(playerIndex: number, move: PlayerMove, payload?: {successfullSpinProbability?: number, guess?: string}): any {
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
        const fieldIndex = this.spinTheWheel(payload?.successfullSpinProbability)
        
        if (fieldIndex !== null) {
          const field = this.wheel[fieldIndex]

          if (typeof field === 'number') {
            this.pointsToWin = field
            this.currentPlayerPossibleMoves = [ 'GUESS_CONSONANT', 'PASS' ]
          } else if (field === 'LOSE_TURN') {
            this.currentPlayerPossibleMoves = []
            this.endTurn()
          } else if (field === 'BANKRUPT') {
            this.players[playerIndex].points = 0
            this.currentPlayerPossibleMoves = []
            this.endTurn()
          } else if (field === 'PRIZE') {
            this.currentPlayerPossibleMoves = [ 'GUESS_CONSONANT', 'PASS' ]
          }
        } else {
          this.currentPlayerPossibleMoves = []
          this.endTurn()
        }

        return fieldIndex
      }
      
      case 'GUESS_CONSONANT': {
        if (!payload?.guess || payload.guess.length !== 1 || !payload.guess.match(/[bcćdfghjklłmnńprsśtwxzźż]/i)) {
          throw new Error('Invalid consonant guess!')
        }

        const hits = this.guessLetter(payload.guess)

        if (hits === null) return null
          
        if (hits > 0) {
          this.currentPlayerPossibleMoves = [ 'SPIN', 'SOLVE', 'BUY_VOWEL', 'PASS' ]

          if (this.pointsToWin > 0) {
            this.players[playerIndex].points += this.pointsToWin * hits
            this.pointsToWin = 0
          }

          return hits
        }
        
        this.currentPlayerPossibleMoves = []
        this.pointsToWin = 0
        this.endTurn()
        return 0
      }

      case 'BUY_VOWEL': {
        if (!payload?.guess || payload.guess.length !== 1 || !payload.guess.match(/[aąeęioóuy]/i)) {
          throw new Error('Invalid vowel guess!')
        }

        if (this.players[playerIndex].points < this.vowelPrice) {
          throw new Error('Not enough points to buy a vowel!')
        }

        this.players[playerIndex].points -= this.vowelPrice

        const hits = this.guessLetter(payload.guess)

        if (hits === null) return null

        if (hits > 0) {
          this.currentPlayerPossibleMoves = [ 'SPIN', 'SOLVE', 'BUY_VOWEL', 'PASS' ]
          return hits
        }
        
        this.currentPlayerPossibleMoves = []
        this.endTurn()
        return 0
      }

      case 'SOLVE': {
        if (!payload?.guess) {
          throw new Error('Guess can\'t be empty!')
        }

        let correctGuess = false

        if (payload.guess.toUpperCase() === this.rounds[this.currentRoundIndex].puzzle.word.toUpperCase()) {
          this.rounds[this.currentRoundIndex].displayWord = this.rounds[this.currentRoundIndex].puzzle.word
          this.rounds[this.currentRoundIndex].isFinished = true
          correctGuess = true
          this.endRound(playerIndex)
        }

        this.currentPlayerPossibleMoves = []
        this.pointsToWin = 0
        this.endTurn()
        return correctGuess
      }

      case 'PASS': {
        this.endTurn()
        return
      }
    }
  }
}

export default WheelOfFortune