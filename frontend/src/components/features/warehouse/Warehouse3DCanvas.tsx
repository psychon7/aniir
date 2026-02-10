/**
 * Warehouse3DCanvas Component
 * Three.js canvas wrapper for 3D warehouse visualization
 */

import { useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
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
  addRack: (x: number, z: number) => string | null
  removeRack: (rackId: string) => boolean
}

const Warehouse3DCanvas = forwardRef<Warehouse3DCanvasHandle, Warehouse3DCanvasProps>(
  function Warehouse3DCanvas(props, ref) {
    const {
      stockItems = [],
      layout,
      config,
      mode,
      placementTool,
      onObjectSelect,
      onLayoutChange,
      onSceneReady,
      className = ''
    } = props

    const sceneConfig = { ...DEFAULT_SCENE_CONFIG, ...config }

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
      syncStockData,
      loadLayout: loadLayoutInternal,
      clearWarehouse,
      getLayout
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
          addRack(pos)
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

    // Load layout when provided
    useEffect(() => {
      if (layout) {
        loadLayoutInternal(layout)
      }
    }, [layout, loadLayoutInternal])

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getLayout,
      loadLayout: loadLayoutInternal,
      clearWarehouse,
      addRack: (x: number, z: number) => addRack({ x, z }),
      removeRack
    }), [getLayout, loadLayoutInternal, clearWarehouse, addRack, removeRack])

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

