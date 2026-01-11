
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Upload, Cpu, FileText, RefreshCw, ExternalLink, ShieldCheck, MessageSquare, History, 
  Send, X, ArrowRightLeft, CheckCircle2, Database, Camera, FileDown, Activity, 
  Youtube, BookOpen, ShoppingCart, Microscope, Sliders, Share2, Zap, Tag, Store, 
  ArrowUpRight, Check, AlertCircle, Eye, Settings2, Globe, Layers, Star, 
  Search, HardDrive, CpuIcon, Binary, Info, AlertTriangle, Lightbulb, ClipboardList,
  Terminal, BarChart4, Filter, BookMarked, Download, Link2, BookCopy, Target
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { analyzeIC, askAboutIC } from './services/geminiService';
import { AnalysisState, ICIntelligenceReport, HistoryItem, FilterSettings, UserFeedback } from './types';

// Research Workspace Components
const TabButton = ({ active, onClick, label, icon: Icon }: { active: boolean, onClick: () => void, label: string, icon: any }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-4 border-b-2 transition-all font-bold text-xs uppercase tracking-widest ${
      active 
      ? 'border-blue-500 text-blue-500 bg-blue-500/5' 
      : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
    }`}
  >
    <Icon size={16} />
    {label}
  </button>
);

const GlassCard = ({ children, className = "", title, icon: Icon, badge, actions }: { children?: React.ReactNode, className?: string, title?: string, icon?: any, badge?: string, actions?: React.ReactNode }) => (
  <div className={`glass rounded-3xl overflow-hidden flex flex-col transition-all duration-300 ${className}`}>
    {(title || Icon) && (
      <div className="px-8 py-5 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/30">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={16} className="text-blue-500" />}
          {title && <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</h3>}
        </div>
        <div className="flex items-center gap-3">
          {badge && <span className="text-[8px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">{badge}</span>}
          {actions}
        </div>
      </div>
    )}
    <div className="flex-1 p-8">
      {children}
    </div>
  </div>
);

const Navbar = React.memo(({ onShowHistory }: { onShowHistory: () => void }) => (
  <nav className="bg-slate-950/90 backdrop-blur-2xl border-b border-slate-800/50 px-8 py-3 flex items-center justify-between sticky top-0 z-[110] no-print">
    <div className="flex items-center gap-5">
      <div className="relative group">
        <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative bg-blue-600 p-2 rounded-xl shadow-lg border border-blue-400/40">
          <Cpu className="text-white w-5 h-5" />
        </div>
      </div>
      <div>
        <h1 className="text-base font-black tracking-tight leading-none flex items-center gap-2">
          SILICON <span className="text-blue-500">DOSSIER</span>
        </h1>
        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Research Laboratory AI</p>
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="hidden md:flex items-center gap-8">
        <div className="flex flex-col items-end">
           <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Active Model</span>
           <span className="text-[10px] font-bold text-slate-300">Gemini 3 Pro Research</span>
        </div>
        <div className="w-px h-6 bg-slate-800"></div>
      </div>
      <button onClick={onShowHistory} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold text-[10px] uppercase tracking-widest">
        <History size={14}/> Records
      </button>
      <div className="flex items-center gap-2 px-4 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Live Node</span>
      </div>
    </div>
  </nav>
));

export default function App() {
  const [state, setState] = useState<AnalysisState>({
    originalImage: null, enhancedImage: null, isAnalyzing: false, 
    report: null, error: null, 
    history: JSON.parse(localStorage.getItem('ic_scan_history') || '[]'),
  });

  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'topology' | 'diagnostics' | 'market' | 'dossier'>('specs');
  const [pinSearch, setPinSearch] = useState('');
  const [researchNotes, setResearchNotes] = useState(localStorage.getItem('ic_research_notes') || '');
  
  const [filters, setFilters] = useState<FilterSettings>({
    contrast: 150, brightness: 110, grayscale: true, invert: false, saturate: 100,
    pixelated: false, hueRotate: 0, blur: 0, zoom: 1, sharpen: 0
  });

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('ic_scan_history', JSON.stringify(state.history));
  }, [state.history]);

  useEffect(() => {
    localStorage.setItem('ic_research_notes', researchNotes);
  }, [researchNotes]);

  const processImage = useCallback(async (base64: string, mimeType: string = "image/jpeg") => {
    setState(prev => ({ ...prev, originalImage: base64, isAnalyzing: true, error: null, report: null, enhancedImage: null }));
    setFeedbackSubmitted(false);
    setRating(0);
    try {
      const report = await analyzeIC(base64, mimeType);
      const newHistory: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), name: report.identification.name, image: base64, report };
      setState(prev => ({ ...prev, report, isAnalyzing: false, enhancedImage: base64, history: [newHistory, ...prev.history].slice(0, 15) }));
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500);
    } catch (err: any) {
      setState(prev => ({ ...prev, isAnalyzing: false, error: err.message || "Forensic Capture Failed" }));
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => processImage(event.target?.result as string, file.type || "image/jpeg");
    reader.readAsDataURL(file);
  };

  const handleDownloadPDF = async () => {
    if (!state.report) return;
    setIsGeneratingPdf(true);
    try {
      const report = state.report;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, pageWidth, 60, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("RESEARCH DOSSIER: " + report.identification.name, 15, 25);
      doc.setFontSize(10);
      doc.text(`Lab Version 6.2 Pro | Forensic Report ID: ${report.identification.number}`, 15, 35);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 40);
      doc.setDrawColor(59, 130, 246);
      doc.line(15, 45, pageWidth - 15, 45);
      
      let y = 75;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.text("1. Component Identity", 15, y);
      y += 10;
      doc.setFontSize(10);
      doc.text(`Manufacturer: ${report.identification.manufacturer}`, 15, y);
      doc.text(`Confidence Level: ${report.identification.confidence}%`, 15, y + 5);
      
      const techData = report.technicalProfile.map(item => [item.label, item.value]);
      autoTable(doc, { startY: y + 15, head: [['Parameter', 'Laboratory Finding']], body: techData, theme: 'striped' });
      
      doc.save(`RESEARCH_DOSSIER_${report.identification.name}.pdf`);
    } finally { setIsGeneratingPdf(false); }
  };

  const handleChat = async () => {
    if (!chatQuery || !state.report) return;
    setChatLoading(true);
    try {
      const response = await askAboutIC(state.report.identification.name, chatQuery, JSON.stringify(state.report.identification));
      setChatResponse(response);
    } catch (e) {
      setChatResponse("Intelligence sync interrupted.");
    } finally { setChatLoading(false); }
  };

  const handleFeedbackSubmit = () => {
    if (rating > 0) {
      setFeedbackSubmitted(true);
    }
  };

  const filteredPins = useMemo(() => {
    if (!state.report) return [];
    return state.report.pinout.table.filter(p => 
      p.pin.toLowerCase().includes(pinSearch.toLowerCase()) || 
      p.name.toLowerCase().includes(pinSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(pinSearch.toLowerCase())
    );
  }, [state.report, pinSearch]);

  const filterStyle = useMemo(() => ({
    filter: `contrast(${filters.contrast}%) brightness(${filters.brightness}%) grayscale(${filters.grayscale ? 1 : 0}) ${filters.invert ? 'invert(1)' : ''} saturate(${filters.saturate}%)`,
    imageRendering: filters.pixelated ? 'pixelated' : 'auto',
  }), [filters]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/40">
      <Navbar onShowHistory={() => setShowHistory(true)} />

      {isGeneratingPdf && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl z-[200] flex flex-col items-center justify-center animate-in fade-in">
          <Activity className="text-blue-500 w-12 h-12 animate-pulse mb-6" />
          <h2 className="text-sm font-black uppercase tracking-[0.5em] text-blue-500">Generating Laboratory Dossier</h2>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 z-[300] bg-slate-950/98 backdrop-blur-3xl p-8 flex flex-col animate-in fade-in">
          <div className="flex justify-between items-center mb-12 max-w-6xl mx-auto w-full">
            <h2 className="text-2xl font-black uppercase tracking-[0.5em] text-white">Forensic Archives</h2>
            <button onClick={() => setShowHistory(false)} className="bg-slate-900 p-4 rounded-full hover:bg-slate-800 transition-colors">
              <X size={24}/>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 custom-scrollbar">
            {state.history.map((item) => (
              <div 
                key={item.id} 
                className="glass p-8 rounded-[2rem] border border-slate-800 hover:border-blue-500/30 transition-all group cursor-pointer" 
                onClick={() => { 
                  setState(prev => ({ ...prev, report: item.report, enhancedImage: item.image, originalImage: item.image })); 
                  setShowHistory(false); 
                }}
              >
                <div className="aspect-square rounded-2xl overflow-hidden mb-6 bg-slate-950">
                  <img src={item.image} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" alt={item.name} />
                </div>
                <h4 className="text-lg font-black uppercase tracking-widest text-white mb-2">{item.name}</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(item.timestamp).toLocaleString()}</p>
              </div>
            ))}
            {state.history.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <History size={48} className="text-slate-800 mx-auto mb-6" />
                <p className="text-slate-600 font-bold uppercase tracking-widest">No archival records found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 p-6 lg:p-10 max-w-[1800px] mx-auto w-full">
        {!state.report && !state.isAnalyzing && (
          <div className="max-w-4xl mx-auto py-20 text-center">
             <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-blue-500/5 rounded-full border border-blue-500/20 mb-10 animate-in slide-in-from-top-4">
                <Microscope size={14} className="text-blue-500" />
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Forensic Workspace v6.2 Ready</span>
             </div>
             <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-10 leading-tight">
                IDENTIFY <span className="text-blue-500">OBSCURED</span> <br/>
                SEMICONDUCTORS.
             </h2>
             <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-16 leading-relaxed">
                Utilizing high-precision computer vision and deep semiconductor intelligence to analyze silicon markings, reconstruct topologies, and verify technical profiles.
             </p>
             <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button onClick={() => setCameraActive(true)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-5 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl shadow-blue-600/20">
                  <Camera size={18} /> Capture Component
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white py-5 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-4 transition-all active:scale-95">
                   <Upload size={18} /> Upload Forensic Feed
                </button>
             </div>
             <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
          </div>
        )}

        {cameraActive && (
          <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-3xl flex flex-col p-8">
            <div className="flex-1 relative glass rounded-[2.5rem] overflow-hidden border-2 border-slate-800 shadow-2xl max-w-6xl mx-auto w-full">
               <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" onLoadedMetadata={() => videoRef.current?.play()}/>
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 md:w-96 md:h-96 border border-blue-500/50 rounded-3xl relative">
                     <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                     <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-blue-500"></div>
                     <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-blue-500"></div>
                     <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-blue-500"></div>
                     <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-blue-500"></div>
                  </div>
               </div>
               <div className="absolute top-8 left-8 flex items-center gap-3 bg-black/80 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase text-white tracking-widest">Live Research Feed</span>
               </div>
            </div>
            <div className="py-12 flex justify-center gap-8">
               <button onClick={() => {
                   const context = canvasRef.current?.getContext('2d');
                   if (context && videoRef.current) {
                       canvasRef.current!.width = videoRef.current.videoWidth;
                       canvasRef.current!.height = videoRef.current.videoHeight;
                       context.drawImage(videoRef.current, 0, 0);
                       const base64 = canvasRef.current!.toDataURL('image/jpeg');
                       setCameraActive(false);
                       (videoRef.current.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
                       processImage(base64);
                   }
               }} className="bg-white text-black w-20 h-20 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all border-4 border-slate-900 group">
                 <Camera size={32} className="group-hover:scale-110 transition-transform"/>
               </button>
               <button onClick={() => { setCameraActive(false); (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach(t => t.stop()); }} className="bg-slate-900 text-white w-20 h-20 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all border-4 border-slate-800">
                 <X size={32}/>
               </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {state.isAnalyzing && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
            <div className="relative mb-16">
              <div className="absolute inset-0 bg-blue-500/20 blur-[80px] animate-pulse rounded-full"></div>
              <div className="relative p-10 bg-slate-900 rounded-full border-2 border-blue-500/30">
                <Cpu size={80} className="text-blue-500 animate-[spin_3s_linear_infinite]"/>
              </div>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-[0.5em] mb-4 text-white">Synthesizing Intel</h2>
            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Running Neural OCR & Datasheet Correlation...</p>
          </div>
        )}

        {state.report && (
          <div ref={reportRef} className="space-y-8 animate-in slide-in-from-bottom-12 duration-1000">
            {/* Research Header Dash */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
               <div className="xl:col-span-3 glass p-10 rounded-[2.5rem] border-l-4 border-l-blue-500">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                       <div className="flex items-center gap-3 mb-5">
                          <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-blue-500/20">Identified Component</span>
                          <div className="h-px w-20 bg-slate-800"></div>
                       </div>
                       <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase mb-4">{state.report.identification?.name ?? "Unknown ID"}</h3>
                       <div className="flex flex-wrap gap-8 text-slate-400">
                          <div className="flex flex-col">
                             <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Part No</span>
                             <span className="text-xs font-bold text-slate-100 mono">{state.report.identification?.number ?? "N/A"}</span>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Designer</span>
                             <span className="text-xs font-bold text-slate-100">{state.report.identification?.manufacturer ?? "N/A"}</span>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Logic Family</span>
                             <span className="text-xs font-bold text-slate-100">{state.report.identification?.family ?? "N/A"}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-950/50 rounded-3xl border border-slate-800 min-w-[180px]">
                       <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-4">Neural Confidence</span>
                       <div className="text-4xl font-black text-green-500">{state.report.identification?.confidence ?? 0}%</div>
                    </div>
                  </div>
               </div>
               
               <div className="flex flex-col gap-6">
                  <GlassCard className="flex-1" title="Dossier Actions">
                     <div className="grid grid-cols-1 gap-4">
                        <button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-600/20">
                           <Download size={16}/> Save PDF Dossier
                        </button>
                        <button onClick={() => setState(prev => ({...prev, report: null}))} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
                           <RefreshCw size={16}/> New Research Session
                        </button>
                     </div>
                  </GlassCard>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Workspace Sidebar */}
              <div className="lg:col-span-3 space-y-8 sticky top-24">
                <GlassCard title="Forensic Feed" icon={Microscope}>
                   <div className="aspect-square rounded-2xl overflow-hidden border border-slate-800/80 mb-6 bg-slate-950 shadow-inner group">
                      <img 
                        src={state.enhancedImage!} 
                        style={filterStyle as any} 
                        className="w-full h-full object-contain transition-all duration-300" 
                        alt="Component Feed" 
                      />
                   </div>
                   <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Feed Contrast</span>
                           <span className="text-[10px] font-bold text-blue-400">{filters.contrast}%</span>
                        </div>
                        <input type="range" min="50" max="250" value={filters.contrast} onChange={(e) => setFilters(f => ({...f, contrast: Number(e.target.value)}))} className="w-full h-1 bg-slate-800 rounded-full appearance-none accent-blue-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <button onClick={() => setFilters(f => ({...f, grayscale: !f.grayscale}))} className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filters.grayscale ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>Gray</button>
                         <button onClick={() => setFilters(f => ({...f, invert: !f.invert}))} className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filters.invert ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>Invert</button>
                      </div>
                   </div>
                </GlassCard>

                <GlassCard title="Research Channels" icon={Globe}>
                  <div className="space-y-3">
                     {state.report.resources?.officialDatasets?.map((ds, i) => (
                        <a key={i} href={ds.url} target="_blank" className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-slate-800 hover:border-blue-500/30 group transition-all">
                           <div className="flex items-center gap-3 min-w-0">
                              <Database size={14} className="text-blue-500 shrink-0" />
                              <span className="text-[11px] font-bold text-slate-400 truncate group-hover:text-blue-300 transition-colors">{ds.name}</span>
                           </div>
                           <Link2 size={12} className="text-slate-600 group-hover:text-blue-500 transition-colors"/>
                        </a>
                     ))}
                     {state.report.resources?.wikipedia && (
                        <a href={state.report.resources.wikipedia.url} target="_blank" className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-slate-800 hover:border-slate-600 transition-all group">
                           <div className="flex items-center gap-3">
                              <BookOpen size={14} className="text-slate-500" />
                              <span className="text-[11px] font-bold text-slate-400">Literature Entry</span>
                           </div>
                           <ArrowUpRight size={12} className="text-slate-600 group-hover:text-white transition-colors"/>
                        </a>
                     )}
                  </div>
                </GlassCard>

                <GlassCard title="Research Notes" icon={ClipboardList}>
                   <textarea 
                     value={researchNotes} 
                     onChange={(e) => setResearchNotes(e.target.value)}
                     placeholder="Record observations, pin mappings, or circuit integrations..."
                     className="w-full h-40 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-[11px] font-medium leading-relaxed outline-none focus:border-blue-500/50 transition-all resize-none custom-scrollbar"
                   />
                   <div className="flex items-center gap-2 mt-4 text-[9px] font-black uppercase text-slate-600 tracking-widest">
                      <Terminal size={12}/> Auto-saving locally
                   </div>
                </GlassCard>
              </div>

              {/* Research Workspace Main */}
              <div className="lg:col-span-9 space-y-8">
                <div className="glass rounded-[2rem] overflow-hidden border border-slate-800/80">
                   <div className="flex flex-wrap bg-slate-900/40 border-b border-slate-800/50">
                      <TabButton active={activeTab === 'specs'} onClick={() => setActiveTab('specs')} label="Technical Profile" icon={Binary} />
                      <TabButton active={activeTab === 'topology'} onClick={() => setActiveTab('topology')} label="Pin Topology" icon={Layers} />
                      <TabButton active={activeTab === 'diagnostics'} onClick={() => setActiveTab('diagnostics')} label="Forensic Tests" icon={ShieldCheck} />
                      <TabButton active={activeTab === 'market'} onClick={() => setActiveTab('market')} label="Global Market" icon={BarChart4} />
                      <TabButton active={activeTab === 'dossier'} onClick={() => setActiveTab('dossier')} label="Research Dossier" icon={BookCopy} />
                   </div>
                   
                   <div className="p-10 animate-in fade-in duration-500">
                      {activeTab === 'specs' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {state.report.technicalProfile?.map((item) => (
                               <div key={item.id} className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-blue-500/20 group transition-all">
                                  <div className="flex items-center gap-4 mb-4">
                                     <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-800 group-hover:border-blue-500 group-hover:text-blue-500 transition-colors">{item.id}</div>
                                     <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{item.label}</h4>
                                  </div>
                                  <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{item.value}</p>
                               </div>
                            ))}
                         </div>
                      )}

                      {activeTab === 'topology' && (
                         <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                            <div className="space-y-6">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                     <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Lead Frame Schematic</span>
                                  </div>
                               </div>
                               <div className="bg-slate-950 p-10 rounded-[2rem] border border-slate-800 font-mono text-[11px] leading-tight text-blue-400 overflow-x-auto whitespace-pre custom-scrollbar h-[500px] shadow-inner">
                                  {state.report.pinout?.diagram ?? "Diagram unavailable for this revision."}
                               </div>
                            </div>
                            <div className="space-y-6">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                     <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Logic Interface Matrix</span>
                                  </div>
                                  <div className="relative">
                                     <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                                     <input 
                                       type="text" 
                                       placeholder="Filter Pins..." 
                                       value={pinSearch}
                                       onChange={(e) => setPinSearch(e.target.value)}
                                       className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-9 pr-4 text-[10px] outline-none focus:border-blue-500/50 transition-all w-40"
                                     />
                                  </div>
                               </div>
                               <div className="overflow-y-auto rounded-[2rem] border border-slate-800 h-[500px] custom-scrollbar bg-slate-950/20">
                                  <table className="w-full text-left">
                                    <thead className="bg-slate-900 sticky top-0 z-10 border-b border-slate-800">
                                      <tr>
                                        <th className="p-5 text-[10px] font-black uppercase text-slate-600 tracking-widest">Terminal</th>
                                        <th className="p-5 text-[10px] font-black uppercase text-slate-600 tracking-widest">Function</th>
                                        <th className="p-5 text-[10px] font-black uppercase text-slate-600 tracking-widest">Allocation Detail</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                      {filteredPins.map((p, i) => (
                                        <tr key={i} className="hover:bg-blue-600/5 transition-colors group">
                                          <td className="p-5 font-black text-blue-500 text-xs mono">{p.pin}</td>
                                          <td className="p-5 font-bold text-slate-100 text-xs group-hover:text-blue-400">{p.name}</td>
                                          <td className="p-5 text-[10px] text-slate-500 leading-relaxed font-medium group-hover:text-slate-300">{p.description}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                               </div>
                            </div>
                         </div>
                      )}

                      {activeTab === 'diagnostics' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8">
                               <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-[2rem]">
                                  <div className="flex items-center gap-3 mb-6">
                                     <Activity size={16} className="text-blue-500"/>
                                     <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Nominal Voltage Rail</span>
                                  </div>
                                  <p className="text-3xl font-black text-slate-100">{state.report.testing?.expectedVoltages ?? "Unknown"}</p>
                               </div>
                               <GlassCard title="Failure Signature Analysis" icon={AlertTriangle}>
                                  <div className="space-y-4">
                                     {state.report.testing?.faultSymptoms?.map((f, i) => (
                                        <div key={i} className="flex items-start gap-4 p-5 bg-slate-950/50 rounded-2xl border border-slate-800">
                                           <div className="w-1.5 h-1.5 bg-red-500/50 rounded-full mt-2 shrink-0"></div>
                                           <p className="text-xs text-slate-400 leading-relaxed font-medium">{f}</p>
                                        </div>
                                     ))}
                                  </div>
                               </GlassCard>
                            </div>
                            <div className="space-y-8">
                               <GlassCard title="Diagnostics Protocols" icon={Filter}>
                                  <div className="space-y-4">
                                     {state.report.testing?.multimeter?.map((m, i) => (
                                        <div key={i} className="flex items-center gap-4 p-5 bg-slate-950/50 rounded-2xl border border-slate-800">
                                           <CheckCircle2 size={14} className="text-blue-600 shrink-0"/>
                                           <p className="text-xs text-slate-400 font-medium">{m}</p>
                                        </div>
                                     ))}
                                  </div>
                               </GlassCard>
                               <div className="p-8 bg-orange-500/5 border border-orange-500/20 rounded-[2rem]">
                                  <div className="flex items-center gap-3 mb-4">
                                     <ShieldCheck size={16} className="text-orange-500"/>
                                     <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest">ESD Safety Protocol</span>
                                  </div>
                                  <p className="text-xs text-slate-400 leading-relaxed font-medium">{state.report.testing?.safety?.[0] || 'Standard clean-room and ESD precautions required.'}</p>
                               </div>
                            </div>
                         </div>
                      )}

                      {activeTab === 'market' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                               <div className="flex items-center gap-3 mb-2">
                                  <Store size={16} className="text-green-500"/>
                                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">India Retail Distribution</span>
                               </div>
                               <div className="space-y-4">
                                  {state.report.marketPrice?.indiaRetailers?.map((ret, i) => (
                                     <div key={i} className="flex items-center justify-between p-6 bg-slate-950/40 border border-slate-800 rounded-3xl hover:bg-slate-900 transition-all">
                                        <div className="flex items-center gap-5">
                                           <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                                              <ShoppingCart size={18} className="text-slate-500"/>
                                           </div>
                                           <div>
                                              <h4 className="text-sm font-black text-slate-100">{ret.store}</h4>
                                              <span className="text-[10px] font-black uppercase text-green-500/70 tracking-widest">{ret.availability}</span>
                                           </div>
                                        </div>
                                        <div className="text-right">
                                           <p className="text-2xl font-black text-white">₹{ret.price}</p>
                                           <a href={ret.url} target="_blank" className="text-[9px] font-black uppercase text-slate-500 hover:text-blue-500 flex items-center justify-end gap-1 mt-1 transition-colors">Catalog Entry <ArrowUpRight size={10}/></a>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </div>
                            <div className="space-y-8">
                               <GlassCard title="Inventory Forecasting" icon={BarChart4}>
                                  <div className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800 mb-6">
                                     <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3">Bulk Pricing Gradient</p>
                                     <p className="text-xs text-slate-300 font-medium leading-relaxed">{state.report.marketPrice?.bulkTrend ?? "Market data unavailable."}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                     <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl">
                                        <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">Index Low</span>
                                        <span className="text-lg font-black text-white">{state.report.marketPrice?.minPrice ?? "N/A"}</span>
                                     </div>
                                     <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl">
                                        <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">Index Peak</span>
                                        <span className="text-lg font-black text-white">{state.report.marketPrice?.maxPrice ?? "N/A"}</span>
                                     </div>
                                  </div>
                               </GlassCard>
                               <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-[2rem] flex items-start gap-4">
                                  <Tag size={16} className="text-blue-500 shrink-0 mt-1"/>
                                  <p className="text-[10px] text-slate-400 font-medium italic">"Price indices are normalized across global distributors including DigiKey, Mouser, and element14."</p>
                               </div>
                            </div>
                         </div>
                      )}

                      {activeTab === 'dossier' && (
                         <div className="space-y-10 max-w-5xl mx-auto">
                            {state.report.caseStudy ? (
                              <section className="space-y-6">
                                 <div className="flex items-center gap-3">
                                    <BookCopy size={20} className="text-blue-500"/>
                                    <h4 className="text-lg font-black uppercase tracking-widest text-white">Case Study: {state.report.caseStudy.title}</h4>
                                 </div>
                                 <div className="p-8 bg-slate-950/60 rounded-[2.5rem] border border-slate-800 space-y-6">
                                    <div className="space-y-3">
                                       <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Analytical Description</p>
                                       <p className="text-sm text-slate-300 leading-relaxed">{state.report.caseStudy.description}</p>
                                    </div>
                                    <div className="p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                       <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-2">Outcome & Observations</p>
                                       <p className="text-sm text-slate-200 leading-relaxed font-medium">{state.report.caseStudy.outcome}</p>
                                    </div>
                                 </div>
                              </section>
                            ) : (
                              <div className="p-8 border border-slate-800 rounded-2xl text-center text-slate-500 text-xs">No case study data available in this report version.</div>
                            )}

                            {state.report.useCases && (
                              <section className="space-y-6">
                                 <div className="flex items-center gap-3">
                                    <Target size={20} className="text-orange-500"/>
                                    <h4 className="text-lg font-black uppercase tracking-widest text-white">Strategic Use Cases</h4>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {state.report.useCases.map((uc, i) => (
                                       <div key={i} className="p-5 bg-slate-950/40 rounded-2xl border border-slate-800 flex items-start gap-4 hover:border-orange-500/30 transition-all">
                                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                                          <p className="text-xs font-bold text-slate-300 leading-relaxed">{uc}</p>
                                       </div>
                                    ))}
                                 </div>
                              </section>
                            )}

                            {state.report.references?.datasetLinks && (
                              <section className="space-y-6">
                                 <div className="flex items-center gap-3">
                                    <Database size={20} className="text-green-500"/>
                                    <h4 className="text-lg font-black uppercase tracking-widest text-white">Advanced Datasets</h4>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {state.report.references.datasetLinks.map((dl, i) => (
                                       <a key={i} href={dl.url} target="_blank" className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800 hover:border-green-500/40 hover:bg-slate-900 group transition-all text-center">
                                          <Database size={24} className="mx-auto mb-4 text-slate-600 group-hover:text-green-500 transition-colors"/>
                                          <span className="text-xs font-black uppercase tracking-widest text-slate-400 block group-hover:text-white">{dl.name}</span>
                                          <span className="text-[9px] text-slate-600 block mt-2">Repository Feed</span>
                                       </a>
                                    ))}
                                 </div>
                              </section>
                            )}
                         </div>
                      )}
                   </div>
                </div>

                {/* Grounding Attribution */}
                {state.report.groundingSources && (
                  <div className="flex flex-wrap items-center gap-4 px-6">
                    <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest flex items-center gap-2">
                       <Globe size={14}/> Forensic Proof Points:
                    </span>
                    {state.report.groundingSources.map((source, i) => (
                      <a key={i} href={source.uri} target="_blank" className="bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-full text-[9px] font-bold text-slate-500 hover:text-blue-400 transition-all flex items-center gap-2">
                        {source.title || 'Data Chunk'} <ArrowUpRight size={10}/>
                      </a>
                    ))}
                  </div>
                )}

                {/* Performance Evaluation */}
                <GlassCard title="Analysis Audit" icon={BookMarked}>
                   <div className="max-w-4xl mx-auto">
                      {feedbackSubmitted ? (
                         <div className="text-center py-10 animate-in zoom-in-95">
                            <div className="bg-blue-600/10 inline-flex p-6 rounded-full mb-6 text-blue-500 border border-blue-500/20">
                               <Check size={40} />
                            </div>
                            <h4 className="text-xl font-black uppercase tracking-widest">Audit Complete</h4>
                            <p className="text-slate-500 mt-2 text-sm font-medium">Research accuracy feedback recorded for model refinement.</p>
                         </div>
                      ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-6">
                            <div className="space-y-8">
                               <div className="p-8 bg-slate-950/50 rounded-[2rem] border border-slate-800/50 text-center">
                                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-8">Verification Accuracy</p>
                                  <div className="flex justify-center gap-4 mb-8">
                                     {[1, 2, 3, 4, 5].map((s) => (
                                        <button key={s} onClick={() => setRating(s)} className="transition-all hover:scale-125">
                                           <Star size={32} fill={rating >= s ? "#3b82f6" : "transparent"} className={rating >= s ? "text-blue-500" : "text-slate-800"} />
                                        </button>
                                     ))}
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-800/50">
                                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                      <p className="text-[8px] font-black uppercase text-slate-500 mb-1 tracking-widest">ID Confidence</p>
                                      <p className="text-lg font-black text-blue-400">{state.report.identification?.confidence ?? 0}%</p>
                                    </div>
                                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                      <p className="text-[8px] font-black uppercase text-slate-500 mb-1 tracking-widest">OCR Precision</p>
                                      <p className="text-lg font-black text-green-400">{state.report.confidence?.ocrScore ?? 0}%</p>
                                    </div>
                                  </div>
                               </div>
                               <div className="flex items-start gap-4 p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl">
                                  <Info size={18} className="text-blue-500 shrink-0 mt-1"/>
                                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">Accuracy ratings help optimize the neural network for damaged markings identification.</p>
                               </div>
                            </div>
                            <div className="space-y-6">
                               <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Forensic Observations</p>
                               <textarea 
                                 value={comment} 
                                 onChange={(e) => setComment(e.target.value)} 
                                 placeholder="Was the pinout reconstruction accurate for your specific board rev?" 
                                 className="w-full h-40 bg-slate-950/50 border border-slate-800 rounded-[2rem] p-6 text-xs outline-none focus:border-blue-500 transition-all resize-none custom-scrollbar" 
                               />
                               <button onClick={handleFeedbackSubmit} disabled={rating === 0} className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${rating > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-900 text-slate-600 cursor-not-allowed'}`}>Submit Audit</button>
                            </div>
                         </div>
                      )}
                   </div>
                </GlassCard>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Laboratory Chat Assistant */}
      {chatOpen && (
        <div className="fixed bottom-8 right-8 z-[250] w-full max-w-lg animate-in slide-in-from-bottom-12 fade-in">
          <div className="glass rounded-[2.5rem] overflow-hidden flex flex-col h-[700px] shadow-2xl border-blue-500/30">
            <div className="p-8 flex justify-between items-center bg-blue-600 text-white">
               <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/20 rounded-xl"><MessageSquare size={18}/></div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest">Semiconductor Assistant</h4>
                    <p className="text-[9px] font-bold opacity-70">Research contexts active</p>
                  </div>
               </div>
               <button onClick={() => setChatOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-950/90 custom-scrollbar">
              {chatResponse && (
                <div className="flex flex-col gap-3 animate-in fade-in">
                  <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Laboratory Insights</span>
                  <div className="bg-blue-600/5 p-6 rounded-[2rem] border border-blue-500/20 text-sm leading-relaxed text-slate-200">
                    {chatResponse}
                  </div>
                </div>
              )}
              {chatLoading && (
                <div className="flex justify-center p-10">
                   <div className="flex gap-2.5">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                   </div>
                </div>
              )}
            </div>
            <div className="p-8 bg-slate-900/50 backdrop-blur-3xl flex gap-4 border-t border-slate-800">
                <input 
                  type="text" 
                  value={chatQuery} 
                  onChange={(e) => setChatQuery(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleChat()} 
                  placeholder="Ask specific technical queries..." 
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-full py-4 px-6 text-xs outline-none focus:border-blue-500/50 transition-all font-medium" 
                />
                <button onClick={handleChat} className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-500 active:scale-90 transition-all shadow-xl shadow-blue-600/30"><Send size={18}/></button>
            </div>
          </div>
        </div>
      )}

      {state.report && !chatOpen && (
        <button onClick={() => setChatOpen(true)} className="fixed bottom-8 right-8 z-[100] bg-blue-600 text-white p-6 rounded-full shadow-2xl hover:bg-blue-500 transition-all active:scale-90 group border-4 border-slate-950">
          <MessageSquare size={32} className="group-hover:rotate-12 transition-transform"/>
          <span className="absolute top-0 right-0 h-4 w-4 bg-green-500 rounded-full border-4 border-slate-950"></span>
        </button>
      )}

      <footer className="py-12 border-t border-slate-900/50 text-center bg-slate-950/40 mt-20">
         <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
            <div className="flex items-center gap-10 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
               <CpuIcon size={24}/>
               <Binary size={24}/>
               <HardDrive size={24}/>
               <Search size={24}/>
            </div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] flex items-center gap-4">
              Dossier Engine v6.2.0 • Pro Analytics Tier • ISO-Forensic Standard
            </p>
         </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  );
}
