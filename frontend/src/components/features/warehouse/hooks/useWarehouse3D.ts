/**
 * useWarehouse3D Hook
 * Core Three.js scene setup: scene, camera, renderer, controls, and lighting
 *
 * IMPORTANT: The scene initialization runs ONCE on mount. Config and callbacks
 * are read from refs so that re-renders do NOT destroy and recreate the scene.
 */

import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import type { WarehouseSceneConfig } from '../types/warehouse3d'
import { DEFAULT_SCENE_CONFIG } from '../types/warehouse3d'
import { createFloorPlane } from '../utils/geometryFactory'
import { disposeMaterials } from '../utils/materialFactory'
import { disposeGeometries } from '../utils/geometryFactory'

export interface UseWarehouse3DOptions {
  config?: Partial<WarehouseSceneConfig>
  onSceneReady?: (scene: THREE.Scene) => void
}

export interface UseWarehouse3DReturn {
  containerRef: React.RefObject<HTMLDivElement>
  sceneRef: React.RefObject<THREE.Scene | null>
  cameraRef: React.RefObject<THREE.PerspectiveCamera | null>
  rendererRef: React.RefObject<THREE.WebGLRenderer | null>
  controlsRef: React.RefObject<OrbitControls | null>
  labelRendererRef: React.RefObject<CSS2DRenderer | null>
  warehouseGroupRef: React.RefObject<THREE.Group | null>
  resize: () => void
  render: () => void
}

export function useWarehouse3D(options: UseWarehouse3DOptions = {}): UseWarehouse3DReturn {
  // Store callback and config in refs to avoid re-creating the entire scene on re-render.
  // Previously, config and options were in the useEffect deps, causing the scene to be
  // torn down and rebuilt on every state change (click, hover, save, mode toggle).
  const onSceneReadyRef = useRef(options.onSceneReady)
  onSceneReadyRef.current = options.onSceneReady

  const configRef = useRef({ ...DEFAULT_SCENE_CONFIG, ...options.config })

  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const labelRendererRef = useRef<CSS2DRenderer | null>(null)
  const warehouseGroupRef = useRef<THREE.Group | null>(null)
  const animationFrameRef = useRef<number>(0)

  // Render function (stable - reads from refs)
  const render = useCallback(() => {
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
      if (labelRendererRef.current) {
        labelRendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }
  }, [])

  // Resize handler (stable - reads from refs)
  const resize = useCallback(() => {
    const container = containerRef.current
    if (!container || !cameraRef.current || !rendererRef.current) return

    const width = container.clientWidth
    const height = container.clientHeight

    cameraRef.current.aspect = width / height
    cameraRef.current.updateProjectionMatrix()

    rendererRef.current.setSize(width, height)
    if (labelRendererRef.current) {
      labelRendererRef.current.setSize(width, height)
    }

    render()
  }, [render])

  // Initialize scene ONCE on mount
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const config = configRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Create scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.set(
      config.cameraPosition.x,
      config.cameraPosition.y,
      config.cameraPosition.z
    )
    cameraRef.current = camera

    // Create WebGL renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = config.shadowsEnabled
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    // Use outputEncoding for Three.js r146 (outputColorSpace is r152+)
    renderer.outputEncoding = THREE.sRGBEncoding
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Create CSS2D label renderer
    const labelRenderer = new CSS2DRenderer()
    labelRenderer.setSize(width, height)
    labelRenderer.domElement.style.position = 'absolute'
    labelRenderer.domElement.style.top = '0'
    labelRenderer.domElement.style.left = '0'
    labelRenderer.domElement.style.pointerEvents = 'none'
    container.appendChild(labelRenderer.domElement)
    labelRendererRef.current = labelRenderer

    // Create orbit controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 5
    controls.maxDistance = 100
    controls.maxPolarAngle = Math.PI / 2 - 0.1 // Prevent going below floor
    controls.target.set(config.dimensions.width / 2, 0, config.dimensions.depth / 2)
    controlsRef.current = controls

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(30, 50, 30)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 200
    directionalLight.shadow.camera.left = -50
    directionalLight.shadow.camera.right = 50
    directionalLight.shadow.camera.top = 50
    directionalLight.shadow.camera.bottom = -50
    scene.add(directionalLight)

    // Add floor with grid
    const floor = createFloorPlane(
      config.dimensions.width,
      config.dimensions.depth,
      config.gridSize
    )
    scene.add(floor)

    // Create warehouse container group
    const warehouseGroup = new THREE.Group()
    warehouseGroup.name = 'warehouse'
    scene.add(warehouseGroup)
    warehouseGroupRef.current = warehouseGroup

    // Notify parent that scene is ready (read from ref for latest callback)
    onSceneReadyRef.current?.(scene)

    // Start animation loop using local variables (no stale closure issues)
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
      labelRenderer.render(scene, camera)
    }
    animate()

    // Cleanup on unmount only
    return () => {
      cancelAnimationFrame(animationFrameRef.current)

      // Dispose of scene resources
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose()
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose())
          } else {
            object.material?.dispose()
          }
        }
      })

      // Dispose cached resources
      disposeMaterials()
      disposeGeometries()

      // Remove renderers from DOM
      renderer.dispose()
      container.removeChild(renderer.domElement)
      container.removeChild(labelRenderer.domElement)

      // Clear refs
      sceneRef.current = null
      cameraRef.current = null
      rendererRef.current = null
      controlsRef.current = null
      labelRendererRef.current = null
      warehouseGroupRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps: init once on mount. Config/callbacks read from refs.

  return {
    containerRef,
    sceneRef,
    cameraRef,
    rendererRef,
    controlsRef,
    labelRendererRef,
    warehouseGroupRef,
    resize,
    render
  }
}

