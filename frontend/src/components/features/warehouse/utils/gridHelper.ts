/**
 * Grid Helper Utilities for 3D Warehouse Visualization
 * Snap-to-grid logic and coordinate conversion
 */

import * as THREE from 'three'

/**
 * Snap a position to the nearest grid intersection
 */
export function snapToGrid(
  position: THREE.Vector3,
  gridSize: number
): THREE.Vector3 {
  return new THREE.Vector3(
    Math.round(position.x / gridSize) * gridSize,
    position.y,
    Math.round(position.z / gridSize) * gridSize
  )
}

/**
 * Snap X and Z components to grid (in-place modification)
 */
export function snapToGridInPlace(
  position: THREE.Vector3,
  gridSize: number
): void {
  position.x = Math.round(position.x / gridSize) * gridSize
  position.z = Math.round(position.z / gridSize) * gridSize
}

/**
 * Check if a position is within warehouse bounds
 */
export function isWithinBounds(
  position: THREE.Vector3,
  dimensions: { width: number; depth: number; height: number }
): boolean {
  return (
    position.x >= 0 &&
    position.x <= dimensions.width &&
    position.z >= 0 &&
    position.z <= dimensions.depth
  )
}

/**
 * Get grid cell index from world position
 */
export function getGridCell(
  position: THREE.Vector3,
  gridSize: number
): { row: number; col: number } {
  return {
    col: Math.floor(position.x / gridSize),
    row: Math.floor(position.z / gridSize)
  }
}

/**
 * Get world position from grid cell index
 */
export function gridCellToWorld(
  row: number,
  col: number,
  gridSize: number
): THREE.Vector3 {
  return new THREE.Vector3(
    col * gridSize + gridSize / 2,
    0,
    row * gridSize + gridSize / 2
  )
}

/**
 * Check if placing an object at a position would overlap with existing objects
 */
export function checkCollision(
  newPosition: THREE.Vector3,
  newDimensions: { width: number; depth: number },
  existingObjects: Array<{
    position: { x: number; z: number }
    dimensions: { width: number; depth: number }
  }>,
  minSpacing: number = 0
): boolean {
  const newBounds = {
    minX: newPosition.x - minSpacing,
    maxX: newPosition.x + newDimensions.width + minSpacing,
    minZ: newPosition.z - minSpacing,
    maxZ: newPosition.z + newDimensions.depth + minSpacing
  }

  for (const obj of existingObjects) {
    const existingBounds = {
      minX: obj.position.x,
      maxX: obj.position.x + obj.dimensions.width,
      minZ: obj.position.z,
      maxZ: obj.position.z + obj.dimensions.depth
    }

    // Check for overlap
    if (
      newBounds.minX < existingBounds.maxX &&
      newBounds.maxX > existingBounds.minX &&
      newBounds.minZ < existingBounds.maxZ &&
      newBounds.maxZ > existingBounds.minZ
    ) {
      return true // Collision detected
    }
  }

  return false // No collision
}

/**
 * Calculate valid placement positions for a new rack
 */
export function getValidPlacementPositions(
  gridSize: number,
  warehouseDimensions: { width: number; depth: number },
  rackDimensions: { width: number; depth: number },
  existingRacks: Array<{
    position: { x: number; z: number }
    dimensions: { width: number; depth: number }
  }>,
  minAisleWidth: number
): THREE.Vector3[] {
  const validPositions: THREE.Vector3[] = []
  const cols = Math.floor(warehouseDimensions.width / gridSize)
  const rows = Math.floor(warehouseDimensions.depth / gridSize)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const position = gridCellToWorld(row, col, gridSize)
      
      // Check bounds
      if (position.x + rackDimensions.width > warehouseDimensions.width) continue
      if (position.z + rackDimensions.depth > warehouseDimensions.depth) continue

      // Check collision with spacing for aisles
      if (!checkCollision(position, rackDimensions, existingRacks, minAisleWidth * gridSize)) {
        validPositions.push(position)
      }
    }
  }

  return validPositions
}

/**
 * Convert screen coordinates to normalized device coordinates
 */
export function screenToNDC(
  screenX: number,
  screenY: number,
  canvasWidth: number,
  canvasHeight: number
): THREE.Vector2 {
  return new THREE.Vector2(
    (screenX / canvasWidth) * 2 - 1,
    -(screenY / canvasHeight) * 2 + 1
  )
}

