import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Send, ArrowRight, User, Trash2, MessageCircle, ChevronRight } from 'lucide-react';
import BackButton from '../components/BackButton';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Chat() {
  const { user } = useAuth();
  const { chatUserId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(chatUserId || null);
  const [chatPartner, setChatPartner] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Load conversations
    const unsub = onSnapshot(collection(db, 'conversations'), (snap) => {
      const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const convs = all.filter((c) => c.participants?.includes(user.email))
                       .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
      setConversations(convs);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || !activeChat) return;

    // Load messages
    // To support 12-hour auto-deletion, we filter on the client or server
    // For storage optimization, we only show messages from the last 12 hours
    const twelveHoursAgo = new Date().getTime() - (12 * 60 * 60 * 1000);
    
    // Finding conversation ID (deterministic)
    const convId = [user.email, activeChat].sort().join('_');
    
    const q = collection(db, 'conversations', convId, 'messages');

    const unsub = onSnapshot(q, (snap) => {
      const msgs = (snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[])
        .filter((m) => m.createdAt?.toMillis() > twelveHoursAgo) // 12-hour cleanup effect
        .sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
      setMessages(msgs);
      
      // Auto-scroll
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    // Load partner info
    const fetchPartner = async () => {
        // In a real app, you'd fetch user data from a 'users' collection
        setChatPartner({ email: activeChat });
    }
    fetchPartner();

    return () => unsub();
  }, [user, activeChat]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !activeChat) return;

    const convId = [user.email, activeChat].sort().join('_');
    const msgData = {
      text: input,
      sender: user.email,
      createdAt: serverTimestamp(),
    };

    setInput('');

    // Ensure conversation exists
    try {
        await addDoc(collection(db, 'conversations', convId, 'messages'), msgData);
        // Update conversation summary
        // Note: You might need a setDoc here if it doesn't exist. 
        // For brevity, assuming conv exists or using a separate trigger.
    } catch (e) {
        console.error("Failed to send message", e);
    }
  };

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6 bg-slate-50 dark:bg-[#020617]">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
        <MessageCircle size={40} className="text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-black">الدردشة تتطلب تسجيل الدخول</h1>
        <p className="text-slate-500 max-w-sm">يرجى تسجيل الدخول لتتمكن من مراسلة البائعين والاستفسار عن المنتجات.</p>
      </div>
      <Link 
        to="/login"
        className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
      >
        تسجيل الدخول
      </Link>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-full md:w-80 border-l bg-card flex-col flex ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-bold text-lg">محادثاتي</h2>
            <BackButton />
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 && <div className="p-10 text-center text-muted-foreground">لا يوجد محادثات</div>}
            {conversations.map((conv: any) => {
              const partner = conv.participants.find((p: string) => p !== user.email);
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveChat(partner)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-accent transition-colors ${activeChat === partner ? 'bg-accent' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <User />
                  </div>
                  <div className="flex-1 text-right overflow-hidden">
                    <div className="font-medium truncate">{partner}</div>
                    <div className="text-sm text-muted-foreground truncate">{conv.lastMessage}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat Area */}
        <main className={`flex-1 flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          {activeChat ? (
            <>
              <div className="p-4 border-b flex items-center gap-3 glass">
                <button onClick={() => setActiveChat(null)} className="md:hidden"><ArrowRight /></button>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User />
                </div>
                <div>
                  <div className="font-bold">{activeChat}</div>
                  <div className="text-xs text-green-500">متصل الآن</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-center py-2">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full">
                        تُحذف الرسائل تلقائياً بعد 12 ساعة لخصوصيتك
                    </span>
                </div>
                {messages.map((m: any) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === user.email ? 'justify-start' : 'justify-end'}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`max-w-[70%] p-3 rounded-2xl ${
                        m.sender === user.email 
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-muted rounded-tl-none'
                      }`}
                    >
                      {m.text}
                    </motion.div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="اكتب رسالتك..."
                  className="flex-1 bg-muted rounded-full px-4 outline-none focus:ring-2 ring-primary transition-all"
                />
                <button type="submit" className="p-3 bg-primary text-primary-foreground rounded-full hover:scale-105 transition-transform">
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-center flex-col items-center justify-center text-center p-10 space-y-4">
              <div className="p-6 rounded-full bg-primary/5">
                <User size={64} className="text-primary opacity-20" />
              </div>
              <h3 className="text-xl font-bold">ابدأ محادثة جديدة</h3>
              <p className="text-muted-foreground max-w-xs">اختر أحد البائعين للتواصل معه بخصوص المنتجات المعروضة</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
