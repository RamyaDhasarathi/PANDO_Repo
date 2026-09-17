"use client";

import { useState, useEffect } from "react";
import styles from "./ProfilePopup.module.css";
import { useAuth } from "@/providers/AuthProvider";

export default function ProfilePopup({ onClose }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("favorites"); // 'favorites' or 'preferences'
  
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
      // Optional: show a small success toast/message here
    } catch (err) {
      console.error("Failed to save preferences", err);
    } finally {
      setSavingPrefs(false);
    }
  };

  if (!user) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={styles.header}>
          <div className={styles.avatar}>
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h3 className={styles.name}>{user.name || "Buyer"}</h3>
            <p className={styles.contact}>{user.phoneNumber || user.email}</p>
          </div>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'favorites' ? styles.active : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            Saved ({favorites.length})
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'preferences' ? styles.active : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            AI Preferences
          </button>
        </div>

        <div className={styles.section}>
          {activeTab === 'favorites' ? (
            <div className={styles.favoritesList}>
              {loadingFavorites ? (
                <p className={styles.emptyState}>Loading...</p>
              ) : favorites.length === 0 ? (
                <p className={styles.emptyState}>No saved properties yet. Start exploring!</p>
              ) : (
                favorites.map((prop) => (
                  <div key={prop.id} className={styles.favoriteItem}>
                    <img src={prop.image} alt={prop.name} className={styles.favoriteImage} />
                    <div className={styles.favoriteInfo}>
                      <h5 className={styles.favoriteName}>{prop.name}</h5>
                      <p className={styles.favoritePrice}>
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
                <p className={styles.emptyState}>Loading preferences...</p>
              ) : (
                <>
                  <div className={styles.formGroup}>
                    <label>Purchasing Goal</label>
                    <select 
                      value={preferences.purchasingGoal} 
                      onChange={(e) => setPreferences({...preferences, purchasingGoal: e.target.value})}
                    >
                      <option value="">Select your goal...</option>
                      <option value="End-User">End-User (Looking for a home)</option>
                      <option value="Investor">Investor (Yield & ROI)</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Budget Range</label>
                    <select 
                      value={preferences.budgetRange} 
                      onChange={(e) => setPreferences({...preferences, budgetRange: e.target.value})}
                    >
                      <option value="">Select your budget...</option>
                      <option value="Under AED 50M">Under AED 50M</option>
                      <option value="AED 50M - 80M">AED 50M - 80M</option>
                      <option value="AED 80M+">AED 80M+</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Preferred Typology</label>
                    <select 
                      value={preferences.preferredTypology} 
                      onChange={(e) => setPreferences({...preferences, preferredTypology: e.target.value})}
                    >
                      <option value="">Select property type...</option>
                      <option value="Villa">Villa / Mansion</option>
                      <option value="Penthouse">Penthouse</option>
                      <option value="Apartment">Luxury Apartment</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Top Location</label>
                    <select 
                      value={preferences.preferredLocations} 
                      onChange={(e) => setPreferences({...preferences, preferredLocations: e.target.value})}
                    >
                      <option value="">Select a location...</option>
                      <option value="Palm Jumeirah">Palm Jumeirah</option>
                      <option value="Dubai Hills Estate">Dubai Hills Estate</option>
                      <option value="Dubai Marina">Dubai Marina</option>
                      <option value="Downtown Dubai">Downtown Dubai</option>
                    </select>
                  </div>

                  <button 
                    className={styles.saveButton} 
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

        <div className={styles.footer}>
          <button onClick={() => { logout(); onClose(); }} className={styles.logoutButton}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
