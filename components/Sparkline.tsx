type SparklineProps = {
  data: number[]
  width?: number
  height?: number
  /** Stroke color; defaults to the theme accent. */
  stroke?: string
  /** Fill the area under the line with a faded gradient. */
  fill?: boolean
  strokeWidth?: number
  className?: string
}

/**
 * Minimal, dependency-free SVG sparkline (Phase 3.6). Pure and deterministic so it renders
 * identically on server and client (no hydration mismatch). Used by the Total Visits
 * mini-card and other trend tiles.
 */
export function Sparkline({
  data,
  width = 120,
  height = 32,
  stroke = "var(--accent)",
  fill = false,
  strokeWidth = 1.75,
  className = "",
}: SparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const stepX = width / (data.length - 1)
  const pad = strokeWidth
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2)

  const points = data.map((v, i) => `${(i * stepX).toFixed(2)},${y(v).toFixed(2)}`)
  const line = `M ${points.join(" L ")}`
  const gradId = `spark-${data.length}-${Math.round(max)}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L ${width},${height} L 0,${height} Z`} fill={`url(#${gradId})`} stroke="none" />
        </>
      )}
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
