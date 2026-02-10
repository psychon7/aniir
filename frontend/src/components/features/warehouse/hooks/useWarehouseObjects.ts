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
  warehouseGroupRef: React.RefObject<THREE.Group | null>
  onLayoutChange?: (layout: WarehouseLayout) => void
}

export interface RackProductInfo {
  binId: string
  stkId?: number
  productRef?: string
  productName?: string
  quantity?: number
  level: number
  bay: number
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
  highlightPallet: (binId: string | null) => void
  getRackProducts: (rackId: string) => RackProductInfo[]
  getPalletByBinId: (binId: string) => THREE.Mesh | null
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
  const { warehouseGroupRef, onLayoutChange } = options
  
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
      const warehouseGroup = warehouseGroupRef.current
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

      // Add rack label - positioned at the front bottom of the rack
      const label = createRackLabel(id, rackConfig.levels, rackConfig.bays)
      label.position.set(
        rackConfig.dimensions.width / 2,
        0.3, // Near floor level
        rackConfig.dimensions.depth + 0.3 // In front of the rack
      )
      rackGroup.add(label)

      warehouseGroup.add(rackGroup)
      rackMapRef.current.set(id, rackGroup)

      // Update layout
      layoutRef.current.racks.push(rackConfig)
      onLayoutChange?.(layoutRef.current)

