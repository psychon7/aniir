/**
 * Warehouse3DView Component
 * Main entry point for 3D warehouse visualization and layout designer
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { StockListItem } from '@/types/warehouse'
import Warehouse3DCanvas, { type Warehouse3DCanvasHandle } from './Warehouse3DCanvas'
import { useWarehouseLayout } from './hooks/useWarehouseLayout'
import type {
  InteractionMode,
  PlacementTool,
  WarehouseLayout,
  Warehouse3DUserData,
  WarehouseSceneConfig,
  RackConfig,
  ShelfConfig,
  PalletSlot,
  AisleConfig
} from './types/warehouse3d'

// Icons from lucide-react
import {
  Eye,
  Pencil,
  Trash2,
  Save,
  Download,
  Upload,
  RotateCcw,
  Maximize2,
  Grid3X3,
  Layers,
  Plus,
  Minus,
  Box
} from 'lucide-react'

export interface Warehouse3DViewProps {
  items: StockListItem[]
  warehouseId?: number
  warehouseName?: string
}

/**
 * Generate a default warehouse layout with aisles, racks, and pallets
 */
function generateDefaultLayout(
  numAisles: number = 3,
  racksPerAisle: number = 3,
  levelsPerRack: number = 4,
  baysPerLevel: number = 3
): WarehouseLayout {
  const racks: RackConfig[] = []
  const aisles: AisleConfig[] = []

  const rackWidth = 4
  const rackDepth = 1.5
  const rackHeight = levelsPerRack * 1.2
  const aisleWidth = 3
  const rackSpacing = 1

  for (let aisleIdx = 0; aisleIdx < numAisles; aisleIdx++) {
    const aisleId = `aisle_${String.fromCharCode(65 + aisleIdx)}` // A, B, C...
    const aisleZ = aisleIdx * (rackDepth * 2 + aisleWidth + rackSpacing * 2) + 5

    // Create aisle
    aisles.push({
      id: aisleId,
      start: { x: 2, z: aisleZ + rackDepth + rackSpacing },
      end: { x: 2 + racksPerAisle * (rackWidth + rackSpacing), z: aisleZ + rackDepth + rackSpacing },
      width: aisleWidth
    })

    // Create racks on both sides of the aisle
    for (let rackIdx = 0; rackIdx < racksPerAisle; rackIdx++) {
      const rackX = 3 + rackIdx * (rackWidth + rackSpacing)

      // Front rack (facing aisle)
      const frontRackId = `rack_${aisleId.replace('aisle_', '')}-${String(rackIdx + 1).padStart(2, '0')}-F`
      const frontShelves: ShelfConfig[] = []
      for (let level = 0; level < levelsPerRack; level++) {
        const pallets: PalletSlot[] = []
        for (let bay = 0; bay < baysPerLevel; bay++) {
          pallets.push({
            bay,
            binId: `${aisleId.replace('aisle_', '')}-${String(rackIdx + 1).padStart(2, '0')}-${String(level + 1).padStart(2, '0')}-${String(bay + 1).padStart(2, '0')}`
          })
        }
        frontShelves.push({ level, pallets })
      }
      racks.push({
        id: frontRackId,
        position: { x: rackX, y: 0, z: aisleZ },
        dimensions: { width: rackWidth, depth: rackDepth, height: rackHeight },
        levels: levelsPerRack,
        bays: baysPerLevel,
        shelves: frontShelves
      })

      // Back rack (facing aisle from other side)
      const backRackId = `rack_${aisleId.replace('aisle_', '')}-${String(rackIdx + 1).padStart(2, '0')}-B`
      const backShelves: ShelfConfig[] = []
      for (let level = 0; level < levelsPerRack; level++) {
        const pallets: PalletSlot[] = []
        for (let bay = 0; bay < baysPerLevel; bay++) {
          pallets.push({
            bay,
            binId: `${aisleId.replace('aisle_', '')}-${String(rackIdx + 1).padStart(2, '0')}-${String(level + 1).padStart(2, '0')}-${String(bay + 1).padStart(2, '0')}B`
          })
        }
        backShelves.push({ level, pallets })
      }
      racks.push({
        id: backRackId,
        position: { x: rackX, y: 0, z: aisleZ + rackDepth + aisleWidth + rackSpacing },
        dimensions: { width: rackWidth, depth: rackDepth, height: rackHeight },
        levels: levelsPerRack,
        bays: baysPerLevel,
        shelves: backShelves
      })
    }
  }

  return {
    version: '1.0.0',
    name: 'Default Warehouse Layout',
    dimensions: { width: 50, depth: 40, height: 12 },
    gridSize: 1,
    racks,
    aisles
  }
}

