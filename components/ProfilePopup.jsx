"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/providers/AuthProvider";

export default function ProfilePopup({ onClose }) {
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("favorites"); // 'favorites' or 'preferences'

  useEffect(() => {
    setMounted(true);
  }, []);

  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const [preferences, setPreferences] = useState({
    purchasingGoal: "",
    budgetRange: "",
    preferredTypology: "",
    preferredLocations: "",
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(false);

  useEffect(() => {
    async function loadFavorites() {
      try {
        const res = await fetch('/api/favorites');
        const data = await res.json();
        if (data.success && data.properties) {
          setFavorites(data.properties);
        }
      } catch (err) {
        console.error("Failed to fetch favorites", err);
      } finally {
        setLoadingFavorites(false);
      }
    }
    
    async function loadPreferences() {
      setLoadingPrefs(true);
      try {
        const res = await fetch('/api/buyer/profile');
        const data = await res.json();
        if (data.success && data.profile) {
          setPreferences({
            purchasingGoal: data.profile.purchasingGoal || "",
            budgetRange: data.profile.budgetRange || "",
            preferredTypology: data.profile.preferredTypology || "",
            preferredLocations: data.profile.preferredLocations?.[0] || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch preferences", err);
      } finally {
        setLoadingPrefs(false);
      }
    }

    if (user) {
      loadFavorites();
      loadPreferences();
    }
  }, [user]);

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await fetch('/api/buyer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchasingGoal: preferences.purchasingGoal,
          budgetRange: preferences.budgetRange,
          preferredTypology: preferences.preferredTypology,
          preferredLocations: preferences.preferredLocations ? [preferences.preferredLocations] : [],
        }),
      });
    } catch (err) {
      console.error("Failed to save preferences", err);
    } finally {
      setSavingPrefs(false);
    }
  };

  if (!user || !mounted) return null;

  const content = (
    <div className="fixed inset-0 w-screen h-screen bg-black/50 backdrop-blur-[6px] z-[99999] flex justify-end items-start pt-[75px] pr-[24px] pb-[24px] box-border" onClick={onClose}>
      <div className="bg-white w-full max-w-[390px] max-h-[calc(100vh-100px)] overflow-y-auto rounded-[18px] shadow-[0_25px_60px_rgba(0,0,0,0.3)] p-[24px] relative flex flex-col gap-[20px] animate-[slideIn_0.25s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="absolute top-[16px] right-[16px] bg-[#f3f4f6] border-none w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer text-[#4b5563] transition-colors duration-200 hover:bg-[#e5e7eb]" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="flex items-center gap-[16px] pb-[20px] border-b border-[#f3f4f6]">
          <div className="w-[50px] h-[50px] bg-[#e11d48] text-white rounded-full flex items-center justify-center text-[20px] font-bold">
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h3 className="m-0 text-[18px] font-bold text-[#111827]">{user.name || "Buyer"}</h3>
            <p className="mt-[4px] text-[13px] text-[#6b7280]">{user.phoneNumber || user.email}</p>
          </div>
        </div>

        <div className="flex gap-[8px] mb-[16px] bg-[#f9fafb] p-[4px] rounded-[10px]">
          <button 
            className={`flex-1 py-[8px] px-[12px] border-none rounded-[6px] text-[13px] font-semibold cursor-pointer transition-all duration-200 ${activeTab === 'favorites' ? 'bg-white text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'bg-transparent text-[#6b7280]'}`}
            onClick={() => setActiveTab('favorites')}
          >
            Saved ({favorites.length})
          </button>
          <button 
            className={`flex-1 py-[8px] px-[12px] border-none rounded-[6px] text-[13px] font-semibold cursor-pointer transition-all duration-200 ${activeTab === 'preferences' ? 'bg-white text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'bg-transparent text-[#6b7280]'}`}
            onClick={() => setActiveTab('preferences')}
          >
            AI Preferences
          </button>
        </div>

        <div>
          {activeTab === 'favorites' ? (
            <div className="flex flex-col gap-[12px] max-h-[300px] overflow-y-auto pr-[4px]">
              {loadingFavorites ? (
                <p className="text-[14px] text-[#9ca3af] text-center py-[20px]">Loading...</p>
              ) : favorites.length === 0 ? (
                <p className="text-[14px] text-[#9ca3af] text-center py-[20px]">No saved properties yet. Start exploring!</p>
              ) : (
                favorites.map((prop) => (
                  <div key={prop.id} className="flex gap-[12px] p-[10px] rounded-[12px] bg-[#f9fafb] border border-[#f3f4f6] transition-all duration-200 cursor-pointer hover:bg-white hover:border-[#e11d48] hover:shadow-[0_4px_12px_rgba(225,29,72,0.1)]">
                    <img src={prop.image} alt={prop.name} className="w-[60px] h-[60px] rounded-[8px] object-cover" />
                    <div className="flex flex-col justify-center">
                      <h5 className="m-0 mb-[4px] text-[14px] font-semibold text-[#111827] line-clamp-1">{prop.name}</h5>
                      <p className="m-0 text-[13px] font-bold text-[#e11d48]">
                        {new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(prop.price)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div>
              {loadingPrefs ? (
                <p className="text-[14px] text-[#9ca3af] text-center py-[20px]">Loading preferences...</p>
              ) : (
                <>
                  <div className="flex flex-col gap-[6px] mb-[12px]">
                    <label className="text-[11px] font-bold text-[#4b5563] uppercase tracking-[0.05em]">Purchasing Goal</label>
                    <select 
                      value={preferences.purchasingGoal} 
                      onChange={(e) => setPreferences({...preferences, purchasingGoal: e.target.value})}
                      className="px-[12px] py-[10px] border border-[#e5e7eb] rounded-[8px] text-[13px] text-[#111827] bg-white outline-none cursor-pointer focus:border-[#e11d48]"
                    >
                      <option value="">Select your goal...</option>
                      <option value="End-User">End-User (Looking for a home)</option>
                      <option value="Investor">Investor (Yield & ROI)</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-[6px] mb-[12px]">
                    <label className="text-[11px] font-bold text-[#4b5563] uppercase tracking-[0.05em]">Budget Range</label>
                    <select 
                      value={preferences.budgetRange} 
                      onChange={(e) => setPreferences({...preferences, budgetRange: e.target.value})}
                      className="px-[12px] py-[10px] border border-[#e5e7eb] rounded-[8px] text-[13px] text-[#111827] bg-white outline-none cursor-pointer focus:border-[#e11d48]"
                    >
                      <option value="">Select your budget...</option>
                      <option value="Under AED 50M">Under AED 50M</option>
                      <option value="AED 50M - 80M">AED 50M - 80M</option>
                      <option value="AED 80M+">AED 80M+</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-[6px] mb-[12px]">
                    <label className="text-[11px] font-bold text-[#4b5563] uppercase tracking-[0.05em]">Preferred Typology</label>
                    <select 
                      value={preferences.preferredTypology} 
                      onChange={(e) => setPreferences({...preferences, preferredTypology: e.target.value})}
                      className="px-[12px] py-[10px] border border-[#e5e7eb] rounded-[8px] text-[13px] text-[#111827] bg-white outline-none cursor-pointer focus:border-[#e11d48]"
                    >
                      <option value="">Select property type...</option>
                      <option value="Villa">Villa / Mansion</option>
                      <option value="Penthouse">Penthouse</option>
                      <option value="Apartment">Luxury Apartment</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-[6px] mb-[12px]">
                    <label className="text-[11px] font-bold text-[#4b5563] uppercase tracking-[0.05em]">Top Location</label>
                    <select 
                      value={preferences.preferredLocations} 
                      onChange={(e) => setPreferences({...preferences, preferredLocations: e.target.value})}
                      className="px-[12px] py-[10px] border border-[#e5e7eb] rounded-[8px] text-[13px] text-[#111827] bg-white outline-none cursor-pointer focus:border-[#e11d48]"
                    >
                      <option value="">Select a location...</option>
                      <option value="Palm Jumeirah">Palm Jumeirah</option>
                      <option value="Dubai Hills Estate">Dubai Hills Estate</option>
                      <option value="Dubai Marina">Dubai Marina</option>
                      <option value="Downtown Dubai">Downtown Dubai</option>
                    </select>
                  </div>

                  <button 
                    className="w-full p-[12px] bg-[#111827] text-white border-none rounded-[8px] font-semibold text-[14px] cursor-pointer mt-[8px] transition-colors duration-200 hover:bg-[#1f2937] disabled:bg-[#9ca3af] disabled:cursor-not-allowed" 
                    onClick={handleSavePreferences}
                    disabled={savingPrefs}
                  >
                    {savingPrefs ? "Saving..." : "Save Preferences"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="pt-[16px] border-t border-[#f3f4f6]">
          <button onClick={() => { logout(); onClose(); }} className="w-full p-[12px] bg-white border border-[#e5e7eb] rounded-[8px] text-[#374151] font-semibold text-[14px] cursor-pointer transition-colors duration-200 hover:bg-[#f3f4f6] hover:text-[#111827]">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
