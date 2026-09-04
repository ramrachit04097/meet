import React from 'react';
import { LogOut, X } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="logout-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="logout-modal-dialog"
        className="w-full max-w-sm bg-[#181133] border border-violet-800/40 rounded-2xl shadow-2xl p-6 text-white relative animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-violet-400/60 hover:text-white p-1 rounded-lg hover:bg-violet-800/30 transition"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Sign Out</h3>
            <p className="text-xs text-violet-300/70">Confirm session termination</p>
          </div>
        </div>

        <p className="text-sm text-violet-200/90 leading-relaxed mb-6">
          Are you sure you want to log out{userName ? `, ${userName}` : ''}? You will need to sign in again with your credentials to access your workspace.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            id="logout-cancel-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#221747] hover:bg-[#2c1e5c] text-violet-200 text-xs font-semibold transition border border-violet-800/30 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="logout-confirm-btn"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition shadow-lg shadow-rose-950/40 cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};
