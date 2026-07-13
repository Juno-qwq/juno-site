// Topics-in-my-garden graph. Nodes deep-link to garden `_Index` pages; Quant is the center.
// Node click navigates to `garden` (see TopicsGraph). Edit topology here only.
export type GraphNode = {
  id: string
  label: string
  /** Relative visual weight (radius). */
  val: number
  garden: string
  central?: boolean
}

export type GraphLink = { source: string; target: string }

export const graphNodes: GraphNode[] = [
  { id: "quant", label: "Quant", val: 10, garden: "/garden/Quant/_Quant", central: true },
  { id: "ai-llm", label: "AI / LLM", val: 7, garden: "/garden/AI/LLM/_LLM" },
  { id: "systems", label: "Systems", val: 7, garden: "/garden/Systems/_Systems" },
  { id: "nlp", label: "NLP", val: 5, garden: "/garden/AI/LLM/_LLM" },
  { id: "cpp", label: "C++", val: 6, garden: "/garden/Systems/C++/_C++" },
  { id: "database", label: "Database", val: 5, garden: "/garden/Systems/databases/_databases" },
  { id: "time-series", label: "Time Series", val: 6, garden: "/garden/AI/time-series/_time-series" },
  { id: "eeg-bci", label: "EEG / BCI", val: 5, garden: "/garden/EEG-BCI/_EEG-BCI" },
]

export const graphLinks: GraphLink[] = [
  { source: "quant", target: "ai-llm" },
  { source: "quant", target: "systems" },
  { source: "quant", target: "time-series" },
  { source: "quant", target: "database" },
  { source: "quant", target: "cpp" },
  { source: "ai-llm", target: "nlp" },
  { source: "ai-llm", target: "time-series" },
  { source: "systems", target: "cpp" },
  { source: "systems", target: "database" },
  { source: "time-series", target: "eeg-bci" },
  { source: "ai-llm", target: "eeg-bci" },
]
