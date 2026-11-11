'use client'

import React, { useState } from 'react'
import { QuizQuestion } from '@/types/academy'

interface LessonQuizProps {
  quiz: QuizQuestion[]
  lessonId?: string
  initialScore?: { score: number; total: number; passed: boolean }
  onQuizSubmit?: (score: number, total: number) => void
  className?: string
}

// Interactive Lesson Quiz Component
// Flat data-terminal design: no pill badges above headings, no emojis, tabular figures.
export function LessonQuiz({
  quiz,
  initialScore,
  onQuizSubmit,
  className = '',
}: LessonQuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState<boolean>(Boolean(initialScore?.passed))
  const [scoreResult, setScoreResult] = useState<{ score: number; total: number; passed: boolean } | null>(
    initialScore || null
  )

  if (!quiz || quiz.length === 0) {
    return null
  }

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (submitted) return
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIdx]: optionIdx,
    }))
  }

  const handleSubmit = () => {
    let correctCount = 0
    quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount += 1
      }
    })

    const total = quiz.length
    const passed = total > 0 && correctCount / total >= 0.7
    const result = { score: correctCount, total, passed }
    setScoreResult(result)
    setSubmitted(true)

    if (onQuizSubmit) {
      onQuizSubmit(correctCount, total)
    }
  }

  const handleRetry = () => {
    setSelectedAnswers({})
    setSubmitted(false)
    setScoreResult(null)
  }

  const allAnswered = quiz.every((_, idx) => selectedAnswers[idx] !== undefined)

  return (
    <section
      aria-label="Check Your Understanding"
      className={`rounded-lg border border-[#1a2030] bg-[#0a0f1a] p-5 sm:p-6 space-y-5 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1a2030] pb-4">
        <div>
          <h3 className="text-base font-semibold text-white">
            Comprehension check
          </h3>
          <p className="text-xs text-[#94a3b8] [font-variant-numeric:tabular-nums]">
            {quiz.length} {quiz.length === 1 ? 'question' : 'questions'} · 70% required to pass
          </p>
        </div>

        {scoreResult && (
          <div
            className={`inline-flex items-center gap-2 rounded px-2.5 py-1 text-xs font-medium [font-variant-numeric:tabular-nums] ${
              scoreResult.passed
                ? 'bg-[#172a1d] text-[#3fc07a]'
                : 'bg-[#2c1a20] text-[#e5566f]'
            }`}
          >
            <span>
              {scoreResult.score}/{scoreResult.total} ({Math.round((scoreResult.score / scoreResult.total) * 100)}%)
            </span>
            <span>·</span>
            <span>{scoreResult.passed ? 'Passed' : 'Below threshold'}</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {quiz.map((q, qIdx) => {
          const selected = selectedAnswers[qIdx]

          return (
            <div
              key={q.id || `quiz-q-${qIdx}`}
              className="space-y-3 border-b border-[#141a26] pb-5 last:border-b-0 last:pb-0"
            >
              <p className="text-sm font-medium text-white leading-relaxed">
                {q.question}
              </p>

              <div className="grid grid-cols-1 gap-2">
                {q.options.map((opt, optIdx) => {
                  const isThisSelected = selected === optIdx
                  const isThisCorrect = q.correctIndex === optIdx

                  let buttonStyle =
                    'border-[#1a2030] bg-[#070b14] text-[#cbd5e1] hover:border-[#2e3852] hover:text-white'

                  if (submitted) {
                    if (isThisCorrect) {
                      buttonStyle = 'border-[#3fc07a] bg-[#172a1d] text-[#3fc07a] font-medium'
                    } else if (isThisSelected && !isThisCorrect) {
                      buttonStyle = 'border-[#e5566f] bg-[#2c1a20] text-[#e5566f]'
                    } else {
                      buttonStyle = 'border-[#141a26] bg-[#070b14] text-[#64748b]'
                    }
                  } else if (isThisSelected) {
                    buttonStyle = 'border-[#ff2e54] bg-[#141b29] text-white font-medium'
                  }

                  return (
                    <button
                      key={`opt-${qIdx}-${optIdx}`}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`flex items-start justify-between gap-3 rounded border px-3.5 py-2.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54] ${buttonStyle}`}
                    >
                      <span className="leading-relaxed">{opt}</span>
                      {submitted && isThisCorrect && (
                        <span className="text-xs font-medium text-[#3fc07a] flex-shrink-0">Correct</span>
                      )}
                      {submitted && isThisSelected && !isThisCorrect && (
                        <span className="text-xs font-medium text-[#e5566f] flex-shrink-0">Incorrect</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {submitted && (
                <div className="rounded bg-[#0d1322] p-3.5 text-xs text-[#cbd5e1] leading-relaxed border-l-2 border-[#2e3852]">
                  <span className="font-medium text-white">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1a2030]">
        <span className="text-xs text-[#94a3b8] [font-variant-numeric:tabular-nums]">
          {!submitted
            ? `${Object.keys(selectedAnswers).length} of ${quiz.length} answered`
            : 'Review the explanations above before advancing.'}
        </span>

        {submitted ? (
          <button
            type="button"
            onClick={handleRetry}
            className="h-8 rounded border border-[#262f45] bg-[#070b14] px-3.5 text-xs font-medium text-white transition-colors hover:bg-[#141b29] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54]"
          >
            Reset answers
          </button>
        ) : (
          <button
            type="button"
            disabled={!allAnswered}
            onClick={handleSubmit}
            className="h-8 rounded bg-white px-4 text-xs font-medium text-[#070b14] transition-colors hover:bg-[#e2e8f0] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54]"
          >
            Check answers
          </button>
        )}
      </div>
    </section>
  )
}
