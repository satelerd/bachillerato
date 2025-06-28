"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shuffle, Lock, Play, RotateCcw } from "lucide-react"

const CATEGORIES = ["Nombre", "Apellido", "Animal", "Ciudad/País", "Comida", "Objeto", "Color", "Profesión"]

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

type CellStatus = "empty" | "incorrect" | "repeated" | "unique"
type GameRow = {
  id: number
  letter: string
  answers: string[]
  status: CellStatus[]
  locked: boolean
  points: number
}

export default function Component() {
  const [currentLetter, setCurrentLetter] = useState<string>("")
  const [gameRows, setGameRows] = useState<GameRow[]>([])
  const [totalPoints, setTotalPoints] = useState(0)

  const generateRandomLetter = () => {
    const randomLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)]
    setCurrentLetter(randomLetter)
  }

  const startNewRound = () => {
    if (!currentLetter) return

    const newRow: GameRow = {
      id: Date.now(),
      letter: currentLetter,
      answers: new Array(CATEGORIES.length).fill(""),
      status: new Array(CATEGORIES.length).fill("empty"),
      locked: false,
      points: 0,
    }

    setGameRows([...gameRows, newRow])
    setCurrentLetter("")
  }

  const updateAnswer = (rowId: number, categoryIndex: number, value: string) => {
    setGameRows((rows) =>
      rows.map((row) =>
        row.id === rowId && !row.locked
          ? {
              ...row,
              answers: row.answers.map((answer, idx) => (idx === categoryIndex ? value : answer)),
            }
          : row,
      ),
    )
  }

  const cycleStatus = (rowId: number, categoryIndex: number) => {
    setGameRows((rows) =>
      rows.map((row) => {
        if (row.id !== rowId || row.locked) return row

        const currentStatus = row.status[categoryIndex]
        const answer = row.answers[categoryIndex]

        let nextStatus: CellStatus
        if (!answer.trim()) {
          nextStatus = "empty"
        } else {
          switch (currentStatus) {
            case "empty":
              nextStatus = "incorrect"
              break
            case "incorrect":
              nextStatus = "repeated"
              break
            case "repeated":
              nextStatus = "unique"
              break
            case "unique":
              nextStatus = "incorrect"
              break
            default:
              nextStatus = "incorrect"
          }
        }

        return {
          ...row,
          status: row.status.map((status, idx) => (idx === categoryIndex ? nextStatus : status)),
        }
      }),
    )
  }

  const calculatePoints = (status: CellStatus[]): number => {
    return status.reduce((total, s) => {
      switch (s) {
        case "unique":
          return total + 100
        case "repeated":
          return total + 50
        default:
          return total
      }
    }, 0)
  }

  const lockRow = (rowId: number) => {
    setGameRows((rows) =>
      rows.map((row) => {
        if (row.id !== rowId) return row

        const points = calculatePoints(row.status)
        return {
          ...row,
          locked: true,
          points,
        }
      }),
    )

    // Recalcular puntos totales
    const newTotal = gameRows.reduce((total, row) => {
      if (row.id === rowId) {
        return total + calculatePoints(row.status)
      }
      return total + row.points
    }, 0)
    setTotalPoints(newTotal)
  }

  const unlockRow = (rowId: number) => {
    setGameRows((rows) => rows.map((row) => (row.id === rowId ? { ...row, locked: false, points: 0 } : row)))

    // Recalcular puntos totales
    const newTotal = gameRows.reduce((total, row) => {
      if (row.id === rowId) return total
      return total + row.points
    }, 0)
    setTotalPoints(newTotal)
  }

  const getStatusColor = (status: CellStatus) => {
    switch (status) {
      case "empty":
        return "bg-red-100 text-red-800"
      case "incorrect":
        return "bg-red-100 text-red-800"
      case "repeated":
        return "bg-yellow-100 text-yellow-800"
      case "unique":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusSymbol = (status: CellStatus) => {
    switch (status) {
      case "empty":
        return "✗"
      case "incorrect":
        return "✗"
      case "repeated":
        return "50"
      case "unique":
        return "100"
      default:
        return ""
    }
  }

  const resetGame = () => {
    setGameRows([])
    setTotalPoints(0)
    setCurrentLetter("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-indigo-700">🎯 Bachillerato / Stop</CardTitle>
            <div className="flex justify-center items-center gap-4 mt-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Puntos Totales: {totalPoints}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selector de letra */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button
                onClick={generateRandomLetter}
                className="flex items-center gap-2 bg-transparent"
                variant="outline"
              >
                <Shuffle className="w-4 h-4" />
                Letra Aleatoria
              </Button>

              {currentLetter && (
                <div className="flex items-center gap-4">
                  <Badge className="text-2xl px-6 py-3 bg-indigo-600">{currentLetter}</Badge>
                  <Button onClick={startNewRound} className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Empezar Ronda
                  </Button>
                </div>
              )}

              {gameRows.length > 0 && (
                <Button onClick={resetGame} variant="destructive" className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Reiniciar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabla de juego */}
        {gameRows.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-3 text-left font-semibold">Letra</th>
                      {CATEGORIES.map((category) => (
                        <th key={category} className="p-3 text-left font-semibold min-w-[120px]">
                          {category}
                        </th>
                      ))}
                      <th className="p-3 text-center font-semibold">Puntos</th>
                      <th className="p-3 text-center font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameRows.map((row) => (
                      <tr key={row.id} className={`border-b ${row.locked ? "bg-gray-50" : ""}`}>
                        <td className="p-3">
                          <Badge className="bg-indigo-600 text-white">{row.letter}</Badge>
                        </td>
                        {CATEGORIES.map((_, categoryIndex) => (
                          <td key={categoryIndex} className="p-2">
                            <div className="space-y-2">
                              <Input
                                value={row.answers[categoryIndex]}
                                onChange={(e) => updateAnswer(row.id, categoryIndex, e.target.value)}
                                disabled={row.locked}
                                className="text-sm"
                                placeholder="..."
                              />
                              <button
                                onClick={() => cycleStatus(row.id, categoryIndex)}
                                disabled={row.locked}
                                className={`w-full px-2 py-1 rounded text-xs font-semibold ${getStatusColor(row.status[categoryIndex])} ${row.locked ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}
                              >
                                {getStatusSymbol(row.status[categoryIndex])}
                              </button>
                            </div>
                          </td>
                        ))}
                        <td className="p-3 text-center">
                          <Badge variant="secondary">{row.points}</Badge>
                        </td>
                        <td className="p-3 text-center">
                          {row.locked ? (
                            <Button
                              onClick={() => unlockRow(row.id)}
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <Lock className="w-3 h-3" />
                              Editar
                            </Button>
                          ) : (
                            <Button onClick={() => lockRow(row.id)} size="sm" className="flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              STOP!
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instrucciones */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">📋 Cómo jugar:</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside text-gray-600">
              <li>Presiona "Letra Aleatoria" para elegir una letra</li>
              <li>Presiona "Empezar Ronda" para crear una nueva fila</li>
              <li>Escribe palabras que empiecen con esa letra en cada categoría</li>
              <li>Toca los botones de puntuación para marcar: ✗ (0 pts), 50 (repetida), 100 (única)</li>
              <li>Presiona "STOP!" cuando termines para bloquear la fila</li>
              <li>¡El que tenga más puntos gana! 🏆</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
