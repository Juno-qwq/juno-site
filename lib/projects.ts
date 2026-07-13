// Featured projects. `icon` is a key mapped to a lucide icon in the component (keeps this
// file pure data). Link to the code repo (code/ convention) and/or the garden project note.
export type ProjectIcon = "health" | "chart" | "network" | "brain"
export type ProjectStatus = "Live" | "Research" | "Prototype" | "Archived"

export type Project = {
  name: string
  subtitle: string
  icon: ProjectIcon
  status: ProjectStatus
  repo?: string
  garden?: string
}

export const projects: Project[] = [
  {
    name: "SmartCare GPS",
    subtitle: "Elderly safety & location system",
    icon: "health",
    status: "Live",
    repo: "https://github.com/Juno-qwq/smartcare-gps",
  },
  {
    name: "Optibook",
    subtitle: "Options analytics & backtesting",
    icon: "chart",
    status: "Research",
    repo: "https://github.com/Juno-qwq/optibook",
    garden: "/garden/Projects/optibook/_optibook",
  },
  {
    name: "FoNE Research",
    subtitle: "Fourier number embeddings",
    icon: "network",
    status: "Research",
    repo: "https://github.com/Juno-qwq/fone-research",
    garden: "/garden/Projects/fone-research/_fone-research",
  },
  {
    name: "EEG Hand Control",
    subtitle: "Brain–computer interface",
    icon: "brain",
    status: "Prototype",
    repo: "https://github.com/Juno-qwq/eeg-bci-arm",
    garden: "/garden/Projects/eeg-bci-arm/_eeg-bci-arm",
  },
]
