import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from './AuthContext';
import { GoogleGenAI } from "@google/genai";
import { db, storage } from './firebaseConfig';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc,
  updateDoc, 
  deleteDoc, 
  arrayUnion,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { auth } from './firebaseConfig';

// --- CONSTANTS & TAXONOMY ---
const CATEGORIES = [
  { id: 'Coding', label: '💻 Coding & Eng', color: 'bg-blue-100 text-blue-700' },
  { id: 'Image', label: '🎨 Image & Design', color: 'bg-purple-100 text-purple-700' },
  { id: 'Writing', label: '✍️ Writing & Content', color: 'bg-green-100 text-green-700' },
  { id: 'Data', label: '📊 Data & Analysis', color: 'bg-amber-100 text-amber-700' },
  { id: 'Business', label: '🚀 Strategy & Biz', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'Productivity', label: '⚡ Productivity', color: 'bg-slate-100 text-slate-700' },
  { id: 'Other', label: '📦 Other', color: 'bg-gray-100 text-gray-700' }
];

const getCategoryColor = (catId: string) => {
  const cat = CATEGORIES.find(c => c.id === catId);
  return cat ? cat.color : 'bg-slate-100 text-slate-700';
};

// --- GLOBAL STYLES CONSTANTS ---
const INPUT_CLASSES = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder:text-slate-400";

// --- ICONS (Simple SVGs) ---
const Icons = {
  Dashboard: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>,
  Prompts: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Frameworks: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Assets: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
  Workflows: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  More: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  ArrowLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>,
  Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  LogOut: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Save: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>,
  Shield: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  MinusCircle: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" x2="16" y1="12" y2="12"/></svg>,
  Magic: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 5h4"/><path d="M3 9h4"/></svg>,
  Upload: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  Copy: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
  Image: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
  Download: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
  Expand: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>,
  Shrink: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>,
  Play: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Link: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Send: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Filter: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Activity: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  Folder: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>,
  Layout: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>,
  Heart: ({ filled }: { filled?: boolean }) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={filled ? "text-red-500" : ""}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>,
  ChevronDown: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  Sparkles: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 5h4"/><path d="M3 9h4"/></svg>,
};

// --- TYPES ---
interface Prompt {
  id: string;
  title: string;
  category: string;
  version: string;
  tags: string[];
  content: string;
  isFavorite?: boolean;
  updatedAt?: Timestamp;
  history?: any[];
}

interface Framework {
  id: string;
  title: string;
  description: string;
  category: string;
  steps: string[];
  tags: string[];
  isFavorite?: boolean;
  updatedAt?: Timestamp;
}

interface Asset {
  id: string;
  title?: string;
  description?: string;
  category: string;
  collectionId?: string;
  fileName: string;
  fileUrl: string;
  storagePath: string;
  tags: string[];
  isFavorite?: boolean;
  userId: string;
  createdAt?: Timestamp;
}

interface AssetCollection {
  id: string;
  title: string;
  userId: string;
  createdAt?: Timestamp;
}

interface NoteEntry {
  id: string;
  content: string;
  createdAt: Timestamp;
}

interface Workflow {
  id: string;
  title: string;
  goal: string;
  promptId: string;
  frameworkId: string;
  category: string;
  notes: string;
  noteLog?: NoteEntry[];
  stepNotes?: { [key: string]: string }; 
  isFavorite?: boolean;
  userId: string;
  createdAt?: Timestamp;
  completedSteps?: number[];
}

// --- HELPERS ---
const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Just now';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const toggleFavorite = async (collectionName: string, id: string, currentStatus?: boolean) => {
    try {
        await updateDoc(doc(db, collectionName, id), {
            isFavorite: !currentStatus
        });
    } catch (e) {
        console.error("Error toggling favorite", e);
    }
};

// --- HOOKS ---
const usePrompts = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'prompts'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const promptsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Prompt[];
      setPrompts(promptsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching prompts:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { prompts, loading };
};

