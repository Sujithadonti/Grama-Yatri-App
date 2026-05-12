import React, { useState, useEffect } from 'react';
import { auth, db, googleProvider } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  getDocs,
  setDoc,
  doc
} from 'firebase/firestore';
import { Route, Stop, Report, Alert } from './types';
import { Timeline } from './components/Timeline';
import { PingPanel } from './components/PingPanel';
import { AlertsPanel } from './components/AlertsPanel';
import { MapPin, Bus, LogIn, Github, Users, ShieldCheck, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Seeder function to populate initial data if DB is empty
async function seedDatabase() {
  try {
    const routesSnap = await getDocs(collection(db, 'routes'));
    if (!routesSnap.empty) return;

    console.log('Seeding demo route...');
    const mainRouteId = 'route-01';
    
    // Create Route
    await setDoc(doc(db, 'routes', mainRouteId), {
      name: 'Grama-City Express (7:30 AM)',
      description: 'Connects Hebbalu to City Bus Stand'
    });

    // Create Stops
    const stops = [
      { name: 'Hebbalu (Source)', order: 0, avgTravelTimeFromPrev: 0 },
      { name: 'Kodigehalli', order: 1, avgTravelTimeFromPrev: 10 },
      { name: 'Byatarayanapura', order: 2, avgTravelTimeFromPrev: 15 },
      { name: 'Sahakara Nagar', order: 3, avgTravelTimeFromPrev: 8 },
      { name: 'City Bus Stand', order: 4, avgTravelTimeFromPrev: 20 },
    ];

    for (const [index, stop] of stops.entries()) {
      await setDoc(doc(db, 'routes', mainRouteId, 'stops', `stop-${index}`), stop);
    }
  } catch (error) {
    console.log('Seeding skipped:', error instanceof Error ? error.message : 'Insufficient permissions');
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // App state
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Auth
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) seedDatabase(); // Try seeding when auth is ready
    });
  }, []);

  // Fetch Routes
  useEffect(() => {
    return onSnapshot(collection(db, 'routes'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Route));
      setRoutes(data);
      if (!selectedRoute && data.length > 0) setSelectedRoute(data[0]);
    });
  }, [selectedRoute]);

  // Fetch Stops for selected route
  useEffect(() => {
    if (!selectedRoute) return;
    return onSnapshot(query(collection(db, 'routes', selectedRoute.id, 'stops'), orderBy('order')), (snap) => {
      setStops(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Stop)));
    });
  }, [selectedRoute]);

  // Fetch Reports
  useEffect(() => {
    if (!selectedRoute) return;
    const q = query(
      collection(db, 'reports'), 
      where('routeId', '==', selectedRoute.id),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    return onSnapshot(q, (snap) => {
      setReports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
    });
  }, [selectedRoute]);

  // Fetch Alerts
  useEffect(() => {
    if (!selectedRoute) return;
    const q = query(
      collection(db, 'alerts'), 
      where('routeId', '==', selectedRoute.id),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    return onSnapshot(q, (snap) => {
      setAlerts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert)));
    });
  }, [selectedRoute]);

  const handleLogin = () => signInWithPopup(auth, googleProvider);

  if (loading) {
    return (
      <div className="min-h-screen bg-heritage-paper flex items-center justify-center p-8 heritage-grid">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-l-4 border-heritage-clay rounded-full animate-spin" />
          <div className="text-center">
            <h2 className="font-serif italic text-xl">GRAMA-YATRI</h2>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em] mt-2">Synchronizing Rural Grids</p>
          </div>
        </div>
      </div>
    );
  }

  const latestReport = reports.length > 0 ? reports[0] : null;

  return (
    <div className="min-h-screen bg-heritage-paper text-heritage-ink font-sans selection:bg-heritage-gold selection:text-black heritage-grid">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/40 backdrop-blur-xl border-b border-heritage-ink/10 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-heritage-ink rounded-none rotate-45 flex items-center justify-center shadow-2xl relative overflow-hidden group transition-all hover:rotate-0">
             <Bus className="w-5 h-5 text-heritage-gold -rotate-45 group-hover:rotate-0 transition-all" />
             <div className="absolute inset-x-0 bottom-0 h-1 bg-heritage-gold opacity-50" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl tracking-tight leading-none italic uppercase">Grama-Yatri</h1>
            <p className="text-[9px] font-mono font-bold text-zinc-400 mt-1 uppercase tracking-widest hidden sm:block">Public Transit Protocol v0.4</p>
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-4 group cursor-pointer">
             <div className="text-right hidden sm:block">
               <p className="text-[10px] font-bold text-heritage-ink uppercase tracking-widest">{user.displayName}</p>
               <p className="text-[9px] text-heritage-clay font-bold mt-0.5 uppercase tracking-wider">Node Contributor</p>
             </div>
             <div className="relative">
               <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-none border border-heritage-ink p-0.5 grayscale hover:grayscale-0 transition-all" />
               <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-heritage-paper" />
             </div>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="group relative px-6 py-2.5 bg-heritage-ink text-heritage-gold font-bold text-[10px] uppercase tracking-widest overflow-hidden transition-all hover:bg-heritage-clay"
          >
            <span className="relative z-10 flex items-center gap-2">
              <LogIn className="w-3 h-3" />
              Initialize Portal
            </span>
            <div className="absolute top-0 right-0 w-2 h-2 bg-heritage-gold rotate-45 translate-x-1 -translate-y-1" />
          </button>
        )}
      </header>

      <main className="pt-32 pb-24 px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Route & Timeline */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-heritage-clay/10 border border-heritage-clay/20 text-heritage-clay text-[9px] font-bold uppercase tracking-[0.2em] mb-4">
              <Database className="w-3 h-3" />
              Live Ledger Update
            </div>
            <h2 className="text-5xl font-serif font-bold tracking-tight text-heritage-ink mb-4 leading-[0.9]">
              {selectedRoute?.name || 'Protocol Offline'}
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium italic">
              "A crowdsourced transit log where arrival signals are generated by the community to eliminate unpredictable wait times."
            </p>
          </div>

          <div className="relative">
            <div className="absolute -left-4 -top-4 w-24 h-24 border-l border-t border-heritage-clay/20" />
            <div className="absolute -right-4 -bottom-4 w-24 h-24 border-r border-b border-heritage-clay/20" />
            
            <div className="bg-white/60 backdrop-blur-sm border border-zinc-200 p-10 overflow-hidden shadow-[40px_40px_80px_-40px_rgba(0,0,0,0.05)]">
              <Timeline stops={stops} latestReport={latestReport} />
              
              {reports.length === 0 && (
                <div className="mt-12 py-12 border-t border-dashed border-zinc-100 flex flex-col items-center text-center">
                  <Users className="w-8 h-8 text-zinc-200 mb-4" />
                  <h3 className="font-serif italic text-xl text-zinc-400">Atmospheric Silence</h3>
                  <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest mt-2">No transmissions received on this frequency</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interaction */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-12">
           {/* Reporting Panel */}
           <AnimatePresence mode="wait">
             {!user ? (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="bg-heritage-ink p-12 text-center shadow-2xl relative overflow-hidden heritage-grid group"
               >
                 <div className="absolute top-0 right-0 p-4">
                    <ShieldCheck className="w-8 h-8 text-white/10 group-hover:text-heritage-gold transition-colors" />
                 </div>
                 <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-none rotate-45 flex items-center justify-center mx-auto mb-10 shadow-inner">
                   <Users className="w-8 h-8 text-heritage-gold -rotate-45" />
                 </div>
                 <h3 className="text-2xl font-serif text-white font-bold mb-4 uppercase tracking-tighter italic">Collaborative Access Only</h3>
                 <p className="text-white/40 text-[11px] mb-10 leading-relaxed font-medium px-4">
                   Authenticated credentials are required to broadcast signals to the community grid.
                 </p>
                 <button 
                  onClick={handleLogin}
                  className="w-full h-14 bg-white text-black font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-heritage-gold transition-all block relative"
                 >
                   Establish Connection
                   <div className="absolute bottom-0 right-0 w-3 h-3 bg-heritage-ink rotate-45 translate-x-1.5 translate-y-1.5" />
                 </button>
               </motion.div>
             ) : (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
               >
                 {selectedRoute && <PingPanel route={selectedRoute} stops={stops} />}
               </motion.div>
             )}
           </AnimatePresence>

           {/* Alerts Panel */}
           <div className="bg-white/40 border-y border-zinc-200 py-10">
             {selectedRoute && <AlertsPanel route={selectedRoute} alerts={alerts} />}
           </div>

           {/* Footer/Info */}
           <div className="relative group">
              <div className="absolute inset-0 bg-heritage-ink opacity-0 group-hover:opacity-5 transition-opacity" />
              <div className="p-8 border border-zinc-200 flex flex-col gap-6 bg-white/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-100 rounded-none rotate-45 flex items-center justify-center shrink-0 border border-zinc-200 overflow-hidden">
                    <Github className="w-4 h-4 text-zinc-500 -rotate-45" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Open Protocol Insight</span>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-lg mb-2 italic">Rural Connectivity Vision</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                    Grama-Yatri leverages shared mobile intelligence to bridge the mobility gap, ensuring rural labor reaches economic hubs with maximum efficiency.
                  </p>
                </div>
              </div>
           </div>
        </div>
      </main>

      {/* Floating Status Bar - Mobile Only */}
      <div className="fixed bottom-8 left-8 right-8 xl:hidden z-40">
         <div className="bg-heritage-ink/95 border border-white/10 rounded-none p-5 shadow-2xl flex items-center justify-between heritage-grid border-l-4 border-l-heritage-gold">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-heritage-gold rotate-45 flex items-center justify-center shadow-lg">
                <Bus className="w-5 h-5 text-black -rotate-45" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] text-white/30 font-bold uppercase tracking-[0.2em] mb-0.5">Frequency Pulse</p>
                <div className="text-[11px] text-white font-serif italic truncate max-w-[140px]">
                  {latestReport ? `${stops.find(s => s.id === latestReport.stopId)?.name || 'Protocol Active'}` : 'Awaiting Signals...'}
                </div>
              </div>
            </div>
            {!user && (
              <button 
                onClick={handleLogin}
                className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-black/10 hover:bg-heritage-gold"
              >
                Sync
              </button>
            )}
         </div>
      </div>
    </div>
  );
}
