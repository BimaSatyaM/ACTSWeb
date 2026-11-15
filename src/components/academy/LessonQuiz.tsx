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
// Daylight 2.1 design: clean typography, tabular figures, high contrast.
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
      className={`rounded-xl border border-slate-900/10 bg-[#faf2df] p-5 sm:p-6 space-y-5 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900/10 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Comprehension check
          </h3>
          <p className="text-xs text-slate-500 font-mono tabular-nums">
            {quiz.length} {quiz.length === 1 ? 'question' : 'questions'} · 70% required to pass
          </p>
        </div>

        {scoreResult && (
          <div
            className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-semibold font-mono tabular-nums ${
              scoreResult.passed
                ? 'bg-emerald-500/10 text-emerald-800 border-emerald-600/30'
                : 'bg-rose-500/10 text-rose-800 border-rose-600/30'
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
              className="space-y-3 border-b border-slate-900/10 pb-5 last:border-b-0 last:pb-0"
            >
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                {q.question}
              </p>

              <div className="grid grid-cols-1 gap-2">
                {q.options.map((opt, optIdx) => {
                  const isThisSelected = selected === optIdx
                  const isThisCorrect = q.correctIndex === optIdx

                  let buttonStyle =
                    'border-slate-900/15 bg-[#fdfaf3] text-slate-800 hover:border-slate-900/30 hover:bg-[#f3ead2]'

                  if (submitted) {
                    if (isThisCorrect) {
                      buttonStyle = 'border-emerald-600/40 bg-emerald-500/15 text-emerald-950 font-semibold'
                    } else if (isThisSelected && !isThisCorrect) {
                      buttonStyle = 'border-rose-600/40 bg-rose-500/15 text-rose-950 font-medium'
                    } else {
                      buttonStyle = 'border-slate-900/10 bg-[#faf2df]/60 text-slate-500'
                    }
                  } else if (isThisSelected) {
                    buttonStyle = 'border-[#0369a1] bg-[#e0f2fe]/60 text-[#0369a1] font-bold'
                  }

                  return (
                    <button
                      key={`opt-${qIdx}-${optIdx}`}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`flex items-start justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0284c7] cursor-pointer ${buttonStyle}`}
                    >
                      <span className="leading-relaxed">{opt}</span>
                      {submitted && isThisCorrect && (
                        <span className="text-xs font-bold text-emerald-700 flex-shrink-0">Correct</span>
                      )}
                      {submitted && isThisSelected && !isThisCorrect && (
                        <span className="text-xs font-bold text-rose-700 flex-shrink-0">Incorrect</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {submitted && (
                <div className="border-l-2 border-[#0369a1] pl-3.5 py-1.5 text-xs text-slate-700 leading-relaxed bg-[#e0f2fe]/30 rounded-r">
                  <span className="font-bold text-slate-900">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-900/10">
        <span className="text-xs text-slate-500 font-mono tabular-nums">
          {!submitted
            ? `${Object.keys(selectedAnswers).length} of ${quiz.length} answered`
            : 'Review the explanations above before advancing.'}
        </span>

        {submitted ? (
          <button
            type="button"
            onClick={handleRetry}
            className="h-8 rounded-lg border border-slate-900/15 bg-[#faf2df] px-3.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-[#f3ead2] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0284c7]"
          >
            Reset answers
          </button>
        ) : (
          <button
            type="button"
            disabled={!allAnswered}
            onClick={handleSubmit}
            className="h-8 rounded-lg bg-[#0369a1] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#0284c7] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0284c7]"
          >
            Check answers
          </button>
        )}
      </div>
    </section>
  )
}
