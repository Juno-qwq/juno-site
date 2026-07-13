// Currently Learning tracks. Edit values here only (Phase 5 rule). Each row deep-links to a
// stable garden `_Index` page (DESIGN.md §6). Seed percentages from the dashboard mockup.
export type LearningTrack = {
  label: string
  pct: number
  /** Garden URL — point at an _Index page, never a leaf note (indexes are stable). */
  garden: string
}

export const learning: LearningTrack[] = [
  { label: "C++23 & Concurrency", pct: 72, garden: "/garden/Systems/C++/_C++" },
  { label: "vLLM Internals", pct: 64, garden: "/garden/Systems/vLLM/_vLLM" },
  { label: "CMU 15-445 (DB Systems)", pct: 58, garden: "/garden/Courses/CMU-15-445/index" },
  { label: "Stanford CS229 (ML)", pct: 45, garden: "/garden/Courses/Stanford-CS229/index" },
  { label: "Stanford CS224N (NLP)", pct: 40, garden: "/garden/AI/LLM/_LLM" },
  { label: "Time Series Analysis", pct: 60, garden: "/garden/AI/time-series/_time-series" },
  { label: "EEG / BCI Fundamentals", pct: 33, garden: "/garden/EEG-BCI/_EEG-BCI" },
]
