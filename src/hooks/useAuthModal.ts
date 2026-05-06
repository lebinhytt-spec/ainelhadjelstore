import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Capacitor } from '@capacitor/core';

const MySwal = withReactContent(Swal);

const getLocalError = (err: any) => {
    const msg = String(err?.message || err);
    if (msg.includes('user-not-found')) return 'البريد الإلكتروني غير مسجل';
    if (msg.includes('wrong-password') || msg.includes('invalid-credential')) return 'كلمة المرور خاطئة';
    if (msg.includes('email-already-in-use')) return 'البريد الإلكتروني مستخدم مسبقاً';
    if (msg.includes('invalid-email')) return 'البريد الإلكتروني غير صالح';
    if (msg.includes('weak-password')) return 'كلمة المرور ضعيفة جداً';
    if (msg.includes('too-many-requests')) return 'محاولات كثيرة للتو، يرجى المحاولة لاحقاً';
    if (msg.includes('popup-closed-by-user')) return 'تم إغلاق نافذة تسجيل الدخول';
    return 'حدث خطأ، يرجى المحاولة مرة أخرى';
};

export function useAuthModal() {
  const openAuthModal = () => {
    let mode = 'login';
    const showModal = () => {
      MySwal.fire({
        title: 'مرحباً بك في عين الحجل',
        html: `
          <div class="flex flex-col gap-4 mt-4">
            <div class="flex border-b border-slate-200 mb-2">
                <button id="tab-login" class="flex-1 pb-2 font-bold transition-all ${mode === 'login' ? 'border-b-2 border-accent text-accent' : 'text-slate-400 border-transparent'}">تسجيل الدخول</button>
                <button id="tab-register" class="flex-1 pb-2 font-bold transition-all ${mode === 'register' ? 'border-b-2 border-accent text-accent' : 'text-slate-400 border-transparent'}">حساب جديد</button>
            </div>
            
            <input id="auth-em" type="email" class="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-right transition-all" placeholder="البريد الإلكتروني" dir="rtl">
            <input id="auth-pa" type="password" class="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-right transition-all" placeholder="كلمة المرور" dir="rtl">
            
            ${mode === 'register' ? `
                <input id="reg-name" type="text" class="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-right transition-all animate-in fade-in slide-in-from-top-2" placeholder="الاسم الكامل" dir="rtl">
                <input id="reg-phone" type="tel" class="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-right transition-all animate-in fade-in slide-in-from-top-2" placeholder="رقم الهاتف الأساسي" dir="ltr">
                <select id="reg-lang" class="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-right bg-white transition-all animate-in fade-in slide-in-from-top-2" dir="rtl">
                    <option value="ar">العربية</option>
                    <option value="fr">الفرنسية (Français)</option>
                    <option value="en">الإنجليزية (English)</option>
                </select>
            ` : ''}

            <div class="flex gap-2 mt-4">
              <button id="btn-submit" class="flex-1 bg-gradient-to-r from-accent to-orange-400 text-white py-3 px-4 rounded-xl font-black hover:opacity-90 transition shadow-lg shadow-accent/30 tracking-wide text-lg">${mode === 'login' ? 'دخول' : 'إنشاء حساب'}</button>
            </div>
            
            ${mode === 'login' ? `<p id="btn-reset" class="text-slate-500 hover:text-accent cursor-pointer font-bold mt-2 hover:underline text-sm transition-colors">نسيت كلمة المرور؟</p>` : ''}
            
            ${(Capacitor.isNativePlatform() || window.innerWidth < 768) ? `
            <div class="mt-4 border-t border-slate-200 pt-4">
                <button id="btn-google" class="w-full flex items-center justify-center gap-2 bg-white text-slate-700 py-3 px-4 rounded-xl font-bold border border-slate-300 hover:bg-slate-50 transition shadow-sm">
                    <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="none" d="M1 1h22v22H1z"/></svg>
                    المتابعة باستخدام جوجل
                </button>
            </div>
            ` : ''}
          </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'إلغاء',
        customClass: { popup: 'rounded-3xl p-6' },
        didOpen: () => {
          document.getElementById('tab-login')?.addEventListener('click', () => { mode = 'login'; showModal(); });
          document.getElementById('tab-register')?.addEventListener('click', () => { mode = 'register'; showModal(); });

          const emailEl = document.getElementById('auth-em') as HTMLInputElement;
          const passEl = document.getElementById('auth-pa') as HTMLInputElement;
          
          document.getElementById('btn-google')?.addEventListener('click', () => {
              Swal.showLoading();
              const provider = new GoogleAuthProvider();
              signInWithPopup(auth, provider).then(async (result) => {
                  try {
                      await setDoc(doc(db, "users", result.user.email!), {
                          name: result.user.displayName || "مستخدم جديد",
                          registrationDate: new Date().getTime()
                      }, { merge: true });
                  } catch(e) {}
                  Swal.fire('نجاح', 'تم تسجيل الدخول بنجاح', 'success');
              }).catch(err => Swal.fire('خطأ', getLocalError(err), 'error'));
          });

          document.getElementById('btn-submit')?.addEventListener('click', () => {
            if (mode === 'login') {
                if (emailEl.value && passEl.value) {
                    Swal.showLoading();
                    signInWithEmailAndPassword(auth, emailEl.value, passEl.value)
                        .then(() => { Swal.fire('نجاح', 'تم تسجيل الدخول', 'success'); })
                        .catch((err) => Swal.fire('خطأ', getLocalError(err), 'error'));
                } else {
                    Swal.showValidationMessage('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
                }
            } else {
                const nameEl = document.getElementById('reg-name') as HTMLInputElement;
                const phoneEl = document.getElementById('reg-phone') as HTMLInputElement;
                const langEl = document.getElementById('reg-lang') as HTMLSelectElement;

                if (emailEl.value && passEl.value && nameEl.value) {
                    Swal.showLoading();
                    createUserWithEmailAndPassword(auth, emailEl.value, passEl.value)
                        .then(async (userCred) => {
                            await setDoc(doc(db, "users", userCred.user.email!), {
                                name: nameEl.value,
                                phone: phoneEl.value,
                                lang: langEl.value,
                                registrationDate: new Date().getTime()
                            });
                            Swal.fire('نجاح', 'تم إنشاء الحساب بنجاح', 'success');
                        })
                        .catch((err) => Swal.fire('خطأ', getLocalError(err), 'error'));
                } else {
                    Swal.showValidationMessage('الرجاء إدخال جميع الحقول المطلوبة');
                }
            }
          });

          if (mode === 'login') {
              document.getElementById('btn-reset')?.addEventListener('click', async () => {
                const { value: emailToReset } = await Swal.fire({
                  title: 'استعادة كلمة المرور',
                  input: 'email',
                  inputPlaceholder: 'أدخل بريدك الإلكتروني...',
                  confirmButtonText: 'إرسال الرابط',
                  cancelButtonText: 'إلغاء',
                  showCancelButton: true,
                  customClass: { popup: 'rounded-3xl' },
                  inputValidator: (value) => {
                    if (!value) {
                      return 'الرجاء إدخال البريد الإلكتروني';
                    }
                  }
                });
                
                if (emailToReset) {
                  Swal.showLoading();
                  sendPasswordResetEmail(auth, emailToReset)
                    .then(() => {
                        Swal.fire('تم بنجاح!', 'تم إرسال رابط تحديث كلمة المرور إلى بريدك الإلكتروني. الرجاء التحقق من صندوق الوارد (أو الرسائل غير المرغوب فيها).', 'success');
                    })
                    .catch((err) => Swal.fire('خطأ', getLocalError(err), 'error'));
                } else {
                    // if user canceled, re-open auth modal
                    showModal();
                }
              });
          }
        }
      });
    };
    showModal();
  };

  return { openAuthModal };
}
