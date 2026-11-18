import React, { useState } from 'react';
import { Lock, X, Check, KeyRound, Sparkles } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passcode.trim().toLowerCase();
    // Accepted passwords: 'tanar', 'admin', 'gyakorlatias'
    if (clean === 'tanar' || clean === 'admin' || clean === 'gyakorlatias') {
      onSuccess();
      onClose();
      setPasscode('');
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-medium text-slate-900 tracking-tight">Tanári Hozzáférés</h3>
              <p className="text-[11px] text-slate-500 font-medium">Csak a csoport vezetőjének / tanárának</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Az <strong>AI Kvízkészítő</strong> a diákok elől rejtve marad, hogy ők csak a zavartalan heti tesztelést lássák.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tanári jelszó
            </label>
            <input
              type="password"
              placeholder="Írd be a jelszót..."
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError(false);
              }}
              autoFocus
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm focus:outline-emerald-500 font-semibold"
            />
            {error && (
              <span className="text-xs text-rose-600 font-bold block mt-1">
                Hibás tanári jelszó! Kérlek ellenőrizd a megadott kódot.
              </span>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm flex items-center justify-center space-x-2 transition shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Belépés Tanári Módba</span>
          </button>
        </form>
      </div>
    </div>
  );
};
