import WordPuzzle from "./WordPuzzle.type"

type Round = {
  isFinished: boolean
  winner: number | null
  puzzle: WordPuzzle
  displayWord: string
  guesses: string[]
}

export default Round