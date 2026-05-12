import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { OperationType, handleFirestoreError, cn } from '../lib/utils';
import { Stop, Route } from '../types';
import { Send, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PingPanelProps {
  route: Route;
  stops: Stop[];
}

export const PingPanel: React.FC<PingPanelProps> = ({ route, stops }) => {
  const [selectedStop, setSelectedStop] = useState<string>('');
  const [reportType, setReportType] = useState<'ARRIVED' | 'PASSED' | 'ON_BUS'>('ARRIVED');
  const [crowdLevel, setCrowdLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async () => {
    if (!selectedStop || !auth.currentUser) return;

    setStatus('loading');
    try {
      await addDoc(collection(db, 'reports'), {
        routeId: route.id,
        stopId: selectedStop,
        type: reportType,
        crowdLevel,
        timestamp: serverTimestamp(),
        reporterName: auth.currentUser.displayName || 'Anonymous',
        userId: auth.currentUser.uid
      });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setStatus('error');
      handleFirestoreError(error, OperationType.WRITE, 'reports');
    }
  };

  return (
    <div className="bg-heritage-ink text-white p-8 rounded-none border border-white/10 shadow-2xl overflow-hidden relative heritage-grid">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-none rotate-45 bg-heritage-gold flex items-center justify-center border-4 border-black/20">
          <Send className="w-6 h-6 text-black -rotate-45" />
        </div>
        <div>
          <h2 className="text-xl font-serif font-bold tracking-tight">Signal Arrival</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono">Community Station 01</p>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <label className="text-[9px] uppercase tracking-[0.3em] font-bold text-white/30 mb-4 block">Select Current Location</label>
          <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {stops.map(stop => (
              <button
                key={stop.id}
                onClick={() => setSelectedStop(stop.id)}
                className={cn(
                  "flex items-center justify-between p-4 border transition-all text-left group",
                  selectedStop === stop.id 
                    ? "bg-heritage-gold border-heritage-gold text-black" 
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                )}
              >
                <span className="text-sm font-serif font-medium">{stop.name}</span>
                <div className={cn(
                  "w-2 h-2 rotate-45 transition-all",
                  selectedStop === stop.id ? "bg-black" : "bg-white/20 group-hover:bg-white/40"
                )} />
              </button>
            ))}
          </div>
        </div>

        <div>
           <label className="text-[9px] uppercase tracking-[0.3em] font-bold text-white/30 mb-4 block">Observation Type</label>
           <div className="grid grid-cols-3 border border-white/10 p-1 bg-black/40">
              {(['ARRIVED', 'PASSED', 'ON_BUS'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={cn(
                    "py-3 text-[9px] font-bold uppercase tracking-widest transition-all",
                    reportType === type 
                      ? "bg-white text-black" 
                      : "text-white/40 hover:text-white"
                  )}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
           </div>
        </div>

        <div>
           <label className="text-[9px] uppercase tracking-[0.3em] font-bold text-white/30 mb-4 block">Crowd Recognition</label>
           <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'LOW', label: 'Spacious', color: 'bg-emerald-500/20' },
                { id: 'MEDIUM', label: 'Moderate', color: 'bg-amber-500/20' },
                { id: 'HIGH', label: 'Crowded', color: 'bg-red-500/20' }
              ].map(level => (
                <button
                  key={level.id}
                  onClick={() => setCrowdLevel(level.id as any)}
                  className={cn(
                    "py-3 rounded-none border text-[9px] font-bold uppercase tracking-wider transition-all",
                    crowdLevel === level.id 
                      ? "border-heritage-gold bg-heritage-gold text-black"
                      : cn("border-white/10 text-white/40", level.color)
                  )}
                >
                  {level.label}
                </button>
              ))}
           </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedStop || status === 'loading'}
          className={cn(
            "w-full h-16 rounded-none font-bold text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 relative overflow-hidden",
            status === 'loading' ? "bg-zinc-800 cursor-wait" : 
            status === 'success' ? "bg-emerald-600 text-white" :
            status === 'error' ? "bg-red-600 text-white" :
            "bg-white text-black hover:bg-heritage-gold active:translate-y-px"
          )}
        >
          {status === 'loading' ? 'Transmitting...' : 
           status === 'success' ? <><Check className="w-4 h-4" /> Logged</> :
           status === 'error' ? <><AlertCircle className="w-4 h-4" /> System Fail</> :
           'Broadcast Update'}
          
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-4 h-4 bg-black/10 rotate-45 translate-x-2 -translate-y-2" />
        </button>
      </div>

      <AnimatePresence>
        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-heritage-gold flex flex-col items-center justify-center p-8 text-center heritage-grid"
          >
            <motion.div 
              initial={{ scale: 0.5, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              className="w-20 h-20 bg-black flex items-center justify-center mb-6 shadow-2xl"
            >
              <Check className="w-10 h-10 text-heritage-gold" />
            </motion.div>
            <h3 className="text-2xl font-serif font-bold text-black italic">Transmission Successful</h3>
            <p className="text-black/60 text-[10px] mt-4 font-mono font-bold uppercase tracking-widest leading-loose max-w-xs">
              Your signal has been synchronized with the community grid.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
