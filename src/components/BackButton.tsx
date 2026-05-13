import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function BackButton({ className = "" }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate(-1)}
      className={`flex items-center gap-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all font-bold text-sm ${className}`}
      dir="rtl"
    >
      <ChevronRight size={18} />
      <span>رجوع</span>
    </button>
  );
}
