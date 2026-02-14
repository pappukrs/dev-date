"use client";

export default function DatingToggle({ enabled, onToggle }: { enabled: boolean; onToggle: (val: boolean) => void }) {
    return (
        <div className="flex items-center gap-3">
            <span className={`text-sm font-bold ${!enabled ? 'text-white' : 'text-gray-500'}`}>Dashboard</span>
            <button
                onClick={() => onToggle(!enabled)}
                className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${enabled ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
                <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${enabled ? 'translate-x-6' : 'translate-x-0'}`}
                />
            </button>
            <span className={`text-sm font-bold ${enabled ? 'text-purple-400' : 'text-gray-500'}`}>Dating Mode</span>
        </div>
    );
}
