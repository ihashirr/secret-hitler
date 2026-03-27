import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../backend/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "lucide-react";

export default function GhostLogs({ roomId }) {
	const logs = useQuery(api.game.getGameLog, roomId ? { roomId } : "skip") ?? [];
	const [visibleLogs, setVisibleLogs] = useState([]);

	useEffect(() => {
		if (logs.length > 0) {
			const newLog = logs[0];
			// Only add if it's not already visible
			if (!visibleLogs.find(l => l._id === newLog._id)) {
				setVisibleLogs(prev => [newLog, ...prev].slice(0, 3));
				
				// Automatically remove this log after 5 seconds
				const timer = setTimeout(() => {
					setVisibleLogs(prev => prev.filter(l => l._id !== newLog._id));
				}, 5000);
				
				return () => clearTimeout(timer);
			}
		}
	}, [logs, visibleLogs]);

	if (!roomId) return null;

	return (
		<div className="fixed bottom-10 left-6 z-[100] flex flex-col-reverse gap-2 pointer-events-none max-w-[320px]">
			<AnimatePresence mode="popLayout">
				{visibleLogs.map((log) => (
					<motion.div
						key={log._id}
						layout
						initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						exit={{ opacity: 0, x: -20, opacity: 0 }}
						transition={{ type: "spring", stiffness: 500, damping: 30, opacity: { duration: 0.2 } }}
						className="bg-obsidian-900/95 backdrop-blur-xl border border-white/10 px-3 py-2.5 rounded-sm flex items-start gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
					>
						<Terminal size={10} className="text-cyan-400 mt-0.5 shrink-0" />
						<div className="flex flex-col gap-1">
							<span className="text-[10px] font-mono text-white/80 uppercase tracking-widest leading-tight font-medium">
								{log.message}
							</span>
							<div className="h-[1px] w-full bg-cyan-500/20" />
						</div>
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
}
