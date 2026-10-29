import { useEffect, useRef, useState, type ReactNode } from 'react'

const FOOTPRINT = 'M-3-7C-6-5-5 2-3 4H3C5 1 5-5 2-7Z M-3 7H3V11Q0 14-3 11Z'
const FOOTSTEP_SPACING = 48
type Footstep = { x: number; y: number; angle: number }
type Segment = { start: number; end: number; pathEnd: number }

export function ExperienceTrail({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const path = useRef<SVGPathElement>(null)
  const [geometry, setGeometry] = useState({ width: 0, height: 0, d: '' })
  const [feet, setFeet] = useState<Footstep[]>([])
  const [length, setLength] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const element = root.current
    if (!element) return
    const markers = [...element.querySelectorAll<HTMLElement>('.experience-number')]
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const rows = [...element.querySelectorAll<HTMLElement>('.experience')]
    let frame = 0
    let segments: Segment[] = []
    let arrivals: number[] = []
    let routeLength = 1
    const update = () => {
      frame = 0
      const position = window.innerHeight * .68 - element.getBoundingClientRect().top
      let distance = 0
      for (const segment of segments) {
        if (position < segment.start) break
        if (position >= segment.end) { distance = segment.pathEnd; continue }
        const t = Math.max(0, Math.min(1, (position - segment.start) / (segment.end - segment.start)))
        const eased = t * t * (3 - 2 * t)
        distance += (segment.pathEnd - distance) * eased
        break
      }
      const value = reducedMotion.matches ? 1 : distance / routeLength
      setProgress(Math.round(value * 500) / 500)
      markers.forEach((marker, index) => marker.classList.toggle('is-reached', reducedMotion.matches || distance >= (arrivals[index] ?? Infinity)))
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    const measure = () => {
      const bounds = element.getBoundingClientRect()
      const rails = rows.map(row => {
        const rect = row.getBoundingClientRect()
        return { top: rect.top - bounds.top + 14, bottom: rect.bottom - bounds.top - 14 }
      })
      const left = -1
      const right = bounds.width + 1
      const radius = Math.min(28, Math.max(18, bounds.width * .05))
      const firstMarker = markers[0]?.getBoundingClientRect()
      const start = firstMarker && {
        x: firstMarker.left - bounds.left + firstMarker.width / 2,
        y: firstMarker.top - bounds.top + 1,
      }
      const measureLength = (d: string) => {
        const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        probe.setAttribute('d', d)
        return probe.getTotalLength()
      }
      let route = ''
      segments = []
      arrivals = []
      rails.slice(0, -1).forEach(({ top, bottom }, index) => {
        const entry = index
          ? `V${top - radius} C${left} ${top - radius * .45} ${left + radius * .45} ${top} ${left + radius} ${top}`
          : start
            ? `M${start.x} ${start.y} C${start.x} ${top + 8} ${left + radius} ${top + 8} ${left + radius} ${top}`
            : `M${left + radius} ${top}`
        route += ` ${entry}`
        const entryDistance = measureLength(route)
        arrivals.push(Math.max(24, 24 + Math.round((entryDistance - 24) / FOOTSTEP_SPACING) * FOOTSTEP_SPACING))
        route += ` H${right - radius} C${right - radius * .45} ${top} ${right} ${top + radius * .45} ${right} ${top + radius} V${bottom - radius} C${right} ${bottom - radius * .45} ${right - radius * .45} ${bottom} ${right - radius} ${bottom} H${left + radius} C${left + radius * .45} ${bottom} ${left} ${bottom + radius * .45} ${left} ${bottom + radius}`
        segments.push({ start: top + (index ? 30 : 0), end: bottom - 30, pathEnd: measureLength(route) })
      })
      const finalMarker = markers.at(-1)?.getBoundingClientRect()
      const target = finalMarker && { x: finalMarker.left - bounds.left + finalMarker.width / 2, y: finalMarker.top - bounds.top + finalMarker.height / 2 }
      const d = target ? `${route} V${target.y - radius} C${left} ${target.y - radius * .45} ${target.x - radius * .45} ${target.y} ${target.x} ${target.y}` : route
      routeLength = measureLength(d) || 1
      if (target) {
        segments.push({ start: rails.at(-2)!.bottom + 10, end: target.y, pathEnd: routeLength })
        arrivals.push(routeLength - 1)
      }
      setGeometry({ width: bounds.width, height: bounds.height, d })
      update()
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    reducedMotion.addEventListener('change', update)
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
      reducedMotion.removeEventListener('change', update)
      cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    if (!path.current || !geometry.d) return
    const length = path.current.getTotalLength()
    setLength(length)
    const steps: Footstep[] = []
    for (let distance = 24, index = 0; distance < length - 18; distance += FOOTSTEP_SPACING, index++) {
      const point = path.current.getPointAtLength(distance)
      const before = path.current.getPointAtLength(distance - 2)
      const after = path.current.getPointAtLength(distance + 2)
      const dx = after.x - before.x
      const dy = after.y - before.y
      const magnitude = Math.hypot(dx, dy) || 1
      const side = index % 2 ? 1 : -1
      steps.push({ x: point.x - dy / magnitude * side * 9, y: point.y + dx / magnitude * side * 9, angle: Math.atan2(dy, dx) * 180 / Math.PI + 90 })
    }
    setFeet(steps)
  }, [geometry.d])

  return <div className="experience-list" ref={root}>
    <svg className="experience-trail" width={geometry.width} height={geometry.height} aria-hidden="true">
      <defs><mask id="experience-trail-reveal" maskUnits="userSpaceOnUse" x={-24} y={0} width={geometry.width + 48} height={geometry.height}><path d={geometry.d} fill="none" stroke="white" strokeWidth="38" strokeDasharray={`${length * progress} ${length + 1}`} /></mask></defs>
      <path ref={path} d={geometry.d} className="experience-trail-base" />
      <g mask="url(#experience-trail-reveal)"><path d={geometry.d} className="experience-trail-active" />
        {feet.map((foot, index) => <path key={index} d={FOOTPRINT} className="experience-footprint" transform={`translate(${foot.x} ${foot.y}) rotate(${foot.angle}) scale(.95)`} />)}
      </g>
    </svg>
    {children}
  </div>
}
