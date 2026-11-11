import { Lesson, Track } from '@/types/academy'
import { track1Foundations } from './track1_foundations'
import { track2Technical } from './track2_technical'
import { track3Macro } from './track3_macro'
import { track4Legends } from './track4_legends'
import { phase2Outlines } from './phase2_outlines'

export { track1Foundations, track2Technical, track3Macro, track4Legends, phase2Outlines }

// Launch Tracks (Milestones 1–4): Fully authored and interactive curriculum tracks.
export const ACADEMY_TRACKS: Track[] = [
  track1Foundations,
  track2Technical,
  track3Macro,
  track4Legends
]

// Phase 2 Tracks: Coming Soon syllabus outlines.
export const PHASE2_TRACKS: Track[] = phase2Outlines

// Combined catalog of all launch and preview tracks.
export const ALL_TRACKS: Track[] = [...ACADEMY_TRACKS, ...PHASE2_TRACKS]

// Retrieve all active launch curriculum tracks.
export function getAllTracks(): Track[] {
  return ACADEMY_TRACKS
}

// Retrieve a specific track by its unique ID.
export function getTrackById(id: string): Track | undefined {
  return ALL_TRACKS.find((track) => track.id === id)
}

// Retrieve a specific lesson by its track ID and lesson ID or slug.
export function getLessonById(trackId: string, lessonId: string): Lesson | undefined {
  const track = getTrackById(trackId)
  if (!track) return undefined

  for (const mod of track.modules) {
    const found = mod.lessons.find((l) => l.id === lessonId || l.slug === lessonId)
    if (found) return found
  }

  return undefined
}

// Retrieve adjacent (previous and next) lessons within a track for sequential navigation.
export function getAdjacentLessons(
  trackId: string,
  lessonId: string
): { prevLesson: Lesson | null; nextLesson: Lesson | null } {
  const track = getTrackById(trackId)
  if (!track) {
    return { prevLesson: null, nextLesson: null }
  }

  const allLessons = track.modules.flatMap((m) => m.lessons)
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId || l.slug === lessonId)

  if (currentIndex === -1) {
    return { prevLesson: null, nextLesson: null }
  }

  return {
    prevLesson: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
    nextLesson: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null
  }
}
