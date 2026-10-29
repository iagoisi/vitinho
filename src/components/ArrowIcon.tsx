type Direction = 'up-right' | 'left' | 'right' | 'up' | 'down' | 'rotate' | 'rotate-back'

const paths: Record<Direction, string> = {
  'up-right': 'M5 19 19 5 M8 5h11v11',
  left: 'M19 12H5 m7-7-7 7 7 7',
  right: 'M5 12h14 m-7-7 7 7-7 7',
  up: 'M12 19V5 m-7 7 7-7 7 7',
  down: 'M12 5v14 m-7-7 7 7 7-7',
  rotate: 'M20 6v6h-6 M20 12a8 8 0 1 0-2.4 5.7',
  'rotate-back': 'M4 6v6h6 M4 12a8 8 0 1 1 2.4 5.7',
}

export function ArrowIcon({ direction = 'up-right' }: { direction?: Direction }) {
  return <svg className="icon-arrow" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[direction]} /></svg>
}
