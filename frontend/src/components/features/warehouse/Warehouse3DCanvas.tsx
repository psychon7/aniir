/**
 * Warehouse3DCanvas Component
 * Three.js canvas wrapper for 3D warehouse visualization
 */

import { useEffect, useCallback, useImperativeHandle, forwardRef, useRef } from 'react'
import type { StockListItem } from '@/types/warehouse'
import { useWarehouse3D } from './hooks/useWarehouse3D'
import { useWarehouseObjects } from './hooks/useWarehouseObjects'
import { useWarehouseInteraction } from './hooks/useWarehouseInteraction'
import type {
  InteractionMode,
  PlacementTool,
  WarehouseLayout,
  WarehouseSceneConfig,
  Warehouse3DUserData
} from './types/warehouse3d'
import type { RackProductInfo } from './hooks/useWarehouseObjects'
import type { RackConfig } from './types/warehouse3d'
import { DEFAULT_SCENE_CONFIG } from './types/warehouse3d'

export interface Warehouse3DCanvasProps {
  /** Stock items from ERP */
  stockItems?: StockListItem[]
  /** Initial layout to load */
  layout?: WarehouseLayout | null
  /** Scene configuration */
  config?: Partial<WarehouseSceneConfig>
  /** Current interaction mode */
  mode: InteractionMode
  /** Current placement tool */
  placementTool: PlacementTool
  /** Default rack config for manual placement */
  rackDefaults?: Partial<RackConfig>
  /** Called when an object is selected */
  onObjectSelect?: (userData: Warehouse3DUserData | null) => void
  /** Called when layout changes */
  onLayoutChange?: (layout: WarehouseLayout) => void
  /** Called when the 3D scene is ready */
  onSceneReady?: () => void
  /** CSS class for container */
  className?: string
}

export interface Warehouse3DCanvasHandle {
  getLayout: () => WarehouseLayout
  loadLayout: (layout: WarehouseLayout) => void
  clearWarehouse: () => void
  addRack: (x: number, z: number, config?: Partial<RackConfig>) => string | null
  removeRack: (rackId: string) => boolean
  highlightPallet: (binId: string | null) => void
  getRackProducts: (rackId: string) => RackProductInfo[]
  assignStockToPallet: (rackId: string, level: number, bay: number, stock: StockListItem) => boolean
  clearPallet: (rackId: string, level: number, bay: number) => boolean
}

const Warehouse3DCanvas = forwardRef<Warehouse3DCanvasHandle, Warehouse3DCanvasProps>(
  function Warehouse3DCanvas(props, ref) {
    const {
      stockItems = [],
      layout,
      config,
      mode,
      placementTool,
      rackDefaults,
      onObjectSelect,
      onLayoutChange,
      onSceneReady,
      className = ''
    } = props

    const sceneConfig = { ...DEFAULT_SCENE_CONFIG, ...config }
    const rackDefaultsRef = useRef(rackDefaults)
    rackDefaultsRef.current = rackDefaults

    // Initialize Three.js scene
    const {
      containerRef,
      sceneRef,
      cameraRef,
      warehouseGroupRef,
      resize
    } = useWarehouse3D({
      config: sceneConfig,
      onSceneReady
    })

    // Warehouse objects management
    const {
      rackMapRef,
      addRack,
      removeRack,
      assignStockToPallet,
      clearPallet,
      syncStockData,
      loadLayout: loadLayoutInternal,
      clearWarehouse,
      getLayout,
      highlightPallet,
      getRackProducts
    } = useWarehouseObjects({
      warehouseGroupRef,
      onLayoutChange
    })

    // Interaction handling
    const { selection, clearSelection } = useWarehouseInteraction({
      scene: sceneRef.current,
      camera: cameraRef.current,
      container: containerRef.current,
      mode,
      placementTool,
      gridSize: sceneConfig.gridSize,
      onObjectSelect: (_, userData) => onObjectSelect?.(userData),
      onGridClick: (pos) => {
        if (mode === 'design' && placementTool === 'rack') {
          addRack(pos, rackDefaultsRef.current)
        }
      }
    })

    // Handle right-click for deletion
    const handleContextMenu = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault()
        if (mode === 'design' && selection.selectedObject) {
          const userData = selection.selectedObject.userData as Warehouse3DUserData
          if (userData.type === 'rack') {
            removeRack(userData.id)
            clearSelection()
          }
        }
      },
      [mode, selection.selectedObject, removeRack, clearSelection]
    )

    // Sync stock data when items change
    useEffect(() => {
      if (stockItems.length > 0) {
        syncStockData(stockItems)
      }
    }, [stockItems, syncStockData])

    // NOTE: Layout loading is now handled ONLY through the imperative loadLayout method
    // exposed via ref. The parent component (Warehouse3DView) is responsible for calling
    // loadLayout when needed. This prevents reload cycles and gives the parent full control.

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getLayout,
      loadLayout: loadLayoutInternal,
      clearWarehouse,
      addRack: (x: number, z: number, config?: Partial<RackConfig>) => addRack({ x, z }, config),
      removeRack,
      highlightPallet,
      getRackProducts,
      assignStockToPallet,
      clearPallet
    }), [getLayout, loadLayoutInternal, clearWarehouse, addRack, removeRack, highlightPallet, getRackProducts, assignStockToPallet, clearPallet])

    // Handle window resize
    useEffect(() => {
      const handleResize = () => resize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [resize])

    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full ${className}`}
        onContextMenu={handleContextMenu}
        style={{ touchAction: 'none' }}
      />
    )
  }
)

export default Warehouse3DCanvas