const useFrameworks = () => {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'frameworks'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const frameworksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Framework[];
      setFrameworks(frameworksData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching frameworks:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { frameworks, loading };
};

const useAssets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'assets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assetsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Asset[];
      setAssets(assetsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching assets:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { assets, loading };
};

const useAssetCollections = () => {
  const [collections, setCollections] = useState<AssetCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'collections'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AssetCollection[];
      const myCollections = data.filter(c => c.userId === user.uid);
      setCollections(myCollections);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  return { collections, loading };
};

const useWorkflows = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'workflows'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workflowsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Workflow[];
      setWorkflows(workflowsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching workflows:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { workflows, loading };
};

// --- GLOBAL AI ASSISTANT COMPONENT ---
const GlobalAIAssistant = () => {
  const { prompts } = usePrompts();
  const { frameworks } = useFrameworks();
  const { workflows } = useWorkflows();
  const { assets } = useAssets();
  
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const contextSummary = {
        prompts: prompts.map(p => ({ title: p.title, category: p.category, tags: p.tags, id: p.id })),
        frameworks: frameworks.map(f => ({ title: f.title, description: f.description, steps: f.steps.length, id: f.id })),
        assets: assets.map(a => ({ title: a.title, fileName: a.fileName, category: a.category, tags: a.tags })),
        workflows: workflows.map(w => ({ title: w.title, goal: w.goal, category: w.category }))
      };

      const systemInstruction = `You are the AI Assistant for the 'Prompt & Process Vault' application.
      You have read-access to the user's current library summary:
      
      - Prompts: ${JSON.stringify(contextSummary.prompts)}
      - Frameworks: ${JSON.stringify(contextSummary.frameworks)}
      - Assets: ${JSON.stringify(contextSummary.assets)}
      - Workflows: ${JSON.stringify(contextSummary.workflows)}

      Your goal is to help the user find items, suggest ideas for new prompts/workflows based on what they have, or answer general questions.
      Keep answers concise and helpful. If you suggest a Prompt ID or Framework ID, mention it clearly.`;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: { systemInstruction: systemInstruction },
        history: history
      });

      const result = await chat.sendMessageStream({ message: userMessage });
      
      let fullResponse = "";
      setMessages(prev => [...prev, { role: 'model', text: "" }]);

      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) {
            fullResponse += chunkText;
            setMessages(prev => {
                const newArr = [...prev];
                newArr[newArr.length - 1].text = fullResponse;
                return newArr;
            });
        }
      }

    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error connecting to Gemini. Please check your API key." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-2xl flex items-center justify-center z-[100] transition-transform hover:scale-105 active:scale-95 group"
        >
          <div className="animate-pulse group-hover:animate-none"><Icons.Sparkles /></div>
        </button>
      )}

      {isOpen && (
        <div className="fixed z-[100] flex flex-col shadow-2xl overflow-hidden
          w-full h-full inset-0 md:inset-auto md:bottom-24 md:right-6 md:w-96 md:h-[600px] md:rounded-2xl bg-white border border-slate-200"
        >
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
               <div className="text-yellow-400"><Icons.Sparkles /></div>
               <div>
                  <h3 className="font-bold text-sm">Vault Assistant</h3>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                    Online • Gemini 2.5
                  </div>
               </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded transition"><Icons.ChevronDown /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
             {messages.length === 0 && (
                <div className="text-center mt-10 space-y-3">
                   <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2"><Icons.Magic /></div>
                   <p className="text-sm font-bold text-slate-700">How can I help you today?</p>
                   <p className="text-xs text-slate-500 max-w-[200px] mx-auto">I have access to your {prompts.length} prompts, {frameworks.length} frameworks and {workflows.length} workflows.</p>
                   
                   <div className="grid grid-cols-1 gap-2 mt-4 px-4">
                      <button onClick={() => { setInput("Find a prompt for coding python"); handleSend(); }} className="text-xs bg-white border border-slate-200 p-2 rounded hover:bg-blue-50 text-left text-slate-600 transition">"Find a prompt for coding..."</button>
                      <button onClick={() => { setInput("Suggest a workflow for SEO blog posts"); handleSend(); }} className="text-xs bg-white border border-slate-200 p-2 rounded hover:bg-blue-50 text-left text-slate-600 transition">"Suggest a workflow for SEO..."</button>
                   </div>
                </div>
             )}

             {messages.map((msg, i) => (
               <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                  }`}>
                    {msg.text ? <div className="whitespace-pre-wrap">{msg.text}</div> : (
                      <div className="flex gap-1 h-5 items-center">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                      </div>
                    )}
                  </div>
               </div>
             ))}
             <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
             <input 
               type="text" 
               className="flex-1 bg-slate-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition outline-none text-slate-900 placeholder:text-slate-400"
               placeholder="Ask Gemini..."
               value={input}
               onChange={e => setInput(e.target.value)}
             />
             <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white w-10 h-10 rounded-full flex items-center justify-center transition shadow-sm"
             >
               <Icons.Send />
             </button>
          </form>
        </div>
      )}
    </>
  );
};

// --- REUSABLE COMPONENTS ---

const TagInput = ({ tags, onChange }: { tags: string[], onChange: (tags: string[]) => void }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.trim().toLowerCase();
      if (val && !tags.includes(val)) {
        onChange([...tags, val]);
      }
      setInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500">
      {tags.map(tag => (
        <span key={tag} className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm flex items-center gap-1">
          #{tag}
          <button type="button" onClick={() => removeTag(tag)} className="text-slate-400 hover:text-red-500 hover:bg-slate-200 rounded-full"><Icons.MinusCircle /></button>
        </span>
      ))}
      <input 
        type="text" 
        className="flex-1 outline-none text-sm min-w-[80px] bg-transparent text-slate-900" 
        placeholder="Type tag & enter..." 
        value={input} 
        onChange={e => setInput(e.target.value)} 
        onKeyDown={handleKeyDown} 
      />
    </div>
  );
};

const CategorySelect = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
    <select required className={INPUT_CLASSES} value={value} onChange={e => onChange(e.target.value)}>
        <option value="General">General (Default)</option>
        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
    </select>
);

const CollectionSelect = ({ value, onChange, collections }: { value: string, onChange: (v: string) => void, collections: AssetCollection[] }) => (
    <select className={INPUT_CLASSES} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">No Collection</option>
        {collections.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
    </select>
);

const GlobalFilterSidebar = ({ 
    title,
    activeGroup, 
    setActiveGroup, 
    collections = [], 
    onCreateCollection, 
    isMobileOpen, 
    onCloseMobile,
    showCollections = false
}: any) => {
    const baseClasses = "fixed inset-y-0 left-0 w-64 bg-slate-50 border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-60 lg:w-64 shrink-0 flex flex-col";
    const mobileClasses = isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full";

    return (
        <>
        {isMobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onCloseMobile}></div>}
        <div className={`${baseClasses} ${mobileClasses}`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center md:hidden">
                <h3 className="font-bold text-slate-800">Filters & Folders</h3>
                <button onClick={onCloseMobile} className="text-slate-500"><Icons.X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">{title}</h4>
                    <button onClick={() => { setActiveGroup('All'); onCloseMobile(); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition mb-1 ${activeGroup === 'All' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}><Icons.Layout /> All Items</button>
                    <button onClick={() => { setActiveGroup('Favorites'); onCloseMobile(); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${activeGroup === 'Favorites' ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-100'}`}><Icons.Heart /> Favorites</button>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Categories</h4>
                    <div className="space-y-1">
                        {CATEGORIES.map(cat => (
                            <button key={cat.id} onClick={() => { setActiveGroup(cat.id); onCloseMobile(); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${activeGroup === cat.id ? 'bg-white border border-slate-200 shadow-sm font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-100 font-medium'}`}>
                                <span className={`w-2 h-2 rounded-full ${cat.color.split(' ')[0]}`}></span>
                                {cat.label.split(' ')[1] + ' ' + (cat.label.split(' ')[2] || '')}
                            </button>
                        ))}
                    </div>
                </div>
                {showCollections && onCreateCollection && (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collections</h4>
                            <button onClick={onCreateCollection} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition"><Icons.Plus /></button>
                        </div>
                        {collections.length === 0 ? <div className="text-xs text-slate-400 italic px-2">No collections yet.</div> : (
                            <div className="space-y-1">
                                {collections.map((col: any) => (
                                    <button key={col.id} onClick={() => { setActiveGroup(col.id); onCloseMobile(); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${activeGroup === col.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100 font-medium'}`}><Icons.Folder /><span className="truncate">{col.title}</span></button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

// --- MODALS (Code retained from previous step but compressed for length) ---
const HealthCheckModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'success' | 'error'}[]>([]);
  const [running, setRunning] = useState(false);
  useEffect(() => { if (isOpen) runDiagnostics(); }, [isOpen]);
  const addLog = (msg: string, type: 'info' | 'success' | 'error') => setLogs(prev => [...prev, { msg, type }]);
  const runDiagnostics = async () => {
    setRunning(true); setLogs([]); addLog('Starting System Diagnostics...', 'info');
    const user = auth.currentUser;
    if (!user) { addLog('Auth Error: No active user session.', 'error'); setRunning(false); return; }
    addLog(`Auth Verified: ${user.email}`, 'success');
    try {
      addLog('Testing Firestore Write...', 'info');
      const docRef = await addDoc(collection(db, '_diagnostics'), { timestamp: serverTimestamp(), user: user.uid });
      addLog(`Firestore Write Success. Doc ID: ${docRef.id}`, 'success');
      addLog('Testing Firestore Delete...', 'info');
      await deleteDoc(doc(db, '_diagnostics', docRef.id));
      addLog('Firestore Delete Success.', 'success');
    } catch (e: any) { addLog(`Firestore Failed: ${e.message}`, 'error'); setRunning(false); return; }
    addLog('Diagnostics Complete.', 'success'); setRunning(false);
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Icons.Activity /> System Diagnostics</h3><button onClick={onClose} className="text-slate-400 hover:text-white"><Icons.X /></button></div>
        <div className="p-4 h-64 overflow-y-auto font-mono text-xs space-y-2 bg-slate-950">{logs.map((log, i) => <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-blue-300'}`}><span>[{new Date().toLocaleTimeString()}]</span><span>{log.msg}</span></div>)}{running && <div className="text-slate-500 animate-pulse">Running tests...</div>}</div>
      </div>
    </div>
  );
};

const CreatePromptModal = ({ isOpen, onClose }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: '', category: 'Coding', content: '' });
  const [tags, setTags] = useState<string[]>([]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await addDoc(collection(db, 'prompts'), { ...formData, tags, version: 'v1.0', userId: user?.uid, updatedAt: serverTimestamp(), createdAt: serverTimestamp(), history: [], isFavorite: false });
      setFormData({ title: '', category: 'Coding', content: '' }); setTags([]); onClose();
    } catch (error) { console.error(error); alert("Error saving prompt."); } finally { setLoading(false); }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="text-lg font-bold text-slate-800">New Prompt</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icons.X /></button></div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label><input required className={INPUT_CLASSES} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label><CategorySelect value={formData.category} onChange={v => setFormData({...formData, category: v})} /></div></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tags</label><TagInput tags={tags} onChange={setTags} /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Content</label><textarea required rows={8} className={INPUT_CLASSES} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} /></div>
        </form>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-200 rounded-lg">Cancel</button><button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700">{loading ? 'Saving...' : 'Save Prompt'}</button></div>
      </div>
    </div>
  );
};

const CreateFrameworkModal = ({ isOpen, onClose }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: '', category: 'Productivity', description: '' });
  const [tags, setTags] = useState<string[]>([]);
  const [steps, setSteps] = useState<string[]>(['']);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await addDoc(collection(db, 'frameworks'), { ...formData, steps: steps.filter(s=>s.trim()), tags, userId: user?.uid, updatedAt: serverTimestamp(), createdAt: serverTimestamp(), isFavorite: false });
      setFormData({ title: '', description: '', category: 'Productivity' }); setTags([]); setSteps(['']); onClose();
    } catch (error) { console.error(error); alert("Error saving framework."); } finally { setLoading(false); }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="text-lg font-bold text-slate-800">New Framework</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icons.X /></button></div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label><input required className={INPUT_CLASSES} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label><CategorySelect value={formData.category} onChange={v => setFormData({...formData, category: v})} /></div></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label><textarea required rows={2} className={INPUT_CLASSES} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tags</label><TagInput tags={tags} onChange={setTags} /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Steps</label><div className="space-y-2">{steps.map((step, index) => (<div key={index} className="flex gap-2"><span className="text-slate-400 font-mono text-xs w-4">{index + 1}.</span><input required className={INPUT_CLASSES} value={step} onChange={(e) => { const newSteps = [...steps]; newSteps[index] = e.target.value; setSteps(newSteps); }} />{steps.length > 1 && <button type="button" onClick={() => setSteps(steps.filter((_, i) => i !== index))} className="text-slate-400 hover:text-red-500"><Icons.MinusCircle /></button>}</div>))}</div><button type="button" onClick={() => setSteps([...steps, ''])} className="mt-3 text-blue-600 text-sm font-bold flex gap-1"><Icons.Plus /> Add Step</button></div>
        </form>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 text-slate-600">Cancel</button><button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg">{loading ? 'Saving...' : 'Save Framework'}</button></div>
      </div>
    </div>
  );
};

