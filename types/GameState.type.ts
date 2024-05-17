import Player from "./Player.type"
import Round from "./Round.type"
import PlayerMove from "./PlayerMove.type"
import Wheel from "./Wheel.type"

type GameState = {
  players: [Player, Player, ...Player[]]
  rounds: [Round, Round, Round, Round, Round]
  currentPlayerIndex: number
  currentPlayerPossibleMoves: PlayerMove[]
  currentRoundIndex: 0 | 1 | 2 | 3 | 4
  isFinished: boolean
  wheel: Wheel,
  vowelPrice: number
}

export default GameState