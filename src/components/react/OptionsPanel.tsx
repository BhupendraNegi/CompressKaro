import type { OptionValues, ToolOption } from '../../tools/types';

interface Props {
  options: ToolOption[];
  values: OptionValues;
  onChange: (key: string, value: string | number) => void;
}

/** Renders a tool's options schema: slider / number / text / choice pills. */
export function OptionsPanel({ options, values, onChange }: Props) {
  return (
    <div className="rounded-[20px] border border-line bg-surface p-[18px] shadow-card">
      <p className="mb-4 text-[13px] font-semibold tracking-[0.08em] text-mute uppercase">Options</p>
      <div className="flex flex-col gap-[18px]">
        {options.map((opt) => (
          <div key={opt.key} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2.5">
              <label htmlFor={`opt-${opt.key}`} className="text-sm font-semibold">
                {opt.label}
              </label>
              {opt.type === 'slider' && (
                <span className="text-[13.5px] font-medium text-accent">
                  {opt.labels ? opt.labels[Number(values[opt.key]) - opt.min] : `${values[opt.key]}${opt.unit ?? ''}`}
                </span>
              )}
            </div>

            {opt.type === 'slider' && (
              <input
                id={`opt-${opt.key}`}
                type="range"
                min={opt.min}
                max={opt.max}
                step={opt.step}
                value={Number(values[opt.key])}
                onChange={(e) => onChange(opt.key, Number(e.target.value))}
                className="w-full cursor-pointer accent-accent"
              />
            )}

            {opt.type === 'number' && (
              <div className="flex items-center gap-2">
                <input
                  id={`opt-${opt.key}`}
                  type="number"
                  value={values[opt.key] ?? ''}
                  placeholder={opt.placeholder}
                  onChange={(e) => onChange(opt.key, e.target.value === '' ? '' : Number(e.target.value))}
                  className="max-w-[200px] flex-1 rounded-xl border border-line bg-bg px-3.5 py-[11px] text-[15px] text-ink outline-none focus:border-accent"
                />
                {opt.unit && <span className="text-sm text-mute">{opt.unit}</span>}
              </div>
            )}

            {opt.type === 'textarea' && (
              <textarea
                id={`opt-${opt.key}`}
                value={String(values[opt.key] ?? '')}
                placeholder={opt.placeholder}
                rows={opt.rows ?? 10}
                onChange={(e) => onChange(opt.key, e.target.value)}
                className="w-full resize-y rounded-xl border border-line bg-bg px-3.5 py-[11px] font-mono text-sm leading-relaxed text-ink outline-none focus:border-accent"
              />
            )}

            {opt.type === 'text' && (
              <input
                id={`opt-${opt.key}`}
                type={opt.inputType ?? 'text'}
                value={String(values[opt.key] ?? '')}
                placeholder={opt.placeholder}
                onChange={(e) => onChange(opt.key, e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-[11px] text-[15px] text-ink outline-none focus:border-accent"
              />
            )}

            {opt.type === 'choice' && (
              <div role="radiogroup" aria-label={opt.label} className="flex flex-wrap gap-2">
                {opt.choices.map((c) => {
                  const active = values[opt.key] === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => onChange(opt.key, c)}
                      className={`min-h-[38px] cursor-pointer rounded-full border px-4 py-[9px] text-sm font-medium transition ${
                        active ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface text-ink hover:border-accent'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            )}

            {opt.hint && <p className="m-0 text-[12.5px] text-mute">{opt.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
