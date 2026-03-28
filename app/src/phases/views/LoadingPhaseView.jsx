export default function LoadingPhaseView() {
  return (
    <div className="min-h-[100svh] w-full flex items-center justify-center bg-obsidian-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 animate-spin transform rotate-45" />
        <p className="text-cyan-400 font-mono text-xs tracking-widest uppercase animate-pulse">
          Establishing_ Uplink...
        </p>
      </div>
    </div>
  );
}
