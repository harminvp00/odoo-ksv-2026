import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/20 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-premium transform transition-all duration-350 scale-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <h3 className="font-semibold text-neutral-900 text-sm">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-900 transition">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

