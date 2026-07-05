import { useState } from 'react';
import { formatSize } from '../../lib/files';
import { copy } from '../../lib/copy';

interface Props {
  files: File[];
  multi: boolean;
  onReorder: (files: File[]) => void;
  onRemove: (index: number) => void;
  onAddMore: () => void;
}

/** The "ready" file card: reorderable (drag or arrow buttons), removable rows. */
export function FileList({ files, multi, onReorder, onRemove, onAddMore }: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= files.length) return;
    const next = files.slice();
    const [f] = next.splice(from, 1);
    next.splice(to, 0, f);
    onReorder(next);
  };

  return (
    <div className="rounded-[20px] border border-line bg-surface p-[18px] shadow-card">
      <div className="mb-3.5 flex items-center justify-between gap-2.5">
        <p className="m-0 text-[13px] font-semibold tracking-[0.08em] text-mute uppercase">
          {files.length} {files.length === 1 ? 'file' : 'files'}
        </p>
        <button type="button" onClick={onAddMore} className="cursor-pointer border-none bg-transparent p-1 text-[13px] font-medium text-accent">
          {copy.addMore}
        </button>
      </div>
      {multi && files.length > 1 && <p className="mt-[-8px] mb-3 text-[13px] text-mute">{copy.reorderHint}</p>}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {files.map((f, i) => (
          <li
            key={`${f.name}-${i}`}
            draggable={multi}
            onDragStart={() => setDragIdx(i)}
            onDragEnd={() => setDragIdx(null)}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragIdx === null || dragIdx === i) return;
              move(dragIdx, i);
              setDragIdx(i);
            }}
            className={`flex items-center gap-3 rounded-[14px] border px-3 py-2.5 transition ${
              dragIdx === i ? 'border-accent bg-accent-soft' : 'border-line bg-bg'
            }`}
          >
            {multi && (
              <span className="flex flex-none cursor-grab items-center gap-2 text-mute">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
                  <line x1="5" y1="8" x2="19" y2="8" /><line x1="5" y1="12" x2="19" y2="12" /><line x1="5" y1="16" x2="19" y2="16" />
                </svg>
                <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[7px] bg-accent text-xs font-bold text-accent-ink">{i + 1}</span>
              </span>
            )}
            <span className="flex h-11 w-9 flex-none items-center justify-center rounded-md border border-line bg-surface2 text-mute">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                <rect x="5" y="3" width="14" height="18" rx="2" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" />
              </svg>
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold">{f.name}</span>
              <span className="text-[12.5px] text-mute">{formatSize(f.size)}</span>
            </span>
            {multi && (
              <span className="flex gap-0.5">
                <button type="button" aria-label={`Move ${f.name} up`} onClick={() => move(i, i - 1)} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-mute hover:bg-surface2 hover:text-ink">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true"><polyline points="6 14 12 8 18 14" /></svg>
                </button>
                <button type="button" aria-label={`Move ${f.name} down`} onClick={() => move(i, i + 1)} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-mute hover:bg-surface2 hover:text-ink">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true"><polyline points="6 10 12 16 18 10" /></svg>
                </button>
              </span>
            )}
            <button type="button" aria-label={`Remove ${f.name}`} onClick={() => onRemove(i)} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-mute hover:bg-accent-soft hover:text-accent">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
