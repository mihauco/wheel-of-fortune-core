import Player from "./types/Player.type"
import Round from "./types/Round.type"
import WordPuzzle from "./types/WordPuzzle.type"
import GameState from "./types/GameState.type"
import Wheel from "./types/Wheel.type"
import PlayerMove from "./types/PlayerMove.type"
import WheelField from "./types/WheelField.type"
import { h } from "vue"

type GuessPayload = {
  guess: string
}

type SpinPayload = {
  successfullSpinProbability: number
}

class WheelOfFortune {
  private players: [Player, Player, ...Player[]]
  private rounds: [Round, Round, Round, Round, Round]
  private currentPlayerIndex: number
  private currentPlayerPossibleMoves: PlayerMove[]
  private currentRoundIndex: 0 | 1 | 2 | 3 | 4
  private isFinished: boolean
  private pointsToWin: number = 0
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

  constructor(
    playerNames: [string, string, ...string[]],
    wordPuzzleDictionary: WordPuzzle[],
    wheel?: Wheel
  ) {
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

  makeMove(playerIndex: number, move: 'SPIN', payload: {successfullSpinProbability: number}): number;
  makeMove(playerIndex: number, move: 'GUESS_CONSONANT', payload: {guess: string}): number;
  makeMove(playerIndex: number, move: 'BUY_VOWEL', payload: {guess: string}): any;
  makeMove(playerIndex: number, move: 'SOLVE', payload: {guess: string}): any;
  makeMove(playerIndex: number, move: 'PASS'): any;
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
          } else if (field === 'BANKRUPT') {
            this.players[playerIndex].points = 0
            this.currentPlayerPossibleMoves = []
          } else if (field === 'PRIZE') {
            this.currentPlayerPossibleMoves = [ 'GUESS_CONSONANT', 'PASS' ]
          }
        }

        return fieldIndex
      }
      
      case 'GUESS_CONSONANT': {
        if (!payload?.guess || payload.guess.length !== 1 || !payload.guess.match(/[a-z]/i)) {
          throw new Error('Invalid consonant guess!')
        }

        if (this.rounds[this.currentRoundIndex].puzzle.word.toUpperCase().includes(payload.guess.toUpperCase())) {
          let hits = 0;
          this.rounds[this.currentRoundIndex].displayWord = this.rounds[this.currentRoundIndex].puzzle.word
            .split('')
            .map((char: string, index: number) => {
              if (char.toUpperCase() === payload.guess?.toUpperCase()) {
                hits += 1
                return this.rounds[this.currentRoundIndex].puzzle.word[index]
              }

              return this.rounds[this.currentRoundIndex].displayWord[index]
            })
            .join('')

          this.currentPlayerPossibleMoves = [ 'SOLVE', 'BUY_VOWEL', 'PASS' ]

          if (this.pointsToWin > 0) {
            this.players[playerIndex].points += this.pointsToWin * hits
            this.pointsToWin = 0
          }

          return hits
        } else {
          this.currentPlayerPossibleMoves = []
        }

        this.pointsToWin = 0
        return 0
      }

      case 'BUY_VOWEL': {
        if (!payload?.guess || payload.guess.length !== 1 || !payload.guess.match(/[aeiouy]/i)) {
          throw new Error('Invalid vowel guess!')
        }

        if (this.rounds[this.currentRoundIndex].puzzle.word.toUpperCase().includes(payload.guess.toUpperCase())) {
          this.rounds[this.currentRoundIndex].displayWord = this.rounds[this.currentRoundIndex].puzzle.word
            .split('')
            .map((char: string, index: number) => {
              if (char === payload.guess?.toUpperCase()) {
                return this.rounds[this.currentRoundIndex].puzzle.word[index]
              }

              return this.rounds[this.currentRoundIndex].displayWord[index]
            })
            .join('')

          this.currentPlayerPossibleMoves = [ 'SOLVE', 'BUY_VOWEL', 'PASS' ]
        } else {
          this.currentPlayerPossibleMoves = []
        }

        this.pointsToWin = 0
        return {}
      }

      case 'SOLVE': {
        if (!payload?.guess) {
          throw new Error('Guess can\'t be empty!')
        }

        if (payload.guess.toUpperCase() === this.rounds[this.currentRoundIndex].puzzle.word.toUpperCase()) {
          this.rounds[this.currentRoundIndex].displayWord = this.rounds[this.currentRoundIndex].puzzle.word
          this.rounds[this.currentRoundIndex].isFinished = true
          this.endRound()
        } else {
          this.currentPlayerPossibleMoves = []
        }

        this.pointsToWin = 0
        return {}
      }
    }
  }
}

export default WheelOfFortune