const UploadAssetModal = ({ isOpen, onClose }: any) => {
    const { user } = useAuth();
    const { collections } = useAssetCollections();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Image');
    const [collectionId, setCollectionId] = useState('');

    useEffect(() => { if (!file) { setPreviewUrl(null); return; } const o = URL.createObjectURL(file); setPreviewUrl(o); return () => URL.revokeObjectURL(o); }, [file]);
    const handleUpload = async (e: React.FormEvent) => { e.preventDefault(); if (!file || !user) return; setLoading(true); try { const path = `assets/${user.uid}/${Date.now()}_${file.name}`; const r = ref(storage, path); await uploadBytes(r, file); const url = await getDownloadURL(r); await addDoc(collection(db, 'assets'), { fileName: file.name, title: title || file.name, description, category, collectionId: collectionId || null, fileUrl: url, storagePath: path, tags, userId: user.uid, createdAt: serverTimestamp(), isFavorite: false }); setFile(null); setTags([]); setTitle(''); setDescription(''); onClose(); } catch (e) { console.error(e); alert("Failed to upload."); } finally { setLoading(false); } };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="text-lg font-bold text-slate-800">Upload Asset</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icons.X /></button></div>
                <form onSubmit={handleUpload} className="p-6 space-y-4 overflow-y-auto">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-8 bg-slate-50 relative"><input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setTitle(e.target.files[0].name); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />{previewUrl ? <img src={previewUrl} className="h-48 object-contain" /> : <div className="text-center"><Icons.Upload /><p className="text-sm mt-2">Select Image</p></div>}</div>
                    {file && <div className="space-y-4 pt-2"><div><label className="block text-xs font-bold text-slate-500 mb-1">Title</label><input className={INPUT_CLASSES} value={title} onChange={e => setTitle(e.target.value)} /></div><div className="grid grid-cols-2 gap-4"><CategorySelect value={category} onChange={setCategory} /><CollectionSelect value={collectionId} onChange={setCollectionId} collections={collections} /></div><div><label className="block text-xs font-bold text-slate-500 mb-1">Description</label><textarea className={INPUT_CLASSES} value={description} onChange={e => setDescription(e.target.value)} /></div><TagInput tags={tags} onChange={setTags} /></div>}
                    <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-slate-600">Cancel</button><button type="submit" disabled={!file || loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg">{loading ? 'Uploading...' : 'Upload'}</button></div>
                </form>
            </div>
        </div>
    );
};

