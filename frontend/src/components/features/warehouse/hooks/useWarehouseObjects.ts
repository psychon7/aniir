/**
 * useWarehouseObjects Hook
 * Manages warehouse 3D objects: racks, shelves, and pallets
 */

import { useCallback, useRef } from 'react'
import * as THREE from 'three'
import { v4 as uuidv4 } from 'uuid'
import type {
  RackConfig,
  WarehouseLayout,
  Warehouse3DUserData,
  ShelfConfig,
  PalletSlot
} from '../types/warehouse3d'
import { createRackGroup, updatePalletMaterial } from '../utils/geometryFactory'
import { createRackLabel, createPalletLabel, removeLabels } from '../utils/labelRenderer'
import type { StockListItem } from '@/types/warehouse'

export interface UseWarehouseObjectsOptions {
  warehouseGroup: THREE.Group | null
  onLayoutChange?: (layout: WarehouseLayout) => void
}

export interface UseWarehouseObjectsReturn {
  rackMapRef: React.RefObject<Map<string, THREE.Group>>
  palletMapRef: React.RefObject<Map<number, THREE.Mesh>>
  addRack: (position: { x: number; z: number }, config?: Partial<RackConfig>) => string | null
  removeRack: (rackId: string) => boolean
  updateRack: (rackId: string, updates: Partial<RackConfig>) => boolean
  addShelfLevel: (rackId: string) => boolean
  removeShelfLevel: (rackId: string) => boolean
  assignStockToPallet: (
    rackId: string,
    level: number,
    bay: number,
    stock: StockListItem
  ) => boolean
  clearPallet: (rackId: string, level: number, bay: number) => boolean
  loadLayout: (layout: WarehouseLayout) => void
  clearWarehouse: () => void
  syncStockData: (stockItems: StockListItem[]) => void
  getLayout: () => WarehouseLayout
}

const DEFAULT_RACK_CONFIG: Omit<RackConfig, 'id' | 'position'> = {
  dimensions: { width: 3, depth: 1.5, height: 4 },
  levels: 3,
  bays: 2,
  shelves: []
}

export function useWarehouseObjects(
  options: UseWarehouseObjectsOptions
): UseWarehouseObjectsReturn {
  const { warehouseGroup, onLayoutChange } = options
  
  // Maps for quick lookup
  const rackMapRef = useRef<Map<string, THREE.Group>>(new Map())
  const palletMapRef = useRef<Map<number, THREE.Mesh>>(new Map()) // stkId -> pallet mesh
  const layoutRef = useRef<WarehouseLayout>({
    version: '1.0.0',
    dimensions: { width: 50, depth: 30, height: 10 },
    gridSize: 1,
    racks: [],
    aisles: []
  })

  // Generate initial shelf configs
  const generateShelfConfigs = (levels: number, bays: number): ShelfConfig[] => {
    const shelves: ShelfConfig[] = []
    for (let level = 0; level < levels; level++) {
      const pallets: PalletSlot[] = []
      for (let bay = 0; bay < bays; bay++) {
        pallets.push({ bay, binId: '' })
      }
      shelves.push({ level, pallets })
    }
    return shelves
  }

  // Add a new rack
  const addRack = useCallback(
    (position: { x: number; z: number }, config?: Partial<RackConfig>): string | null => {
      if (!warehouseGroup) return null

      const id = config?.id || `rack_${uuidv4().slice(0, 8)}`
      const rackConfig: RackConfig = {
        ...DEFAULT_RACK_CONFIG,
        ...config,
        id,
        position: { x: position.x, y: 0, z: position.z },
        shelves: config?.shelves || generateShelfConfigs(
          config?.levels || DEFAULT_RACK_CONFIG.levels,
          config?.bays || DEFAULT_RACK_CONFIG.bays
        )
      }

      // Update shelf bin IDs
      rackConfig.shelves.forEach((shelf) => {
        shelf.pallets.forEach((pallet) => {
          if (!pallet.binId) {
            pallet.binId = `${id.replace('rack_', '')}-${String(shelf.level + 1).padStart(2, '0')}-${String(pallet.bay + 1).padStart(2, '0')}`
          }
        })
      })

      const rackGroup = createRackGroup(rackConfig)
      rackGroup.position.set(position.x, 0, position.z)
      
      // Add rack label
      const label = createRackLabel(id, rackConfig.levels, rackConfig.bays)
      label.position.set(
        rackConfig.dimensions.width / 2,
        rackConfig.dimensions.height + 0.5,
        rackConfig.dimensions.depth / 2
      )
      rackGroup.add(label)

      warehouseGroup.add(rackGroup)
      rackMapRef.current.set(id, rackGroup)

      // Update layout
      layoutRef.current.racks.push(rackConfig)
      onLayoutChange?.(layoutRef.current)

      return id
    },
    [warehouseGroup, onLayoutChange]
  )

  // Remove a rack
  const removeRack = useCallback(
    (rackId: string): boolean => {
      if (!warehouseGroup) return false

      const rack = rackMapRef.current.get(rackId)
      if (!rack) return false

      // Remove labels
      removeLabels(rack)

      // Dispose geometries and materials
      rack.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material?.dispose()
          }
        }
      })

      warehouseGroup.remove(rack)
      rackMapRef.current.delete(rackId)

      // Update layout
      layoutRef.current.racks = layoutRef.current.racks.filter((r) => r.id !== rackId)
      onLayoutChange?.(layoutRef.current)

      return true
    },
    [warehouseGroup, onLayoutChange]
  )

  // Update rack properties - placeholder for now
  const updateRack = useCallback(
    (_rackId: string, _updates: Partial<RackConfig>): boolean => {
      // Implementation would require rebuilding the rack geometry
      return false
    },
    []
  )

  return {
    rackMapRef,
    palletMapRef,
    addRack,
    removeRack,
    updateRack,
    addShelfLevel: () => false, // Will implement
    removeShelfLevel: () => false, // Will implement
    assignStockToPallet: () => false, // Will implement
    clearPallet: () => false, // Will implement
    loadLayout: () => {}, // Will implement
    clearWarehouse: () => {}, // Will implement
    syncStockData: () => {}, // Will implement
    getLayout: () => layoutRef.current
  }
}

