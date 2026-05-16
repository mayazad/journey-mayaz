'use client'

import { useState, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeMouseHandler,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { NodeSidePanel } from './NodeSidePanel'
import { saveNodePositions } from '@/actions/learning'
import type { RoadmapNode, Roadmap } from '@/actions/learning'

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  not_started: { bg: '#ffffff',  border: '#e7e5e0', text: '#374151' },
  in_progress:  { bg: '#ecfdf5', border: '#6ee7b7', text: '#047857' },
  done:         { bg: '#10b981', border: '#059669', text: '#ffffff' },
  skipped:      { bg: '#f5f4f0', border: '#d6d3ce', text: '#9ca3af' },
}

function buildFlowNodes(nodes: RoadmapNode[]): Node[] {
  return nodes.map((n) => {
    const s = STATUS_STYLE[n.status] ?? STATUS_STYLE.not_started
    return {
      id: n.id,
      position: { x: n.position_x || 0, y: n.position_y || 0 },
      data: {
        label: n.title,
        status: n.status,
        description: n.description,
      },
      style: {
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        color: s.text,
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '13px',
        fontWeight: 500,
        fontFamily: 'Inter, system-ui, sans-serif',
        minWidth: '160px',
        maxWidth: '220px',
        boxShadow: n.status === 'in_progress'
          ? '0 0 0 3px rgba(52,211,153,0.2)'
          : '0 1px 4px rgba(0,0,0,0.06)',
        cursor: 'pointer',
      },
    }
  })
}

function buildFlowEdges(nodes: RoadmapNode[]): Edge[] {
  const edges: Edge[] = []
  nodes.forEach((n) => {
    if (Array.isArray(n.parent_ids)) {
      n.parent_ids.forEach((parentId) => {
        edges.push({
          id: `e-${parentId}-${n.id}`,
          source: parentId,
          target: n.id,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#a7f3d0' },
          style: { stroke: '#a7f3d0', strokeWidth: 1.5 },
          animated: n.status === 'in_progress',
        })
      })
    }
  })
  // Fallback: chain by order_index if no parent_ids defined
  if (edges.length === 0 && nodes.length > 1) {
    const sorted = [...nodes].sort((a, b) => a.order_index - b.order_index)
    for (let i = 0; i < sorted.length - 1; i++) {
      edges.push({
        id: `chain-${i}`,
        source: sorted[i].id,
        target: sorted[i + 1].id,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#a7f3d0' },
        style: { stroke: '#a7f3d0', strokeWidth: 1.5 },
        animated: sorted[i + 1].status === 'in_progress',
      })
    }
  }
  return edges
}

// Auto-layout nodes in a vertical chain if positions are all 0
function autoLayout(nodes: RoadmapNode[]): RoadmapNode[] {
  const allZero = nodes.every(n => n.position_x === 0 && n.position_y === 0)
  if (!allZero) return nodes
  const sorted = [...nodes].sort((a, b) => a.order_index - b.order_index)
  // Simple waterfall layout
  return sorted.map((n, i) => ({
    ...n,
    position_x: i % 2 === 0 ? 200 : 420,
    position_y: Math.floor(i / 2) * 120 + (i % 2 === 0 ? 0 : 60),
  }))
}

export function RoadmapCanvas({ roadmap, initialNodes }: { roadmap: Roadmap; initialNodes: RoadmapNode[] }) {
  const [nodeData, setNodeData] = useState<RoadmapNode[]>(() => autoLayout(initialNodes))
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null)

  const flowNodes = buildFlowNodes(nodeData)
  const flowEdges = buildFlowEdges(nodeData)

  const [nodes, , onNodesChange] = useNodesState(flowNodes)
  const [edges, , onEdgesChange] = useEdgesState(flowEdges)

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    const full = nodeData.find(n => n.id === node.id)
    if (full) setSelectedNode(full)
  }, [nodeData])

  const onNodeDragStop: NodeMouseHandler = useCallback((_event, node) => {
    const updates = [{ id: node.id, position_x: node.position.x, position_y: node.position.y }]
    saveNodePositions(updates)
    setNodeData(prev => prev.map(n => n.id === node.id ? { ...n, position_x: node.position.x, position_y: node.position.y } : n))
  }, [])

  function handleStatusChange(nodeId: string, status: RoadmapNode['status']) {
    setNodeData(prev => prev.map(n => n.id === nodeId ? { ...n, status } : n))
    if (selectedNode?.id === nodeId) setSelectedNode(prev => prev ? { ...prev, status } : null)
  }

  const done  = nodeData.filter(n => n.status === 'done').length
  const total = nodeData.length
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <main className="main-content flex flex-col">
      {/* Header */}
      <div className="page-header flex-wrap gap-2">
        <Link href="/learning" className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--em-600)] hover:bg-[var(--bg-hover)] transition-all">
          <ArrowLeft size={15} />
        </Link>
        <div className="w-7 h-7 rounded-lg bg-[var(--em-50)] border border-[var(--border-accent)] flex items-center justify-center flex-shrink-0">
          <BookOpen size={13} className="text-[var(--em-600)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-[var(--text-primary)] truncate">{roadmap.title}</h1>
          {roadmap.description && (
            <p className="text-xs text-[var(--text-muted)] truncate">{roadmap.description}</p>
          )}
        </div>
        {/* Progress */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-24 h-1.5 rounded-full bg-[var(--bg-surface2)] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-[var(--em-500)] rounded-full"
            />
          </div>
          <span className="text-xs mono text-[var(--text-muted)]">{done}/{total}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-2.5 border-b border-[var(--border)] bg-[var(--bg-surface)] text-[11px] text-[var(--text-muted)] overflow-x-auto">
        {[
          { label: 'Not Started', bg: '#fff',     border: '#e7e5e0' },
          { label: 'In Progress',  bg: '#ecfdf5', border: '#6ee7b7' },
          { label: 'Done',         bg: '#10b981', border: '#059669' },
          { label: 'Skipped',      bg: '#f5f4f0', border: '#d6d3ce' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-3 h-3 rounded" style={{ background: s.bg, border: `1.5px solid ${s.border}` }} />
            {s.label}
          </div>
        ))}
        <span className="ml-auto flex-shrink-0">Click a node to view details &amp; update status</span>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative" style={{ minHeight: '500px' }}>
        {nodeData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <BookOpen size={36} className="text-[var(--border-2)] mx-auto mb-3" strokeWidth={1.25} />
              <p className="text-[var(--text-secondary)] font-medium text-sm">No nodes yet</p>
              <p className="text-[var(--text-muted)] text-xs mt-1">Go back and use AI Import to add topics.</p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeDragStop={onNodeDragStop}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#e7e5e0" gap={20} size={1} />
            <Controls className="!bg-white !border-[var(--border)] !shadow-sm" />
            <MiniMap
              nodeColor={(n) => STATUS_STYLE[(n.data as { status: string }).status]?.bg ?? '#fff'}
              maskColor="rgba(250,250,249,0.8)"
              className="!bg-white !border-[var(--border)] !rounded-xl"
            />
          </ReactFlow>
        )}

        {/* Side panel */}
        <AnimatePresence>
          {selectedNode && (
            <NodeSidePanel
              key={selectedNode.id}
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onStatusChange={handleStatusChange}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
