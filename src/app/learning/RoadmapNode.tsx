import { Handle, Position } from 'reactflow'
import { clsx } from 'clsx'

export function RoadmapNode({ data }: { data: any }) {
  const { title, status } = data

  return (
    <div
      className={clsx(
        'px-4 py-3 rounded-lg min-w-[150px] text-center bg-[var(--bg-surface)] flex flex-col items-center justify-center transition-all',
        status === 'completed' && 'border-2 border-[var(--em-400)] text-[var(--em-100)]',
        status === 'in-progress' && 'border-2 border-dashed border-[var(--em-500)] text-[var(--em-200)]',
        status === 'planned' && 'border-2 border-[var(--em-800)] text-[var(--em-600)] opacity-70'
      )}
    >
      <Handle type="target" position={Position.Top} className="bg-[var(--em-600)]" />
      <div className="text-sm font-medium">{title}</div>
      <Handle type="source" position={Position.Bottom} className="bg-[var(--em-600)]" />
    </div>
  )
}
