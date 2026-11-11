import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import changelogFallback from '@/data/changelog.json'

export async function GET() {
  try {
    const gitLog = execSync('git log -n 8 --pretty=format:"%h|%an|%aI|%s"', {
      encoding: 'utf-8',
      timeout: 2000,
    })

    const commits = gitLog
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [hash, author, date, message] = line.split('|')
        return { hash, author, date, message }
      })

    if (commits.length > 0) {
      return NextResponse.json({ updates: commits })
    }
  } catch {
    // Fallback to bundled changelog in serverless environments
  }

  return NextResponse.json({ updates: changelogFallback })
}
