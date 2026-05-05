import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { Star, MessageSquare } from 'lucide-react';

export default function SellerReviews({ sellerEmail, currentUserEmail }: { sellerEmail: string, currentUserEmail?: string | null }) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sellerEmail) return;
        const q = query(
            collection(db, "userReviews"),
            where("seller", "==", sellerEmail)
        );
        const unsub = onSnapshot(q, (snap) => {
            const revs: any[] = [];
            snap.forEach(d => revs.push({ id: d.id, ...d.data() }));
            revs.sort((a, b) => b.date - a.date);
            setReviews(revs);
            setLoading(false);
        });
        return () => unsub();
    }, [sellerEmail]);

    const averageRating = reviews.length > 0 
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
        : 0;

    const handleAddReview = async () => {
        if (!currentUserEmail) {
            Swal.fire("تنبيه", "سجل دخولك لتتمكن من تقييم البائع", "warning");
            return;
        }
        if (currentUserEmail === sellerEmail) {
            Swal.fire("عذراً", "لا يمكنك تقييم نفسك", "error");
            return;
        }

        const { value: formValues } = await Swal.fire({
            title: 'تقييم البائع',
            html: `
                <div class="flex flex-col gap-3 text-right" dir="rtl">
                    <label class="block text-sm font-bold text-slate-700">التقييم (من 1 إلى 5)</label>
                    <select id="swal-rating" class="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-400 text-right bg-white mb-3 text-lg">
                        <option value="5">⭐⭐⭐⭐⭐ ممتاز</option>
                        <option value="4">⭐⭐⭐⭐ جيد جداً</option>
                        <option value="3">⭐⭐⭐ جيد</option>
                        <option value="2">⭐⭐ مقبول</option>
                        <option value="1">⭐ سيء</option>
                    </select>
                    <label class="block text-sm font-bold text-slate-700 mt-2">تعليق (اختياري)</label>
                    <textarea id="swal-comment" class="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-400 text-right min-h-[100px] m-0" placeholder="اكتب تجربتك مع البائع..."></textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'إرسال التقييم',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                return {
                    rating: parseInt((document.getElementById('swal-rating') as HTMLSelectElement).value),
                    comment: (document.getElementById('swal-comment') as HTMLTextAreaElement).value
                }
            }
        });

        if (formValues) {
            try {
                // optionally check if user already reviewed
                const existing = reviews.find(r => r.user === currentUserEmail);
                if (existing) {
                    Swal.fire('تنبيه', 'لقد قمت بتقييم هذا البائع مسبقاً', 'warning');
                    return;
                }

                await addDoc(collection(db, "userReviews"), {
                    seller: sellerEmail,
                    user: currentUserEmail,
                    rating: formValues.rating,
                    comment: formValues.comment,
                    date: new Date().getTime()
                });
                Swal.fire('شكراً لك', 'تم إضافة تقييمك بنجاح', 'success');
            } catch (error) {
                console.error("Error adding review: ", error);
                Swal.fire('خطأ', 'حدث خطأ أثناء إضافة التقييم', 'error');
            }
        }
    };

    return (
        <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                    <Star className="w-6 h-6 text-amber-400 fill-amber-400" /> تقييمات البائع
                </h4>
                <button 
                    onClick={handleAddReview}
                    className="text-sm bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-5 rounded-xl transition shadow-md shadow-amber-500/20"
                >
                    إضافة تقييم للبائع
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
                </div>
            ) : reviews.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100">
                    <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium text-lg">لا توجد تقييمات لهذا البائع حتى الآن</p>
                    <p className="text-slate-400 text-sm mt-1">كن أول من يقيم البائع بعد التعامل معه!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 border border-amber-100 shadow-sm">
                        <div className="bg-amber-400 text-white font-black text-4xl h-20 w-20 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                            {averageRating}
                        </div>
                        <div className="text-center sm:text-right flex-1">
                            <p className="font-bold text-slate-800 text-2xl mb-1">التقييم العام للبائع</p>
                            <p className="text-slate-500 font-medium mb-3">بناءً على {reviews.length} من التقييمات</p>
                            <div className="flex justify-center sm:justify-start gap-1 text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-5 h-5 ${i < Math.round(Number(averageRating)) ? 'fill-current' : 'text-amber-100'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {reviews.map(review => (
                            <div key={review.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-100'}`} />
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                        {new Date(review.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                                {review.comment ? (
                                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{review.comment}</p>
                                ) : (
                                    <p className="text-slate-400 text-sm italic">ابدى تقييمه بدون تعليق</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
