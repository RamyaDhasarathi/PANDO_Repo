"use client";

import { useState } from "react";

import Image from "next/image";
import styles from "@/app/auth.module.css";

export default function AuthForm({ mode, onSwitchMode, onClose }) {
  const isSignUp = mode === "sign-up";
  const [method, setMethod] = useState("mobile");
  const [step, setStep] = useState("contact");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);

  function handleContinue(e) {
    e.preventDefault();
    if (step === "contact") setStep("otp");
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

        {step === "contact" ? (
          <form onSubmit={handleContinue}>
            <div className={styles.methodToggle}>
              <button
                type="button"
                className={`${styles.methodBtn} ${method === "mobile" ? styles.methodBtnActive : ""}`}
                onClick={() => setMethod("mobile")}
              >
                Mobile Number
              </button>
              <button
                type="button"
                className={`${styles.methodBtn} ${method === "email" ? styles.methodBtnActive : ""}`}
                onClick={() => setMethod("email")}
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
                {method === "mobile" && <span className={styles.prefix}>+971</span>}
                <input
                  id="contact"
                  className={styles.input}
                  type={method === "mobile" ? "tel" : "email"}
                  placeholder={method === "mobile" ? "50 123 4567" : "you@example.com"}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="hp-btn hp-btn-primary" style={{ width: "100%", padding: 14 }}>
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => e.preventDefault()}>
            <div className={styles.field}>
              <label className={styles.label}>Enter the 4-digit code sent to {contact || "your number"}</label>
              <div className={styles.otpRow}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    className={styles.otpDigit}
                    value={digit}
                    maxLength={1}
                    inputMode="numeric"
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                  />
                ))}
              </div>
            </div>
            <button type="submit" className="hp-btn hp-btn-primary" style={{ width: "100%", padding: 14 }}>
              Verify &amp; Continue
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
              <button type="button" onClick={() => onSwitchMode("sign-in")} className={styles.switchLink} style={{background: 'none', border: 'none', padding: 0, cursor: 'pointer'}}>
                Sign in
              </button>
            </>
          ) : (
            <>
              New to Hi Pando?{" "}
              <button type="button" onClick={() => onSwitchMode("sign-up")} className={styles.switchLink} style={{background: 'none', border: 'none', padding: 0, cursor: 'pointer'}}>
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
