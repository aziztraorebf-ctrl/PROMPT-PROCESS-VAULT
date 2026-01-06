import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from './firebaseConfig';
import { AuthProvider, useAuth } from './AuthContext';
import { GoogleGenAI, Type } from "@google/genai";

// --- Constants ---

// For Prompts & Frameworks (Legacy/Tag-based navigation)
const UNIVERSAL_TAGS = [
  'UI/UX', 'Code', 'Marketing', 'Content', 'Data', 
  'Productivity', 'Strategy', 'Sales', 'HR', 'Design', 'Other'
];

// For Assets (Hybrid Architecture: Collections)
const ASSET_COLLECTIONS = [
  'Marketing & Strategy',
  'Development & Code',
  'Design & UI/UX',
  'Lifestyle & Fashion',
  'Productivity & Ops',
  'Content Creation',
  'Archives / Other'
];

// --- Icons ---
const IconWrapper = ({ children, ...props }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" viewBox="0 0 24 24" 
    fill="none" stroke="currentColor" strokeWidth="2" 
    strokeLinecap="round" strokeLinejoin="round" 
    {...props}
  >
    {children}
  </svg>
);

const Icons = {
  Layout: (props: any) => <IconWrapper {...props}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></IconWrapper>,
  Plus: (props: any) => <IconWrapper {...props}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></IconWrapper>,
  Heart: ({ filled, ...props }: any) => (
    <IconWrapper {...props} fill={filled ? "currentColor" : "none"}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </IconWrapper>
  ),
  Trash: (props: any) => <IconWrapper {...props}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></IconWrapper>,
  X: (props: any) => <IconWrapper {...props}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></IconWrapper>,
  ArrowLeft: (props: any) => <IconWrapper {...props}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></IconWrapper>,
  Box: (props: any) => <IconWrapper {...props}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></IconWrapper>,
  Image: (props: any) => <IconWrapper {...props}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></IconWrapper>,
  FileText: (props: any) => <IconWrapper {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></IconWrapper>,
  LogOut: (props: any) => <IconWrapper {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></IconWrapper>,
  Menu: (props: any) => <IconWrapper {...props}><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></IconWrapper>,
  Sliders: (props: any) => <IconWrapper {...props}><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></IconWrapper>,
  Sparkles: (props: any) => <IconWrapper {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></IconWrapper>,
  Upload: (props: any) => <IconWrapper {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></IconWrapper>,
  Check: (props: any) => <IconWrapper {...props}><polyline points="20 6 9 17 4 12" /></IconWrapper>,
  Edit: (props: any) => <IconWrapper {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></IconWrapper>,
  AlertTriangle: (props: any) => <IconWrapper {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></IconWrapper>,
  Zap: (props: any) => <IconWrapper {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></IconWrapper>,
  Quote: (props: any) => <IconWrapper {...props}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" /></IconWrapper>,
  Clock: (props: any) => <IconWrapper {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></IconWrapper>,
  ChevronRight: (props: any) => <IconWrapper {...props}><polyline points="9 18 15 12 9 6" /></IconWrapper>
};

// --- Helper Functions ---
const getCategoryColor = (category: string) => {
  if (!category) return 'bg-slate-100 text-slate-800';
  
  const colors: Record<string, string> = {
    'Marketing': 'bg-blue-100 text-blue-800',
    'Marketing & Strategy': 'bg-blue-100 text-blue-800',
    'Development': 'bg-green-100 text-green-800',
    'Development & Code': 'bg-green-100 text-green-800',
    'Sales': 'bg-purple-100 text-purple-800',
    'HR': 'bg-orange-100 text-orange-800',
    'Design': 'bg-pink-100 text-pink-800',
    'Design & UI/UX': 'bg-pink-100 text-pink-800',
    'Lifestyle & Fashion': 'bg-rose-100 text-rose-800',
    'Code': 'bg-slate-100 text-slate-800',
    'Content': 'bg-yellow-100 text-yellow-800',
    'Content Creation': 'bg-yellow-100 text-yellow-800',
    'Data': 'bg-cyan-100 text-cyan-800',
    'Productivity': 'bg-teal-100 text-teal-800',
    'Productivity & Ops': 'bg-teal-100 text-teal-800',
    'Strategy': 'bg-indigo-100 text-indigo-800',
  };
  return colors[category] || 'bg-slate-100 text-slate-800';
};

const toggleFavorite = async (collectionName: string, id: string, currentStatus: boolean) => {
  try {
    const ref = doc(db, collectionName, id);
    await updateDoc(ref, { isFavorite: !currentStatus });
  } catch (error) {
    console.error("Error toggling favorite:", error);
  }
};

// --- AI Logic (Phase 2.2 Hybrid) ---
async function analyzeImageWithGemini(file: File): Promise<{ title: string, description: string, category: string, tags: string[] }> {
  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Updated Prompt for Hybrid Architecture
    const promptText = `Analyze this image for a digital asset library. 
    1. "category": Choose EXACTLY ONE from: ${JSON.stringify(ASSET_COLLECTIONS)}.
    2. "title": A short professional title.
    3. "description": A concise description.
    4. "tags": A list of 3-5 free-form descriptive tags (e.g., "blue vest", "studio", "happy").`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: promptText }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const data = JSON.parse(text);
    
    // Validate category fallbacks
    let category = data.category;
    if (!ASSET_COLLECTIONS.includes(category)) {
      category = 'Archives / Other';
    }

    return { ...data, category };

  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      title: file.name.split('.')[0],
      description: "Auto-analysis unavailable.",
      category: "Archives / Other",
      tags: ["image"]
    };
  }
}

// --- Hooks ---
const useCollection = (collectionName: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, collectionName);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setData(items);
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching ${collectionName}:`, error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [collectionName]);

  return { data, loading };
};

// --- Shared Components ---
const Sidebar = ({ activeView, setActiveView, isMobileOpen, setIsMobileOpen, user, signOut }: any) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Layout },
    { id: 'prompts', label: 'Prompts', icon: Icons.FileText },
    { id: 'assets', label: 'Assets', icon: Icons.Image },
    { id: 'frameworks', label: 'Frameworks', icon: Icons.Box },
  ];

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white tracking-wider">VAULT</h1>
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden"><Icons.X /></button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveView(item.id); setIsMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800'}`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="mb-4 px-2">
             <p className="text-xs text-slate-500 uppercase font-bold mb-1">User</p>
             <p className="text-sm text-white truncate">{user?.email}</p>
          </div>
          <button onClick={signOut} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition">
            <Icons.LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

const FilterSidebar = ({ title, activeGroup, setActiveGroup, isMobileOpen, onCloseMobile, categories }: any) => {
  const defaultCategories = ['All', 'Favorites', ...UNIVERSAL_TAGS];
  const list = categories || defaultCategories;

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onCloseMobile} />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center h-[73px]">
           <h2 className="font-bold text-slate-800 text-lg">{title}</h2>
           <button onClick={onCloseMobile} className="md:hidden text-slate-500"><Icons.X size={20} /></button>
        </div>
        <div className="p-4 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
           {list.map((cat: string) => (
              <button
                 key={cat}
                 onClick={() => { setActiveGroup(cat); onCloseMobile(); }}
                 className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${activeGroup === cat ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                 {cat}
              </button>
           ))}
        </div>
      </div>
    </>
  );
};

const LoginView = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError('Failed to sign in. Check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">Vault Access</h1>
        <p className="text-slate-500 text-center mb-8">Enter your credentials to continue</p>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="admin@vault.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-200">
            Secure Login
          </button>
        </form>
      </div>
    </div>
  );
};

const DashboardView = ({ setActiveView, setIsMobileOpen, setTargetId, user }: any) => {
  const prompts = useCollection('prompts');
  const assets = useCollection('assets');
  const frameworks = useCollection('frameworks');
  
  const [quote, setQuote] = useState({ text: "", author: "" });

  useEffect(() => {
    const quotes = [
      { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
      { text: "Design is not just what it looks like, it's how it works.", author: "Steve Jobs" },
      { text: "Good design is obvious. Great design is transparent.", author: "Joe Sparano" },
      { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
      { text: "Digital design is like painting, except the paint never dries.", author: "Neville Brody" }
    ];
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  const getRecent = (list: any[]) => {
    // Sort locally to avoid complex Firestore indexing requirements right now (Ghost Safety)
    return [...list].sort((a, b) => {
       const tA = a.createdAt?.seconds || 0;
       const tB = b.createdAt?.seconds || 0;
       return tB - tA;
    }).slice(0, 5);
  };

  const recentAssets = getRecent(assets.data);
  const recentPrompts = getRecent(prompts.data);
  const recentFrameworks = getRecent(frameworks.data);

  const QuickAction = ({ label, icon: Icon, color, onClick }: any) => (
    <button 
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl p-4 flex items-center gap-3 transition hover:scale-105 shadow-sm hover:shadow-md bg-white border border-slate-100 group`}
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition bg-gradient-to-r ${color}`}></div>
      <div className={`p-2 rounded-lg bg-slate-50 text-slate-700 group-hover:text-white group-hover:bg-gradient-to-br ${color} transition-colors`}>
        <Icon size={20} />
      </div>
      <span className="font-bold text-slate-700 text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* 1. HERO SECTION (Fixed padding top) */}
      <div className="bg-slate-900 text-white p-6 md:p-10 pt-24 pb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 transform translate-x-10 -translate-y-10">
           <Icons.Box size={200} />
        </div>
        
        <header className="flex items-center gap-3 mb-6 md:hidden relative z-10">
            <button onClick={() => setIsMobileOpen(true)} className="p-2 bg-white/10 rounded-lg text-white">
               <Icons.Menu size={20} />
            </button>
            <h2 className="text-xl font-bold">Dashboard</h2>
        </header>

        <div className="relative z-10 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Hello, {user?.email?.split('@')[0]} 👋</h1>
          <div className="flex items-start gap-2 text-slate-400 max-w-xl">
             <Icons.Quote size={16} className="mt-1 flex-shrink-0 opacity-50" />
             <p className="italic text-sm md:text-base">{quote.text} — <span className="text-slate-500 not-italic">{quote.author}</span></p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 md:px-8 mt-6 pb-10 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* 5. QUICK ACTIONS (Moved to top) */}
        <div>
           {/* Removed label to keep it clean at the top, or keep it if preferred? Let's keep it minimal for top position */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickAction label="New Prompt" icon={Icons.FileText} color="from-blue-500 to-indigo-500" onClick={() => setActiveView('prompts')} />
              <QuickAction label="Upload Asset" icon={Icons.Upload} color="from-purple-500 to-pink-500" onClick={() => setActiveView('assets')} />
              <QuickAction label="New Framework" icon={Icons.Box} color="from-emerald-500 to-teal-500" onClick={() => setActiveView('frameworks')} />
              <QuickAction 
                 label="Magic Analysis" 
                 icon={Icons.Sparkles} 
                 color="from-amber-400 to-orange-500" 
                 onClick={() => { setTargetId('MAGIC_UPLOAD'); setActiveView('assets'); }} 
              />
           </div>
        </div>

        {/* 2. STATS BAR (Slim) */}
        <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 p-4 flex flex-wrap justify-around items-center border border-slate-100 gap-4">
             <div className="flex items-center gap-3 px-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icons.FileText size={20}/></div>
                <div><p className="text-xs text-slate-400 font-bold uppercase">Prompts</p><p className="text-xl font-bold text-slate-800">{prompts.loading ? '-' : prompts.data.length}</p></div>
             </div>
             <div className="w-px h-8 bg-slate-100 hidden md:block"></div>
             <div className="flex items-center gap-3 px-4">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Icons.Image size={20}/></div>
                <div><p className="text-xs text-slate-400 font-bold uppercase">Assets</p><p className="text-xl font-bold text-slate-800">{assets.loading ? '-' : assets.data.length}</p></div>
             </div>
             <div className="w-px h-8 bg-slate-100 hidden md:block"></div>
             <div className="flex items-center gap-3 px-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Icons.Box size={20}/></div>
                <div><p className="text-xs text-slate-400 font-bold uppercase">Frameworks</p><p className="text-xl font-bold text-slate-800">{frameworks.loading ? '-' : frameworks.data.length}</p></div>
             </div>
        </div>

        {/* 3. RECENT ASSETS (Filmstrip) */}
        <div>
           <div className="flex justify-between items-end mb-4">
              <h3 className="text-lg font-bold text-slate-800">Recent Inspiration</h3>
              <button onClick={() => setActiveView('assets')} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">View Gallery <Icons.ChevronRight size={14}/></button>
           </div>
           
           {assets.loading ? (
             <div className="h-40 bg-slate-200 rounded-xl animate-pulse"></div>
           ) : recentAssets.length === 0 ? (
             <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
                <Icons.Image size={32} className="mx-auto mb-2 opacity-50" />
                <p>No assets yet. Upload your first one!</p>
             </div>
           ) : (
             <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
               {recentAssets.map(asset => (
                 <div 
                   key={asset.id} 
                   onClick={() => { setTargetId(asset.id); setActiveView('assets'); }}
                   className="snap-start flex-shrink-0 w-48 aspect-square relative rounded-xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-all border border-slate-200"
                 >
                    {asset.url ? (
                       <img 
                         src={asset.url} 
                         className="w-full h-full object-cover transition duration-500 group-hover:scale-110" 
                         onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
                         }}
                       />
                    ) : (
                       <div className="w-full h-full bg-slate-100"></div>
                    )}
                    <div className="fallback hidden absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-300">
                       <Icons.Image size={32} />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                       <p className="text-white text-sm font-bold truncate">{asset.title}</p>
                       <p className="text-white/70 text-xs truncate">{asset.category}</p>
                    </div>
                 </div>
               ))}
               {/* Quick Add Card */}
               <button 
                 onClick={() => setActiveView('assets')}
                 className="flex-shrink-0 w-32 aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition"
               >
                 <Icons.Plus size={24} />
                 <span className="text-xs font-bold mt-2">Add New</span>
               </button>
             </div>
           )}
        </div>

        {/* 4. GRID: Prompts & Frameworks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Recent Prompts */}
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2"><Icons.FileText size={18} className="text-blue-500"/> Latest Prompts</h3>
                 <button onClick={() => setActiveView('prompts')} className="text-xs font-bold text-slate-400 hover:text-slate-600">VIEW ALL</button>
              </div>
              <div className="space-y-3">
                 {recentPrompts.length === 0 && <p className="text-sm text-slate-400 italic">No prompts created yet.</p>}
                 {recentPrompts.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => { setTargetId(p.id); setActiveView('prompts'); }}
                      className="p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition cursor-pointer group"
                    >
                       <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{p.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${getCategoryColor(p.category)}`}>{p.category}</span>
                       </div>
                       <p className="text-sm text-slate-500 line-clamp-1 mt-1 font-mono text-xs opacity-80">{p.content}</p>
                    </div>
                 ))}
              </div>
              <button onClick={() => setActiveView('prompts')} className="w-full mt-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                 + Create Prompt
              </button>
           </div>

           {/* Recent Frameworks */}
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2"><Icons.Box size={18} className="text-emerald-500"/> Latest Frameworks</h3>
                 <button onClick={() => setActiveView('frameworks')} className="text-xs font-bold text-slate-400 hover:text-slate-600">VIEW ALL</button>
              </div>
              <div className="space-y-3">
                 {recentFrameworks.length === 0 && <p className="text-sm text-slate-400 italic">No frameworks created yet.</p>}
                 {recentFrameworks.map(f => (
                    <div 
                      key={f.id} 
                      onClick={() => { setTargetId(f.id); setActiveView('frameworks'); }}
                      className="p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition cursor-pointer group"
                    >
                       <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">{f.title}</h4>
                          <div className="flex items-center gap-1 text-slate-400 text-xs">
                             <Icons.Clock size={12} />
                             <span>{f.steps?.length || 0} steps</span>
                          </div>
                       </div>
                       <p className="text-sm text-slate-500 line-clamp-1 mt-1">{f.description}</p>
                    </div>
                 ))}
              </div>
              <button onClick={() => setActiveView('frameworks')} className="w-full mt-4 py-2 text-sm font-bold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition">
                 + New Framework
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

// --- View Components ---

const PromptsView = ({ setIsMobileOpen, targetId }: any) => {
  const { data: prompts, loading } = useCollection('prompts');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // State for Create/Edit
  const [promptForm, setPromptForm] = useState({ title: '', content: '', category: 'Other', tags: [] as string[], isFavorite: false });
  
  // Deep Linking Effect
  useEffect(() => {
    if (targetId && prompts.length > 0) {
      const exists = prompts.find(p => p.id === targetId);
      if (exists) setSelectedId(targetId);
    }
  }, [targetId, prompts]);

  useEffect(() => {
    if (selectedId) {
      const p = prompts.find(i => i.id === selectedId);
      if (p) setPromptForm({ ...p });
      setIsEditing(false); // Reset edit mode when switching selection
    }
  }, [selectedId, prompts]);

  const filtered = prompts.filter(p => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Favorites') return p.isFavorite;
    return p.category === activeCategory || (p.tags && p.tags.includes(activeCategory));
  });

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if(window.confirm("Delete this prompt permanently?")) {
        try {
          await deleteDoc(doc(db, 'prompts', id));
          if (selectedId === id) setSelectedId(null);
        } catch (err) {
          console.error("Delete failed:", err);
          alert("Could not delete prompt.");
        }
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptForm.title) return;

    try {
      if (isEditing && selectedId) {
        // Update existing
        await updateDoc(doc(db, 'prompts', selectedId), {
          ...promptForm,
          updatedAt: serverTimestamp()
        });
        setIsEditing(false);
      } else {
        // Create new
        await addDoc(collection(db, 'prompts'), {
          ...promptForm,
          isFavorite: false,
          createdAt: serverTimestamp()
        });
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Error saving prompt:", err);
    }
  };

  const PromptModal = () => (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold">New Prompt</h3>
          <button onClick={() => setIsModalOpen(false)}><Icons.X /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <input 
            className="w-full p-2 border rounded-lg font-bold" 
            placeholder="Prompt Title" 
            value={promptForm.title}
            onChange={e => setPromptForm({...promptForm, title: e.target.value})}
          />
          <textarea 
            className="w-full p-2 border rounded-lg h-40 font-mono text-sm" 
            placeholder="Prompt content..."
            value={promptForm.content}
            onChange={e => setPromptForm({...promptForm, content: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-4">
            <select 
               className="p-2 border rounded-lg"
               value={promptForm.category}
               onChange={e => setPromptForm({...promptForm, category: e.target.value})}
            >
              {UNIVERSAL_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input 
              className="p-2 border rounded-lg" 
              placeholder="Tags (comma separated)" 
              value={promptForm.tags?.join(', ')}
              onChange={e => setPromptForm({...promptForm, tags: e.target.value.split(',').map(t => t.trim())})}
            />
          </div>
          <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold">Create Prompt</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex h-full bg-slate-50">
      <FilterSidebar 
        title="Prompts" 
        activeGroup={activeCategory} 
        setActiveGroup={setActiveCategory} 
        isMobileOpen={isMobileSidebarOpen} 
        onCloseMobile={() => setIsMobileSidebarOpen(false)} 
      />

      <div className={`flex-1 flex flex-col min-w-0 h-full ${selectedId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 md:p-8 flex-1 flex flex-col h-full overflow-hidden">
          <header className="flex justify-between items-center mb-6 gap-2">
            <div className="flex items-center gap-3 overflow-hidden">
               {/* Mobile: Main Navigation Trigger */}
               <button onClick={() => setIsMobileOpen(true)} className="md:hidden p-2 bg-white border rounded-lg text-slate-700 shadow-sm shrink-0">
                  <Icons.Menu size={20} />
               </button>
               
               <h2 className="text-2xl font-bold text-slate-900 truncate">Prompts</h2>
               
               {/* Mobile: Filter Trigger */}
               <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg shrink-0">
                  <Icons.Sliders size={20} />
               </button>
            </div>
            <button 
              onClick={() => {
                setPromptForm({ title: '', content: '', category: 'Marketing', tags: [], isFavorite: false });
                setIsEditing(false);
                setIsModalOpen(true);
              }} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-blue-700 transition shrink-0"
            >
              <Icons.Plus /> <span className="hidden sm:inline">New</span>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {loading ? <div className="text-center text-slate-400 mt-10">Loading...</div> : filtered.map(prompt => (
              <div 
                key={prompt.id} 
                onClick={() => setSelectedId(prompt.id)}
                className={`bg-white p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${selectedId === prompt.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getCategoryColor(prompt.category)}`}>{prompt.category || 'General'}</span>
                    <h3 className="font-bold text-slate-800">{prompt.title}</h3>
                  </div>
                  {prompt.isFavorite && <div className="text-red-500"><Icons.Heart filled /></div>}
                </div>
                <p className="text-slate-500 text-sm line-clamp-2">{prompt.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail / Edit View */}
      {selectedId && (
        <div className="fixed inset-0 z-50 bg-white md:static md:w-[500px] md:border-l border-slate-200 flex flex-col h-full shadow-2xl md:shadow-none">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <button onClick={() => setSelectedId(null)} className="md:hidden p-2 -ml-2 text-slate-500"><Icons.ArrowLeft /></button>
              <div className="flex gap-2">
                  <button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded ${isEditing ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}><Icons.Edit /></button>
                  <button onClick={() => toggleFavorite('prompts', selectedId, promptForm.isFavorite)} className="p-2 text-slate-400 hover:text-red-500"><Icons.Heart filled={promptForm.isFavorite} /></button>
                  <button type="button" onClick={(e) => handleDelete(selectedId, e)} className="p-2 text-slate-400 hover:text-red-500"><Icons.Trash /></button>
                  <button onClick={() => setSelectedId(null)} className="hidden md:block p-2 text-slate-400 hover:text-slate-600"><Icons.X /></button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {isEditing ? (
                 <form onSubmit={handleSave} className="space-y-4">
                    <input 
                      className="w-full p-2 border rounded-lg font-bold text-lg" 
                      value={promptForm.title} 
                      onChange={e => setPromptForm({...promptForm, title: e.target.value})}
                    />
                    <div className="flex gap-2">
                       <select 
                          className="p-2 border rounded-lg text-sm bg-slate-50"
                          value={promptForm.category}
                          onChange={e => setPromptForm({...promptForm, category: e.target.value})}
                       >
                          {UNIVERSAL_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                       <input 
                          className="flex-1 p-2 border rounded-lg text-sm"
                          value={promptForm.tags?.join(', ')}
                          onChange={e => setPromptForm({...promptForm, tags: e.target.value.split(',').map(t => t.trim())})}
                          placeholder="Tags..."
                       />
                    </div>
                    <textarea 
                      className="w-full p-3 border rounded-lg h-64 font-mono text-sm bg-slate-50" 
                      value={promptForm.content} 
                      onChange={e => setPromptForm({...promptForm, content: e.target.value})}
                    />
                    <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold">Save Changes</button>
                 </form>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-4">{promptForm.title}</h2>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-700 whitespace-pre-wrap font-mono text-sm">
                      {promptForm.content}
                  </div>
                  <div className="mt-4 flex gap-2 flex-wrap">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getCategoryColor(promptForm.category)}`}>{promptForm.category}</span>
                      {promptForm.tags?.map((t: string) => <span key={t} className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">#{t}</span>)}
                  </div>
                </>
              )}
            </div>
        </div>
      )}
      
      {isModalOpen && <PromptModal />}
    </div>
  );
};

const AssetsView = ({ setIsMobileOpen, targetId }: any) => {
    const { data: assets, loading } = useCollection('assets');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [metadata, setMetadata] = useState({ title: '', description: '', category: '', tags: [] as string[] });
    const [tagInput, setTagInput] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Deep Linking Effect
    useEffect(() => {
      // INTERCEPT MAGIC UPLOAD SIGNAL
      if (targetId === 'MAGIC_UPLOAD') {
         setEditingAssetId(null);
         setMetadata({ title: '', description: '', category: ASSET_COLLECTIONS[0], tags: [] });
         setPreviewUrl(null);
         setUploadFile(null);
         setIsUploadModalOpen(true);
         return; // STOP EXECUTION HERE (Do not search for ID)
      }

      if (targetId && assets.length > 0) {
        const target = assets.find(a => a.id === targetId);
        if (target) handleEditOpen(target);
      }
    }, [targetId, assets]);

    // Hybrid Filtering: Check Category field OR Tags fallback
    const filteredAssets = assets.filter(asset => {
      if (activeCategory === 'All') return true;
      if (activeCategory === 'Favorites') return asset.isFavorite;
      
      const assetCat = asset.category;
      
      // 1. Direct Category Match
      if (assetCat === activeCategory) return true;
      
      // 2. Smart Fallback for Legacy Assets (Empty category or mismatch)
      if (!assetCat || !ASSET_COLLECTIONS.includes(assetCat)) {
         if (activeCategory === 'Archives / Other') {
            // If viewing Archives, show items that DON'T match other main categories in their tags
            const matchesOther = ASSET_COLLECTIONS.some(c => asset.tags?.some((t: string) => c.includes(t)));
            return !matchesOther;
         }
         // Fuzzy match in tags (e.g. tag "Fashion" shows in "Lifestyle & Fashion")
         return asset.tags?.some((t: string) => activeCategory.includes(t));
      }
      
      return false;
    });

    // Handle Asset Deletion (Ghost Proof)
    const handleDeleteAsset = async (asset: any, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      if (!window.confirm("Permanently delete this asset?")) return;

      // 1. Try Delete Storage (Best Effort)
      if (asset.url) {
        try {
          const fileRef = ref(storage, asset.url);
          await deleteObject(fileRef);
        } catch (err) {
          console.warn("Storage delete skipped (Ghost asset?):", err);
        }
      }

      // 2. Always Delete Firestore Doc
      try {
        await deleteDoc(doc(db, 'assets', asset.id));
      } catch (err) {
        alert("Error deleting record.");
      }
    };

    const handleEditOpen = (asset: any) => {
       setEditingAssetId(asset.id);
       setMetadata({ 
         title: asset.title, 
         description: asset.description, 
         category: asset.category || 'Archives / Other', 
         tags: asset.tags || [] 
       });
       setPreviewUrl(asset.url);
       setUploadFile(null); // No new file by default
       setIsUploadModalOpen(true);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setUploadFile(file);
        
        // Create preview
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        // Start Gemini Analysis
        setIsAnalyzing(true);
        const analysis = await analyzeImageWithGemini(file);
        setMetadata(analysis);
        setIsAnalyzing(false);
      }
    };

    const handleSave = async () => {
      if (!metadata.title) return;

      try {
        if (editingAssetId) {
             // Update Mode (Metadata only)
             await updateDoc(doc(db, 'assets', editingAssetId), {
               title: metadata.title,
               description: metadata.description,
               category: metadata.category,
               tags: metadata.tags,
               updatedAt: serverTimestamp()
             });
        } else {
             // Create Mode
             if (!uploadFile) return;
             const storageRef = ref(storage, `assets/${Date.now()}_${uploadFile.name}`);
             await uploadBytes(storageRef, uploadFile);
             const url = await getDownloadURL(storageRef);

             await addDoc(collection(db, 'assets'), {
               title: metadata.title,
               description: metadata.description,
               category: metadata.category,
               tags: metadata.tags,
               url: url,
               type: 'image',
               isFavorite: false,
               createdAt: serverTimestamp()
             });
        }

        handleClose();
      } catch (error) {
        console.error("Save failed", error);
        alert("Save failed. Please try again.");
      }
    };

    const handleClose = () => {
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setPreviewUrl(null);
      setMetadata({ title: '', description: '', category: '', tags: [] });
      setEditingAssetId(null);
      setTagInput('');
    };

    const addTag = () => {
       if (tagInput && !metadata.tags.includes(tagInput)) {
         setMetadata(prev => ({ ...prev, tags: [...prev.tags, tagInput] }));
         setTagInput('');
       }
    };

    const removeTag = (t: string) => {
       setMetadata(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== t) }));
    }
  
    return (
      <div className="flex h-full bg-slate-50">
        <FilterSidebar 
          title="Assets" 
          activeGroup={activeCategory} 
          setActiveGroup={setActiveCategory} 
          isMobileOpen={isMobileSidebarOpen} 
          onCloseMobile={() => setIsMobileSidebarOpen(false)} 
          categories={['All', 'Favorites', ...ASSET_COLLECTIONS]} // Hybrid collections
        />

        <div className="p-4 md:p-8 flex-1 flex flex-col h-full overflow-hidden min-w-0">
            <header className="flex justify-between items-center mb-6 gap-2">
              <div className="flex items-center gap-3 overflow-hidden">
                 {/* Mobile: Main Navigation Trigger */}
                 <button onClick={() => setIsMobileOpen(true)} className="md:hidden p-2 bg-white border rounded-lg text-slate-700 shadow-sm shrink-0">
                    <Icons.Menu size={20} />
                 </button>
                 
                 <h2 className="text-2xl font-bold text-slate-900 truncate">Digital Assets</h2>

                 {/* Mobile: Filter Trigger */}
                 <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg shrink-0">
                    <Icons.Sliders size={20} />
                 </button>
              </div>
              <button 
                onClick={() => {
                  setEditingAssetId(null);
                  setMetadata({ title: '', description: '', category: ASSET_COLLECTIONS[0], tags: [] });
                  setPreviewUrl(null);
                  setIsUploadModalOpen(true);
                }} 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-blue-700 transition shrink-0"
              >
                <Icons.Plus /> <span className="hidden sm:inline">Upload</span>
              </button>
            </header>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto custom-scrollbar pb-20">
                {loading ? <div className="col-span-full text-center text-slate-400">Loading assets...</div> : filteredAssets.map(asset => (
                    <div 
                       key={asset.id} 
                       onClick={() => handleEditOpen(asset)}
                       className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition aspect-square flex flex-col cursor-pointer"
                    >
                         {asset.url ? (
                             <img 
                               src={asset.url} 
                               alt={asset.title} 
                               className="w-full h-full object-cover" 
                               onError={(e) => {
                                 // Placeholder for broken/ghost image
                                 const target = e.target as HTMLImageElement;
                                 target.style.display = 'none';
                                 target.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                               }}
                             />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400"><Icons.FileText size={48} /></div>
                         )}
                         
                         {/* Fallback for Broken/Ghost Images */}
                         <div className="fallback-icon hidden absolute inset-0 bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                             <Icons.AlertTriangle size={32} className="mb-2 text-amber-500" />
                             <span className="text-xs font-bold text-amber-600">Image Missing</span>
                         </div>

                         {/* Overlay Actions */}
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                             <div className="flex justify-end gap-2">
                                <button type="button" onClick={(e) => {e.stopPropagation(); toggleFavorite('assets', asset.id, asset.isFavorite)}} className="text-white hover:text-red-400">
                                   <Icons.Heart filled={asset.isFavorite} />
                                </button>
                                <button type="button" onClick={(e) => handleDeleteAsset(asset, e)} className="text-white hover:text-red-400 bg-white/20 p-1 rounded-full backdrop-blur-sm">
                                   <Icons.Trash size={16} />
                                </button>
                             </div>
                             <div>
                               <p className="text-white font-bold text-sm truncate">{asset.title}</p>
                               <span className="inline-block px-1.5 py-0.5 rounded bg-white/20 text-white text-[10px] backdrop-blur-sm">
                                 {asset.category || 'No Category'}
                               </span>
                             </div>
                         </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Unified Upload / Edit Modal */}
        {isUploadModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 md:p-4" onClick={handleClose}>
                <div 
                  className="bg-white md:rounded-xl shadow-2xl w-full max-w-5xl h-full md:h-[85vh] flex flex-col md:flex-row overflow-hidden" 
                  onClick={e => e.stopPropagation()}
                >
                    {/* Left: Preview */}
                    <div className="w-full md:w-1/2 bg-slate-50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 relative shrink-0 min-h-[200px] md:min-h-0">
                        {previewUrl ? (
                          <div className="relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center">
                            <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                            {isAnalyzing && (
                              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                                <Icons.Sparkles className="animate-pulse mb-2" size={32} />
                                <span className="font-medium animate-pulse">Gemini Analyzing...</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-64 md:h-full border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100 transition"
                          >
                             <Icons.Upload size={48} className="mb-4 opacity-50" />
                             <p className="font-medium">Click to upload image</p>
                          </div>
                        )}
                        {!editingAssetId && (
                           <input 
                             type="file" 
                             ref={fileInputRef} 
                             className="hidden" 
                             accept="image/*"
                             onChange={handleFileSelect}
                           />
                        )}
                    </div>

                    {/* Right: Metadata - Fixed Height Fix applied via md:h-[85vh] on parent */}
                    <div className="w-full md:w-1/2 flex flex-col h-full min-h-0">
                      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                        <h3 className="text-xl font-bold text-slate-800">{editingAssetId ? 'Edit Asset' : 'New Asset'}</h3>
                        <button onClick={handleClose} className="text-slate-400 hover:text-slate-600"><Icons.X /></button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
                          <input
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            value={metadata.title}
                            onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                          />
                        </div>

                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">Collection</label>
                           <select 
                              className="w-full p-3 border border-slate-200 rounded-lg bg-white"
                              value={metadata.category}
                              onChange={(e) => setMetadata({...metadata, category: e.target.value})}
                           >
                              {ASSET_COLLECTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                          <textarea 
                            rows={4}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                            value={metadata.description}
                            onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Tags</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                             {metadata.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium flex items-center gap-1">
                                   {tag}
                                   <button onClick={() => removeTag(tag)} className="hover:text-blue-900"><Icons.X size={14}/></button>
                                </span>
                             ))}
                          </div>
                          <input 
                             className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                             placeholder="Type tag and press Enter..."
                             value={tagInput}
                             onChange={e => setTagInput(e.target.value)}
                             onKeyDown={e => {
                                if (e.key === 'Enter') {
                                   e.preventDefault();
                                   addTag();
                                }
                             }}
                          />
                        </div>
                      </div>

                      <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                        <button onClick={handleClose} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition">Cancel</button>
                        <button 
                          onClick={handleSave} 
                          disabled={(!uploadFile && !editingAssetId) || !metadata.title || isAnalyzing}
                          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-lg shadow-blue-200 flex items-center gap-2"
                        >
                          {isAnalyzing ? 'Processing...' : 'Save Asset'}
                        </button>
                      </div>
                    </div>
                </div>
             </div>
        )}
      </div>
    );
  };

const FrameworksView = ({ selectedFrameworkId, setSelectedFrameworkId, setIsMobileOpen, targetId }: any) => {
  const { data: frameworks, loading } = useCollection('frameworks');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Create / Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fwForm, setFwForm] = useState({ 
     title: '', description: '', category: 'Strategy', tags: [] as string[], steps: [] as string[], isFavorite: false 
  });
  const [stepInput, setStepInput] = useState('');

  // Deep Linking Effect
  useEffect(() => {
    if (targetId && frameworks.length > 0) {
      const exists = frameworks.find(f => f.id === targetId);
      if (exists) setSelectedFrameworkId(targetId);
    }
  }, [targetId, frameworks]);

  // Update form when selection changes
  useEffect(() => {
    if (selectedFrameworkId) {
       const fw = frameworks.find(f => f.id === selectedFrameworkId);
       if (fw) setFwForm({ ...fw });
       setIsEditing(false);
    }
  }, [selectedFrameworkId, frameworks]);
  
  const filtered = frameworks.filter(f => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Favorites') return f.isFavorite;
    return f.category === activeCategory;
  });

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (window.confirm("Are you sure you want to delete this framework?")) {
      try {
        await deleteDoc(doc(db, 'frameworks', id));
        if (selectedFrameworkId === id) setSelectedFrameworkId(null);
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete framework.");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!fwForm.title) return;

     const data = { ...fwForm, tags: fwForm.tags || [], steps: fwForm.steps || [] };

     try {
        if (isEditing && selectedFrameworkId) {
           await updateDoc(doc(db, 'frameworks', selectedFrameworkId), { ...data, updatedAt: serverTimestamp() });
           setIsEditing(false);
        } else {
           await addDoc(collection(db, 'frameworks'), { ...data, isFavorite: false, createdAt: serverTimestamp() });
           setIsModalOpen(false);
        }
     } catch (err) {
        console.error(err);
     }
  };

  const addStep = () => {
     if (stepInput) {
        setFwForm(prev => ({ ...prev, steps: [...prev.steps, stepInput] }));
        setStepInput('');
     }
  };

  const removeStep = (index: number) => {
     setFwForm(prev => ({ ...prev, steps: prev.steps.filter((_, i) => i !== index) }));
  };

  // Shared Form UI (Used in Modal and Sidebar)
  const FrameworkFormUI = () => (
     <div className="space-y-4">
        <input 
           className="w-full p-2 border rounded-lg font-bold"
           placeholder="Framework Title"
           value={fwForm.title}
           onChange={e => setFwForm({...fwForm, title: e.target.value})}
        />
        <div className="flex gap-2">
            <select 
              className="p-2 border rounded-lg bg-white"
              value={fwForm.category}
              onChange={e => setFwForm({...fwForm, category: e.target.value})}
            >
               {UNIVERSAL_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
        <textarea 
           className="w-full p-2 border rounded-lg text-sm"
           placeholder="Description..."
           rows={3}
           value={fwForm.description}
           onChange={e => setFwForm({...fwForm, description: e.target.value})}
        />
        
        <div>
           <label className="text-xs font-bold uppercase text-slate-500">Steps</label>
           <div className="space-y-2 mt-2">
              {fwForm.steps.map((s, i) => (
                 <div key={i} className="flex gap-2 items-start bg-slate-50 p-2 rounded text-sm">
                    <span className="font-bold text-slate-400">{i+1}.</span>
                    <span className="flex-1">{s}</span>
                    <button type="button" onClick={() => removeStep(i)} className="text-red-400"><Icons.X size={14}/></button>
                 </div>
              ))}
              <div className="flex gap-2 mt-2">
                 <input 
                    className="flex-1 p-2 border rounded text-sm"
                    placeholder="Next step..."
                    value={stepInput}
                    onChange={e => setStepInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStep())}
                 />
                 <button type="button" onClick={addStep} className="p-2 bg-slate-200 rounded hover:bg-slate-300"><Icons.Plus size={16}/></button>
              </div>
           </div>
        </div>
     </div>
  );

  return (
    <div className="flex h-full bg-slate-50">
       <FilterSidebar 
          title="Frameworks" 
          activeGroup={activeCategory} 
          setActiveGroup={setActiveCategory} 
          isMobileOpen={isMobileSidebarOpen} 
          onCloseMobile={() => setIsMobileSidebarOpen(false)} 
       />
       
       <div className={`flex-1 flex flex-col min-w-0 h-full ${selectedFrameworkId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 md:p-8 flex-1 flex flex-col h-full overflow-hidden">
             <header className="flex justify-between items-center mb-6 gap-2">
                <div className="flex items-center gap-3 overflow-hidden">
                   {/* Mobile: Main Navigation Trigger */}
                   <button onClick={() => setIsMobileOpen(true)} className="md:hidden p-2 bg-white border rounded-lg text-slate-700 shadow-sm shrink-0">
                      <Icons.Menu size={20} />
                   </button>
                   
                   <h2 className="text-2xl font-bold text-slate-900 truncate">Frameworks</h2>

                   {/* Mobile: Filter Trigger */}
                   <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg shrink-0">
                      <Icons.Sliders size={20} />
                   </button>
                </div>
                <button 
                   onClick={() => {
                      setFwForm({ title: '', description: '', category: 'Strategy', tags: [], steps: [], isFavorite: false });
                      setIsModalOpen(true);
                   }} 
                   className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-blue-700 transition shrink-0"
                >
                   <Icons.Plus /> <span className="hidden sm:inline">New</span>
                </button>
             </header>

             <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {loading ? <div className="text-center text-slate-400 mt-10">Loading...</div> : filtered.map(fw => (
                   <div 
                      key={fw.id} 
                      onClick={() => setSelectedFrameworkId(fw.id)}
                      className={`bg-white p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${selectedFrameworkId === fw.id ? 'border-purple-500 ring-1 ring-purple-500' : 'border-slate-200 hover:border-purple-300'}`}
                   >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                           <span className={`px-2 py-0.5 rounded text-xs font-bold ${getCategoryColor(fw.category)}`}>{fw.category}</span>
                           <h3 className="font-bold text-slate-800">{fw.title}</h3>
                        </div>
                        {fw.isFavorite && <div className="text-red-500"><Icons.Heart filled /></div>}
                      </div>
                      <p className="text-slate-500 text-sm mb-3 line-clamp-2">{fw.description}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-2 rounded">
                          <span className="font-bold text-slate-600">{fw.steps?.length || 0} Steps</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>

       {/* Detail / Edit View */}
       {selectedFrameworkId && (
          <div className="fixed inset-0 z-50 bg-white md:static md:w-[500px] md:border-l border-slate-200 flex flex-col h-full shadow-2xl md:shadow-none">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                   <button onClick={() => setSelectedFrameworkId(null)} className="md:hidden p-2 -ml-2 text-slate-500"><Icons.ArrowLeft /></button>
                   {!isEditing && <span className={`px-2 py-1 rounded text-xs font-bold ${getCategoryColor(fwForm.category)}`}>{fwForm.category}</span>}
                </div>
                <div className="flex gap-1">
                   <button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded ${isEditing ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}><Icons.Edit /></button>
                   <button onClick={() => toggleFavorite('frameworks', selectedFrameworkId, fwForm.isFavorite)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"><Icons.Heart filled={fwForm.isFavorite} /></button>
                   <button type="button" onClick={(e) => handleDelete(selectedFrameworkId, e)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"><Icons.Trash /></button>
                   <button onClick={() => setSelectedFrameworkId(null)} className="hidden md:block p-2 text-slate-400 hover:text-slate-600"><Icons.X /></button>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {isEditing ? (
                   <form onSubmit={handleSave}>
                      <FrameworkFormUI />
                      <button type="submit" className="mt-6 w-full py-2 bg-blue-600 text-white rounded-lg font-bold">Save Changes</button>
                   </form>
                ) : (
                   <>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">{fwForm.title}</h2>
                      <p className="text-slate-600 mb-6">{fwForm.description}</p>
                      
                      <h3 className="font-bold text-slate-400 uppercase text-xs mb-3 tracking-wider">Process Steps</h3>
                      <div className="space-y-4 mb-6">
                          {fwForm.steps?.map((step: any, idx: number) => (
                              <div key={idx} className="flex gap-4">
                                  <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-sm">{idx + 1}</div>
                                  <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-800 text-sm">
                                      {step}
                                  </div>
                              </div>
                          ))}
                      </div>
                   </>
                )}
             </div>
          </div>
       )}

       {/* Create Modal */}
       {isModalOpen && (
         <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
            <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold">New Framework</h3>
                  <button onClick={() => setIsModalOpen(false)}><Icons.X /></button>
               </div>
               <form onSubmit={handleSave} className="p-6 overflow-y-auto max-h-[80vh]">
                  <FrameworkFormUI />
                  <button type="submit" className="mt-6 w-full py-2 bg-blue-600 text-white rounded-lg font-bold">Create Framework</button>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};

// --- App Container ---
const AppContent = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);
  
  // Navigation Parameter State (for Deep Linking from Dashboard)
  const [targetId, setTargetId] = useState<string | null>(null);

  // Clear targetId when switching views naturally to prevent sticky selection
  useEffect(() => {
    // Optional: We might want to clear targetId after a short delay or when view changes 
    // BUT child views are responsible for consuming it.
    // Here we mainly ensure that if the user clicks a menu item manually, we reset deep links.
  }, [activeView]);

  if (authLoading) return <div className="h-screen flex items-center justify-center text-slate-400">Loading Vault...</div>;
  if (!user) return <LoginView />;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
       <Sidebar 
         activeView={activeView} 
         setActiveView={(view: string) => { setActiveView(view); setTargetId(null); }} 
         isMobileOpen={isMobileOpen} 
         setIsMobileOpen={setIsMobileOpen} 
         user={user}
         signOut={signOut}
       />
       
       <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          
          {activeView === 'dashboard' && (
             <DashboardView 
                setActiveView={setActiveView} 
                setIsMobileOpen={setIsMobileOpen} 
                setTargetId={setTargetId}
                user={user}
             />
          )}
          
          {activeView === 'prompts' && (
             <PromptsView 
                setIsMobileOpen={setIsMobileOpen} 
                targetId={targetId}
             />
          )}
          
          {activeView === 'assets' && (
             <AssetsView 
                setIsMobileOpen={setIsMobileOpen} 
                targetId={targetId}
             />
          )}
          
          {activeView === 'frameworks' && (
            <FrameworksView 
               selectedFrameworkId={selectedFrameworkId} 
               setSelectedFrameworkId={setSelectedFrameworkId} 
               setIsMobileOpen={setIsMobileOpen}
               targetId={targetId}
            />
          )}
       </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);