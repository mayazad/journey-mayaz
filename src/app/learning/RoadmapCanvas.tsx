'use client'

import { useMemo } from 'react'
import ReactFlow, { Background, Controls, Edge, Node } from 'reactflow'
import 'reactflow/dist/style.css'
import { RoadmapNode } from './RoadmapNode'

type LearningModule = {
  id: string
  title: string
  status: string
  roadmap_data?: any
}

const nodeTypes = {
  roadmapNode: RoadmapNode,
}

export function RoadmapCanvas({ modules }: { modules: LearningModule[] }) {
  const nodes: Node[] = useMemo(() => {
    return modules.map((mod, index) => {
      // Basic layout algorithm if roadmap_data lacks coordinates
      const x = mod.roadmap_data?.x ?? 250
      const y = mod.roadmap_data?.y ?? index * 120 + 50

      return {
        id: mod.id,
        type: 'roadmapNode',
        position: { x, y },
        data: { title: mod.title, status: mod.status },
      }
    })
  }, [modules])

  const edges: Edge[] = useMemo(() => {
    const newEdges: Edge[] = []
    for (let i = 0; i < modules.length - 1; i++) {
      newEdges.push({
        id: `e-${modules[i].id}-${modules[i+1].id}`,
        source: modules[i].id,
        target: modules[i+1].id,
        animated: modules[i].status === 'in-progress' || modules[i+1].status === 'in-progress',
        style: { stroke: 'var(--em-700)' }
      })
    }
    return newEdges
  }, [modules])

  return (
    <div className="w-full h-[600px] border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-base)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        className="dark"
      >
        <Background color="#333" gap={16} />
        <Controls className="!bg-[var(--bg-elevated)] !border-[var(--border)] !fill-[var(--text-primary)]" />
      </ReactFlow>
    </div>
  )
}
