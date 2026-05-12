import React from 'react';
import { motion } from 'motion/react';
import { Stop, Report } from '../types';
import { Bus, Clock, MapPin, CheckCircle2, Users2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

interface TimelineProps {
  stops: Stop[];
  latestReport: Report | null;
}

export const Timeline: React.FC<TimelineProps> = ({ stops, latestReport }) => {
  const currentStopIndex = latestReport 
    ? stops.findIndex(s => s.id === latestReport.stopId) 
    : -1;

  return (
    <div className="relative pt-4">
      {/* The main path line */}
      <div className="absolute left-[39px] top-0 bottom-0 w-px bg-zinc-200 border-l border-dashed border-heritage-clay/20" />

      <div className="space-y-6">
        {stops.map((stop, index) => {
          const isPassed = index < currentStopIndex;
          const isCurrent = index === currentStopIndex;
          const isUpcoming = index > currentStopIndex;

          // Calculate ETA
          let eta = 0;
          if (isUpcoming && currentStopIndex !== -1) {
            for (let i = currentStopIndex + 1; i <= index; i++) {
              eta += stops[i].avgTravelTimeFromPrev;
            }
          }

          return (
            <motion.div 
              key={stop.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start gap-8 group"
            >
              {/* Order Number / Marker */}
              <div className="w-10 flex flex-col items-center shrink-0">
                <span className="font-mono text-[10px] text-zinc-400 font-bold mb-1">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className={cn(
                  "w-5 h-5 rounded-sm rotate-45 border-2 flex items-center justify-center transition-all duration-500 bg-white",
                  isPassed ? "border-heritage-clay bg-heritage-clay text-white shadow-sm" : 
                  isCurrent ? "border-amber-500 bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]" : 
                  "border-zinc-300"
                )}>
                  {isPassed && <CheckCircle2 className="w-3 h-3 -rotate-45" />}
                  {isCurrent && <Bus className="w-3 h-3 -rotate-45 animate-pulse" />}
                </div>
              </div>

              {/* Stop Details Card */}
              <div className={cn(
                "flex-1 p-5 rounded-none border-l-4 transition-all relative overflow-hidden",
                isCurrent 
                  ? "bg-white border-amber-500 shadow-[20px_0_40px_-20px_rgba(245,158,11,0.1)]" 
                  : "bg-white/40 border-zinc-100 hover:bg-white hover:border-zinc-300"
              )}>
                {/* Decorative Pattern for Current Stop */}
                {isCurrent && (
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Bus className="w-16 h-16 -rotate-12" />
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={cn(
                      "text-xl font-serif font-semibold tracking-tight leading-none",
                      isPassed ? "text-zinc-400 italic" : "text-heritage-ink"
                    )}>
                      {stop.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                       {isCurrent && (
                         <div className="flex flex-wrap items-center gap-2">
                           <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider">
                             <Clock className="w-3 h-3" />
                             Arrived {latestReport?.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
                           
                           {latestReport?.crowdLevel && (
                             <div className={cn(
                               "flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                               latestReport.crowdLevel === 'LOW' ? "bg-emerald-50 text-emerald-700" :
                               latestReport.crowdLevel === 'MEDIUM' ? "bg-amber-50 text-amber-700" :
                               "bg-red-50 text-red-700"
                             )}>
                               <Users2 className="w-3 h-3" />
                               {latestReport.crowdLevel === 'LOW' ? 'Spacious' : 
                                latestReport.crowdLevel === 'MEDIUM' ? 'Moderate' : 
                                'Heavily Crowded'}
                             </div>
                           )}
                         </div>
                       )}
                       {isUpcoming && currentStopIndex !== -1 && latestReport?.timestamp && (
                         <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-1.5 text-heritage-clay font-mono text-[10px] font-bold uppercase">
                             <Clock className="w-3 h-3" />
                             ETA ~{eta} min
                           </div>
                           <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                             Expected at {new Date(latestReport.timestamp.toDate().getTime() + eta * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
                         </div>
                       )}
                       <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                          Stop Point
                       </div>
                    </div>
                  </div>

                  {isCurrent && (
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }} 
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <MapPin className="w-5 h-5 text-amber-500 fill-amber-50" />
                    </motion.div>
                  )}
                </div>

                {isCurrent && latestReport?.reporterName && (
                  <div className="mt-4 pt-4 border-t border-dashed border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] text-white font-bold">
                        {latestReport.reporterName[0]}
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                        Verified by {latestReport.reporterName}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-zinc-300 uppercase">
                      Live Pulse
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
