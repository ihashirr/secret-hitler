export default function StageTimeline({ timeline = [], compact = false }) {
  if (!timeline.length) return null;

  const currentStep = timeline.find((step) => step.status === 'current') || timeline[0];

  if (compact) {
    return (
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[9px] font-mono font-black uppercase tracking-[0.18em] text-white/70">
          <span className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-cyan-100">
            {currentStep.index + 1}/{timeline.length}
          </span>
          <span className="truncate text-white/80">{currentStep.label}</span>
        </div>

        <div className="mt-2 flex gap-1">
          {timeline.map((step) => (
            <span
              key={step.key}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step.status === 'complete'
                  ? 'bg-cyan-300'
                  : step.status === 'current'
                    ? 'bg-white'
                    : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex min-w-max items-center gap-2">
        {timeline.map((step, index) => (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className={`flex min-w-[96px] items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-mono font-black uppercase tracking-[0.16em] transition-colors ${
                step.status === 'complete'
                  ? 'border-cyan-400/25 bg-cyan-400/12 text-cyan-100'
                  : step.status === 'current'
                    ? 'border-white/20 bg-white/10 text-white'
                    : 'border-white/10 bg-white/[0.03] text-white/40'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] ${
                  step.status === 'complete'
                    ? 'bg-cyan-300 text-black'
                    : step.status === 'current'
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/45'
                }`}
              >
                {index + 1}
              </span>
              <span>{step.label}</span>
            </div>

            {index < timeline.length - 1 && (
              <span
                className={`h-px w-5 rounded-full ${
                  step.status === 'complete' ? 'bg-cyan-300/70' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
