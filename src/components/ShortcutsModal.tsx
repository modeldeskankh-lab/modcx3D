import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'W', desc: 'Activate Move / Translation Gizmo' },
    { key: 'E', desc: 'Activate Rotate Gizmo' },
    { key: 'R', desc: 'Activate Scale Gizmo' },
    { key: 'F', desc: 'Focus Camera on Selected Object' },
    { key: 'Home', desc: 'Frame All Objects in Scene' },
    { key: 'Delete / Backspace', desc: 'Delete Selected Object' },
    { key: 'Ctrl + D', desc: 'Duplicate Selected Object' },
    { key: 'Ctrl + Z', desc: 'Undo Last Action' },
    { key: 'Ctrl + Shift + Z', desc: 'Redo Last Action' },
    { key: 'Left Click (on 3D Object)', desc: 'Select Object & Attach Gizmo' },
    { key: 'Left Click + Drag (Gizmo Axis)', desc: 'Move/Rotate/Scale along X, Y, or Z' },
    { key: 'Left Click + Drag (Empty Space)', desc: 'Orbit Camera' },
    { key: 'Right Click + Drag / Scroll', desc: 'Zoom Camera In/Out' },
    { key: 'Middle Click + Drag', desc: 'Pan Camera' },
    { key: 'W / A / S / D + Space (Play Mode)', desc: 'Move Player & Jump' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181a20] border border-[#333842] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-xs text-gray-200">
        <div className="px-4 py-3 bg-[#15171d] border-b border-[#282b33] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-cyan-400" />
            <span className="font-semibold text-white text-sm">Keyboard & Mouse Shortcuts</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#282c35] rounded text-gray-400 hover:text-white">
            <X size={15} />
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-2">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between py-1.5 border-b border-[#232731] last:border-0">
              <span className="text-gray-400">{s.desc}</span>
              <kbd className="px-2 py-0.5 bg-[#101216] border border-[#2d313b] rounded font-mono text-cyan-300 font-medium">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-4 py-2.5 bg-[#15171d] border-t border-[#282b33] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
