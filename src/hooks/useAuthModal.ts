import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const MySwal = withReactContent(Swal);

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
          
          document.getElementById('btn-submit')?.addEventListener('click', () => {
            if (mode === 'login') {
                if (emailEl.value && passEl.value) {
                    Swal.showLoading();
                    signInWithEmailAndPassword(auth, emailEl.value, passEl.value)
                        .then(() => { Swal.fire('نجاح', 'تم تسجيل الدخول', 'success'); })
                        .catch(() => Swal.fire('خطأ', 'بيانات الدخول خاطئة', 'error'));
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
                        .catch((err) => Swal.fire('خطأ', err.message, 'error'));
                } else {
                    Swal.showValidationMessage('الرجاء إدخال جميع الحقول المطلوبة');
                }
            }
          });

          if (mode === 'login') {
              document.getElementById('btn-reset')?.addEventListener('click', async () => {
                Swal.close();
                const { value: emailToReset } = await Swal.fire({
                  title: 'استعادة كلمة المرور',
                  input: 'email',
                  inputPlaceholder: 'بريدك الإلكتروني...',
                  confirmButtonText: 'إرسال',
                  cancelButtonText: 'إلغاء',
                  showCancelButton: true,
                  customClass: { popup: 'rounded-3xl' }
                });
                if (emailToReset) {
                  sendPasswordResetEmail(auth, emailToReset)
                    .then(() => Swal.fire('تم', 'أرسلنا رابط الاستعادة لإيميلك', 'success'))
                    .catch((err) => Swal.fire('خطأ', err.message, 'error'));
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
