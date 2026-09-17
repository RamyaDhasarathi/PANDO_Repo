"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "@/app/auth.module.css";

import { useAuth } from "@/providers/AuthProvider";

export default function AuthForm({ mode, onSwitchMode, onClose }) {
  const isSignUp = mode === "sign-up";
  const router = useRouter();
  const { login } = useAuth();
  const [method, setMethod] = useState("mobile");
  const [step, setStep] = useState("contact");
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+971");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devMode, setDevMode] = useState(false);

  async function handleContinue(e) {
    e.preventDefault();
    setError("");

    // --- Dev Mode Bypass ---
    if (devMode) {
      if (!contact) {
        setError("Please enter a contact detail to bypass");
        return;
      }
      setLoading(true);
      try {
        const cleanNumber = contact.replace(/\D/g, "");
        const fullNumber = `${countryCode}${cleanNumber}`;
        const payload = {
          contact: method === "mobile" ? fullNumber : contact,
          isEmail: method === "email",
          code: "000000",
          name: isSignUp ? name : undefined,
          devMode: true
        };
        
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        
        if (data.success) {
          await login();
          onClose();
          router.refresh();
        } else {
          setError(data.error || "Failed to bypass OTP");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }
    // --- End Dev Mode Bypass ---

    if (method === "mobile") {
      const cleanNumber = contact.replace(/\D/g, "");
      if (countryCode === "+971" && cleanNumber.length !== 9) {
        setError("UAE mobile number must be 9 digits (e.g. 50 123 4567)");
        return;
      }
      if (countryCode === "+91" && cleanNumber.length !== 10) {
        setError("India mobile number must be 10 digits");
        return;
      }

      setLoading(true);
      try {
        const fullNumber = `${countryCode}${cleanNumber}`;
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact: fullNumber, isEmail: false }),
        });
        const data = await res.json();
        
        if (data.success) {
          setStep("otp");
        } else {
          setError(data.error || "Failed to send OTP");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      if (!/^\S+@\S+\.\S+$/.test(contact)) {
        setError("Please enter a valid email address");
        return;
      }
      
      setLoading(true);
      try {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact, isEmail: true }),
        });
        const data = await res.json();
        
        if (data.success) {
          setStep("otp");
        } else {
          setError(data.error || "Failed to send OTP");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    
    if (code.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const cleanNumber = contact.replace(/\D/g, "");
      const fullNumber = `${countryCode}${cleanNumber}`;
      
      const payload = {
        contact: method === "mobile" ? fullNumber : contact,
        isEmail: method === "email",
        code,
        name: isSignUp ? name : undefined
      };
      
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (data.success) {
        await login(); // Refresh the auth state
        onClose();
        router.refresh();
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index, value) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < otp.length - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  const handleContactChange = (e) => {
    let val = e.target.value;
    if (method === "mobile") {
      val = val.replace(/[^\d\s]/g, ""); // Allow only digits and spaces
    }
    setContact(val);
  };

  const handleSwitchMode = (newMode) => {
    setStep("contact");
    setOtp(["", "", "", "", "", ""]);
    setError("");
    onSwitchMode(newMode);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.wrap} onClick={(e) => e.stopPropagation()}>
        <div className={styles.card}>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div className={styles.mark}>
            <Image src="/images/logo-mascot.png" alt="Hi Pando" width={44} height={44} />
          </div>
          <div className={styles.title}>{isSignUp ? "Create your account" : "Welcome back"}</div>
        <div className={styles.subtitle}>
          {isSignUp
            ? "Sign up to save properties and get personalised alerts."
            : "Sign in to continue exploring homes in Dubai."}
        </div>

        {error && (
          <div style={{ color: '#dc2626', fontSize: '14px', margin: '0 0 20px 0', textAlign: 'center', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', fontWeight: 500, wordBreak: 'break-word', lineHeight: '1.4' }}>
            {error}
          </div>
        )}

        {step === "contact" ? (
          <form onSubmit={handleContinue}>
            <div className={styles.methodToggle}>
              <button
                type="button"
                className={`${styles.methodBtn} ${method === "mobile" ? styles.methodBtnActive : ""}`}
                onClick={() => {
                  setMethod("mobile");
                  setContact("");
                  setError("");
                }}
              >
                Mobile Number
              </button>
              <button
                type="button"
                className={`${styles.methodBtn} ${method === "email" ? styles.methodBtnActive : ""}`}
                onClick={() => {
                  setMethod("email");
                  setContact("");
                  setError("");
                }}
              >
                Email
              </button>
            </div>

            {isSignUp && (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">
                  Full Name
                </label>
                <div className={styles.inputRow}>
                  <input
                    id="name"
                    className={styles.input}
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="contact">
                {method === "mobile" ? "Mobile Number" : "Email Address"}
              </label>
              <div className={styles.inputRow}>
                {method === "mobile" && (
                  <select 
                    value={countryCode} 
                    onChange={(e) => setCountryCode(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', padding: '0 8px', color: '#666', fontWeight: 500, fontSize: '15px', cursor: 'pointer' }}
                  >
                    <option value="+971">+971 (UAE)</option>
                    <option value="+91">+91 (IND)</option>
                  </select>
                )}
                <input
                  id="contact"
                  className={styles.input}
                  type={method === "mobile" ? "tel" : "email"}
                  placeholder={method === "mobile" ? (countryCode === "+971" ? "50 123 4567" : "98765 43210") : "you@example.com"}
                  value={contact}
                  onChange={handleContactChange}
                  pattern={method === "email" ? "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" : undefined}
                  title={method === "email" ? "Please enter a valid email address (e.g. you@example.com)" : undefined}
                  maxLength={method === "mobile" ? (countryCode === "+971" ? 9 : 10) : undefined}
                  required
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', background: '#f3f4f6', padding: '10px 14px', borderRadius: '8px' }}>
              <input 
                type="checkbox" 
                id="devModeToggle" 
                checked={devMode}
                onChange={(e) => setDevMode(e.target.checked)}
                style={{ accentColor: '#e11d48', cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="devModeToggle" style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', cursor: 'pointer', userSelect: 'none' }}>
                Dev Mode: Bypass OTP Verification
              </label>
            </div>

            <button type="submit" disabled={loading} className="hp-btn hp-btn-primary" style={{ width: "100%", padding: 14, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Processing..." : (devMode ? "Instant Sign In" : "Continue")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className={styles.field}>
              <label className={styles.label}>Enter the 6-digit code sent to {contact || "your number"}</label>
              <div className={styles.otpRow} style={{ gap: '6px' }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    className={styles.otpDigit}
                    style={{ padding: '0', width: '40px', height: '48px' }}
                    value={digit}
                    maxLength={1}
                    inputMode="numeric"
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                  />
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading} className="hp-btn hp-btn-primary" style={{ width: "100%", padding: 14, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
            <div className={styles.resend}>
              Didn&apos;t get a code?{" "}
              <button type="button" className={styles.resendLink} onClick={() => setStep("contact")}>
                Resend / Change details
              </button>
            </div>
          </form>
        )}

        <div className={styles.switchRow}>
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => handleSwitchMode("sign-in")} className={styles.switchLink} style={{background: 'none', border: 'none', padding: 0, cursor: 'pointer'}}>
                Sign in
              </button>
            </>
          ) : (
            <>
              New to Hi Pando?{" "}
              <button type="button" onClick={() => handleSwitchMode("sign-up")} className={styles.switchLink} style={{background: 'none', border: 'none', padding: 0, cursor: 'pointer'}}>
                Create an account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
