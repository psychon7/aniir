/**
 * useWarehouseInteraction Hook
 * Handles raycasting, object selection, hover, and drag interactions
 */

import { useCallback, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import type {
  InteractionMode,
  PlacementTool,
  SelectionState,
  DragState,
  Warehouse3DUserData,
  OnObjectSelect,
  OnObjectHover
} from '../types/warehouse3d'
import { snapToGrid } from '../utils/gridHelper'

export interface UseWarehouseInteractionOptions {
  scene: THREE.Scene | null
  camera: THREE.PerspectiveCamera | null
  container: HTMLElement | null
  mode: InteractionMode
  placementTool: PlacementTool
  gridSize: number
  onObjectSelect?: OnObjectSelect
  onObjectHover?: OnObjectHover
  onGridClick?: (position: { x: number; z: number }) => void
  onObjectDrag?: (object: THREE.Object3D, newPosition: THREE.Vector3) => void
}

export interface UseWarehouseInteractionReturn {
  selection: SelectionState
  dragState: DragState
  clearSelection: () => void
  selectObject: (object: THREE.Object3D | null) => void
}

// Cache for raycaster and mouse
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

export function useWarehouseInteraction(
  options: UseWarehouseInteractionOptions
): UseWarehouseInteractionReturn {
  const {
    scene,
    camera,
    container,
    mode,
    placementTool,
    gridSize,
    onObjectSelect,
    onObjectHover,
    onGridClick,
    onObjectDrag
  } = options

  const [selection, setSelection] = useState<SelectionState>({
    selectedObject: null,
    hoveredObject: null,
    selectedType: null
  })

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragObject: null,
    dragStart: null,
    dragOffset: null
  })

  // Store original materials for highlight restoration
  const originalMaterialsRef = useRef<Map<THREE.Object3D, THREE.Material | THREE.Material[]>>(
    new Map()
  )
  const highlightMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null)

  // Initialize highlight material
  useEffect(() => {
    highlightMaterialRef.current = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    })
    return () => {
      highlightMaterialRef.current?.dispose()
    }
  }, [])

  // Get mouse position in normalized device coordinates
  const getMouseNDC = useCallback(
    (event: MouseEvent | TouchEvent): THREE.Vector2 => {
      if (!container) return mouse
      const rect = container.getBoundingClientRect()
      
      let clientX: number, clientY: number
      if ('touches' in event) {
        clientX = event.touches[0].clientX
        clientY = event.touches[0].clientY
      } else {
        clientX = event.clientX
        clientY = event.clientY
      }

      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1
      return mouse
    },
    [container]
  )

  // Find the top-level selectable parent
  const getSelectableParent = useCallback((object: THREE.Object3D): THREE.Object3D | null => {
    let current: THREE.Object3D | null = object
    while (current) {
      const userData = current.userData as Warehouse3DUserData
      if (userData?.isSelectable) {
        return current
      }
      current = current.parent
    }
    return null
  }, [])

  // Perform raycast and find intersections
  const raycast = useCallback(
    (event: MouseEvent | TouchEvent): THREE.Intersection[] => {
      if (!scene || !camera) return []
      getMouseNDC(event)
      raycaster.setFromCamera(mouse, camera)
      return raycaster.intersectObjects(scene.children, true)
    },
    [scene, camera, getMouseNDC]
  )

  // Get floor intersection point
  const getFloorIntersection = useCallback(
    (event: MouseEvent | TouchEvent): THREE.Vector3 | null => {
      if (!camera) return null
      getMouseNDC(event)
      raycaster.setFromCamera(mouse, camera)
      const intersectPoint = new THREE.Vector3()
      const result = raycaster.ray.intersectPlane(floorPlane, intersectPoint)
      return result ? snapToGrid(intersectPoint, gridSize) : null
    },
    [camera, getMouseNDC, gridSize]
  )

  // Apply selection highlight (cyan color)
  const applySelectionHighlight = useCallback((object: THREE.Object3D) => {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && highlightMaterialRef.current) {
        // Create outline by scaling slightly and using backface material
        const outline = child.clone()
        outline.material = highlightMaterialRef.current.clone()
        outline.scale.multiplyScalar(1.05)
        outline.name = 'selectionOutline'
        child.parent?.add(outline)
      }
    })
  }, [])

  // Remove selection highlight
  const removeSelectionHighlight = useCallback((object: THREE.Object3D) => {
    const outlines: THREE.Object3D[] = []
    object.traverse((child) => {
      if (child.name === 'selectionOutline') {
        outlines.push(child)
      }
    })
    outlines.forEach((outline) => outline.removeFromParent())
  }, [])

  // Apply hover highlight (light blue, subtle)
  const applyHoverHighlight = useCallback((object: THREE.Object3D) => {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && !child.name.includes('Outline')) {
        // Store original material if not already stored
        if (!originalMaterialsRef.current.has(child)) {
          originalMaterialsRef.current.set(child, child.material)
        }
        // Apply emissive glow for hover
        if (child.material instanceof THREE.MeshStandardMaterial) {
          const hoverMaterial = child.material.clone()
          hoverMaterial.emissive = new THREE.Color(0x4444ff)
          hoverMaterial.emissiveIntensity = 0.3
          child.material = hoverMaterial
        }
      }
    })
  }, [])

  // Remove hover highlight
  const removeHoverHighlight = useCallback((object: THREE.Object3D) => {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const originalMaterial = originalMaterialsRef.current.get(child)
        if (originalMaterial) {
          // Dispose the hover material
          if (child.material && child.material !== originalMaterial) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose())
            } else {
              child.material.dispose()
            }
          }
          child.material = originalMaterial
          originalMaterialsRef.current.delete(child)
        }
      }
    })
  }, [])

  // Select an object
  const selectObject = useCallback(
    (object: THREE.Object3D | null) => {
      // Remove previous selection highlight
      if (selection.selectedObject) {
        removeSelectionHighlight(selection.selectedObject)
      }

      if (object) {
        const userData = object.userData as Warehouse3DUserData
        applySelectionHighlight(object)
        setSelection({
          selectedObject: object,
          hoveredObject: null,
          selectedType: userData?.type || null
        })
        onObjectSelect?.(object, userData)
      } else {
        setSelection({
          selectedObject: null,
          hoveredObject: null,
          selectedType: null
        })
        onObjectSelect?.(null, null)
      }
    },
    [selection.selectedObject, removeSelectionHighlight, applySelectionHighlight, onObjectSelect]
  )

  // Clear selection
  const clearSelection = useCallback(() => {
    selectObject(null)
  }, [selectObject])

  // Handle pointer down (click/tap)
  const handlePointerDown = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!scene || !camera) return

      const intersections = raycast(event)

      if (intersections.length > 0) {
        // Find first selectable object
        for (const intersection of intersections) {
          const selectableParent = getSelectableParent(intersection.object)
          if (selectableParent) {
            const userData = selectableParent.userData as Warehouse3DUserData

            // In design mode with delete tool, remove the object
            if (mode === 'design' && placementTool === 'delete') {
              // Deletion handled by parent component
              return
            }

            // Start dragging in design mode if object is draggable
            if (mode === 'design' && userData?.isDraggable) {
              const floorPoint = getFloorIntersection(event)
              if (floorPoint) {
                setDragState({
                  isDragging: true,
                  dragObject: selectableParent,
                  dragStart: floorPoint.clone(),
                  dragOffset: new THREE.Vector3().subVectors(
                    selectableParent.position,
                    floorPoint
                  )
                })
              }
            }

            selectObject(selectableParent)
            return
          }
        }
      }

      // Clicked on floor/empty space
      if (mode === 'design' && placementTool !== 'select' && placementTool !== 'delete') {
        const floorPoint = getFloorIntersection(event)
        if (floorPoint) {
          onGridClick?.({ x: floorPoint.x, z: floorPoint.z })
        }
      } else {
        clearSelection()
      }
    },
    [
      scene,
      camera,
      mode,
      placementTool,
      raycast,
      getSelectableParent,
      getFloorIntersection,
      selectObject,
      clearSelection,
      onGridClick
    ]
  )

  // Handle pointer move (hover/drag)
  const handlePointerMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!scene || !camera) return

      // Handle dragging
      if (dragState.isDragging && dragState.dragObject && dragState.dragOffset) {
        const floorPoint = getFloorIntersection(event)
        if (floorPoint) {
          const newPosition = floorPoint.add(dragState.dragOffset)
          dragState.dragObject.position.copy(newPosition)
          onObjectDrag?.(dragState.dragObject, newPosition)
        }
        return
      }

      // Handle hover
      const intersections = raycast(event)

      if (intersections.length > 0) {
        for (const intersection of intersections) {
          const selectableParent = getSelectableParent(intersection.object)
          if (selectableParent && selectableParent !== selection.hoveredObject) {
            // Remove highlight from previous hover
            if (selection.hoveredObject) {
              removeHoverHighlight(selection.hoveredObject)
            }
            // Apply highlight to new hover (only for pallets to avoid visual clutter)
            const userData = selectableParent.userData as Warehouse3DUserData
            if (userData?.type === 'pallet') {
              applyHoverHighlight(selectableParent)
            }
            setSelection((prev) => ({ ...prev, hoveredObject: selectableParent }))
            onObjectHover?.(selectableParent, userData)
            return
          }
        }
      }

      // No hover - remove highlight
      if (selection.hoveredObject) {
        removeHoverHighlight(selection.hoveredObject)
        setSelection((prev) => ({ ...prev, hoveredObject: null }))
        onObjectHover?.(null, null)
      }
    },
    [
      scene,
      camera,
      dragState,
      selection.hoveredObject,
      raycast,
      getSelectableParent,
      getFloorIntersection,
      applyHoverHighlight,
      removeHoverHighlight,
      onObjectDrag,
      onObjectHover
    ]
  )

  // Handle pointer up (end drag)
  const handlePointerUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        dragObject: null,
        dragStart: null,
        dragOffset: null
      })
    }
  }, [dragState.isDragging])

  // Attach event listeners
  useEffect(() => {
    if (!container) return

    container.addEventListener('mousedown', handlePointerDown)
    container.addEventListener('mousemove', handlePointerMove)
    container.addEventListener('mouseup', handlePointerUp)
    container.addEventListener('touchstart', handlePointerDown)
    container.addEventListener('touchmove', handlePointerMove)
    container.addEventListener('touchend', handlePointerUp)

    return () => {
      container.removeEventListener('mousedown', handlePointerDown)
      container.removeEventListener('mousemove', handlePointerMove)
      container.removeEventListener('mouseup', handlePointerUp)
      container.removeEventListener('touchstart', handlePointerDown)
      container.removeEventListener('touchmove', handlePointerMove)
      container.removeEventListener('touchend', handlePointerUp)
    }
  }, [container, handlePointerDown, handlePointerMove, handlePointerUp])

  return {
    selection,
    dragState,
    clearSelection,
    selectObject
  }
}

