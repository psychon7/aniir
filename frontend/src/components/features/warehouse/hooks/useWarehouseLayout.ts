/**
 * useWarehouseLayout Hook
 * Manages warehouse layout persistence: save/load JSON, API integration
 */

import { useCallback, useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  WarehouseLayout,
  WarehouseLayoutCreateDto,
  WarehouseLayoutUpdateDto,
  WarehouseLayoutResponse
} from '../types/warehouse3d'
import apiClient from '@/api/client'

// Query keys
export const warehouseLayoutKeys = {
  all: ['warehouseLayouts'] as const,
  byWarehouse: (warehouseId: number) => [...warehouseLayoutKeys.all, warehouseId] as const
}

// API functions
async function getWarehouseLayout(warehouseId: number): Promise<WarehouseLayoutResponse | null> {
  try {
    const response = await apiClient.get<WarehouseLayoutResponse>(
      `/warehouse/warehouses/${warehouseId}/layout`
    )
    return response.data
  } catch {
    return null
  }
}

async function saveWarehouseLayout(
  warehouseId: number,
  layout: WarehouseLayout,
  layoutId?: number
): Promise<WarehouseLayoutResponse> {
  if (layoutId) {
    const response = await apiClient.put<WarehouseLayoutResponse>(
      `/warehouse/warehouses/${warehouseId}/layout`,
      { layoutJson: layout } as WarehouseLayoutUpdateDto
    )
    return response.data
  } else {
    const response = await apiClient.post<WarehouseLayoutResponse>(
      `/warehouse/warehouses/${warehouseId}/layout`,
      { warehouseId, layoutJson: layout } as WarehouseLayoutCreateDto
    )
    return response.data
  }
}

async function deleteWarehouseLayout(warehouseId: number): Promise<void> {
  await apiClient.delete(`/warehouse/warehouses/${warehouseId}/layout`)
}

export interface UseWarehouseLayoutOptions {
  warehouseId?: number
  onLayoutLoaded?: (layout: WarehouseLayout) => void
  onSaveSuccess?: () => void
  onSaveError?: (error: Error) => void
}

export interface UseWarehouseLayoutReturn {
  layout: WarehouseLayout | null
  layoutId: number | null
  isLoading: boolean
  isSaving: boolean
  error: Error | null
  saveLayout: (layout: WarehouseLayout) => void
  deleteLayout: () => void
  exportToJson: (layout: WarehouseLayout) => string
  importFromJson: (json: string) => WarehouseLayout | null
  downloadLayout: (layout: WarehouseLayout, filename?: string) => void
}

const LAYOUT_VERSION = '1.0.0'

export function useWarehouseLayout(
  options: UseWarehouseLayoutOptions = {}
): UseWarehouseLayoutReturn {
  const { warehouseId, onLayoutLoaded, onSaveSuccess, onSaveError } = options
  const queryClient = useQueryClient()
  const [layoutId, setLayoutId] = useState<number | null>(null)
  // Track if we've already notified about this layout to prevent duplicate loads
  const lastLoadedLayoutIdRef = useRef<number | null>(null)

  // Fetch layout query
  const {
    data: layoutResponse,
    isLoading,
    error
  } = useQuery({
    queryKey: warehouseLayoutKeys.byWarehouse(warehouseId || 0),
    queryFn: () => getWarehouseLayout(warehouseId!),
    enabled: !!warehouseId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Update layoutId when response changes - properly in useEffect
  useEffect(() => {
    if (layoutResponse?.id) {
      setLayoutId(layoutResponse.id)
      // Only call onLayoutLoaded once per layout ID to prevent reload cycles
      if (lastLoadedLayoutIdRef.current !== layoutResponse.id) {
        lastLoadedLayoutIdRef.current = layoutResponse.id
        onLayoutLoaded?.(layoutResponse.layoutJson)
      }
    }
  }, [layoutResponse?.id, layoutResponse?.layoutJson, onLayoutLoaded])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (layout: WarehouseLayout) => {
      if (!warehouseId) throw new Error('Warehouse ID required')
      return saveWarehouseLayout(warehouseId, layout, layoutId || undefined)
    },
    onSuccess: (response) => {
      setLayoutId(response.id)
      queryClient.invalidateQueries({ queryKey: warehouseLayoutKeys.byWarehouse(warehouseId!) })
      onSaveSuccess?.()
    },
    onError: (error: Error) => {
      onSaveError?.(error)
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!warehouseId) throw new Error('Warehouse ID required')
      return deleteWarehouseLayout(warehouseId)
    },
    onSuccess: () => {
      setLayoutId(null)
      queryClient.invalidateQueries({ queryKey: warehouseLayoutKeys.byWarehouse(warehouseId!) })
    }
  })

  // Export layout to JSON string
  const exportToJson = useCallback((layout: WarehouseLayout): string => {
    const exportLayout = { ...layout, version: LAYOUT_VERSION }
    return JSON.stringify(exportLayout, null, 2)
  }, [])

  // Import layout from JSON string
  const importFromJson = useCallback((json: string): WarehouseLayout | null => {
    try {
      const parsed = JSON.parse(json) as WarehouseLayout
      if (!parsed.version || !parsed.dimensions || !Array.isArray(parsed.racks)) {
        throw new Error('Invalid layout format')
      }
      return parsed
    } catch {
      return null
    }
  }, [])

  // Download layout as file
  const downloadLayout = useCallback(
    (layout: WarehouseLayout, filename?: string) => {
      const json = exportToJson(layout)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `warehouse-layout-${warehouseId || 'export'}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    [exportToJson, warehouseId]
  )

  return {
    layout: layoutResponse?.layoutJson || null,
    layoutId,
    isLoading,
    isSaving: saveMutation.isPending,
    error: error as Error | null,
    saveLayout: saveMutation.mutate,
    deleteLayout: deleteMutation.mutate,
    exportToJson,
    importFromJson,
    downloadLayout
  }
}

