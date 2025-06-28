"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lock, ChevronLeft, ChevronRight, Plus, Shuffle, Settings, X } from "lucide-react"

const DEFAULT_CATEGORIES = [
  "Nombre",
  "Apellido",
  "Animal",
  "País o capital",
  "Comida",
  "Objeto",
  "Color",
  "Cantante o banda",
]

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

type CellStatus = "incorrect" | "repeated" | "correct" | "unique"

type GameRound = {
  id: number
  letter: string
  answers: string[]
  status: CellStatus[]
  locked: boolean
  points: number
  hasSelectedStatus: boolean[]
}

export default function Component() {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [editingCategories, setEditingCategories] = useState(false)
  const [newCategory, setNewCategory] = useState("")

  const [rounds, setRounds] = useState<GameRound[]>([])
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [letterInput, setLetterInput] = useState("")

  const [isHoldingStop, setIsHoldingStop] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentRound = rounds[currentRoundIndex]

  const generateRandomLetter = () => {
    const randomLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)]
    setLetterInput(randomLetter)
  }

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()])
      setNewCategory("")
    }
  }

  const removeCategory = (index: number) => {
    if (categories.length > 1) {
      setCategories(categories.filter((_, i) => i !== index))
    }
  }

  const createNewRound = () => {
    const newRound: GameRound = {
      id: Date.now(),
      letter: "",
      answers: new Array(categories.length).fill(""),
      status: new Array(categories.length).fill("incorrect"),
      locked: false,
      points: 0,
      hasSelectedStatus: new Array(categories.length).fill(false),
    }

    const newRounds = [...rounds, newRound]
    setRounds(newRounds)
    setCurrentRoundIndex(newRounds.length - 1)
    setLetterInput("")
    setEditingCategories(false) // Cerrar edición al empezar
  }

  const updateRoundLetter = (newLetter: string) => {
    if (!currentRound || currentRound.locked) return

    const letter = newLetter.toUpperCase()

    setRounds(
      rounds.map((round, idx) =>
        idx === currentRoundIndex
          ? {
              ...round,
              letter: letter,
              answers: round.answers.map((answer) =>
                !answer.trim() || answer.length === 1 ? letter.toLowerCase() : answer,
              ),
            }
          : round,
      ),
    )
  }

  const updateAnswer = (categoryIndex: number, value: string) => {
    if (!currentRound || currentRound.locked) return

    setRounds(
      rounds.map((round, idx) =>
        idx === currentRoundIndex
          ? {
              ...round,
              answers: round.answers.map((answer, i) => (i === categoryIndex ? value : answer)),
            }
          : round,
      ),
    )
  }

  const selectStatus = (categoryIndex: number, status: CellStatus) => {
    if (!currentRound) return

    setRounds(
      rounds.map((round, idx) => {
        if (idx !== currentRoundIndex) return round

        const newStatuses = round.status.map((s, i) => (i === categoryIndex ? status : s))
        const newHasSelected = round.hasSelectedStatus.map((selected, i) => (i === categoryIndex ? true : selected))
        const points = round.locked ? calculateRoundPoints(newStatuses) : 0

        return {
          ...round,
          status: newStatuses,
          hasSelectedStatus: newHasSelected,
          points,
        }
      }),
    )
  }

  const cycleStatus = (categoryIndex: number) => {
    if (!currentRound) return

    setRounds(
      rounds.map((round, idx) => {
        if (idx !== currentRoundIndex) return round

        const currentStatus = round.status[categoryIndex]
        const answer = round.answers[categoryIndex]
        let nextStatus: CellStatus

        if (!answer.trim() || answer.length <= 1) {
          nextStatus = "incorrect"
        } else {
          switch (currentStatus) {
            case "incorrect":
              nextStatus = "repeated"
              break
            case "repeated":
              nextStatus = "correct"
              break
            case "correct":
              nextStatus = "unique"
              break
            case "unique":
              nextStatus = "incorrect"
              break
            default:
              nextStatus = "incorrect"
          }
        }

        const newStatuses = round.status.map((s, i) => (i === categoryIndex ? nextStatus : s))
        const points = round.locked ? calculateRoundPoints(newStatuses) : 0

        return { ...round, status: newStatuses, points }
      }),
    )
  }

  const calculateRoundPoints = (status: CellStatus[]): number => {
    return status.reduce((total, s) => {
      switch (s) {
        case "unique":
          return total + 20
        case "correct":
          return total + 10
        case "repeated":
          return total + 5
        case "incorrect":
        default:
          return total + 0
      }
    }, 0)
  }

  const lockRound = () => {
    if (!currentRound) return

    const updatedRounds = rounds.map((round, idx) => {
      if (idx !== currentRoundIndex) return round
      const points = calculateRoundPoints(round.status)
      return { ...round, locked: true, points }
    })

    setRounds(updatedRounds)
  }

  const startHoldingStop = () => {
    if (!currentRound || currentRound.locked || !currentRound.letter.trim()) return

    setIsHoldingStop(true)
    setHoldProgress(0)

    const intervalId = setInterval(() => {
      setHoldProgress((prev) => {
        const newProgress = prev + 3.33
        return newProgress >= 100 ? 100 : newProgress
      })
    }, 20)

    const timeoutId = setTimeout(() => {
      lockRound()
      stopHoldingStop()
    }, 600)

    holdTimeoutRef.current = timeoutId
    holdIntervalRef.current = intervalId
  }

  const stopHoldingStop = () => {
    setIsHoldingStop(false)
    setHoldProgress(0)

    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
  }

  useEffect(() => {
    const total = rounds.reduce((sum, round) => sum + round.points, 0)
    setTotalPoints(total)
  }, [rounds])

  const getStatusColor = (status: CellStatus) => {
    switch (status) {
      case "incorrect":
        return "bg-red-100 text-red-800 border-red-200"
      case "repeated":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "correct":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "unique":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: CellStatus) => {
    switch (status) {
      case "incorrect":
        return "Incorrecto (0 pts)"
      case "repeated":
        return "Repetido (5 pts)"
      case "correct":
        return "Correcto (10 pts)"
      case "unique":
        return "Único (20 pts)"
      default:
        return "Sin evaluar"
    }
  }

  const goToPreviousRound = () => {
    if (currentRoundIndex > 0) {
      setCurrentRoundIndex(currentRoundIndex - 1)
    }
  }

  const goToNextRound = () => {
    if (currentRoundIndex < rounds.length - 1) {
      setCurrentRoundIndex(currentRoundIndex + 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header con puntaje total - solo cuando hay rondas */}
        {rounds.length > 0 && (
          <Card className="sticky top-4 z-10 shadow-lg">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-indigo-700">🎯 Bachillerato</h1>
                <Badge className="text-lg px-3 py-1 bg-indigo-600">{totalPoints} pts</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navegación entre rondas */}
        {rounds.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <Button variant="outline" size="sm" onClick={goToPreviousRound} disabled={currentRoundIndex === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="text-center">
                  <div className="text-sm text-gray-600">Ronda</div>
                  <div className="font-bold">
                    {currentRoundIndex + 1} de {rounds.length}
                  </div>
                  {currentRound?.locked && (
                    <Badge variant="secondary" className="mt-1">
                      {currentRound.points} pts
                    </Badge>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextRound}
                  disabled={currentRoundIndex === rounds.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selector de letra para nueva ronda */}
        {!currentRound && rounds.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-2">
                <Input
                  value={letterInput}
                  onChange={(e) => setLetterInput(e.target.value.toUpperCase().slice(0, 1))}
                  placeholder="Letra..."
                  className="text-center text-2xl font-bold w-20"
                  maxLength={1}
                />
                <Button
                  onClick={generateRandomLetter}
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Shuffle className="w-4 h-4" />
                  Aleatoria
                </Button>
              </div>
              <Button onClick={createNewRound} className="w-full flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nueva Ronda
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Botón nueva ronda cuando hay rondas */}
        {rounds.length > 0 && (
          <Button onClick={createNewRound} className="w-full flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva Ronda
          </Button>
        )}

        {/* Ronda actual */}
        {currentRound && (
          <>
            <Card className="shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center items-center gap-4">
                  {currentRound.locked ? (
                    <Badge className="text-3xl px-6 py-3 bg-indigo-600 text-white">{currentRound.letter}</Badge>
                  ) : (
                    <Input
                      value={currentRound.letter}
                      onChange={(e) => updateRoundLetter(e.target.value.slice(0, 1))}
                      placeholder="?"
                      className="text-center text-3xl font-bold w-20 h-16 border-2 border-indigo-600"
                      maxLength={1}
                    />
                  )}

                  {currentRound.locked && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Bloqueado
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {categories.map((category, index) => (
                  <Card key={category} className="border-2">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <label className="font-semibold text-gray-700 text-sm">{category}</label>

                        <Input
                          value={currentRound.answers[index]}
                          onChange={(e) => updateAnswer(index, e.target.value)}
                          disabled={currentRound.locked}
                          placeholder={
                            currentRound.letter ? `Palabra con "${currentRound.letter}"...` : "Primero elige una letra"
                          }
                          className="text-base"
                        />

                        {/* Opciones de puntaje después de bloquear */}
                        {currentRound.locked && (
                          <div className="space-y-2">
                            {!currentRound.hasSelectedStatus?.[index] ? (
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  onClick={() => selectStatus(index, "incorrect")}
                                  variant="outline"
                                  className="bg-red-100 text-red-800 border-red-200 text-xs px-2 py-1 h-8"
                                >
                                  Incorrecto (0)
                                </Button>
                                <Button
                                  onClick={() => selectStatus(index, "repeated")}
                                  variant="outline"
                                  className="bg-orange-100 text-orange-800 border-orange-200 text-xs px-2 py-1 h-8"
                                >
                                  Repetido (5)
                                </Button>
                                <Button
                                  onClick={() => selectStatus(index, "correct")}
                                  variant="outline"
                                  className="bg-blue-100 text-blue-800 border-blue-200 text-xs px-2 py-1 h-8"
                                >
                                  Correcto (10)
                                </Button>
                                <Button
                                  onClick={() => selectStatus(index, "unique")}
                                  variant="outline"
                                  className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1 h-8"
                                >
                                  Único (20)
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => cycleStatus(index)}
                                variant="outline"
                                className={`w-full text-sm ${getStatusColor(currentRound.status[index])}`}
                              >
                                {getStatusText(currentRound.status[index])}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Mensaje si no hay letra */}
                {!currentRound.locked && !currentRound.letter.trim() && (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">👆 Primero elige una letra para esta ronda</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botón STOP en card separada */}
            {!currentRound.locked && currentRound.letter.trim() && (
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="relative">
                    <Button
                      onMouseDown={startHoldingStop}
                      onMouseUp={stopHoldingStop}
                      onMouseLeave={stopHoldingStop}
                      onTouchStart={startHoldingStop}
                      onTouchEnd={stopHoldingStop}
                      className={`w-full text-white py-6 transition-all duration-200 shadow-lg text-lg font-bold ${
                        isHoldingStop ? "bg-red-700 scale-95" : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 px-4">
                        {isHoldingStop ? (
                          <span className="text-center">
                            🛑 Manteniendo...
                            <br />
                            <span className="text-sm">{Math.round(holdProgress)}%</span>
                          </span>
                        ) : (
                          <span className="text-center">
                            🛑 Mantén presionado
                            <br />
                            <span className="text-sm">para STOP</span>
                          </span>
                        )}
                      </div>
                    </Button>

                    {/* Progress bar */}
                    {isHoldingStop && (
                      <div
                        className="absolute bottom-0 left-0 h-2 bg-white/40 rounded-b-md transition-all duration-75 ease-out"
                        style={{ width: `${holdProgress}%` }}
                      ></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Pantalla inicial con configuración de categorías */}
        {rounds.length === 0 && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-indigo-700">🎯 Bachillerato</CardTitle>
              <h2 className="text-xl font-bold">¡Empecemos a jugar!</h2>
              <p className="text-gray-600 text-sm">Configura las categorías y presiona "Nueva Ronda"</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configuración de categorías */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Categorías ({categories.length})</h3>
                  <Button
                    onClick={() => setEditingCategories(!editingCategories)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    {editingCategories ? "Listo" : "Editar"}
                  </Button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {categories.map((category, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                      <span className="flex-1 text-sm">{category}</span>
                      {editingCategories && (
                        <Button
                          onClick={() => removeCategory(index)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-600"
                          disabled={categories.length <= 1}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {editingCategories && (
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Nueva categoría..."
                      className="flex-1"
                      onKeyPress={(e) => e.key === "Enter" && addCategory()}
                    />
                    <Button onClick={addCategory} size="sm" className="px-3">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Botón para empezar */}
              <Button onClick={createNewRound} className="w-full" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Ronda
              </Button>

              {/* Instrucciones */}
              <div className="text-xs text-gray-500 space-y-1 text-center">
                <p>📝 Elige letra después de crear la ronda</p>
                <p>🛑 Mantén STOP por menos tiempo</p>
                <p>🏆 Puntúa: Incorrecto (0), Repetido (5), Correcto (10), Único (20)</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
