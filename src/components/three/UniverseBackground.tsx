import { Suspense, useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'

// ── Mouse-reactive star particles ─────────────────────────────────────────────
const INTERACTIVE_COUNT = 250
const SPREAD           = 10
const ATTRACT_RADIUS   = 3.5
const ATTRACT_STRENGTH = 0.06
const RETURN_STRENGTH  = 0.025

function InteractiveStars() {
  const pointsRef    = useRef<THREE.Points>(null!)
  const mouseNDC     = useRef(new THREE.Vector2(0, 0))
  const mouseWorld   = useRef(new THREE.Vector3())
  const dirRef       = useRef(new THREE.Vector3())
  const positions    = useRef<Float32Array>()
  const restPositions = useRef<Float32Array>()

  const geometry = useMemo(() => {
    const geo  = new THREE.BufferGeometry()
    const pos  = new Float32Array(INTERACTIVE_COUNT * 3)
    const rest = new Float32Array(INTERACTIVE_COUNT * 3)

    for (let i = 0; i < INTERACTIVE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = Math.cbrt(Math.random()) * SPREAD

      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = (Math.random() - 0.5) * 4

      pos[i * 3]     = x; rest[i * 3]     = x
      pos[i * 3 + 1] = y; rest[i * 3 + 1] = y
      pos[i * 3 + 2] = z; rest[i * 3 + 2] = z
    }

    positions.current    = pos
    restPositions.current = rest
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return geo
  }, [])

  // Track mouse position as NDC [-1,1]
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseNDC.current.x =  (e.clientX / window.innerWidth)  * 2 - 1
      mouseNDC.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useFrame(({ camera }) => {
    if (!pointsRef.current || !positions.current || !restPositions.current) return

    // Project mouse NDC to world space (z=0 plane)
    dirRef.current.set(mouseNDC.current.x, mouseNDC.current.y, 0.5).unproject(camera)
    dirRef.current.sub(camera.position).normalize()
    const dist = -camera.position.z / (dirRef.current.z || 0.0001)
    mouseWorld.current.copy(camera.position).addScaledVector(dirRef.current, dist)

    const pos  = positions.current
    const rest = restPositions.current
    const mx   = mouseWorld.current.x
    const my   = mouseWorld.current.y

    for (let i = 0; i < INTERACTIVE_COUNT; i++) {
      const idx = i * 3
      const px  = pos[idx];     const py = pos[idx + 1]
      const rx  = rest[idx];    const ry = rest[idx + 1]; const rz = rest[idx + 2]

      const dx = mx - px
      const dy = my - py
      const d  = Math.sqrt(dx * dx + dy * dy)

      if (d < ATTRACT_RADIUS && d > 0.01) {
        const f = (1 - d / ATTRACT_RADIUS) * ATTRACT_STRENGTH
        pos[idx]     += dx * f
        pos[idx + 1] += dy * f
      } else {
        pos[idx]     += (rx - px) * RETURN_STRENGTH
        pos[idx + 1] += (ry - py) * RETURN_STRENGTH
        pos[idx + 2] += (rz - pos[idx + 2]) * RETURN_STRENGTH
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#E5A84B"
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  )
}

// ── Slow-rotating nebula ring ────────────────────────────────────────────────
const NEBULA_COUNT = 1800

function NebulaRing() {
  const groupRef = useRef<THREE.Group>(null!)

  const geometry = useMemo(() => {
    const geo  = new THREE.BufferGeometry()
    const pos  = new Float32Array(NEBULA_COUNT * 3)
    const cols = new Float32Array(NEBULA_COUNT * 3)

    for (let i = 0; i < NEBULA_COUNT; i++) {
      const angle  = (i / NEBULA_COUNT) * Math.PI * 2
      const radius = 12 + (Math.random() - 0.5) * 6
      const spread = (Math.random() - 0.5) * 2

      pos[i * 3]     = Math.cos(angle) * radius + spread * 0.5
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3
      pos[i * 3 + 2] = Math.sin(angle) * radius + spread * 0.5

      // Colours cycle between amber, orange, brown
      const t = Math.random()
      cols[i * 3]     = 0.5 + t * 0.5
      cols[i * 3 + 1] = 0.2 + t * 0.3
      cols[i * 3 + 2] = 0.05
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos,  3))
    geo.setAttribute('color',    new THREE.BufferAttribute(cols, 3))
    return geo
  }, [])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.015
      groupRef.current.rotation.x += delta * 0.004
    }
  })

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <pointsMaterial
          size={0.05}
          vertexColors
          transparent
          opacity={0.55}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  )
}

// ── Subtle camera drift on mouse ─────────────────────────────────────────────
function CameraDrift() {
  const { camera } = useThree()
  const target      = useRef(new THREE.Vector3())
  const mouseNDC    = useRef(new THREE.Vector2())

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseNDC.current.x =  (e.clientX / window.innerWidth)  * 2 - 1
      mouseNDC.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useFrame(() => {
    target.current.set(mouseNDC.current.x * 0.4, mouseNDC.current.y * 0.25, 5)
    camera.position.lerp(target.current, 0.02)
    camera.lookAt(0, 0, 0)
  })

  return null
}

// ── Root exported component ──────────────────────────────────────────────────
export function UniverseBackground() {
  return (
    <div
      id="universe-canvas"
      aria-hidden="true"
      style={{ background: '#050510' }}
    >
      <Canvas
        style={{ width: '100%', height: '100%' }}
        camera={{ position: [0, 0, 5], fov: 75, near: 0.1, far: 1000 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false }}
      >
        <color attach="background" args={['#050510']} />
        <Suspense fallback={null}>
          {/* Deep background stars — provided by drei */}
          <Stars
            radius={100}
            depth={60}
            count={6000}
            factor={3}
            saturation={0.1}
            fade
            speed={0.4}
          />
          {/* Amber interactive foreground stars */}
          <InteractiveStars />
          {/* Rotating nebula ring */}
          <NebulaRing />
          {/* Camera drifts subtly with mouse */}
          <CameraDrift />
        </Suspense>
      </Canvas>
    </div>
  )
}
