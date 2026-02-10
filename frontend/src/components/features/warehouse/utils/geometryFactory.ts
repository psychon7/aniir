/**
 * Geometry Factory for 3D Warehouse Visualization
 * Creates procedural Three.js geometry for warehouse elements
 */

import * as THREE from 'three'
import {
  DEFAULT_RACK_GEOMETRY,
  DEFAULT_PALLET_GEOMETRY,
  type RackGeometryConfig,
  type PalletGeometryConfig,
  type RackConfig,
  type Warehouse3DUserData
} from '../types/warehouse3d'
import {
  createRackFrameMaterial,
  createShelfMaterial,
  createPalletMaterial,
  createEmptyPalletMaterial
} from './materialFactory'

// Geometry cache for reuse
const geometryCache = new Map<string, THREE.BufferGeometry>()

/**
 * Get or create a cached geometry
 */
function getCachedGeometry<T extends THREE.BufferGeometry>(
  key: string,
  factory: () => T
): T {
  if (!geometryCache.has(key)) {
    geometryCache.set(key, factory())
  }
  return geometryCache.get(key) as T
}

/**
 * Create a single post (vertical support) for a rack
 */
function createPost(height: number, config: RackGeometryConfig): THREE.BufferGeometry {
  const key = `post_${height}_${config.postSize}`
  return getCachedGeometry(key, () =>
    new THREE.BoxGeometry(config.postSize, height, config.postSize)
  )
}

/**
 * Create a horizontal beam connecting posts
 */
function createBeam(length: number, config: RackGeometryConfig): THREE.BufferGeometry {
  const key = `beam_${length}_${config.beamHeight}_${config.beamDepth}`
  return getCachedGeometry(key, () =>
    new THREE.BoxGeometry(length, config.beamHeight, config.beamDepth)
  )
}

/**
 * Create a shelf surface
 */
function createShelfGeometry(
  width: number,
  depth: number,
  config: RackGeometryConfig
): THREE.BufferGeometry {
  const key = `shelf_${width}_${depth}_${config.shelfThickness}`
  return getCachedGeometry(key, () =>
    new THREE.BoxGeometry(width, config.shelfThickness, depth)
  )
}

/**
 * Create pallet geometry
 */
export function createPalletGeometry(
  config: PalletGeometryConfig = DEFAULT_PALLET_GEOMETRY
): THREE.BufferGeometry {
  const key = `pallet_${config.width}_${config.depth}_${config.height}`
  return getCachedGeometry(key, () =>
    new THREE.BoxGeometry(config.width, config.height, config.depth)
  )
}

/**
 * Create a complete rack structure as a Group
 */
