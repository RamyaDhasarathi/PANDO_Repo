"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/AuthProvider";

export default function AuthForm({ mode, onSwitchMode, onClose, onSuccess }) {
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
          devMode: true,
          isSignUp
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
          onSuccess?.();
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
          body: JSON.stringify({ contact: fullNumber, isEmail: false, isSignUp }),
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
          body: JSON.stringify({ contact, isEmail: true, isSignUp }),
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
        name: isSignUp ? name : undefined,
        isSignUp
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
        onSuccess?.();
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]" onClick={onClose}>
      <div className="w-full max-w-md animate-[slideUpFade_0.4s_cubic-bezier(0.16,1,0.3,1)]" onClick={(e) => e.stopPropagation()}>
        <div className="w-full bg-white rounded-2xl shadow-lg p-8 relative">
          <button type="button" className="absolute top-[16px] right-[16px] w-[32px] h-[32px] flex items-center justify-center border-none bg-transparent text-hp-slate cursor-pointer rounded-full transition-all duration-200 hover:bg-black/5 hover:text-hp-charcoal" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center mb-4 mx-auto">
            <Image src="/images/logo-mascot.png" alt="Hi Pando" width={44} height={44} className="w-full h-full object-cover" />
          </div>
          <div className="text-3xl font-bold text-gray-900 text-center mb-2">{isSignUp ? "Welcome to Hi Pando" : "Welcome back"}</div>
          <div className="text-gray-500 text-sm text-center mb-8">
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
            <form onSubmit={handleContinue} className="space-y-6">
              <div className="flex bg-gray-100 rounded-full p-1 mb-6">
                <button
                  type="button"
                  className={`flex-1 border-none bg-transparent p-2 rounded-full font-bold text-sm cursor-pointer transition-colors ${method === "mobile" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
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
                  className={`flex-1 border-none bg-transparent p-2 rounded-full font-bold text-sm cursor-pointer transition-colors ${method === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    id="name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#d22c23] focus:border-transparent outline-none transition-all text-sm"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="contact">
                  {method === "mobile" ? "Mobile Number" : "Email Address"}
                </label>
                <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#d22c23] focus-within:border-transparent transition-all bg-white">
                  {method === "mobile" && (
                    <select 
                      value={countryCode} 
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="border-none bg-transparent outline-none text-gray-600 font-medium text-sm cursor-pointer pr-2"
                    >
                      <option value="+971">+971 (UAE)</option>
                      <option value="+91">+91 (IND)</option>
                    </select>
                  )}
                  <input
                    id="contact"
                    className="border-none bg-transparent outline-none w-full text-sm"
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
              
              <div className="flex items-center gap-2 mt-4 mb-2">
                <input
                  type="checkbox"
                  id="devMode"
                  checked={devMode}
                  onChange={(e) => setDevMode(e.target.checked)}
                  className="w-4 h-4 text-[#d22c23] border-gray-300 rounded focus:ring-[#d22c23] cursor-pointer"
                />
                <label htmlFor="devMode" className="text-sm text-gray-600 cursor-pointer font-medium select-none">
                  Dev Mode: Bypass OTP (Instantly sign in)
                </label>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#d22c23] hover:bg-[#b8261e] text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-70 mt-2">
                {loading ? "Processing..." : (devMode ? "Instant Sign In" : "Continue")}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Enter the 6-digit code sent to {contact || "your number"}
                </label>
                <div className="flex justify-center gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      className="w-12 h-14 text-center text-xl font-bold border border-gray-300 rounded-xl outline-none focus:border-transparent focus:ring-2 focus:ring-[#d22c23] transition-all"
                      value={digit}
                      maxLength={1}
                      inputMode="numeric"
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                    />
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#d22c23] hover:bg-[#b8261e] text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-70">
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
              <div className="text-center">
                <button type="button" className="text-[#d22c23] text-sm font-medium hover:underline bg-transparent border-none p-0 cursor-pointer" onClick={() => setStep("contact")}>
                  Change Phone Number
                </button>
              </div>
            </form>
          )}

          <div className="text-center mt-6 pt-6 border-t border-gray-100 text-sm text-gray-500">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => handleSwitchMode("sign-in")} className="text-[#d22c23] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer">
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to Hi Pando?{" "}
                <button type="button" onClick={() => handleSwitchMode("sign-up")} className="text-[#d22c23] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer">
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
