import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { MessageCircle, CornerDownRight, Trash2, Send } from "lucide-react";

export default function ProductComments({ productId, productOwner }: { productId: string, productOwner: string }) {
    const { user } = useAuth();
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");

    useEffect(() => {
        if (!productId) return;
        const q = collection(db, `products/${productId}/comments`);
        const unsub = onSnapshot(q, (snap) => {
            const data: any[] = [];
            snap.forEach(d => data.push({ id: d.id, ...d.data() }));
            data.sort((a, b) => (a.date || 0) - (b.date || 0));
            setComments(data);
            setLoading(false);
        });
        return () => unsub();
    }, [productId]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            Swal.fire("تنبيه", "سجل دخولك لتتمكن من التعليق", "warning");
            return;
        }
        if (!newComment.trim()) return;

        try {
            await addDoc(collection(db, `products/${productId}/comments`), {
                text: newComment.trim(),
                user: user.email,
                date: new Date().getTime(),
                replies: []
            });
            setNewComment("");
            
            if (user.email !== productOwner) {
                await addDoc(collection(db, "notifications"), {
                    user: productOwner,
                    title: "تعليق جديد",
                    body: `قام ${user.email} بالتعليق على إعلانك.`,
                    date: new Date().getTime(),
                    read: false,
                    type: "comments"
                });
            }
        } catch (error) {
            Swal.fire("خطأ", "لم نتمكن من إضافة التعليق", "error");
        }
    };

    const handleAddReply = async (e: React.FormEvent, commentId: string, commentOwner: string) => {
        e.preventDefault();
        if (!user) {
            Swal.fire("تنبيه", "سجل دخولك لتتمكن من التعليق", "warning");
            return;
        }
        if (!replyText.trim()) return;

        try {
            await updateDoc(doc(db, `products/${productId}/comments`, commentId), {
                replies: arrayUnion({
                    text: replyText.trim(),
                    user: user.email,
                    date: new Date().getTime(),
                    id: Math.random().toString(36).substring(7)
                })
            });
            setReplyingTo(null);
            setReplyText("");

            if (user.email !== commentOwner) {
                await addDoc(collection(db, "notifications"), {
                    user: commentOwner,
                    title: "رد جديد",
                    body: `قام ${user.email} بالرد على تعليقك.`,
                    date: new Date().getTime(),
                    read: false,
                    type: "comments"
                });
            }
        } catch (error) {
            Swal.fire("خطأ", "لم نتمكن من إضافة الرد", "error");
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await deleteDoc(doc(db, `products/${productId}/comments`, commentId));
        } catch (error) {
            Swal.fire("خطأ", "حدث خطأ أثناء الحذف", "error");
        }
    };

    return (
        <div className="mt-8 border-t border-slate-100 pt-6">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 text-lg mb-6">
                <MessageCircle className="w-6 h-6 text-accent" /> التعليقات والتواصل
            </h4>

            {loading ? (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {comments.length === 0 ? (
                        <p className="text-slate-500 text-center bg-slate-50 p-6 rounded-2xl border border-slate-100">لا توجد تعليقات حتى الآن. كن أول من يعلق!</p>
                    ) : (
                        comments.map(c => (
                            <div key={c.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-slate-700">{c.user}</span>
                                        <span className="text-xs text-slate-400">
                                            {new Date(c.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {user?.email === c.user && (
                                        <button onClick={() => handleDeleteComment(c.id)} className="text-slate-400 hover:text-rose-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-slate-800 text-sm mt-2">{c.text}</p>
                                
                                <div className="mt-3">
                                    <button 
                                        onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                                        className="text-accent text-xs font-bold hover:underline"
                                    >
                                        رد
                                    </button>
                                </div>

                                {/* Replies */}
                                {c.replies && c.replies.length > 0 && (
                                    <div className="mt-4 space-y-3 pr-4 border-r-2 border-slate-200">
                                        {c.replies.map((r: any) => (
                                            <div key={r.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative">
                                                <CornerDownRight className="w-4 h-4 text-slate-300 absolute -right-6 top-3" />
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xs text-slate-700">{r.user}</span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(r.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-slate-700 text-xs mt-1">{r.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Reply Input */}
                                {replyingTo === c.id && (
                                    <form onSubmit={(e) => handleAddReply(e, c.id, c.user)} className="mt-3 flex gap-2 w-full animate-in fade-in zoom-in-95">
                                        <input 
                                            autoFocus
                                            type="text" 
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            placeholder="اكتب ردك..." 
                                            className="flex-1 text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-accent text-right"
                                        />
                                        <button type="submit" className="bg-accent text-white p-3 rounded-xl hover:bg-accent/90 transition shadow-md shadow-accent/20">
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </form>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Main Comment Input */}
            <form onSubmit={handleAddComment} className="mt-6 flex gap-2">
                <input 
                    type="text" 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="اكتب تعليقك هنا..." 
                    className="flex-1 p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-accent text-right text-sm"
                />
                <button type="submit" className="bg-slate-800 text-white p-3 rounded-xl hover:bg-slate-700 transition shadow-md shadow-slate-800/20">
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}
