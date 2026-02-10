/**
 * Label Renderer Utilities for 3D Warehouse Visualization
 * Creates CSS2D labels for warehouse objects
 */

import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import type { Warehouse3DUserData, StockThresholds, DEFAULT_STOCK_THRESHOLDS } from '../types/warehouse3d'

/**
 * Initialize the CSS2D renderer for labels
 */
export function createLabelRenderer(container: HTMLElement): CSS2DRenderer {
  const labelRenderer = new CSS2DRenderer()
  labelRenderer.setSize(container.clientWidth, container.clientHeight)
  labelRenderer.domElement.style.position = 'absolute'
  labelRenderer.domElement.style.top = '0'
  labelRenderer.domElement.style.left = '0'
  labelRenderer.domElement.style.pointerEvents = 'none'
  container.appendChild(labelRenderer.domElement)
  return labelRenderer
}

/**
 * Create a product label for a pallet
 */
export function createPalletLabel(
  productRef: string,
  productName: string,
  quantity: number,
  binId: string
): CSS2DObject {
  const div = document.createElement('div')
  div.className = 'warehouse-label pallet-label'
  div.style.cssText = `
    background: rgba(0, 0, 0, 0.75);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-family: system-ui, -apple-system, sans-serif;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
    max-width: 150px;
    text-overflow: ellipsis;
    overflow: hidden;
  `
  
  div.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 2px;">${productRef}</div>
    <div style="font-size: 10px; opacity: 0.8;">${productName}</div>
    <div style="font-size: 10px; margin-top: 2px;">
      <span style="color: ${getQuantityColor(quantity)};">Qty: ${quantity}</span>
      <span style="opacity: 0.6; margin-left: 4px;">${binId}</span>
    </div>
  `
  
  const label = new CSS2DObject(div)
  label.name = 'palletLabel'
  return label
}

/**
 * Create a bin location label
 */
export function createBinLabel(binId: string): CSS2DObject {
  const div = document.createElement('div')
  div.className = 'warehouse-label bin-label'
  div.style.cssText = `
    background: rgba(59, 130, 246, 0.9);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-family: monospace;
    pointer-events: none;
    user-select: none;
  `
  div.textContent = binId
  
  const label = new CSS2DObject(div)
  label.name = 'binLabel'
  return label
}

/**
 * Create a rack label showing rack ID
 */
export function createRackLabel(rackId: string, levels: number, bays: number): CSS2DObject {
  const div = document.createElement('div')
  div.className = 'warehouse-label rack-label'
  div.style.cssText = `
    background: rgba(30, 41, 59, 0.9);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-family: system-ui, -apple-system, sans-serif;
    pointer-events: none;
    user-select: none;
    text-align: center;
  `
  
  div.innerHTML = `
    <div style="font-weight: 600;">${rackId}</div>
    <div style="font-size: 10px; opacity: 0.7;">${levels}L × ${bays}B</div>
  `
  
  const label = new CSS2DObject(div)
  label.name = 'rackLabel'
  return label
}

/**
 * Get color for quantity display
 */
function getQuantityColor(quantity: number): string {
  if (quantity <= 0) return '#ef4444' // red
  if (quantity < 10) return '#f59e0b' // amber
  if (quantity < 50) return '#10b981' // green
  return '#059669' // dark green
}

/**
 * Update an existing pallet label
 */
export function updatePalletLabel(
  label: CSS2DObject,
  productRef: string,
  productName: string,
  quantity: number,
  binId: string
): void {
  const div = label.element
  div.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 2px;">${productRef}</div>
    <div style="font-size: 10px; opacity: 0.8;">${productName}</div>
    <div style="font-size: 10px; margin-top: 2px;">
      <span style="color: ${getQuantityColor(quantity)};">Qty: ${quantity}</span>
      <span style="opacity: 0.6; margin-left: 4px;">${binId}</span>
    </div>
  `
}

/**
 * Set label visibility based on camera distance
 */
export function updateLabelVisibility(
  label: CSS2DObject,
  camera: THREE.Camera,
  objectPosition: THREE.Vector3,
  maxDistance: number = 20
): void {
  const distance = camera.position.distanceTo(objectPosition)
  label.visible = distance <= maxDistance
}

/**
 * Remove all labels from an object
 */
export function removeLabels(object: THREE.Object3D): void {
  const labelsToRemove: CSS2DObject[] = []
  object.traverse((child) => {
    if (child instanceof CSS2DObject) {
      labelsToRemove.push(child)
    }
  })
  labelsToRemove.forEach((label) => {
    label.removeFromParent()
    label.element.remove()
  })
}

