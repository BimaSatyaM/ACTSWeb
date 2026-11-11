import React from 'react'
import { LessonVisual } from '@/components/academy/LessonVisuals'

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Clean Editorial & Technical Markdown Renderer
 * Follows taste-skill house rules: no warning icons, no boxed formula headers,
 * clean typography with tabular numerals and interactive/visual SVG chart embeds.
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null

  const text = content.replace(/\r\n/g, '\n')
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  let i = 0
  let blockKey = 0

  while (i < lines.length) {
    const line = lines[i]

    // 0. Visual Chart / Interactive Widget Directive: :::visual[type]
    const visualMatch = line.trim().match(/^:::visual\[([a-z0-9-]+)\]$/i)
    if (visualMatch) {
      elements.push(<LessonVisual key={`vis-${blockKey++}`} type={visualMatch[1]} />)
      i++
      continue
    }

    // 1. Code block fence (```)
    if (line.trim().startsWith('```')) {
      const fenceLang = line.trim().slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++
      if (fenceLang.startsWith('visual:')) {
        elements.push(
          <LessonVisual key={`vis-${blockKey++}`} type={fenceLang.replace(/^visual:/, '')} />
        )
        continue
      }
      elements.push(
        <pre
          key={`code-${blockKey++}`}
          className="my-4 overflow-x-auto rounded-lg border border-[#1a2030] bg-[#070b14] p-4 text-xs text-[#cbd5e1] leading-relaxed"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      continue
    }

    // 2. Display Math block ($$ ... $$)
    if (line.trim().startsWith('$$')) {
      const mathLines: string[] = []
      if (line.trim() === '$$') {
        i++
        while (i < lines.length && !lines[i].trim().startsWith('$$')) {
          mathLines.push(lines[i])
          i++
        }
        i++
      } else {
        const clean = line.trim().replace(/^\$\$/, '').replace(/\$\$$/, '')
        mathLines.push(clean)
        i++
      }

      const mathFormula = mathLines.join(' ')
      elements.push(
        <pre
          key={`math-${blockKey++}`}
          className="my-4 overflow-x-auto rounded-lg border border-[#1a2030] bg-[#070b14] px-4 py-3 text-xs sm:text-sm font-medium text-white [font-variant-numeric:tabular-nums]"
        >
          <code>{formatLatexFormula(mathFormula)}</code>
        </pre>
      )
      continue
    }

    // 3. Blockquote / Callout (> ...)
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = []
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('>') ||
          (lines[i].trim() !== '' && quoteLines.length > 0 && !lines[i].startsWith('#')))
      ) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }

      elements.push(
        <blockquote
          key={`quote-${blockKey++}`}
          className="my-4 border-l-2 border-[#2e3852] pl-4 py-1 text-xs sm:text-sm text-[#cbd5e1] leading-relaxed space-y-1.5"
        >
          {quoteLines.map((qLine, qIdx) => {
            const cleanLine = qLine.replace(/\u26A0\uFE0F?/g, '').trim()
            if (cleanLine.startsWith('###')) {
              return (
                <p key={`qh-${qIdx}`} className="font-semibold text-white text-sm">
                  {renderInlineFormatted(cleanLine.replace(/^###\s?/, ''))}
                </p>
              )
            }
            return (
              <p key={`qp-${qIdx}`} className="leading-relaxed">
                {renderInlineFormatted(cleanLine)}
              </p>
            )
          })}
        </blockquote>
      )
      continue
    }

    // 4. Horizontal Rule (---)
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={`hr-${blockKey++}`} className="my-6 border-[#1a2030]" />)
      i++
      continue
    }

    // 5. Headings (###, ####, ##)
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${blockKey++}`} className="mt-7 mb-2.5 text-base sm:text-lg font-semibold text-white">
          {renderInlineFormatted(line.replace(/^###\s+/, ''))}
        </h3>
      )
      i++
      continue
    }

    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4-${blockKey++}`} className="mt-5 mb-2 text-sm font-semibold text-white">
          {renderInlineFormatted(line.replace(/^####\s+/, ''))}
        </h4>
      )
      i++
      continue
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${blockKey++}`} className="mt-8 mb-3 text-lg sm:text-xl font-semibold text-white">
          {renderInlineFormatted(line.replace(/^##\s+/, ''))}
        </h2>
      )
      i++
      continue
    }

    // 6. Ordered List Item
    if (/^\d+\.\s/.test(line.trim())) {
      const listItems: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      elements.push(
        <ol key={`ol-${blockKey++}`} className="my-3 list-decimal list-inside space-y-1.5 text-sm text-[#cbd5e1] leading-relaxed">
          {listItems.map((item, itemIdx) => (
            <li key={`ol-item-${itemIdx}`} className="leading-relaxed">
              <span>{renderInlineFormatted(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // 7. Unordered List Item
    if (/^[-*]\s/.test(line.trim())) {
      const listItems: string[] = []
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^[-*]\s+/, ''))
        i++
      }
      elements.push(
        <ul key={`ul-${blockKey++}`} className="my-3 list-disc list-inside space-y-1.5 text-sm text-[#cbd5e1] leading-relaxed">
          {listItems.map((item, itemIdx) => (
            <li key={`ul-item-${itemIdx}`} className="leading-relaxed">
              <span>{renderInlineFormatted(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // 8. Normal Paragraph
    if (line.trim() !== '') {
      const pLines: string[] = [line]
      i++
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !lines[i].trim().startsWith(':::visual[') &&
        !lines[i].startsWith('#') &&
        !lines[i].startsWith('```') &&
        !lines[i].startsWith('$$') &&
        !lines[i].startsWith('>') &&
        !lines[i].startsWith('---') &&
        !/^[-*]\s/.test(lines[i].trim()) &&
        !/^\d+\.\s/.test(lines[i].trim())
      ) {
        pLines.push(lines[i])
        i++
      }
      elements.push(
        <p key={`p-${blockKey++}`} className="my-3 text-sm text-[#cbd5e1] leading-relaxed">
          {renderInlineFormatted(pLines.join(' '))}
        </p>
      )
      continue
    }

    i++
  }

  return <div className={`space-y-1 ${className}`}>{elements}</div>
}

