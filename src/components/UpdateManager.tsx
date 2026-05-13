import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Capacitor } from "@capacitor/core";
import { Download, AlertCircle, X, ShieldCheck } from "lucide-react";

// Current local version code of this app build.
// Every time a new APK is generated, this should be incremented if we want users to update.
export const APP_VERSION_CODE = 1;

export default function UpdateManager() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateData, setUpdateData] = useState<{
    versionCode: number;
    forceUpdate: boolean;
    releaseNotes: string;
    downloadLink: string;
  } | null>(null);

  useEffect(() => {
    // Check if it's a mobile device (Android/iOS browser or WebView) or a native Capacitor app
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || Capacitor.isNativePlatform();
    // For testing purposes in a web browser, you can append ?test_update=true to the URL
    const isTestMode = window.location.search.includes('test_update=true');
    if (!isMobile && !isTestMode) return;

    const unsub = onSnapshot(doc(db, "global_settings", "app"), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const serverVersionCode = data.versionCode || 1;
        const githubRepo = data.githubRepo || "lebinhytt-spec/ainelhadjelstore";
        
        if (serverVersionCode > APP_VERSION_CODE) {
          let finalDownloadLink = data.downloadLink || "";
          
          // Try to get link from GitHub if not provided explicitly
          if (!finalDownloadLink) {
              try {
                  const res = await fetch(`https://api.github.com/repos/${githubRepo}/releases/latest`);
                  const release = await res.json();
                  const apk = release.assets?.find((a: any) => a.name.endsWith(".apk"));
                  if (apk) finalDownloadLink = apk.browser_download_url;
                  else finalDownloadLink = release.html_url;
              } catch(e) {}
          }

          setUpdateData({
            versionCode: serverVersionCode,
            forceUpdate: true, // Always forced as requested
            releaseNotes: data.releaseNotes || 'إصدار جديد متوفر مع تحسينات ومميزات لخدمتكم بشكل أفضل.',
            downloadLink: finalDownloadLink
          });
          setShowUpdate(true);
        } else {
          setShowUpdate(false);
        }
      }
    });

    return () => unsub();
  }, []);

  if (!showUpdate || !updateData || !updateData.downloadLink) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 flex flex-col items-center justify-center text-white relative">
          {!updateData.forceUpdate && (
            <button 
              onClick={() => setShowUpdate(false)}
              className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 p-2 rounded-full transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-900/20">
            <Download className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-black mb-1">تحديث جديد متوفر!</h2>
          <p className="text-blue-100 text-sm opacity-90 mx-auto text-center">
            نسخة جديدة من التطبيق اصبحت متاحة الان لتقديم تجربة افضل لك.
          </p>
        </div>
        
        <div className="p-6">
          {updateData.releaseNotes && (
            <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> 
                ميزات التحديث:
              </h3>
              <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{updateData.releaseNotes}</p>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            <a 
              href={updateData.downloadLink}
              onClick={async () => {
                try {
                  const { increment, setDoc, doc } = await import('firebase/firestore');
                  await setDoc(doc(db, "global_settings", "stats"), { appDownloads: increment(1) }, { merge: true });
                } catch(e) {}
              }}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition active:scale-95 text-lg"
            >
              <Download className="w-5 h-5" />
              تحديث التطبيق الان
            </a>
            
            {!updateData.forceUpdate && (
              <button 
                onClick={() => setShowUpdate(false)}
                className="w-full bg-white text-slate-500 font-bold py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              >
                تحديث لاحقاً
              </button>
            )}
            {updateData.forceUpdate && (
              <p className="text-center text-xs text-rose-500 font-medium flex items-center justify-center gap-1 mt-2">
                <AlertCircle className="w-4 h-4 mt-0.5" /> 
                هذا التحديث إجباري للإستمرار في استخدام التطبيق
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