export function createRackGroup(
  rackConfig: RackConfig,
  geoConfig: RackGeometryConfig = DEFAULT_RACK_GEOMETRY,
  palletConfig: PalletGeometryConfig = DEFAULT_PALLET_GEOMETRY
): THREE.Group {
  const group = new THREE.Group()
  group.name = `rack_${rackConfig.id}`
  
  const { width, depth, height } = rackConfig.dimensions
  const { levels, bays, id } = rackConfig
  
  // Set user data for selection
  const userData: Warehouse3DUserData = {
    type: 'rack',
    id,
    isSelectable: true,
    isDraggable: true
  }
  group.userData = userData
  
  const frameMaterial = createRackFrameMaterial()
  const shelfMaterial = createShelfMaterial()
  
  // Create 4 corner posts
  const postGeometry = createPost(height, geoConfig)
  const postPositions = [
    [0, 0],
    [width - geoConfig.postSize, 0],
    [0, depth - geoConfig.postSize],
    [width - geoConfig.postSize, depth - geoConfig.postSize]
  ]
  
  postPositions.forEach(([x, z], index) => {
    const post = new THREE.Mesh(postGeometry, frameMaterial)
    post.position.set(
      x + geoConfig.postSize / 2,
      height / 2,
      z + geoConfig.postSize / 2
    )
    post.castShadow = true
    post.receiveShadow = true
    post.name = `post_${index}`
    group.add(post)
  })
  
  // Create horizontal beams and shelves for each level
  const levelHeight = height / levels
  const beamGeometryWidth = createBeam(width - 2 * geoConfig.postSize, geoConfig)
  const beamGeometryDepth = createBeam(depth - 2 * geoConfig.postSize, geoConfig)
  const shelfGeometry = createShelfGeometry(
    width - 2 * geoConfig.postSize,
    depth - 2 * geoConfig.postSize,
    geoConfig
  )
  
  for (let level = 0; level < levels; level++) {
    const levelY = (level + 1) * levelHeight - geoConfig.beamHeight / 2
    
    // Front and back beams
    const frontBeam = new THREE.Mesh(beamGeometryWidth, frameMaterial)
    frontBeam.position.set(width / 2, levelY, geoConfig.postSize / 2)
    frontBeam.castShadow = true
    group.add(frontBeam)
    
    const backBeam = new THREE.Mesh(beamGeometryWidth, frameMaterial)
    backBeam.position.set(width / 2, levelY, depth - geoConfig.postSize / 2)
    backBeam.castShadow = true
    group.add(backBeam)
    
    // Side beams
    const leftBeam = new THREE.Mesh(beamGeometryDepth, frameMaterial)
    leftBeam.position.set(geoConfig.postSize / 2, levelY, depth / 2)
    leftBeam.rotation.y = Math.PI / 2
    leftBeam.castShadow = true
    group.add(leftBeam)
    
    const rightBeam = new THREE.Mesh(beamGeometryDepth, frameMaterial)
    rightBeam.position.set(width - geoConfig.postSize / 2, levelY, depth / 2)
    rightBeam.rotation.y = Math.PI / 2
    rightBeam.castShadow = true
    group.add(rightBeam)
  }
  
  // Create shelves and pallet slots
  for (let level = 0; level < levels; level++) {
    const shelfY = (level + 1) * levelHeight - geoConfig.beamHeight - geoConfig.shelfThickness / 2

    // Shelf surface
    const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial)
    shelf.position.set(width / 2, shelfY, depth / 2)
    shelf.receiveShadow = true
    shelf.name = `shelf_${level}`

    const shelfUserData: Warehouse3DUserData = {
      type: 'shelf',
      id: `${id}_shelf_${level}`,
      rackId: id,
      shelfLevel: level,
      isSelectable: true,
      isDraggable: false
    }
    shelf.userData = shelfUserData
    group.add(shelf)

    // Create pallet slots for this level
    const palletSlotWidth = (width - 2 * geoConfig.postSize) / bays
    const palletGeometry = createPalletGeometry(palletConfig)
    const emptyMaterial = createEmptyPalletMaterial()

    for (let bay = 0; bay < bays; bay++) {
      // Find if there's stock assigned to this slot
      const shelfConfig = rackConfig.shelves.find(s => s.level === level)
      const palletSlot = shelfConfig?.pallets.find(p => p.bay === bay)

      const pallet = new THREE.Mesh(
        palletGeometry,
        palletSlot?.stkId ? createPalletMaterial(0) : emptyMaterial
      )

      const palletX = geoConfig.postSize + (bay + 0.5) * palletSlotWidth
      const palletY = shelfY + geoConfig.shelfThickness / 2 + palletConfig.height / 2

      pallet.position.set(palletX, palletY, depth / 2)
      pallet.castShadow = true
      pallet.name = `pallet_${level}_${bay}`

      const palletUserData: Warehouse3DUserData = {
        type: 'pallet',
        id: `${id}_pallet_${level}_${bay}`,
        rackId: id,
        shelfLevel: level,
        bay,
        binId: palletSlot?.binId || `${id}-${String(level).padStart(2, '0')}-${String(bay).padStart(2, '0')}`,
        stkId: palletSlot?.stkId,
        isSelectable: true,
        isDraggable: false
      }
      pallet.userData = palletUserData
      group.add(pallet)
    }
  }

  return group
}

/**
 * Create floor plane with grid
 */
export function createFloorPlane(
  width: number,
  depth: number,
  gridSize: number
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'floor'

  // Main floor plane
  const floorGeometry = new THREE.PlaneGeometry(width, depth)
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide
  })

  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.set(width / 2, 0, depth / 2)
  floor.receiveShadow = true
  floor.name = 'floorMesh'

  const floorUserData: Warehouse3DUserData = {
    type: 'floor',
    id: 'floor',
    isSelectable: false,
    isDraggable: false
  }
  floor.userData = floorUserData
  group.add(floor)

  // Grid helper
  const gridHelper = new THREE.GridHelper(
    Math.max(width, depth),
    Math.max(width, depth) / gridSize,
    0x444444,
    0x888888
  )
  gridHelper.position.set(width / 2, 0.01, depth / 2)
  group.add(gridHelper)

  return group
}

/**
 * Update pallet material based on stock quantity
 */
export function updatePalletMaterial(
  pallet: THREE.Mesh,
  quantity: number,
  productRef?: string,
  productName?: string
): void {
  // Dispose old material if not cached
  if (pallet.material instanceof THREE.Material) {
    const oldMaterial = pallet.material as THREE.MeshStandardMaterial
    if (oldMaterial.opacity === 1) {
      oldMaterial.dispose()
    }
  }

  pallet.material = createPalletMaterial(quantity)

  // Update user data
  const userData = pallet.userData as Warehouse3DUserData
  userData.quantity = quantity
  userData.productRef = productRef
  userData.productName = productName
}

/**
 * Dispose all cached geometries
 * Call this on component unmount
 */
export function disposeGeometries(): void {
  geometryCache.forEach((geometry) => geometry.dispose())
  geometryCache.clear()
}

