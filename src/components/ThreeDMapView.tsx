import { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { type WhiteLabelVenueConfig, type POIItem } from '../types/venueConfig'
import { type RouteResult } from '../utils/pathfinding'

interface ThreeMapProps {
  config: WhiteLabelVenueConfig
  onSelectPOI: (poi: POIItem) => void
  onSelectZone: (zoneId: string) => void
  activeRoute: RouteResult | null
  currentLocation: { x: number; y: number; name: string }
}

const SCALE = 0.1
function toThreeCoord(svgX: number, svgY: number): [number, number] {
  return [(svgX - 320) * SCALE, (svgY - 320) * SCALE]
}

// 3D Text Label Sprite Generator
function createTextSprite(text: string, bgColor = 'rgba(20, 21, 24, 0.85)', textColor = '#ffffff', borderColor = 'rgba(255,255,255,0.2)'): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = bgColor
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.roundRect(8, 8, 240, 48, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = textColor
  ctx.font = 'bold 22px Poppins, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 128, 32)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(spriteMat)
  sprite.scale.set(7, 1.75, 1)
  return sprite
}

export default function ThreeDMapView({
  config,
  onSelectPOI,
  onSelectZone,
  activeRoute,
  currentLocation
}: ThreeMapProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animFrameRef = useRef<number>(0)
  const stagePosRef = useRef({ x: 0, z: 0 })

  const isDragging = useRef(false)
  const previousMousePosition = useRef({ x: 0, y: 0 })
  const sphericalRef = useRef({ radius: 65, theta: Math.PI / 4, phi: Math.PI / 3.2 })
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const routePulseMeshRef = useRef<THREE.Mesh | null>(null)
  const beaconGroupRef = useRef<THREE.Group | null>(null)

  const handlePointerDown = useCallback((e: MouseEvent) => {
    isDragging.current = true
    previousMousePosition.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handlePointerMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - previousMousePosition.current.x
    const dy = e.clientY - previousMousePosition.current.y
    sphericalRef.current.theta -= dx * 0.003
    sphericalRef.current.phi -= dy * 0.003
    sphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphericalRef.current.phi))
    updateCamera()
    previousMousePosition.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const updateCamera = useCallback(() => {
    const { radius, theta, phi } = sphericalRef.current
    if (!cameraRef.current) return
    cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta)
    cameraRef.current.position.y = radius * Math.cos(phi)
    cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta)
    cameraRef.current.lookAt(targetLookAt.current)
  }, [])

  const [bx, bz] = toThreeCoord(currentLocation.x, currentLocation.y)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x08090a)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    cameraRef.current = camera
    updateCamera()

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const ambientLight = new THREE.AmbientLight(0xd0d6e0, 0.65)
    scene.add(ambientLight)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3)
    dirLight.position.set(30, 50, 30)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 1024
    dirLight.shadow.mapSize.height = 1024
    scene.add(dirLight)

    // Floor
    const floorGeo = new THREE.CircleGeometry(30, 48)
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a152e, roughness: 0.9, metalness: 0.1 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    // Main Stage Platform
    const stageGeo = new THREE.CylinderGeometry(3.8, 3.8, 0.8, 32)
    const stageMat = new THREE.MeshStandardMaterial({ color: 0xfaf3e0, roughness: 0.2, metalness: 0.8, emissive: 0x00f0ff, emissiveIntensity: 0.3 })
    const stagePlatform = new THREE.Mesh(stageGeo, stageMat)
    const [stX, stZ] = toThreeCoord(320, 290)
    stagePosRef.current = { x: stX, z: stZ }
    stagePlatform.position.set(stX, 2.9, stZ)
    stagePlatform.castShadow = true
    scene.add(stagePlatform)

    // Main Bowl Amphitheatre
    const bowlGeo = new THREE.CylinderGeometry(16.5, 14, 2.5, 48)
    const bowlMat = new THREE.MeshStandardMaterial({ color: 0x3f0f8a, roughness: 0.5, metalness: 0.4 })
    const bowlMesh = new THREE.Mesh(bowlGeo, bowlMat)
    bowlMesh.position.y = 1.25
    bowlMesh.castShadow = true
    bowlMesh.receiveShadow = true
    scene.add(bowlMesh)

    // Floating 3D Label for Main Bowl
    const bowlLabel = createTextSprite('MAIN STAGE BOWL', 'rgba(63, 15, 138, 0.9)', '#FFFFFF', '#7928CA')
    bowlLabel.position.set(0, 5.5, 0)
    scene.add(bowlLabel)

    // Outer wings
    const wingsData = [
      { id: 'hall-xyz', name: 'HALL XYZ EXPO', color: 0x2e9d8f, labelBg: 'rgba(46, 157, 143, 0.9)', labelBorder: '#38D9A9', width: 9, depth: 8, height: 4.5, pos: [0, -23] },
      { id: 'startup-festival', name: 'STARTUP FESTIVAL', color: 0xe85d3f, labelBg: 'rgba(232, 93, 63, 0.9)', labelBorder: '#FF922B', width: 8, depth: 9, height: 4.5, pos: [23, 0] },
      { id: 'studios', name: 'STUDIOS 2 & 3', color: 0x9ad5b1, labelBg: 'rgba(154, 213, 177, 0.9)', labelBorder: '#69DB7C', width: 8, depth: 9, height: 4.0, pos: [-23, 0] }
    ]

    wingsData.forEach((w) => {
      const wingGeo = new THREE.BoxGeometry(w.width, w.height, w.depth)
      const wingMat = new THREE.MeshStandardMaterial({ color: w.color, roughness: 0.3, metalness: 0.4, transparent: true, opacity: 0.9 })
      const wingMesh = new THREE.Mesh(wingGeo, wingMat)
      wingMesh.position.set(w.pos[0], w.height / 2, w.pos[1])
      wingMesh.castShadow = true
      wingMesh.receiveShadow = true
      scene.add(wingMesh)

      const edges = new THREE.EdgesGeometry(wingGeo)
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }))
      wingMesh.add(line)

      const labelSprite = createTextSprite(w.name, w.labelBg, '#FFFFFF', w.labelBorder)
      labelSprite.position.set(w.pos[0], w.height + 2.2, w.pos[1])
      scene.add(labelSprite)
    })

    // Sponsor booths
    const sponsorBooths = config.pois.filter((p) => p.category === 'sponsor')
    sponsorBooths.forEach((poi) => {
      const [px, pz] = toThreeCoord(poi.x, poi.y)
      const boothGroup = new THREE.Group()
      boothGroup.position.set(px, 0, pz)

      const baseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.5, 16)
      const baseMat = new THREE.MeshStandardMaterial({ color: 0xf5a623, metalness: 0.6, roughness: 0.2 })
      const baseMesh = new THREE.Mesh(baseGeo, baseMat)
      baseMesh.position.y = 0.25
      baseMesh.castShadow = true
      boothGroup.add(baseMesh)

      const diamondGeo = new THREE.OctahedronGeometry(0.7, 0)
      const diamondMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.6, roughness: 0.1, metalness: 0.9 })
      const diamondMesh = new THREE.Mesh(diamondGeo, diamondMat)
      diamondMesh.position.y = 2.8
      boothGroup.add(diamondMesh)

      const spinPillarGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8)
      const spinPillarMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.4, metalness: 0.7, roughness: 0.2 })
      const spinPillar = new THREE.Mesh(spinPillarGeo, spinPillarMat)
      spinPillar.position.y = 3.4
      boothGroup.add(spinPillar)

      const sponsorLabel = createTextSprite(poi.name.split(' ')[0], 'rgba(15, 16, 17, 0.9)', '#F5A623', '#F5A623')
      sponsorLabel.scale.set(4.5, 1.1, 1)
      sponsorLabel.position.set(0, 4.2, 0)
      boothGroup.add(sponsorLabel)

      scene.add(boothGroup)
    })

    // User beacon
    const beaconGroup = new THREE.Group()
    beaconGroup.position.set(bx, 0, bz)

    const beaconPillarGeo = new THREE.ConeGeometry(0.5, 1.8, 16)
    beaconPillarGeo.rotateX(Math.PI)
    const beaconPillarMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.8, metalness: 0.5, roughness: 0.2 })
    const beaconPillar = new THREE.Mesh(beaconPillarGeo, beaconPillarMat)
    beaconPillar.position.y = 2.6
    beaconGroup.add(beaconPillar)

    const pulseRingGeo = new THREE.RingGeometry(0.7, 1.2, 32)
    pulseRingGeo.rotateX(-Math.PI / 2)
    const pulseRingMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
    const pulseRing = new THREE.Mesh(pulseRingGeo, pulseRingMat)
    pulseRing.position.y = 0.05
    beaconGroup.add(pulseRing)

    scene.add(beaconGroup)
    beaconGroupRef.current = beaconGroup

    // Occupancy agents
    const occupancyAgents: { mesh: THREE.Mesh; angle: number; radius: number; speed: number; y: number }[] = []
    const agentGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.55, 6)
    for (let i = 0; i < 28; i++) {
      const load = (i % 5) / 5
      const mat = new THREE.MeshStandardMaterial({ color: load > 0.7 ? 0xe85d3f : load > 0.4 ? 0xf5a623 : 0x10b981, emissive: load > 0.7 ? 0xe85d3f : 0x10b981, emissiveIntensity: 0.25, roughness: 0.4 })
      const mesh = new THREE.Mesh(agentGeo, mat)
      occupancyAgents.push({ mesh, angle: (i / 28) * Math.PI * 2, radius: 12 + (i % 7) * 2.1, speed: 0.08 + (i % 5) * 0.03, y: 0.45 })
      mesh.position.set(0, 0.45, 0)
      scene.add(mesh)
    }

    const clock = new THREE.Clock()
    const pulseGeo = new THREE.RingGeometry(0.5, 0.6, 32)
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.6, depthTest: false })
    const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat)
    pulseMesh.position.y = 0.1
    pulseMesh.visible = false
    scene.add(pulseMesh)
    routePulseMeshRef.current = pulseMesh

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()

      // Simple auto-rotate
      sphericalRef.current.theta += 0.003
      updateCamera()

      occupancyAgents.forEach((agent) => {
        agent.angle += agent.speed * 0.008
        agent.mesh.position.set(Math.cos(agent.angle) * agent.radius, agent.y, Math.sin(agent.angle) * agent.radius)
      })

      beaconGroup.rotation.y = Math.sin(elapsed * 1.5) * 0.02
      beaconGroup.position.set(bx, 0, bz)

      if (activeRoute && routePulseMeshRef.current) {
        routePulseMeshRef.current.visible = true
        routePulseMeshRef.current.position.set(stagePosRef.current.x, 2.5, stagePosRef.current.z)
      } else if (routePulseMeshRef.current) {
        routePulseMeshRef.current.visible = false
      }

      renderer.render(scene, camera)
    }
    animate()

    renderer.domElement.addEventListener('pointerdown', handlePointerDown)
    renderer.domElement.addEventListener('pointermove', handlePointerMove)
    renderer.domElement.addEventListener('pointerup', handlePointerUp)
    renderer.domElement.addEventListener('pointercancel', handlePointerUp)

    const handleResize = () => {
      if (!renderer || !camera) return
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      renderer.dispose()
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
      renderer.domElement.removeEventListener('pointermove', handlePointerMove)
      renderer.domElement.removeEventListener('pointerup', handlePointerUp)
      renderer.domElement.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [currentLocation.x, currentLocation.y, activeRoute])

  return (
    <div className="threejs-map-viewport">
      <div ref={mountRef} className="threejs-canvas-stage" />
    </div>
  )
}