function formatLatexFormula(latex: string): string {
  const cleaned = latex
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\times/g, ' × ')
    .replace(/\\le/g, ' ≤ ')
    .replace(/\\ge/g, ' ≥ ')
    .replace(/\\neq/g, ' ≠ ')
    .replace(/\\approx/g, ' ≈ ')
    .replace(/\\pm/g, ' ± ')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\cdot/g, ' · ')
    .replace(/\\%/g, '%')
    .replace(/\\\$/g, '$')
    .replace(/\\/g, '')

  return cleaned.trim()
}

function renderInlineFormatted(text: string): React.ReactNode {
  if (!text) return null

  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\$(?:\\\$|[^$])+\$|\*[^*]+\*)/g
  const parts = text.split(tokenRegex)

  return parts.map((part, idx) => {
    if (!part) return null

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      const isExternal = linkMatch[2].startsWith('http')
      return (
        <a
          key={`link-${idx}`}
          href={linkMatch[2]}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-white underline underline-offset-2 hover:text-[#cbd5e1]"
        >
          {linkMatch[1]}
        </a>
      )
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={`b-${idx}`} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      )
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={`c-${idx}`}
          className="rounded bg-[#111726] px-1.5 py-0.5 text-xs text-white"
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    if (part.startsWith('$') && part.endsWith('$') && part.length > 2 && !/^\$\d+(\.\d+)?$/.test(part)) {
      return (
        <code
          key={`m-${idx}`}
          className="rounded bg-[#111726] px-1.5 py-0.5 text-xs text-white [font-variant-numeric:tabular-nums]"
        >
          {formatLatexFormula(part.slice(1, -1))}
        </code>
      )
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={`i-${idx}`} className="italic text-[#e2e8f0]">
          {part.slice(1, -1)}
        </em>
      )
    }

    return part
  })
}
