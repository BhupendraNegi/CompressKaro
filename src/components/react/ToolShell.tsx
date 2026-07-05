import { Suspense, useMemo, useRef, useState } from 'react';
import type { OptionValues, ToolConfig, ToolOutput } from '../../tools/types';
import { runTool } from '../../lib/workers/client';
import { friendlyError } from '../../lib/errors';
import { formatSize } from '../../lib/files';
import { acceptHint, copy } from '../../lib/copy';
import { FileList } from './FileList';
import { OptionsPanel } from './OptionsPanel';
import { toolPanels } from './toolPanels';

type Phase = 'empty' | 'ready' | 'processing' | 'done' | 'error';

interface Props {
  config: ToolConfig;
}

const defaultOptions = (config: ToolConfig): OptionValues => {
  const values: OptionValues = {};
  for (const opt of config.options) {
    if (opt.type === 'slider') values[opt.key] = opt.def;
    else if (opt.type === 'choice') values[opt.key] = opt.def ?? opt.choices[0];
    else values[opt.key] = opt.def ?? '';
  }
  return values;
};

/**
 * The single tool island (docs/Architecture.md §3, Rule 3): dropzone → files +
 * options → worker-driven progress → download. Every tool renders through it.
 */
export function ToolShell({ config }: Props) {
  const [phase, setPhase] = useState<Phase>('empty');
  const [files, setFiles] = useState<File[]>([]);
  const [values, setValues] = useState<OptionValues>(() => defaultOptions(config));
  const [progress, setProgress] = useState(0);
  const [outputs, setOutputs] = useState<ToolOutput[]>([]);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const inputBytes = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);
  const outputBytes = useMemo(() => outputs.reduce((s, o) => s + o.blob.size, 0), [outputs]);

  const addFiles = (incoming: File[]) => {
    if (!incoming.length) return;
    let next = config.multi ? [...files, ...incoming] : incoming.slice(-1);
    const cap = config.maxFiles ?? 25;
    if (next.length > cap) next = next.slice(0, cap);
    setFiles(next);
    setPhase('ready');
  };

  const openPicker = () => inputRef.current?.click();

  const start = async () => {
    setPhase('processing');
    setProgress(0);
    try {
      const result = await runTool(config.slug, files, values, setProgress);
      setOutputs(result);
      setPhase('done');
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : String(err)));
      setPhase('error');
    }
  };

  const download = (output: ToolOutput) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(output.blob);
    a.download = output.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const reset = () => {
    setFiles([]);
    setOutputs([]);
    setProgress(0);
    setError('');
    setPhase('empty');
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple={config.multi}
        accept={config.accept}
        onChange={(e) => {
          addFiles(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />

      {phase === 'empty' && (
        <div
          role="button"
          tabIndex={0}
          aria-label={`${config.multi ? copy.dropTitleMulti : copy.dropTitleSingle} ${copy.browseHint}`}
          onClick={openPicker}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openPicker())}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(Array.from(e.dataTransfer.files ?? []));
          }}
          className={`mt-1.5 cursor-pointer rounded-[20px] border-2 border-dashed px-6 py-14 text-center transition ${
            dragOver ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
          }`}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-accent text-accent-ink shadow-card-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7" aria-hidden="true">
              <line x1="12" y1="19" x2="12" y2="6" /><polyline points="6 11 12 5 18 11" />
            </svg>
          </div>
          <p className="mt-5 mb-0 text-lg font-semibold">{config.multi ? copy.dropTitleMulti : copy.dropTitleSingle}</p>
          <p className="mt-1.5 mb-0 text-sm text-mute">
            {copy.browseHint} · {acceptHint(config.accept)}
          </p>
          {config.optionalFile && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPhase('ready');
              }}
              className="mt-[18px] inline-block cursor-pointer border-none bg-transparent text-[13.5px] font-medium text-accent underline underline-offset-[3px]"
            >
              {copy.skipFile}
            </button>
          )}
        </div>
      )}

      {phase === 'ready' && (
        <div className="mt-1.5 flex flex-col gap-4" style={{ animation: 'ck-rise 0.25s ease' }}>
          {files.length > 0 && (
            <FileList
              files={files}
              multi={config.multi}
              onReorder={setFiles}
              onRemove={(i) => {
                const next = files.filter((_, idx) => idx !== i);
                setFiles(next);
                if (!next.length) setPhase('empty');
              }}
              onAddMore={openPicker}
            />
          )}
          {(() => {
            const panel = toolPanels[config.slug];
            if (!panel || !files[0]) return null;
            const Panel = panel.component;
            return (
              <Suspense fallback={<p className="m-0 py-4 text-center text-[13px] text-mute">Loading previews…</p>}>
                <Panel
                  file={files[0]}
                  value={String(values[panel.optionKey] ?? '')}
                  onChange={(v) => setValues({ ...values, [panel.optionKey]: v })}
                  mode={panel.mode}
                />
              </Suspense>
            );
          })()}
          {config.options.length > 0 && (
            <OptionsPanel options={config.options} values={values} onChange={(k, v) => setValues({ ...values, [k]: v })} />
          )}
          <button
            type="button"
            onClick={start}
            className="w-full cursor-pointer rounded-2xl border-none bg-accent p-[17px] text-[17px] font-semibold tracking-[0.01em] text-accent-ink shadow-card-lg transition hover:-translate-y-px hover:brightness-106 active:translate-y-0"
          >
            {config.verb} {copy.actionSuffix} →
          </button>
        </div>
      )}

      {phase === 'processing' && (
        <div className="mt-1.5 rounded-[20px] border border-line bg-surface px-7 py-12 text-center shadow-card" aria-live="polite">
          <p className="m-0 font-serif text-2xl italic text-accent" style={{ animation: 'ck-pulse 1.4s ease infinite' }}>
            {copy.processing}
          </p>
          <p className="mt-2 mb-0 text-sm text-mute">{copy.processingNote}</p>
          <div className="mx-auto mt-6 h-2 max-w-[360px] overflow-hidden rounded-full bg-surface2">
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2.5 mb-0 text-[13px] font-semibold">{progress}%</p>
        </div>
      )}

      {phase === 'done' && (
        <div className="mt-1.5 rounded-[20px] border border-line bg-surface px-7 py-12 text-center shadow-card" style={{ animation: 'ck-rise 0.3s ease' }} aria-live="polite">
          <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent text-accent-ink" style={{ animation: 'ck-pop 0.45s cubic-bezier(0.2, 1.4, 0.4, 1)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" aria-hidden="true">
              <polyline points="5 13 10 18 19 7" strokeDasharray="48" style={{ animation: 'ck-draw 0.5s ease 0.25s backwards' }} />
            </svg>
          </div>
          <p className="mt-5 mb-0 font-serif text-3xl italic">{copy.done}</p>
          <p className="mt-2 mb-0 text-[14.5px] text-mute">
            {outputs.length > 1 ? copy.doneNoteMulti(outputs.length) : copy.doneNoteSingle}
            {outputBytes > 0 && outputBytes < inputBytes && ` ${formatSize(inputBytes)} → ${formatSize(outputBytes)}.`}
          </p>
          <div className="mt-[18px] flex flex-col items-center gap-2">
            {outputs.map((o) => (
              <div key={o.name} className="inline-flex items-center gap-2.5 rounded-xl border border-line bg-surface2 px-4 py-2.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-mute" aria-hidden="true">
                  <rect x="5" y="3" width="14" height="18" rx="2" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" />
                </svg>
                <span className="text-sm font-semibold">{o.name}</span>
                <span className="text-[13px] text-mute">{formatSize(o.blob.size)}</span>
              </div>
            ))}
          </div>
          <div className="mt-[22px] flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              onClick={() => outputs.forEach(download)}
              className="cursor-pointer rounded-[14px] border-none bg-accent px-7 py-[15px] text-base font-semibold text-accent-ink shadow-card-lg hover:brightness-106"
            >
              {outputs.length > 1 ? copy.downloadAll : copy.download}
            </button>
            <button
              type="button"
              onClick={reset}
              className="cursor-pointer rounded-[14px] border border-line bg-surface px-[22px] py-[15px] text-[15px] font-medium text-ink hover:border-accent"
            >
              {copy.startOver}
            </button>
          </div>
          <p className="mt-[18px] mb-0 text-[12.5px] text-mute">{copy.privacyFootnote}</p>
        </div>
      )}

      {phase === 'error' && (
        <div className="mt-1.5 rounded-[20px] border border-line bg-surface px-7 py-12 text-center shadow-card" aria-live="assertive">
          <p className="m-0 font-serif text-2xl italic text-accent">{copy.errorTitle}</p>
          <p className="mx-auto mt-3 mb-0 max-w-[420px] text-sm leading-relaxed text-mute">{error}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 cursor-pointer rounded-[14px] border border-line bg-surface px-[22px] py-3 text-[15px] font-medium text-ink hover:border-accent"
          >
            {copy.tryAgain}
          </button>
        </div>
      )}
    </div>
  );
}
