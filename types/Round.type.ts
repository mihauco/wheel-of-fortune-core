import WordPuzzle from "./WordPuzzle.type"

type Round = {
  isFinished: boolean
  winner: 0 | 1 | 2 | 3 | null
  puzzle: WordPuzzle
  displayWord: string
  guesses: string[]
}

export default Round