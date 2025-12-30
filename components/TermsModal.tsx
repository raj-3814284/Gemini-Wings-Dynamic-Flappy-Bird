
import React from 'react';

interface TermsModalProps {
  isOpen: boolean;
  onAgree: () => void;
  onCancel: () => void;
  accentColor: string;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onAgree, onCancel, accentColor }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-slate-900 rounded-full border border-white/10 flex items-center justify-center text-4xl shadow-xl">
          🎨
        </div>
        
        <div className="mt-8 text-center space-y-6">
          <h2 className="text-3xl font-black italic uppercase tracking-tight">
            Creative <span style={{ color: accentColor }}>Guidelines</span>
          </h2>
          
          <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
            <p className="bg-white/5 p-4 rounded-2xl border border-white/5 italic">
              "By uploading an image, you agree to transform your flight experience while respecting our sky."
            </p>
            
            <div className="text-left space-y-3">
              <div className="flex gap-3">
                <div className="text-green-400 mt-1"><i className="fa-solid fa-check-circle"></i></div>
                <p>This feature is strictly for <span className="text-white font-black underline decoration-2" style={{ textDecorationColor: accentColor }}>FOR FUN PURPOSES</span> only.</p>
              </div>
              
              <div className="flex gap-3">
                <div className="text-red-400 mt-1"><i className="fa-solid fa-circle-xmark"></i></div>
                <p>Users are strictly prohibited from using <span className="text-red-400 font-black uppercase tracking-wider">Unconcerned or Inappropriate images</span> that may be offensive to others.</p>
              </div>
              
              <div className="flex gap-3">
                <div className="text-blue-400 mt-1"><i className="fa-solid fa-shield-halved"></i></div>
                <p>You retain ownership of your image, but you are responsible for the content you choose to display.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button 
              onClick={onAgree}
              className="w-full py-4 rounded-full font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-lg"
              style={{ backgroundColor: accentColor, color: '#000' }}
            >
              I AGREE & FLY
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-2 text-slate-500 hover:text-white font-bold transition-colors uppercase text-xs tracking-widest"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
