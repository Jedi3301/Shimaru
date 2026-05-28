import { Settings, Bell, Shield } from "lucide-react";

export default function SettingsView() {
  return (
    <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-500" /> Settings</h2>
      <div className="space-y-4">
        <div><label className="block text-sm font-medium text-gray-700">Display Name</label><input className="w-full bg-white/50 border border-white/60 rounded-xl p-3" /></div>
        <button className="w-full bg-indigo-600 text-white rounded-full py-2">Save Changes</button>
      </div>
    </div>
  );
}