import { useEffect, useRef, useState, type ReactNode } from 'react'

const FOOTPRINT = 'M-3-7C-6-5-5 2-3 4H3C5 1 5-5 2-7Z M-3 7H3V11Q0 14-3 11Z'
const FOOTSTEP_SPACING = 48
const SCROLL_PAUSE = 180
const CAMERA_SCROLL = 400

type Footstep = { x: number; y: number; angle: number }
type Phase = { duration: number; from: number; to: number; focusFrom: number; focusTo: number }

export function ExperienceTrail({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const path = useRef<SVGPathElement>(null)
  const [geometry, setGeometry] = useState({ width: 0, height: 0, d: '' })
  const [feet, setFeet] = useState<Footstep[]>([])
  const [length, setLength] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const element = root.current
    const stageElement = stage.current
    const viewportElement = viewport.current
    if (!element || !stageElement || !viewportElement) return
    const markers = [...element.querySelectorAll<HTMLElement>('.experience-number')]
    const rows = [...element.querySelectorAll<HTMLElement>('.experience')]
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let arrivals: number[] = []
    let loopEnds: number[] = []
    let cameraStops: number[] = []
    let phases: Phase[] = []
    let routeLength = 1
    let scrollDistance = 1

    const stateAt = (travel: number) => {
      let remaining = Math.max(0, Math.min(scrollDistance, travel))
      for (const phase of phases) {
        if (remaining <= phase.duration) {
          const share = phase.duration ? remaining / phase.duration : 1
          const eased = share * share * (3 - 2 * share)
          return {
            distance: phase.from + (phase.to - phase.from) * share,
            camera: cameraStops[phase.focusFrom] + (cameraStops[phase.focusTo] - cameraStops[phase.focusFrom]) * eased,
          }
        }
        remaining -= phase.duration
      }
      return { distance: routeLength, camera: cameraStops.at(-1) ?? 0 }
    }

    const update = () => {
      const stageTop = stageElement.getBoundingClientRect().top + window.scrollY
      const stickyTop = parseFloat(getComputedStyle(viewportElement).top) || 0
      const travel = window.scrollY - stageTop + stickyTop
      const { distance, camera } = reducedMotion.matches ? { distance: routeLength, camera: 0 } : stateAt(travel)
      element.style.transform = reducedMotion.matches ? '' : `translate3d(0, ${-camera}px, 0)`
      setProgress(Math.round(distance / routeLength * 1000) / 1000)
      markers.forEach((marker, index) => marker.classList.toggle('is-reached', distance >= (arrivals[index] ?? Infinity)))
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; update() }) }

    const measure = () => {
      stageElement.classList.toggle('is-scroll-ready', !reducedMotion.matches)
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
      arrivals = []
      loopEnds = []
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
        loopEnds.push(measureLength(route))
      })
      const finalMarker = markers.at(-1)?.getBoundingClientRect()
      const target = finalMarker && { x: finalMarker.left - bounds.left + finalMarker.width / 2, y: finalMarker.top - bounds.top + finalMarker.height / 2 }
      const d = target ? `${route} V${target.y - radius} C${left} ${target.y - radius * .45} ${target.x - radius * .45} ${target.y} ${target.x} ${target.y}` : route
      routeLength = measureLength(d) || 1
      if (target) arrivals.push(routeLength - 1)

      const frameHeight = viewportElement.clientHeight
      cameraStops = rows.map(row => {
        const rect = row.getBoundingClientRect()
        return rect.top - bounds.top + rect.height / 2 - frameHeight / 2
      })
      phases = []
      let previous = 0
      arrivals.forEach((arrival, index) => {
        phases.push({ duration: arrival - previous, from: previous, to: arrival, focusFrom: index, focusTo: index })
        phases.push({ duration: SCROLL_PAUSE, from: arrival, to: arrival, focusFrom: index, focusTo: index })
        if (index < loopEnds.length) {
          const end = loopEnds[index]
          phases.push({ duration: end - arrival, from: arrival, to: end, focusFrom: index, focusTo: index })
          phases.push({ duration: CAMERA_SCROLL, from: end, to: end, focusFrom: index, focusTo: index + 1 })
          previous = end
        }
      })
      phases.push({ duration: routeLength - arrivals.at(-1)!, from: arrivals.at(-1)!, to: routeLength, focusFrom: rows.length - 1, focusTo: rows.length - 1 })
      scrollDistance = phases.reduce((total, phase) => total + phase.duration, 0)
      stageElement.style.height = reducedMotion.matches ? '' : `${frameHeight + scrollDistance}px`
      setGeometry({ width: bounds.width, height: bounds.height, d })
      update()
    }

    const observer = new ResizeObserver(measure)
    observer.observe(element)
    observer.observe(viewportElement)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    reducedMotion.addEventListener('change', measure)
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
      reducedMotion.removeEventListener('change', measure)
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

  return <div className="experience-scroll" ref={stage}><div className="experience-viewport" ref={viewport}><div className="experience-list" ref={root}>
    <svg className="experience-trail" width={geometry.width} height={geometry.height} aria-hidden="true">
      <defs><mask id="experience-trail-reveal" maskUnits="userSpaceOnUse" x={-24} y={0} width={geometry.width + 48} height={geometry.height}><path d={geometry.d} fill="none" stroke="white" strokeWidth="38" strokeDasharray={`${length * progress} ${length + 1}`} /></mask></defs>
      <path ref={path} d={geometry.d} className="experience-trail-base" />
      <g mask="url(#experience-trail-reveal)"><path d={geometry.d} className="experience-trail-active" />
        {feet.map((foot, index) => <path key={index} d={FOOTPRINT} className="experience-footprint" transform={`translate(${foot.x} ${foot.y}) rotate(${foot.angle}) scale(.95)`} />)}
      </g>
    </svg>
    {children}
  </div></div></div>
}
