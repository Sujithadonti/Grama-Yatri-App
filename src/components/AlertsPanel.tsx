import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { OperationType, handleFirestoreError } from '../lib/utils';
import { Route, Alert } from '../types';
import { AlertTriangle, Plus, MessageCircle, Clock, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'motion/react';

interface AlertsPanelProps {
  route: Route;
  alerts: Alert[];
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ route, alerts }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');

  const handleSubmit = async () => {
    if (!message || !auth.currentUser) return;

    setStatus('loading');
    try {
      await addDoc(collection(db, 'alerts'), {
        routeId: route.id,
        message,
        timestamp: serverTimestamp(),
        reporterName: auth.currentUser.displayName || 'Anonymous',
        userId: auth.currentUser.uid
      });
      setMessage('');
      setIsAdding(false);
      setStatus('idle');
    } catch (error) {
      setStatus('idle');
      handleFirestoreError(error, OperationType.WRITE, 'alerts');
    }
  };

  return (
    <div className="">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-red-500" />
          <h2 className="text-xl font-serif font-bold text-heritage-ink tracking-tight uppercase leading-none">Emergency Bulletins</h2>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-[10px] font-bold border-b border-heritage-ink hover:text-heritage-clay hover:border-heritage-clay pb-0.5 uppercase tracking-[0.2em] transition-all"
        >
          {isAdding ? 'Close Entry' : 'Manual Report'}
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-zinc-50 border border-zinc-200 p-6 mb-8"
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Document the transit issue here..."
            className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 outline-none placeholder:text-zinc-300 font-serif italic min-h-[100px] resize-none"
          />
          <div className="flex justify-end mt-4 pt-4 border-t border-zinc-100">
            <button
              onClick={handleSubmit}
              disabled={!message || status === 'loading'}
              className="bg-heritage-ink text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-heritage-clay transition-colors disabled:opacity-50"
            >
              Log Information
            </button>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        {alerts.length === 0 ? (
          <div className="py-12 px-6 text-center bg-zinc-50 border-y border-dashed border-zinc-200">
            <MessageCircle className="w-6 h-6 text-zinc-300 mx-auto mb-4" />
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">All Systems Clear</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className="relative group pl-6">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-red-100 group-hover:bg-red-500 transition-colors" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-heritage-ink font-serif leading-relaxed italic">{alert.message}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-[9px] text-zinc-400 font-mono font-bold uppercase flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {alert.timestamp ? formatDistanceToNow(alert.timestamp.toDate(), { addSuffix: true }) : 'Live'}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                     Record #{alert.id.slice(0, 4)} By {alert.reporterName}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