const CreateWorkflowModal = ({ isOpen, onClose }: any) => {
  const { user } = useAuth();
  const { prompts } = usePrompts();
  const { frameworks } = useFrameworks();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: '', goal: '', promptId: '', frameworkId: '', notes: '' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); const cat = prompts.find(p => p.id === formData.promptId)?.category || 'General'; try { await addDoc(collection(db, 'workflows'), { ...formData, category: cat, userId: user?.uid, createdAt: serverTimestamp(), isFavorite: false }); setFormData({ title: '', goal: '', promptId: '', frameworkId: '', notes: '' }); onClose(); } catch (e) { console.error(e); } finally { setLoading(false); } };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="text-lg font-bold text-slate-800">New Workflow</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icons.X /></button></div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label><input required className={INPUT_CLASSES} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Goal</label><input required className={INPUT_CLASSES} value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-blue-600 mb-1">Prompt</label><select required className={INPUT_CLASSES} value={formData.promptId} onChange={e => setFormData({...formData, promptId: e.target.value})}><option value="">Select Prompt</option>{prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div><div><label className="block text-xs font-bold text-indigo-600 mb-1">Framework</label><select required className={INPUT_CLASSES} value={formData.frameworkId} onChange={e => setFormData({...formData, frameworkId: e.target.value})}><option value="">Select Framework</option>{frameworks.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}</select></div></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label><textarea className={INPUT_CLASSES} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
        </form>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 text-slate-600">Cancel</button><button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg">{loading ? 'Saving...' : 'Create'}</button></div>
      </div>
    </div>
  );
};