      return id
    },
    [warehouseGroupRef, onLayoutChange]
  )

  // Remove a rack
  const removeRack = useCallback(
    (rackId: string): boolean => {
      const warehouseGroup = warehouseGroupRef.current
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
    [warehouseGroupRef, onLayoutChange]
  )

  // Update rack properties - placeholder for now
  const updateRack = useCallback(
    (_rackId: string, _updates: Partial<RackConfig>): boolean => {
      // Implementation would require rebuilding the rack geometry
      return false
    },
    []
  )

  // Clear all warehouse objects
  const clearWarehouse = useCallback(() => {
    const warehouseGroup = warehouseGroupRef.current
    if (!warehouseGroup) return

    // Remove all racks
    rackMapRef.current.forEach((rack) => {
      removeLabels(rack)
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
    })

    rackMapRef.current.clear()
    palletMapRef.current.clear()
    layoutRef.current.racks = []
    layoutRef.current.aisles = []
    onLayoutChange?.(layoutRef.current)
  }, [warehouseGroupRef, onLayoutChange])

  // Load a layout
  const loadLayout = useCallback(
    (layout: WarehouseLayout) => {
      const warehouseGroup = warehouseGroupRef.current
      if (!warehouseGroup) return

      // Clear existing
      clearWarehouse()

      // Update layout ref
      layoutRef.current = { ...layout }

      // Create racks from layout
      layout.racks.forEach((rackConfig) => {
        const rackGroup = createRackGroup(rackConfig)
        rackGroup.position.set(rackConfig.position.x, 0, rackConfig.position.z)

        // Add rack label - positioned at the front bottom of the rack
        const label = createRackLabel(rackConfig.id, rackConfig.levels, rackConfig.bays)
        label.position.set(
          rackConfig.dimensions.width / 2,
          0.3, // Near floor level
          rackConfig.dimensions.depth + 0.3 // In front of the rack
        )
        rackGroup.add(label)

        warehouseGroup.add(rackGroup)
        rackMapRef.current.set(rackConfig.id, rackGroup)
      })

      onLayoutChange?.(layoutRef.current)
    },
    [warehouseGroupRef, clearWarehouse, onLayoutChange]
  )

  // Sync stock data to pallets
  const syncStockData = useCallback(
    (stockItems: StockListItem[]) => {
      // Map stock items by bin location
      const stockByBin = new Map<string, StockListItem>()
      stockItems.forEach((item) => {
        if (item.bin_location) {
          stockByBin.set(item.bin_location, item)
        }
      })

      // Update pallet materials based on stock
      rackMapRef.current.forEach((rackGroup) => {
        rackGroup.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const userData = child.userData as Warehouse3DUserData
            if (userData.type === 'pallet' && userData.binId) {
              const stock = stockByBin.get(userData.binId)
              if (stock) {
                userData.stkId = stock.stk_id
                userData.productRef = stock.product_ref
                userData.productName = stock.product_name
                userData.quantity = stock.stk_quantity_available || 0
                updatePalletMaterial(child, userData.quantity)
                palletMapRef.current.set(stock.stk_id, child)

                // Add pallet label
                const label = createPalletLabel(
                  stock.product_ref || '',
                  stock.product_name || '',
                  userData.quantity,
                  userData.binId
                )
                label.position.set(0, 0.3, 0)
                child.add(label)
              }
            }
          }
        })
      })
    },
    []
  )

  // Assign stock to a specific pallet
  const assignStockToPallet = useCallback(
    (rackId: string, level: number, bay: number, stock: StockListItem): boolean => {
      const rack = rackMapRef.current.get(rackId)
      if (!rack) return false

      const binId = `${rackId.replace('rack_', '')}-${String(level + 1).padStart(2, '0')}-${String(bay + 1).padStart(2, '0')}`

      rack.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const userData = child.userData as Warehouse3DUserData
          if (userData.type === 'pallet' && userData.binId === binId) {
            userData.stkId = stock.stk_id
            userData.productRef = stock.product_ref
            userData.productName = stock.product_name
            userData.quantity = stock.stk_quantity_available || 0
            updatePalletMaterial(child, userData.quantity)
            palletMapRef.current.set(stock.stk_id, child)
          }
        }
      })

      // Update layout
      const rackConfig = layoutRef.current.racks.find((r) => r.id === rackId)
      if (rackConfig) {
        const shelf = rackConfig.shelves.find((s) => s.level === level)
        if (shelf) {
          const pallet = shelf.pallets.find((p) => p.bay === bay)
          if (pallet) {
            pallet.stkId = stock.stk_id
          }
        }
      }

      onLayoutChange?.(layoutRef.current)
      return true
    },
    [onLayoutChange]
  )

  // Clear a pallet
  const clearPallet = useCallback(
    (rackId: string, level: number, bay: number): boolean => {
      const rack = rackMapRef.current.get(rackId)
      if (!rack) return false

      const binId = `${rackId.replace('rack_', '')}-${String(level + 1).padStart(2, '0')}-${String(bay + 1).padStart(2, '0')}`

      rack.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const userData = child.userData as Warehouse3DUserData
          if (userData.type === 'pallet' && userData.binId === binId) {
            if (userData.stkId) {
              palletMapRef.current.delete(userData.stkId)
            }
            userData.stkId = undefined
            userData.productRef = undefined
            userData.productName = undefined
            userData.quantity = undefined
            updatePalletMaterial(child, 0)
            removeLabels(child)
          }
        }
      })

      // Update layout
      const rackConfig = layoutRef.current.racks.find((r) => r.id === rackId)
      if (rackConfig) {
        const shelf = rackConfig.shelves.find((s) => s.level === level)
        if (shelf) {
          const pallet = shelf.pallets.find((p) => p.bay === bay)
          if (pallet) {
            pallet.stkId = undefined
          }
        }
      }

      onLayoutChange?.(layoutRef.current)
      return true
    },
    [onLayoutChange]
  )

  // Track highlighted pallet for cleanup
  const highlightedPalletRef = useRef<THREE.Mesh | null>(null)
  const originalMaterialRef = useRef<THREE.Material | THREE.Material[] | null>(null)

  // Get pallet mesh by bin ID
  const getPalletByBinId = useCallback((binId: string): THREE.Mesh | null => {
    let foundPallet: THREE.Mesh | null = null
    rackMapRef.current.forEach((rackGroup) => {
      rackGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const userData = child.userData as Warehouse3DUserData
          if (userData.type === 'pallet' && userData.binId === binId) {
            foundPallet = child
          }
        }
      })
    })
    return foundPallet
  }, [])

  // Highlight a specific pallet by bin ID
  const highlightPallet = useCallback((binId: string | null) => {
    // Restore previous highlight
    if (highlightedPalletRef.current && originalMaterialRef.current) {
      highlightedPalletRef.current.material = originalMaterialRef.current
      highlightedPalletRef.current = null
      originalMaterialRef.current = null
    }

    if (!binId) return

    const pallet = getPalletByBinId(binId)
    if (pallet) {
      // Store original material
      originalMaterialRef.current = pallet.material
      highlightedPalletRef.current = pallet

      // Apply highlight material (bright yellow/gold)
      pallet.material = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.5,
        metalness: 0.3,
        roughness: 0.5
      })
    }
  }, [getPalletByBinId])

  // Get all products in a specific rack
  const getRackProducts = useCallback((rackId: string): RackProductInfo[] => {
    const products: RackProductInfo[] = []
    const rack = rackMapRef.current.get(rackId)
    if (!rack) return products

    rack.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const userData = child.userData as Warehouse3DUserData
        if (userData.type === 'pallet' && userData.binId) {
          products.push({
            binId: userData.binId,
            stkId: userData.stkId,
            productRef: userData.productRef,
            productName: userData.productName,
            quantity: userData.quantity,
            level: userData.shelfLevel ?? 0,
            bay: userData.bay ?? 0
          })
        }
      }
    })

    // Sort by level then bay
    return products.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level
      return a.bay - b.bay
    })
  }, [])

  return {
    rackMapRef,
    palletMapRef,
    addRack,
    removeRack,
    updateRack,
    addShelfLevel: () => false, // Complex - requires geometry rebuild
    removeShelfLevel: () => false, // Complex - requires geometry rebuild
    assignStockToPallet,
    clearPallet,
    loadLayout,
    clearWarehouse,
    syncStockData,
    getLayout: () => layoutRef.current,
    highlightPallet,
    getRackProducts,
    getPalletByBinId
  }
}

