/**
 * Material Factory for 3D Warehouse Visualization
 * Creates and caches Three.js materials for warehouse elements
 */

import * as THREE from 'three'
import {
  DEFAULT_COLOR_SCHEME,
  DEFAULT_STOCK_THRESHOLDS,
  type WarehouseColorScheme,
  type StockThresholds
} from '../types/warehouse3d'

// Material cache for reuse
const materialCache = new Map<string, THREE.Material>()

/**
 * Get or create a cached material
 */
function getCachedMaterial<T extends THREE.Material>(
  key: string,
  factory: () => T
): T {
  if (!materialCache.has(key)) {
    materialCache.set(key, factory())
  }
  return materialCache.get(key) as T
}

/**
 * Create floor material
 */
export function createFloorMaterial(
  colors: WarehouseColorScheme = DEFAULT_COLOR_SCHEME
): THREE.MeshStandardMaterial {
  return getCachedMaterial('floor', () =>
    new THREE.MeshStandardMaterial({
      color: colors.floor,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    })
  )
}

/**
 * Create rack frame material (posts and beams)
 */
export function createRackFrameMaterial(
  colors: WarehouseColorScheme = DEFAULT_COLOR_SCHEME
): THREE.MeshStandardMaterial {
  return getCachedMaterial('rackFrame', () =>
    new THREE.MeshStandardMaterial({
      color: colors.rackFrame,
      roughness: 0.6,
      metalness: 0.3
    })
  )
}

/**
 * Create shelf material
 */
export function createShelfMaterial(
  colors: WarehouseColorScheme = DEFAULT_COLOR_SCHEME
): THREE.MeshStandardMaterial {
  return getCachedMaterial('shelf', () =>
    new THREE.MeshStandardMaterial({
      color: colors.shelf,
      roughness: 0.7,
      metalness: 0.2
    })
  )
}

/**
 * Get pallet color based on stock quantity
 */
export function getPalletColorByQuantity(
  quantity: number,
  thresholds: StockThresholds = DEFAULT_STOCK_THRESHOLDS,
  colors: WarehouseColorScheme = DEFAULT_COLOR_SCHEME
): number {
  if (quantity <= thresholds.outOfStock) return colors.palletOutOfStock
  if (quantity < thresholds.low) return colors.palletLow
  if (quantity < thresholds.medium) return colors.palletMedium
  return colors.palletHigh
}

/**
 * Create pallet material based on stock quantity
 * Note: These are NOT cached as color varies per pallet
 */
export function createPalletMaterial(
  quantity: number = 0,
  thresholds: StockThresholds = DEFAULT_STOCK_THRESHOLDS,
  colors: WarehouseColorScheme = DEFAULT_COLOR_SCHEME
): THREE.MeshStandardMaterial {
  const color = getPalletColorByQuantity(quantity, thresholds, colors)
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    metalness: 0.0
  })
}

/**
 * Create empty pallet slot material (placeholder)
 */
export function createEmptyPalletMaterial(
  colors: WarehouseColorScheme = DEFAULT_COLOR_SCHEME
): THREE.MeshStandardMaterial {
  return getCachedMaterial('palletEmpty', () =>
    new THREE.MeshStandardMaterial({
      color: colors.palletEmpty,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.3
    })
  )
}

/**
 * Create selection highlight material
 */
export function createSelectionMaterial(
  colors: WarehouseColorScheme = DEFAULT_COLOR_SCHEME
): THREE.MeshBasicMaterial {
  return getCachedMaterial('selection', () =>
    new THREE.MeshBasicMaterial({
      color: colors.selection,
      transparent: true,
      opacity: 0.5,
      side: THREE.BackSide
    })
  )
}

/**
 * Create hover highlight material
 */
export function createHoverMaterial(
  colors: WarehouseColorScheme = DEFAULT_COLOR_SCHEME
): THREE.MeshBasicMaterial {
  return getCachedMaterial('hover', () =>
    new THREE.MeshBasicMaterial({
      color: colors.hover,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    })
  )
}

/**
 * Create wireframe material for grid overlay
 */
export function createGridMaterial(): THREE.LineBasicMaterial {
  return getCachedMaterial('grid', () =>
    new THREE.LineBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.5
    })
  )
}

/**
 * Dispose all cached materials
 * Call this on component unmount
 */
export function disposeMaterials(): void {
  materialCache.forEach((material) => material.dispose())
  materialCache.clear()
}