const ImageLightbox = ({ asset, onClose }: { asset: Asset, onClose: () => void }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!asset) return null;
    const handleDownload = async (url: string, filename: string) => { try { const r = await fetch(url, { mode: 'cors' }); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); } catch (e) { window.open(url, '_blank'); } };
    return (
        <div className="fixed inset-0 bg-black z-[70] flex flex-col backdrop-blur-sm" onClick={onClose}>
            <div className="absolute top-4 right-4 z-50 flex gap-3"><button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="p-3 text-white/70 hover:text-white bg-black/40 rounded-full">{isExpanded ? <Icons.Shrink /> : <Icons.Expand />}</button><button onClick={onClose} className="p-3 text-white/70 hover:text-white bg-black/40 rounded-full"><Icons.X /></button></div>
            <div className={`flex-1 w-full h-full flex ${isExpanded ? '' : 'flex-col lg:flex-row'} overflow-hidden`} onClick={(e) => e.stopPropagation()}>
                 <div className={`relative flex items-center justify-center bg-black/50 transition-all duration-300 ${isExpanded ? 'w-full h-full' : 'w-full h-[45vh] lg:h-full lg:flex-1'}`}><img src={asset.fileUrl} alt={asset.title} className="max-w-full max-h-full w-auto h-auto object-contain" /></div>
                 {!isExpanded && (
                     <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-l border-white/10 flex flex-col h-auto flex-1 lg:h-full overflow-hidden shadow-2xl z-20">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"><div className="flex justify-between items-start"><h3 className="text-xl font-bold text-white">{asset.title}</h3><button onClick={() => toggleFavorite('assets', asset.id, asset.isFavorite)} className="text-white/50 hover:text-red-500"><Icons.Heart filled={asset.isFavorite} /></button></div><div className="bg-slate-800/50 rounded-lg p-4"><p className="text-slate-300 text-sm">{asset.description || "No description."}</p></div></div>
                        <div className="p-4 bg-slate-950 border-t border-white/10"><button onClick={() => handleDownload(asset.fileUrl, asset.fileName)} className="w-full bg-white text-slate-900 py-3 rounded-lg font-bold flex justify-center gap-2"><Icons.Download /> Download</button></div>
                     </div>
                 )}
            </div>
        </div>
    );
};

// --- VIEWS ---

