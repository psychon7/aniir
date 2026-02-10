/**
 * 3D Warehouse Visualization Type Definitions
 * TypeScript interfaces for warehouse layout schema, objects, and interactions
 */

import type { Object3D, Vector3 } from 'three'

// =============================================================================
// Layout Schema Types (JSON Persistence)
// =============================================================================

/**
 * Pallet slot within a shelf
 */
export interface PalletSlot {
  bay: number
  binId: string
  stkId?: number // Maps to StockListItem.stk_id
}

/**
 * Shelf within a rack
 */
export interface ShelfConfig {
  level: number
  pallets: PalletSlot[]
}

/**
 * Rack configuration
 */
export interface RackConfig {
  id: string
  position: { x: number; y: number; z: number }
  dimensions: { width: number; depth: number; height: number }
  levels: number
  bays: number
  shelves: ShelfConfig[]
}

/**
 * Aisle configuration
 */
export interface AisleConfig {
  id: string
  start: { x: number; z: number }
  end: { x: number; z: number }
  width: number
}

/**
 * Complete warehouse layout schema for save/load
 */
export interface WarehouseLayout {
  version: string
  warehouseId?: number
  name?: string
  dimensions: { width: number; depth: number; height: number }
  gridSize: number
  racks: RackConfig[]
  aisles: AisleConfig[]
  createdAt?: string
  updatedAt?: string
}

// =============================================================================
// 3D Object User Data Types
// =============================================================================

export type Warehouse3DObjectType = 'rack' | 'shelf' | 'pallet' | 'floor' | 'aisle'

/**
 * User data attached to Three.js objects for identification
 */
export interface Warehouse3DUserData {
  type: Warehouse3DObjectType
  id: string
  rackId?: string
  shelfLevel?: number
  bay?: number
  binId?: string
  stkId?: number
  productRef?: string
  productName?: string
  quantity?: number
  isSelectable?: boolean
  isDraggable?: boolean
}

// =============================================================================
// Interaction State Types
// =============================================================================

export type InteractionMode = 'view' | 'design'

export type PlacementTool = 'select' | 'rack' | 'shelf' | 'pallet' | 'delete'

export interface SelectionState {
  selectedObject: Object3D | null
  hoveredObject: Object3D | null
  selectedType: Warehouse3DObjectType | null
}

export interface DragState {
  isDragging: boolean
  dragObject: Object3D | null
  dragStart: Vector3 | null
  dragOffset: Vector3 | null
}

// =============================================================================
// Scene Configuration Types
// =============================================================================

export interface WarehouseSceneConfig {
  /** Warehouse dimensions in meters */
  dimensions: { width: number; depth: number; height: number }
  /** Grid cell size in meters */
  gridSize: number
  /** Camera initial position */
  cameraPosition: { x: number; y: number; z: number }
  /** Enable shadows */
  shadowsEnabled: boolean
  /** Minimum aisle width in grid units */
  minAisleWidth: number
}

export const DEFAULT_SCENE_CONFIG: WarehouseSceneConfig = {
  dimensions: { width: 50, depth: 30, height: 10 },
  gridSize: 1,
  cameraPosition: { x: 25, y: 20, z: 40 },
  shadowsEnabled: true,
  minAisleWidth: 2
}

// =============================================================================
// Material/Color Configuration Types
// =============================================================================

export interface WarehouseColorScheme {
  floor: number
  grid: number
  rackFrame: number
  shelf: number
  palletEmpty: number
  palletLow: number    // qty < 10
  palletMedium: number // qty 10-50
  palletHigh: number   // qty >= 50
  palletOutOfStock: number // qty = 0
  selection: number
  hover: number
}

export const DEFAULT_COLOR_SCHEME: WarehouseColorScheme = {
  floor: 0x808080,
  grid: 0x444444,
  rackFrame: 0x4a5568,
  shelf: 0x718096,
  palletEmpty: 0xa0aec0,
  palletLow: 0xf59e0b,
  palletMedium: 0x10b981,
  palletHigh: 0x059669,
  palletOutOfStock: 0xef4444,
  selection: 0x00ffff,
  hover: 0xffff00
}

// =============================================================================
// Rack Geometry Configuration
// =============================================================================

export interface RackGeometryConfig {
  /** Post thickness (square cross-section) */
  postSize: number
  /** Beam thickness */
  beamHeight: number
  beamDepth: number
  /** Shelf thickness */
  shelfThickness: number
  /** Gap between shelf surface and next level's beam */
  levelGap: number
}

export const DEFAULT_RACK_GEOMETRY: RackGeometryConfig = {
  postSize: 0.08,
  beamHeight: 0.1,
  beamDepth: 0.05,
  shelfThickness: 0.02,
  levelGap: 0.05
}

// =============================================================================
// Pallet Configuration
// =============================================================================

export interface PalletGeometryConfig {
  /** Standard pallet dimensions */
  width: number
  depth: number
  height: number
  /** Gap between pallets */
  gap: number
}

export const DEFAULT_PALLET_GEOMETRY: PalletGeometryConfig = {
  width: 1.0,
  depth: 1.2,
  height: 0.15,
  gap: 0.1
}

// =============================================================================
// Stock Quantity Thresholds
// =============================================================================

export interface StockThresholds {
  outOfStock: number
  low: number
  medium: number
}

export const DEFAULT_STOCK_THRESHOLDS: StockThresholds = {
  outOfStock: 0,
  low: 10,
  medium: 50
}

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface WarehouseLayoutCreateDto {
  warehouseId: number
  name?: string
  layoutJson: WarehouseLayout
}

export interface WarehouseLayoutUpdateDto {
  name?: string
  layoutJson: WarehouseLayout
}

export interface WarehouseLayoutResponse {
  id: number
  warehouseId: number
  name: string | null
  version: string
  layoutJson: WarehouseLayout
  createdAt: string
  updatedAt: string
}

// =============================================================================
// Bin Location Parser Types
// =============================================================================

export interface ParsedBinLocation {
  aisle: string
  rack: number
  level: number
  bay?: number
}

/**
 * Parse bin location string like "A-01-03" to coordinates
 * Format: AISLE-RACK-LEVEL or AISLE-RACK-LEVEL-BAY
 */
export function parseBinLocation(binId: string): ParsedBinLocation | null {
  const parts = binId.split('-')
  if (parts.length < 3) return null

  const aisle = parts[0]
  const rack = parseInt(parts[1], 10)
  const level = parseInt(parts[2], 10)
  const bay = parts.length > 3 ? parseInt(parts[3], 10) : undefined

  if (isNaN(rack) || isNaN(level)) return null

  return { aisle, rack, level, bay }
}

// =============================================================================
// Callback Types
// =============================================================================

export type OnObjectSelect = (object: Object3D | null, userData: Warehouse3DUserData | null) => void
export type OnObjectHover = (object: Object3D | null, userData: Warehouse3DUserData | null) => void
export type OnLayoutChange = (layout: WarehouseLayout) => void
export type OnRackPlace = (position: { x: number; z: number }) => void
export type OnPalletDrop = (rackId: string, level: number, bay: number, stkId: number) => void

