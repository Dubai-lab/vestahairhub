import { useEffect } from 'react'

const COLORS  = ['#E5A84B', '#C8851A', '#F0C48A', '#ffffff', '#7B3F1E']
const MAX_DOT = 18

function spawnDot(x: number, y: number) {
  const dot = document.createElement('div')
  dot.className = 'sparkle'

  const size   = Math.random() * 6 + 3
  const color  = COLORS[Math.floor(Math.random() * COLORS.length)]
  const tx     = (Math.random() - 0.5) * 50
  const ty     = -(Math.random() * 40 + 20)

  dot.style.cssText = `
    left: ${x}px; top: ${y}px;
    width: ${size}px; height: ${size}px;
    background: ${color};
    box-shadow: 0 0 ${size * 2}px ${color};
    transform: translate(-50%, -50%);
    animation-duration: ${Math.random() * 0.4 + 0.6}s;
    --tx: ${tx}px; --ty: ${ty}px;
  `

  // Custom end position via inline keyframe
  dot.animate(
    [
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 },
    ],
    { duration: Math.random() * 400 + 600, easing: 'ease-out', fill: 'forwards' },
  ).onfinish = () => dot.remove()

  document.body.appendChild(dot)
}

let lastTime   = 0
let dotCount   = 0

export function CursorSparkle() {
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastTime < 40) return   // throttle to ~25 sparks/sec
      if (dotCount >= MAX_DOT) return

      lastTime = now
      dotCount++
      spawnDot(e.clientX, e.clientY)
      setTimeout(() => dotCount--, 1200)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return null
}
