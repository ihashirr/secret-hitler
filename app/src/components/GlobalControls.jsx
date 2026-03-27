import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, ShieldAlert, LogOut, Terminal, Settings, X, Activity, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from "convex/react";
import { api } from "../../../backend/convex/_generated/api";
import { PHASES } from '../lib/constants';

const PHASE_LABELS = {
	[PHASES.LOBBY]: 'SECURE_LOBBY',
	[PHASES.ROLE_REVEAL]: 'IDENTITY_SYNC',
	[PHASES.NOMINATION]: 'NOMINATION_PHASE',
	[PHASES.VOTING]: 'VOTING_PROTOCOL',
	[PHASES.LEGISLATIVE_PRESIDENT]: 'PRESIDENTIAL_DISCARD',
	[PHASES.LEGISLATIVE_CHANCELLOR]: 'CHANCELLOR_ENACTMENT',
	[PHASES.EXECUTIVE_ACTION]: 'EXECUTIVE_OVERRIDE',
	[PHASES.GAME_OVER]: 'MISSION_COMPLETE'
};

export default function GlobalControls({ gameState, playerId, onReset, onWipe, onExit }) {
	const me = gameState?.players?.find(p => p.id === playerId);
	const isHost = me?.isHost;
	const [showHostMenu, setShowHostMenu] = useState(false);
	const [activeModal, setActiveModal] = useState(null); // 'wipe' | 'reset'
	const [modalInput, setModalInput] = useState('');

	const closeModal = () => {
		setActiveModal(null);
		setModalInput('');
	};

	// Handle Escape key
	useEffect(() => {
		const handleEsc = (e) => {
			if (e.key === 'Escape') {
				setActiveModal(null);
				setModalInput('');
				setShowHostMenu(false);
			}
		};
		window.addEventListener('keydown', handleEsc);
		return () => window.removeEventListener('keydown', handleEsc);
	}, []);

	if (!me) return null;

	const handleWipe = () => {
		onWipe();
		closeModal();
	};

	const handleReset = () => {
		onReset();
		closeModal();
	};

	return (
		<>
			{/* Global Click-outside underlay for Host Menu */}
			<AnimatePresence>
				{showHostMenu && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setShowHostMenu(false)}
						className="fixed inset-0 z-[205] bg-transparent pointer-events-auto"
					/>
				)}
			</AnimatePresence>

			<motion.div
				initial={{ y: -60, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				className={`fixed top-0 left-0 right-0 h-[36px] flex items-center backdrop-blur-md border-b shadow-2xl ${isHost ? 'border-red-500/40 shadow-red-500/5' : 'border-white/10 shadow-black/80'} ${showHostMenu ? 'z-[210]' : 'z-[200]'} bg-black/80 transition-all duration-300`}
			>
				{/* Symmetrical HUD Bar */}
				<div className="grid grid-cols-3 items-center w-full px-4 sm:px-6">
					{/* Left: Branding Logo */}
					<div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
						<div className="w-2 h-2 rounded-full border-2 border-cyan-400/40 relative flex items-center justify-center shrink-0">
							<div className="w-0.5 h-0.5 rounded-full bg-cyan-400" />
						</div>
						<span className="text-[10px] font-black text-white uppercase tracking-[0.25em] flex items-center">
							<span className="text-cyan-400 brightness-110">ECLIPSE</span>
							<span className="ml-1.5 opacity-40 font-light">HITLER</span>
						</span>
					</div>

					{/* Center: Centered Session Identity */}
					<div className="flex items-center justify-center min-w-0">
						<div className="flex items-center gap-2 max-w-full drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
							<span className="text-[11px] font-mono font-black uppercase tracking-[0.15em] text-white overflow-hidden text-ellipsis whitespace-nowrap">
								{me.name} <span className="text-white/30 mx-1">//</span> {gameState.roomId}
							</span>
						</div>
					</div>

					{/* Right: Actions */}
					<div className="flex items-center justify-end gap-3 shrink-0">
						{isHost && (
							<div className="relative">
								<button
									onClick={() => setShowHostMenu(!showHostMenu)}
									className={`flex items-center justify-center w-6 h-6 transition-all rounded-sm border ${showHostMenu ? 'bg-red-500 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-white/80 border-transparent hover:text-white hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]'}`}
								>
									{showHostMenu ? <X size={12} /> : <Settings size={12} />}
								</button>

								<AnimatePresence>
									{showHostMenu && (
										<motion.div
											initial={{ opacity: 0, y: 5, scale: 0.95 }}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											exit={{ opacity: 0, y: 5, scale: 0.95 }}
											className="absolute right-0 top-[calc(100%+8px)] w-40 bg-black backdrop-blur-xl border border-white/10 shadow-2xl p-1 rounded-sm z-[210] pointer-events-auto"
										>
											<div className="px-2 py-1 mb-0.5 border-b border-white/5">
												<span className="text-[7px] font-mono text-white/20 uppercase tracking-[0.25em]">System Protocols</span>
											</div>
											<button
												onClick={() => { setShowHostMenu(false); setActiveModal('wipe'); }}
												className="w-full flex items-center gap-2 px-2 py-2 hover:bg-red-500/10 text-red-500 transition-all text-[8px] font-mono font-black uppercase tracking-widest text-left"
											>
												<AlertTriangle size={10} /> Wipe Storage
											</button>
											<button
												onClick={() => { setShowHostMenu(false); setActiveModal('reset'); }}
												className="w-full flex items-center gap-2 px-2 py-2 hover:bg-white/5 text-white/40 hover:text-white/80 transition-all text-[8px] font-mono font-bold uppercase tracking-widest text-left"
											>
												<ShieldAlert size={10} /> Delete Session
											</button>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						)}

						<div className="w-[1px] h-4 bg-white/5 mx-1" />

						<button
							onClick={onExit}
							className="group flex items-center gap-2 h-7 px-4 bg-red-500/5 border border-red-500/10 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all text-[10px] font-mono font-black uppercase tracking-[0.2em] rounded-sm"
						>
							<LogOut size={10} className="group-hover:translate-x-0.5 transition-transform" />
							<span className="hidden xs:inline">ABORT</span>
						</button>
					</div>
				</div>
			</motion.div>

			{/* Custom System Modal */}
			<AnimatePresence>
				{activeModal && (
					<div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={closeModal}
							className="absolute inset-0 bg-black/40 backdrop-blur-xl"
						/>
						<motion.div
							initial={{ scale: 0.95, opacity: 0, y: 20 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							exit={{ scale: 0.95, opacity: 0, y: 20 }}
							className="w-full max-w-[320px] bg-black border border-white/10 p-6 rounded-sm shadow-2xl relative overflow-hidden z-[310]"
						>
							<div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

							<h2 className={`text-[10px] font-mono font-black uppercase tracking-[0.3em] mb-3 ${activeModal === 'wipe' ? 'text-red-500' : 'text-white/60'}`}>
								{activeModal === 'wipe' ? 'Critical Override Required' : 'Session Termination'}
							</h2>

							<p className="text-[9px] font-mono text-white/40 leading-relaxed mb-6 uppercase tracking-wider">
								{activeModal === 'wipe'
									? 'This action will PERMANENTLY ERASE all database records. This protocol is irreversible.'
									: 'This will terminate the current tactical session for all operatives. Proceed?'}
							</p>

							{activeModal === 'wipe' && (
								<div className="mb-6">
									<label className="block text-[7px] font-mono text-red-500/50 uppercase mb-2 tracking-widest font-bold">Type &quot;ECLIPSE&quot; to authorize</label>
									<input
										autoFocus
										type="text"
										value={modalInput}
										onChange={(e) => setModalInput(e.target.value.toUpperCase())}
										className="w-full bg-red-500/5 border border-red-500/10 px-3 py-2 text-red-500 font-mono text-[10px] tracking-[0.2em] focus:outline-none focus:border-red-500/30 rounded-sm"
										placeholder="CODE"
									/>
								</div>
							)}

							<div className="flex gap-2">
								<motion.button
									whileTap={{ scale: 0.985 }}
									onClick={closeModal}
									className="flex-1 py-3 border border-white/5 text-white/20 hover:text-white/40 hover:bg-white/5 transition-all text-[8.5px] font-mono font-bold uppercase tracking-widest rounded-sm"
								>
									Abort
								</motion.button>
								<motion.button
									whileTap={{ scale: 0.985 }}
									onClick={activeModal === 'wipe' ? handleWipe : handleReset}
									disabled={activeModal === 'wipe' && modalInput !== 'ECLIPSE'}
									className={`flex-1 py-3 font-mono font-black text-[8.5px] uppercase tracking-widest transition-all rounded-sm ${activeModal === 'wipe'
											? 'bg-red-500 text-black shadow-[0_0_15px_rgba(239,68,68,0.3)]'
											: 'bg-white/10 text-white hover:bg-white/20'
										}`}
								>
									{activeModal === 'wipe' ? 'Execute' : 'Proceed'}
								</motion.button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</>
	);
}