export function Warehouse3DView({ items, warehouseId, warehouseName }: Warehouse3DViewProps) {
  const { t } = useTranslation()
  const canvasRef = useRef<Warehouse3DCanvasHandle>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  // State
  const [mode, setMode] = useState<InteractionMode>('design') // Start in design mode
  const [placementTool, setPlacementTool] = useState<PlacementTool>('select')
  const [selectedObject, setSelectedObject] = useState<Warehouse3DUserData | null>(null)
  const [config, setConfig] = useState<Partial<WarehouseSceneConfig>>({
    dimensions: { width: 50, depth: 40, height: 12 },
    gridSize: 1
  })
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Layout configuration state
  const [layoutConfig, setLayoutConfig] = useState({
    numAisles: 3,
    racksPerAisle: 3,
    levelsPerRack: 4,
    baysPerLevel: 3
  })

  // Layout persistence
  const {
    layout: savedLayout,
    isLoading: isLoadingLayout,
    isSaving,
    saveLayout,
    downloadLayout,
    importFromJson
  } = useWarehouseLayout({
    warehouseId,
    onLayoutLoaded: (layout) => canvasRef.current?.loadLayout(layout),
    onSaveSuccess: () => console.log('Layout saved successfully'),
    onSaveError: (error) => console.error('Failed to save layout:', error)
  })

  // Generate and load default layout on mount if no saved layout
  useEffect(() => {
    if (!hasInitialized && !isLoadingLayout && canvasRef.current) {
      setHasInitialized(true)
      if (!savedLayout) {
        const defaultLayout = generateDefaultLayout(
          layoutConfig.numAisles,
          layoutConfig.racksPerAisle,
          layoutConfig.levelsPerRack,
          layoutConfig.baysPerLevel
        )
        canvasRef.current.loadLayout(defaultLayout)
      }
    }
  }, [hasInitialized, isLoadingLayout, savedLayout, layoutConfig])

  // Handler to regenerate layout with new config
  const handleRegenerateLayout = useCallback(() => {
    if (canvasRef.current) {
      const newLayout = generateDefaultLayout(
        layoutConfig.numAisles,
        layoutConfig.racksPerAisle,
        layoutConfig.levelsPerRack,
        layoutConfig.baysPerLevel
      )
      canvasRef.current.loadLayout(newLayout)
    }
  }, [layoutConfig])

  // Handlers
  const handleModeToggle = useCallback(() => {
    setMode((prev) => (prev === 'view' ? 'design' : 'view'))
    setPlacementTool('select')
  }, [])

  const handleToolSelect = useCallback((tool: PlacementTool) => {
    setPlacementTool(tool)
  }, [])

  const handleObjectSelect = useCallback((userData: Warehouse3DUserData | null) => {
    setSelectedObject(userData)
  }, [])

  const handleLayoutChange = useCallback((_layout: WarehouseLayout) => {
    // Layout changed, could auto-save here
  }, [])

  const handleSave = useCallback(() => {
    const layout = canvasRef.current?.getLayout()
    if (layout) {
      saveLayout(layout)
    }
  }, [saveLayout])

  const handleExport = useCallback(() => {
    const layout = canvasRef.current?.getLayout()
    if (layout) {
      downloadLayout(layout)
    }
  }, [downloadLayout])

  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const json = event.target?.result as string
          const layout = importFromJson(json)
          if (layout) {
            canvasRef.current?.loadLayout(layout)
          } else {
            console.error('Invalid layout file')
          }
        }
        reader.readAsText(file)
      }
    },
    [importFromJson]
  )

  const handleClear = useCallback(() => {
    if (confirm('Are you sure you want to clear the warehouse layout?')) {
      canvasRef.current?.clearWarehouse()
    }
  }, [])

  const handleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  // Filter stock items by warehouse if specified
  const filteredItems = useMemo(() => {
    if (!warehouseId) return items
    return items.filter((item) => item.whs_id === warehouseId)
  }, [items, warehouseId])

  // Determine color status for legend
  const stockStatusLegend = [
    { color: 'bg-red-500', label: 'Out of Stock (0)' },
    { color: 'bg-amber-500', label: 'Low Stock (<10)' },
    { color: 'bg-emerald-500', label: 'In Stock (≥10)' }
  ]

  if (isLoadingLayout) {
    return (
      <div className="card p-6 flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium">
            {warehouseName || t('warehouse.3dVisualization', '3D Warehouse')}
          </h3>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs text-muted-foreground">
            {filteredItems.length} items
          </span>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleModeToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors
              ${mode === 'view'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          <button
            onClick={handleModeToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors
              ${mode === 'design'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            Design
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar - Design Tools */}
        {mode === 'design' && (
          <div className="w-56 border-r bg-card p-3 flex flex-col gap-3">
            {/* Placement Tools */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Tools
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { tool: 'select' as PlacementTool, icon: Grid3X3, label: 'Select' },
                  { tool: 'rack' as PlacementTool, icon: Layers, label: 'Add Rack' },
                  { tool: 'delete' as PlacementTool, icon: Trash2, label: 'Delete' }
                ].map(({ tool, icon: Icon, label }) => (
                  <button
                    key={tool}
                    onClick={() => handleToolSelect(tool)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-md text-xs transition-colors
                      ${placementTool === tool
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 hover:bg-secondary'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Dimensions (m)
              </h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs">
                  <span className="w-12">Width:</span>
                  <input
                    type="number"
                    value={config.dimensions?.width ?? 50}
                    onChange={(e) => setConfig((prev) => ({
                      ...prev,
                      dimensions: { ...prev.dimensions!, width: Number(e.target.value) }
                    }))}
                    className="flex-1 px-2 py-1 rounded border bg-background text-xs"
                    min={10}
                    max={200}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <span className="w-12">Depth:</span>
                  <input
                    type="number"
                    value={config.dimensions?.depth ?? 30}
                    onChange={(e) => setConfig((prev) => ({
                      ...prev,
                      dimensions: { ...prev.dimensions!, depth: Number(e.target.value) }
                    }))}
                    className="flex-1 px-2 py-1 rounded border bg-background text-xs"
                    min={10}
                    max={200}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <span className="w-12">Grid:</span>
                  <select
                    value={config.gridSize ?? 1}
                    onChange={(e) => setConfig((prev) => ({
                      ...prev,
                      gridSize: Number(e.target.value)
                    }))}
                    className="flex-1 px-2 py-1 rounded border bg-background text-xs"
                  >
                    <option value={0.5}>0.5m</option>
                    <option value={1}>1m</option>
                    <option value={2}>2m</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Layout Generator */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Layout Generator
              </h4>
              <div className="space-y-2">
                <label className="flex items-center justify-between text-xs">
                  <span>Aisles:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setLayoutConfig(prev => ({ ...prev, numAisles: Math.max(1, prev.numAisles - 1) }))}
                      className="p-1 rounded bg-secondary hover:bg-secondary/80"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-medium">{layoutConfig.numAisles}</span>
                    <button
                      onClick={() => setLayoutConfig(prev => ({ ...prev, numAisles: Math.min(10, prev.numAisles + 1) }))}
                      className="p-1 rounded bg-secondary hover:bg-secondary/80"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </label>
                <label className="flex items-center justify-between text-xs">
                  <span>Racks/Aisle:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setLayoutConfig(prev => ({ ...prev, racksPerAisle: Math.max(1, prev.racksPerAisle - 1) }))}
                      className="p-1 rounded bg-secondary hover:bg-secondary/80"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-medium">{layoutConfig.racksPerAisle}</span>
                    <button
                      onClick={() => setLayoutConfig(prev => ({ ...prev, racksPerAisle: Math.min(10, prev.racksPerAisle + 1) }))}
                      className="p-1 rounded bg-secondary hover:bg-secondary/80"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </label>
                <label className="flex items-center justify-between text-xs">
                  <span>Levels:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setLayoutConfig(prev => ({ ...prev, levelsPerRack: Math.max(1, prev.levelsPerRack - 1) }))}
                      className="p-1 rounded bg-secondary hover:bg-secondary/80"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-medium">{layoutConfig.levelsPerRack}</span>
                    <button
                      onClick={() => setLayoutConfig(prev => ({ ...prev, levelsPerRack: Math.min(8, prev.levelsPerRack + 1) }))}
                      className="p-1 rounded bg-secondary hover:bg-secondary/80"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </label>
                <label className="flex items-center justify-between text-xs">
                  <span>Bays/Level:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setLayoutConfig(prev => ({ ...prev, baysPerLevel: Math.max(1, prev.baysPerLevel - 1) }))}
                      className="p-1 rounded bg-secondary hover:bg-secondary/80"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-medium">{layoutConfig.baysPerLevel}</span>
                    <button
                      onClick={() => setLayoutConfig(prev => ({ ...prev, baysPerLevel: Math.min(6, prev.baysPerLevel + 1) }))}
                      className="p-1 rounded bg-secondary hover:bg-secondary/80"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </label>
                <button
                  onClick={handleRegenerateLayout}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Box className="w-3.5 h-3.5" />
                  Generate Layout
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto space-y-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Layout'}
              </button>
              <div className="flex gap-1.5">
                <button
                  onClick={handleExport}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-md bg-secondary hover:bg-secondary/80"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-md bg-secondary hover:bg-secondary/80"
                >
                  <Upload className="w-3 h-3" />
                  Import
                </button>
              </div>
              <button
                onClick={handleClear}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md text-destructive border border-destructive/30 hover:bg-destructive/10"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* 3D Canvas */}
        <div className="flex-1 relative min-h-[500px]">
          <Warehouse3DCanvas
            ref={canvasRef}
            stockItems={filteredItems}
            layout={savedLayout}
            config={config}
            mode={mode}
            placementTool={placementTool}
            onObjectSelect={handleObjectSelect}
            onLayoutChange={handleLayoutChange}
            className="absolute inset-0"
          />

          {/* Stock Legend */}
          <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm rounded-lg p-2 border shadow-sm">
            <h5 className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase">
              Stock Status
            </h5>
            <div className="flex flex-col gap-1">
              {stockStatusLegend.map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs">
                  <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleFullscreen}
            className="absolute top-3 right-3 p-2 rounded-md bg-card/90 backdrop-blur-sm border shadow-sm hover:bg-accent"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Properties Panel */}
        {selectedObject && (
          <div className="w-64 border-l bg-card p-3">
            <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Properties
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium capitalize">{selectedObject.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono text-[10px]">{selectedObject.id}</span>
              </div>
              {selectedObject.binId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bin ID:</span>
                  <span className="font-mono">{selectedObject.binId}</span>
                </div>
              )}
              {selectedObject.productRef && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product:</span>
                  <span>{selectedObject.productRef}</span>
                </div>
              )}
              {selectedObject.quantity !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-semibold">{selectedObject.quantity}</span>
                </div>
              )}
            </div>

            {mode === 'design' && selectedObject.type === 'rack' && (
              <div className="mt-4 pt-3 border-t">
                <button
                  onClick={() => canvasRef.current?.removeRack(selectedObject.id)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md text-destructive border border-destructive/30 hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Rack
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  )
}