const LoginView = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, signUp } = useAuth();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="text-slate-500 mb-6">Prompt & Process Vault</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              required 
              className={INPUT_CLASSES}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required 
              className={INPUT_CLASSES}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-bold hover:underline">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ view, setView, user, signOut, isOpen, closeMenu, onRunDiagnostics }: any) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { id: 'prompts', label: 'Prompts', icon: Icons.Prompts },
    { id: 'frameworks', label: 'Frameworks', icon: Icons.Frameworks },
    { id: 'assets', label: 'Assets', icon: Icons.Assets },
    { id: 'workflows', label: 'Workflows', icon: Icons.Workflows },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMenu}></div>}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static shrink-0 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="font-bold text-xl tracking-tight">Vault<span className="text-blue-500">.AI</span></div>
          <button onClick={closeMenu} className="md:hidden text-slate-400 hover:text-white"><Icons.X /></button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); closeMenu(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-xs font-bold">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.email}</div>
              <div className="text-xs text-slate-500">Free Plan</div>
            </div>
          </div>
          <button onClick={onRunDiagnostics} className="w-full flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 px-2 py-1 mb-2">
            <Icons.Activity /> System Status
          </button>
          <button onClick={signOut} className="w-full flex items-center gap-2 text-slate-400 hover:text-white px-2 py-2 rounded hover:bg-slate-800 transition text-sm">
            <Icons.LogOut /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

const MobileHeader = ({ onMenuClick }: { onMenuClick: () => void }) => (
  <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center z-30 sticky top-0">
    <div className="font-bold text-xl">Vault<span className="text-blue-600">.AI</span></div>
    <button onClick={onMenuClick} className="text-slate-600 p-1 rounded hover:bg-slate-100"><Icons.Menu /></button>
  </div>
);

const StatCard = ({ label, count, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
      <Icon />
    </div>
    <div>
      <div className="text-2xl font-bold text-slate-900">{count}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  </div>
);

const DashboardView = ({ setView, setSelectedPromptId }: any) => {
  const { prompts } = usePrompts();
  const { frameworks } = useFrameworks();
  const { assets } = useAssets();
  const { workflows } = useWorkflows();

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 p-4 md:p-8">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500">Overview of your creative vault.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Prompts" count={prompts.length} icon={Icons.Prompts} color="bg-blue-100 text-blue-600" />
        <StatCard label="Frameworks" count={frameworks.length} icon={Icons.Frameworks} color="bg-purple-100 text-purple-600" />
        <StatCard label="Assets" count={assets.length} icon={Icons.Assets} color="bg-green-100 text-green-600" />
        <StatCard label="Workflows" count={workflows.length} icon={Icons.Workflows} color="bg-amber-100 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">Recent Prompts</h3>
            <button onClick={() => setView('prompts')} className="text-sm text-blue-600 hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {prompts.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer border border-transparent hover:border-slate-100 transition" onClick={() => { setView('prompts'); setSelectedPromptId(p.id); }}>
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${getCategoryColor(p.category).split(' ')[0]}`}></span>
                  <span className="font-medium text-slate-700">{p.title}</span>
                </div>
                <span className="text-xs text-slate-400">{formatDate(p.updatedAt)}</span>
              </div>
            ))}
            {prompts.length === 0 && <div className="text-slate-400 text-sm italic">No prompts yet.</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setView('prompts')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-left transition group">
              <div className="text-blue-600 mb-2 group-hover:scale-110 transition-transform origin-left"><Icons.Plus /></div>
              <div className="font-bold text-slate-800">New Prompt</div>
            </button>
             <button onClick={() => setView('frameworks')} className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl text-left transition group">
              <div className="text-purple-600 mb-2 group-hover:scale-110 transition-transform origin-left"><Icons.Plus /></div>
              <div className="font-bold text-slate-800">New Framework</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PromptsView = ({ selectedPromptId, setSelectedPromptId }: any) => {
  const { prompts, loading } = usePrompts();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const filtered = prompts.filter(p => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Favorites') return p.isFavorite;
    return p.category === activeCategory;
  });

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this prompt?")) {
      await deleteDoc(doc(db, 'prompts', id));
      if (selectedPromptId === id) setSelectedPromptId(null);
    }
  };

  const selectedPrompt = prompts.find(p => p.id === selectedPromptId);

  return (
    <div className="flex h-full bg-slate-50">
       <CreatePromptModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
       <GlobalFilterSidebar title="Prompts" activeGroup={activeCategory} setActiveGroup={setActiveCategory} isMobileOpen={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} />
       
       <div className={`flex-1 flex flex-col min-w-0 h-full ${selectedPromptId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 md:p-8 flex-1 flex flex-col h-full overflow-hidden">
             <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                   <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden p-2 bg-white border rounded-lg"><Icons.Layout /></button>
                   <h2 className="text-2xl font-bold text-slate-900">Prompts</h2>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-blue-700 transition"><Icons.Plus /> New</button>
             </header>

             <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {loading ? <div className="text-center text-slate-400 mt-10">Loading...</div> : filtered.map(prompt => (
                   <div 
                      key={prompt.id} 
                      onClick={() => setSelectedPromptId(prompt.id)}
                      className={`bg-white p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${selectedPromptId === prompt.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}
                   >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                           <span className={`px-2 py-0.5 rounded text-xs font-bold ${getCategoryColor(prompt.category)}`}>{prompt.category}</span>
                           <h3 className="font-bold text-slate-800">{prompt.title}</h3>
                        </div>
                        {prompt.isFavorite && <div className="text-red-500"><Icons.Heart filled /></div>}
                      </div>
                      <p className="text-slate-500 text-sm line-clamp-2 mb-3 font-mono bg-slate-50 p-2 rounded">{prompt.content}</p>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                         <div className="flex gap-2">
                            {prompt.tags?.map(t => <span key={t}>#{t}</span>)}
                         </div>
                         <span>{formatDate(prompt.updatedAt)}</span>
                      </div>
                   </div>
                ))}
                {filtered.length === 0 && !loading && <div className="text-center text-slate-400 mt-10 italic">No prompts found in this category.</div>}
             </div>
          </div>
       </div>

       {/* Detail Pane (Desktop: Side / Mobile: Full) */}
       {selectedPrompt && (
          <div className="fixed inset-0 z-50 bg-white md:static md:w-[500px] md:border-l border-slate-200 flex flex-col h-full shadow-2xl md:shadow-none">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                   <button onClick={() => setSelectedPromptId(null)} className="md:hidden p-2 -ml-2 text-slate-500"><Icons.ArrowLeft /></button>
                   <span className={`px-2 py-1 rounded text-xs font-bold ${getCategoryColor(selectedPrompt.category)}`}>{selectedPrompt.category}</span>
                </div>
                <div className="flex gap-1">
                   <button onClick={() => toggleFavorite('prompts', selectedPrompt.id, selectedPrompt.isFavorite)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"><Icons.Heart filled={selectedPrompt.isFavorite} /></button>
                   <button onClick={() => handleDelete(selectedPrompt.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"><Icons.Trash /></button>
                   <button onClick={() => setSelectedPromptId(null)} className="hidden md:block p-2 text-slate-400 hover:text-slate-600"><Icons.X /></button>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedPrompt.title}</h2>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-sm text-slate-700 whitespace-pre-wrap mb-6 relative group">
                   {selectedPrompt.content}
                   <button 
                      onClick={() => navigator.clipboard.writeText(selectedPrompt.content)}
                      className="absolute top-2 right-2 p-2 bg-white border border-slate-200 rounded text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition"
                      title="Copy"
                   >
                      <Icons.Copy />
                   </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                   {selectedPrompt.tags?.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">#{tag}</span>
                   ))}
                </div>
                <div className="text-xs text-slate-400 border-t border-slate-100 pt-4">
                   Last updated: {formatDate(selectedPrompt.updatedAt)}
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

const FrameworksView = ({ selectedFrameworkId, setSelectedFrameworkId }: any) => {
  const { frameworks, loading } = useFrameworks();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const filtered = frameworks.filter(f => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Favorites') return f.isFavorite;
    return f.category === activeCategory;
  });

  const handleDelete = async (id: string) => {
    if (confirm("Delete this framework?")) {
      await deleteDoc(doc(db, 'frameworks', id));
      if (selectedFrameworkId === id) setSelectedFrameworkId(null);
    }
  };

  const selectedFramework = frameworks.find(f => f.id === selectedFrameworkId);

  return (
    <div className="flex h-full bg-slate-50">
       <CreateFrameworkModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
       <GlobalFilterSidebar title="Frameworks" activeGroup={activeCategory} setActiveGroup={setActiveCategory} isMobileOpen={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} />
       
       <div className={`flex-1 flex flex-col min-w-0 h-full ${selectedFrameworkId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 md:p-8 flex-1 flex flex-col h-full overflow-hidden">
             <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                   <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden p-2 bg-white border rounded-lg"><Icons.Layout /></button>
                   <h2 className="text-2xl font-bold text-slate-900">Frameworks</h2>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-blue-700 transition"><Icons.Plus /> New</button>
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
                      <p className="text-slate-500 text-sm mb-3">{fw.description}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-2 rounded">
                          <span className="font-bold text-slate-600">{fw.steps.length} Steps</span>
                          <span>•</span>
                          <div className="flex gap-2">
                            {fw.tags?.map(t => <span key={t}>#{t}</span>)}
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>

       {selectedFramework && (
          <div className="fixed inset-0 z-50 bg-white md:static md:w-[500px] md:border-l border-slate-200 flex flex-col h-full shadow-2xl md:shadow-none">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                   <button onClick={() => setSelectedFrameworkId(null)} className="md:hidden p-2 -ml-2 text-slate-500"><Icons.ArrowLeft /></button>
                   <span className={`px-2 py-1 rounded text-xs font-bold ${getCategoryColor(selectedFramework.category)}`}>{selectedFramework.category}</span>
                </div>
                <div className="flex gap-1">
                   <button onClick={() => toggleFavorite('frameworks', selectedFramework.id, selectedFramework.isFavorite)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"><Icons.Heart filled={selectedFramework.isFavorite} /></button>
                   <button onClick={() => handleDelete(selectedFramework.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"><Icons.Trash /></button>
                   <button onClick={() => setSelectedFrameworkId(null)} className="hidden md:block p-2 text-slate-400 hover:text-slate-600"><Icons.X /></button>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedFramework.title}</h2>
                <p className="text-slate-600 mb-6">{selectedFramework.description}</p>
                
                <h3 className="font-bold text-slate-400 uppercase text-xs mb-3 tracking-wider">Process Steps</h3>
                <div className="space-y-4 mb-6">
                    {selectedFramework.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-sm">{idx + 1}</div>
                            <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-800 text-sm">
                                {step}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                   {selectedFramework.tags?.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">#{tag}</span>
                   ))}
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

const AssetsView = () => {
    const { assets, loading } = useAssets();
    const { collections } = useAssetCollections();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [activeGroup, setActiveGroup] = useState('All');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const { user } = useAuth();

    const handleCreateCollection = async () => { const t = prompt("Name:"); if (t && user) await addDoc(collection(db, 'collections'), { title: t, userId: user.uid, createdAt: serverTimestamp() }); };
    const handleDeleteAsset = async (asset: Asset) => { if (confirm("Delete?")) { try { await deleteObject(ref(storage, asset.storagePath)); await deleteDoc(doc(db, 'assets', asset.id)); setSelectedAsset(null); } catch (e) { console.error(e); } } };

    const filtered = assets.filter(a => {
        if (activeGroup === 'All') return true;
        if (activeGroup === 'Favorites') return a.isFavorite;
        const isCat = CATEGORIES.some(c => c.id === activeGroup);
        if (isCat) return a.category === activeGroup;
        return a.collectionId === activeGroup;
    });

    return (
        <div className="flex h-full bg-slate-50">
            <UploadAssetModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
            {selectedAsset && <ImageLightbox asset={selectedAsset} onClose={() => setSelectedAsset(null)} />}
            <GlobalFilterSidebar title="Assets" activeGroup={activeGroup} setActiveGroup={setActiveGroup} collections={collections} onCreateCollection={handleCreateCollection} showCollections={true} isMobileOpen={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0 h-full">
                <div className="p-4 md:p-8 flex-1 flex flex-col h-full overflow-hidden">
                    <header className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden p-2 bg-white border rounded-lg"><Icons.Layout /></button><h2 className="text-2xl font-bold text-slate-900">Assets</h2></div><button onClick={() => setIsUploadModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Icons.Upload /> Upload</button></header>
                    <div className="flex-1 overflow-y-auto">{loading ? <div className="text-center text-slate-400 mt-10">Loading...</div> : <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{filtered.map(a => (<div key={a.id} onClick={() => setSelectedAsset(a)} className="group relative aspect-square bg-slate-200 rounded-xl overflow-hidden cursor-pointer"><img src={a.fileUrl} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-2"><div className="text-white text-xs font-bold truncate">{a.title}</div><div className="flex justify-end gap-2 mt-1"><button onClick={(e) => { e.stopPropagation(); toggleFavorite('assets', a.id, a.isFavorite); }} className="text-white hover:text-red-400"><Icons.Heart filled={a.isFavorite} /></button><button onClick={(e) => { e.stopPropagation(); handleDeleteAsset(a); }} className="text-white hover:text-red-400"><Icons.Trash /></button></div></div></div>))}</div>}</div>
                </div>
            </div>
        </div>
    );
};

const WorkflowsView = () => {
    const { workflows, loading } = useWorkflows();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const filtered = workflows.filter(w => { if (activeCategory === 'Favorites') return w.isFavorite; return activeCategory === 'All' || w.category === activeCategory; });
    const handleDelete = async (id: string) => { if(confirm("Delete?")) await deleteDoc(doc(db, 'workflows', id)); };

    return (
        <div className="flex h-full bg-slate-50">
            <CreateWorkflowModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
            <GlobalFilterSidebar title="Workflows" activeGroup={activeCategory} setActiveGroup={setActiveCategory} isMobileOpen={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0 h-full">
                <div className="p-4 md:p-8 flex-1 flex flex-col h-full overflow-hidden">
                    <header className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden p-2 bg-white border rounded-lg"><Icons.Layout /></button><h2 className="text-2xl font-bold text-slate-900">Workflows</h2></div><button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Icons.Plus /> New</button></header>
                    <div className="flex-1 overflow-y-auto space-y-4">{filtered.map(flow => (<div key={flow.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"><div className="flex justify-between items-start mb-3"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${getCategoryColor(flow.category).replace('text-', 'bg-').split(' ')[0]}`}><Icons.Workflows /></div><div><h3 className="font-bold text-slate-900">{flow.title}</h3><p className="text-sm text-slate-500">{flow.goal}</p></div></div><div className="flex gap-2"><button onClick={() => toggleFavorite('workflows', flow.id, flow.isFavorite)} className="text-slate-300 hover:text-red-500"><Icons.Heart filled={flow.isFavorite} /></button><button onClick={() => handleDelete(flow.id)} className="text-slate-300 hover:text-red-500"><Icons.Trash /></button></div></div><div className="bg-slate-50 p-3 rounded flex items-center gap-4 text-sm text-slate-600"><span className="flex items-center gap-1"><Icons.Prompts /> Ingredient</span><Icons.ArrowLeft /><span className="flex items-center gap-1">Method <Icons.Shield /></span></div></div>))}</div>
                </div>
            </div>
        </div>
    );
};

const App = () => {
  const { user, loading, signOut } = useAuth();
  const [view, setView] = useState('dashboard');
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHealthCheckOpen, setIsHealthCheckOpen] = useState(false);

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-slate-400">Loading Vault...</div>;
  if (!user) return <LoginView />;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <HealthCheckModal isOpen={isHealthCheckOpen} onClose={() => setIsHealthCheckOpen(false)} />
      <Sidebar view={view} setView={setView} user={user} signOut={signOut} isOpen={isMenuOpen} closeMenu={() => setIsMenuOpen(false)} onRunDiagnostics={() => setIsHealthCheckOpen(true)} />
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <MobileHeader onMenuClick={() => setIsMenuOpen(true)} />
        <main className="flex-1 overflow-hidden relative">
            {view === 'dashboard' && <DashboardView setView={setView} setSelectedPromptId={setSelectedPromptId} />}
            {view === 'prompts' && <PromptsView selectedPromptId={selectedPromptId} setSelectedPromptId={setSelectedPromptId} />}
            {view === 'frameworks' && <FrameworksView selectedFrameworkId={selectedFrameworkId} setSelectedFrameworkId={setSelectedFrameworkId} />}
            {view === 'assets' && <AssetsView />}
            {view === 'workflows' && <WorkflowsView />}
        </main>
        <GlobalAIAssistant />
      </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<AuthProvider><App /></AuthProvider>);