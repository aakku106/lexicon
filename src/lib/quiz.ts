import type { QuizQuestion, Term } from '../types'
import { shuffle } from './study'

function choiceKey(kind: QuizQuestion['kind'], value: string): string {
  return `${kind}:${value}`
}

function pickDistractors(
  term: Term,
  allTerms: Term[],
  kind: QuizQuestion['kind'],
  random: () => number,
): string[] {
  const sameCategory = allTerms.filter(
    (candidate) =>
      candidate.id !== term.id &&
      (candidate.category === term.category || candidate.alsoIn?.includes(term.category)),
  )
  const others = allTerms.filter(
    (candidate) => candidate.id !== term.id && !sameCategory.some((item) => item.id === candidate.id),
  )
  const pool = [...shuffle(sameCategory, random), ...shuffle(others, random)]
  const seen = new Set<string>([choiceKey(kind, kind === 'term-to-definition' ? term.definition : term.term)])
  const options: string[] = []
  for (const candidate of pool) {
    if (options.length >= 3) break
    const value = kind === 'term-to-definition' ? candidate.definition : candidate.term
    const key = choiceKey(kind, value)
    if (seen.has(key)) continue
    seen.add(key)
    options.push(value)
  }
  return options
}

export function generateQuiz(
  questionTerms: Term[],
  allTerms: Term[],
  count: number,
  random: () => number = Math.random,
): QuizQuestion[] {
  const pool = shuffle(questionTerms, random).slice(0, count)
  return pool.map((term, index) => {
    const kind: QuizQuestion['kind'] =
      index % 2 === 0 ? 'term-to-definition' : 'definition-to-term'
    const answer = kind === 'term-to-definition' ? term.definition : term.term
    const distractors = pickDistractors(term, allTerms, kind, random)
    const options = shuffle([answer, ...distractors], random)
    return {
      id: `${term.id}-${index}`,
      termId: term.id,
      kind,
      prompt: kind === 'term-to-definition' ? term.term : term.definition,
      options,
      answer,
      definition: term.definition,
    }
  })
}

export function quizScore(questions: QuizQuestion[], answers: Record<string, string>): number {
  return questions.reduce(
    (score, question) => score + (answers[question.id] === question.answer ? 1 : 0),
    0,
  )
}
