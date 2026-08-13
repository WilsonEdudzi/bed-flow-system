"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Activity, AlertTriangle, Users, CheckCircle2, Zap, ClipboardList,
  ArrowRight, Clock, BarChart3, LayoutGrid, TrendingUp,
  Lock, Mail, LogOut, ShieldCheck, Play, X, Brush, UserPlus,
  Search, Filter, ArrowRightLeft, Download, History, Sliders, Radio, User, UserCheck, Trash2
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8080/api"
    : "https://bed-flow-system.onrender.com/api"
);

const C = {
  bg: "#0F141C",
  surface: "#171E29",
  surfaceRaised: "#1F2836",
  border: "#2B3547",
  borderLight: "#3A4759",
  textPrimary: "#EAEEF3",
  textSecondary: "#93A0B4",
  textMuted: "#5E6B7F",
  accent: "#57C7BE",
  accentDim: "#2E6E68",
  accentBg: "rgba(87,199,190,0.12)",
  available: "#4CC988",      // Green
  occupied: "#7E8AA0",        // Slate Grey
  reserved: "#EFB94D",        // Amber/Yellow
  cleaning: "#38BDF8",        // Medical Cyan/Teal
  critical: "#F16456",        // Red
};

const FONT_DISPLAY = '"Space Grotesk", sans-serif';
const FONT_BODY = '"IBM Plex Sans", sans-serif';
const FONT_MONO = '"IBM Plex Mono", monospace';

const LEGEND = [
  { label: "Available", color: C.available },
  { label: "Occupied", color: C.occupied },
  { label: "Reserved", color: C.reserved },
  { label: "Cleaning / Turnover", color: C.cleaning },
  { label: "Isolation Flag", color: C.critical },
];

const TABS = [
  { id: "board", label: "Bed board", icon: LayoutGrid },
  { id: "allocate", label: "Allocate", icon: Zap },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "audit", label: "Audit log", icon: History },
  { id: "users", label: "Staff management", icon: Users },
];

const ALERT_THRESHOLD = 85;

const cardStyle = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 };

const inputStyle = {
  width: "100%",
  paddingTop: 10,
  paddingRight: 12,
  paddingBottom: 10,
  paddingLeft: 12,
  borderRadius: 8,
  background: C.surfaceRaised,
  border: `1px solid ${C.border}`,
  color: C.textPrimary,
  fontSize: 13.5,
  outline: "none",
  fontFamily: "inherit",
};

function tileColor(bed) {
  const status = (bed.status || "").toLowerCase();
  if (status === "occupied" && bed.isolation) return C.critical;
  if (status === "available") return C.available;
  if (status === "reserved") return C.reserved;
  if (status === "cleaning") return C.cleaning;
  return C.occupied;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: C.surfaceRaised, border: `1px solid ${C.borderLight}`, borderRadius: 8,
      padding: "8px 12px", fontFamily: FONT_MONO, fontSize: 12, color: C.textPrimary,
    }}>
      {label && <div style={{ color: C.textSecondary, marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => <div key={i}>{p.name}: {p.value}</div>)}
    </div>
  );
}

function StatBlock({ label, value, tone = "default" }) {
  const color = tone === "alert" ? C.critical : tone === "good" ? C.available : C.textPrimary;
  return (
    <div style={{ background: C.surface, padding: "14px 16px" }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.08em", color: C.textMuted, marginBottom: 6 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontWeight: 600, fontSize: 23, color }}>{value}</div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", color: C.textMuted, marginBottom: 6, textTransform: "uppercase" }}>
      {children}
    </div>
  );
}

function Badge({ children, tone = "default" }) {
  const map = {
    default: { color: C.textSecondary, background: C.surfaceRaised, border: `1px solid ${C.border}` },
    accent: { color: C.accent, background: C.accentBg, border: `1px solid ${C.accentDim}` },
    alert: { color: C.critical, background: "rgba(241,100,86,0.12)", border: "1px solid rgba(241,100,86,0.4)" },
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10.5, fontWeight: 600, letterSpacing: "0.03em",
      padding: "3px 9px", borderRadius: 20, fontFamily: FONT_MONO,
      ...map[tone],
    }}>{children}</span>
  );
}

function SectionHeading({ icon: Icon, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14, fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 13.5, letterSpacing: "0.02em" }}>
      <Icon size={15} color={C.accent} />{children}
    </div>
  );
}

function MiniBar({ label, value, max }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div style={{ flex: "1 1 100px", minWidth: 90 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: C.textMuted, marginBottom: 4, fontFamily: FONT_MONO, letterSpacing: "0.02em" }}>
        <span>{label}</span><span>{value}/{max}</span>
      </div>
      <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: C.accent, borderRadius: 2 }} />
      </div>
    </div>
  );
}

function BedTile({ bed, isSelected, onClick }) {
  const color = tileColor(bed);
  const label = bed.id.includes("-") ? bed.id.split("-")[1] : bed.id;
  const status = (bed.status || "").toLowerCase();

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative", aspectRatio: "1 / 1", borderRadius: 6,
        background: status === "available" ? "transparent" : `${color}26`,
        border: isSelected ? `2.5px solid ${C.accent}` : `1.5px solid ${color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all .15s ease",
        transform: isSelected ? "scale(1.12)" : "scale(1)",
        boxShadow: isSelected ? `0 0 12px ${C.accent}` : "none",
        zIndex: isSelected ? 5 : 1,
        cursor: "pointer"
      }}
    >
      <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: isSelected ? 700 : 400, color: status === "available" ? C.textMuted : C.textPrimary }}>
        {label}
      </span>

      {status === "occupied" && bed.isolation && (
        <span className="animate-pulse" style={{ position: "absolute", top: -3, right: -3, width: 6, height: 6, borderRadius: "50%", background: C.critical }} />
      )}
    </div>
  );
}

function ActionModal({ bed, availableBeds, onClose, onReserve, onAdmit, onCleaning, onFinishCleaning, onRelease, onTransfer }) {
  if (!bed) return null;
  const status = (bed.status || "").toLowerCase();
  const [transferTarget, setTransferTarget] = useState("");

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(11, 20, 16, 0.75)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, padding: 20
    }}>
      <div style={{
        background: C.surface, border: `1px solid ${C.borderLight}`,
        borderRadius: 14, width: "100%", maxWidth: 420, padding: 24,
        boxShadow: "0 16px 40px rgba(0,0,0,0.5)", fontFamily: FONT_BODY
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontFamily: FONT_DISPLAY, margin: 0, fontSize: 18, color: C.textPrimary }}>
              Bed {bed.id}
            </h3>
            <span style={{ fontSize: 12, color: C.textSecondary, textTransform: "uppercase", fontFamily: FONT_MONO }}>
              Current Status: <strong style={{ color: tileColor(bed) }}>{status}</strong>
            </span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {bed.patientName && (
          <div style={{ background: C.surfaceRaised, padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            <span style={{ color: C.textMuted, display: "block", fontSize: 11, fontFamily: FONT_MONO }}>PATIENT DETAILS</span>
            <strong style={{ color: C.textPrimary }}>{bed.patientName}</strong>
            {bed.acuity && <span style={{ color: C.textSecondary }}> · Acuity {bed.acuity}</span>}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {status === "available" && (
            <>
              <button
                onClick={() => onReserve(bed.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "11px", background: C.reserved, color: "#0B1410",
                  border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY
                }}
              >
                <UserPlus size={16} /> Reserve Bed Space
              </button>
              <button
                onClick={() => onCleaning(bed.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "11px", background: C.cleaning, color: "#0B1410",
                  border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY
                }}
              >
                <Brush size={16} /> Mark for Cleaning / Turnover
              </button>
            </>
          )}

          {status === "occupied" && (
            <>
              <div style={{ background: C.surfaceRaised, padding: 12, borderRadius: 8, border: `1px solid ${C.border}` }}>
                <FieldLabel>Transfer Patient To Available Bed</FieldLabel>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <select
                    value={transferTarget}
                    onChange={(e) => setTransferTarget(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 10, paddingRight: 10, paddingTop: 6, paddingBottom: 6 }}
                  >
                    <option value="">Select destination bed...</option>
                    {availableBeds.map(b => (
                      <option key={b.id} value={b.id}>{b.id} ({b.dept.toUpperCase()})</option>
                    ))}
                  </select>
                  <button
                    disabled={!transferTarget}
                    onClick={() => onTransfer(bed.id, transferTarget)}
                    style={{
                      background: transferTarget ? C.accent : C.surface,
                      color: transferTarget ? "#0B1410" : C.textMuted,
                      border: "none", borderRadius: 6, padding: "0 12px",
                      fontWeight: 700, cursor: transferTarget ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", gap: 4
                    }}
                  >
                    <ArrowRightLeft size={14} /> Transfer
                  </button>
                </div>
              </div>

              <button
                onClick={() => onCleaning(bed.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "11px", background: C.cleaning, color: "#0B1410",
                  border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY
                }}
              >
                <Brush size={16} /> Send Bed to Cleaning / Turnover
              </button>
              <button
                onClick={() => onRelease(bed.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "11px", background: C.critical, color: "#FFF",
                  border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY
                }}
              >
                Discharge Patient
              </button>
            </>
          )}

          {status === "reserved" && (
            <>
              <button
                onClick={() => onAdmit(bed.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "11px", background: C.available, color: "#0B1410",
                  border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY
                }}
              >
                <UserPlus size={16} /> Admit Reserved Patient
              </button>
              <button
                onClick={() => onRelease(bed.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "11px", background: C.surfaceRaised, color: C.textPrimary,
                  border: `1px solid ${C.borderLight}`, borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY
                }}
              >
                Cancel Reservation / Free Bed
              </button>
            </>
          )}

          {status === "cleaning" && (
            <button
              onClick={() => onFinishCleaning(bed.id)}
              style={{
                width: "100%", background: C.available, color: "#0B1410", border: "none",
                borderRadius: 8, padding: "11px", fontSize: 13, fontFamily: FONT_BODY,
                fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}
            >
              <CheckCircle2 size={16} /> Complete Cleaning & Set Available
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CandidateRow({ result, rank, recommended, onConfirm, departments }) {
  const { bed, total, specialty, acuityFit, loadBalance, bonus } = result;
  const deptObj = departments.find((d) => d.id === bed.dept) || { name: bed.dept };

  return (
    <div style={{
      border: `1px solid ${recommended ? C.accent : C.border}`,
      background: recommended ? C.accentBg : C.surfaceRaised,
      borderRadius: 10, padding: 16, marginBottom: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textMuted }}>#{rank}</span>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 16, color: C.textPrimary }}>{bed.id}</div>
            <div style={{ fontSize: 11.5, color: C.textSecondary }}>{deptObj.name}</div>
          </div>
          {recommended && <Badge tone="accent"><CheckCircle2 size={11} /> Recommended</Badge>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 23, color: recommended ? C.accent : C.textPrimary }}>{total}</div>
          <div style={{ fontSize: 9.5, color: C.textMuted, letterSpacing: "0.04em" }}>MATCH SCORE</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <MiniBar label="SPECIALTY" value={specialty} max={40} />
        <MiniBar label="ACUITY FIT" value={acuityFit} max={30} />
        <MiniBar label="LOAD BALANCE" value={loadBalance} max={20} />
        <MiniBar label="ISOLATION" value={bonus} max={10} />
      </div>
      <button onClick={onConfirm} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 7,
        cursor: "pointer", background: recommended ? C.accent : C.surfaceRaised,
        color: recommended ? "#0B1410" : C.textPrimary,
        border: recommended ? "none" : `1px solid ${C.borderLight}`,
        fontWeight: 600, fontSize: 12.5, fontFamily: FONT_BODY,
      }}>
        Assign to {bed.id} <ArrowRight size={13} />
      </button>
    </div>
  );
}

// --- SVG EYE ICON COMPONENT ---
function EyeIcon({ visible }) {
  return visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  );
}

// --- SVG BELL ICON COMPONENT ---
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  );
}

function LoginPage({ onLogin }) {
  const [role, setRole] = useState("admin"); // 'admin' | 'nurse'
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPass, setIsForgotPass] = useState(false);
  
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [nurseName, setNurseName] = useState("");
  const [nurseEmail, setNurseEmail] = useState("");
  const [ward, setWard] = useState("ER");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleResetForm = () => {
    setError("");
    setSuccess("");
    setUsername("");
    setPassword("");
    setNurseName("");
    setNurseEmail("");
    setRecoveryEmail("");
    setVerificationCode("");
    setNewPassword("");
    setRecoveryStep(1);
    setIsSendingCode(false);
  };

  const handleResendCode = async () => {
    setError("");
    setSuccess("");
    setIsSendingCode(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("A new verification code has been sent to your email.");
      } else {
        setError(data.message || "Failed to resend code.");
      }
    } catch (err) {
      setError("Unable to connect to Spring Boot server.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isForgotPass) {
      if (recoveryStep === 1) {
        if (!recoveryEmail) {
          setError("Please enter your Work Email or Hospital ID.");
          return;
        }

        setIsSendingCode(true);
        try {
          const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: recoveryEmail })
          });
          const data = await res.json();
          if (res.ok) {
            setSuccess(`Verification code sent to your email inbox!`);
            setRecoveryStep(2);
          } else {
            setError(data.message || "User not found.");
          }
        } catch (err) {
          setError("Unable to connect to Spring Boot server.");
        } finally {
          setIsSendingCode(false);
        }
        return;
      }

      if (recoveryStep === 2) {
        if (!verificationCode || !newPassword) {
          setError("Please provide both the 6-digit code and a new password.");
          return;
        }

        try {
          const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: recoveryEmail,
              code: verificationCode,
              newPassword: newPassword
            })
          });

          if (res.ok) {
            setSuccess("Password successfully updated! You can now log in.");
            setIsForgotPass(false);
            setUsername(recoveryEmail);
            setPassword("");
            setRecoveryStep(1);
          } else {
            const data = await res.json();
            setError(data.message || "Invalid or expired verification code.");
          }
        } catch (err) {
          setError("Password reset request failed.");
        }
        return;
      }
    }

    if (isRegistering) {
      if (!nurseName || !nurseEmail || !password) {
        setError("Please complete all registration fields.");
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: nurseEmail,
            password: password,
            fullName: nurseName,
            ward: ward
          })
        });

        const data = await res.json();

        if (res.ok) {
          setSuccess("Account successfully created! You can now log in.");
          setIsRegistering(false);
          setUsername(nurseEmail);
          setPassword("");
        } else {
          setError(data.message || "Registration failed.");
        }
      } catch (err) {
        setError("Unable to connect to Spring Boot auth server.");
      }
      return;
    }

    if (!username || !password) {
      setError("Please enter both credentials.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        onLogin({ role: data.role, username: data.username, fullName: data.fullName });
      } else {
        setError(data.message || "Invalid credentials.");
      }
    } catch (err) {
      setError("Unable to connect to Spring Boot auth server.");
    }
  };

  const handleDemoSignIn = () => {
    setError("");
    onLogin({ role: "Demo User", username: "demo_user", fullName: "Demo User" });
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", fontFamily: FONT_BODY, color: C.textPrimary
    }}>
      <div style={{
        background: C.surface, width: "100%", maxWidth: 440, borderRadius: 16,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.4)", border: `1px solid ${C.border}`, padding: "36px 32px"
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12, background: C.accentBg, border: `1px solid ${C.accentDim}`,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(87, 199, 190, 0.15)", marginBottom: 12
          }}>
            <Activity size={28} color={C.accent} strokeWidth={2.2} />
          </div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 24, color: C.textPrimary, margin: "4px 0" }}>
            BedFlow Portal
          </h2>
          <p style={{ fontSize: 13.5, color: C.textSecondary, margin: 0 }}>
            {isForgotPass 
              ? recoveryStep === 1 ? "Request Password Reset Code" : "Enter Verification Code"
              : isRegistering 
              ? "Create a Nurse Access Account" 
              : "Select your role to access clinical bed management"}
          </p>
        </div>

        {!isRegistering && !isForgotPass && (
          <div style={{ display: "flex", background: C.surfaceRaised, padding: 3, borderRadius: 10, marginBottom: 20, border: `1px solid ${C.border}` }}>
            <button
              type="button"
              onClick={() => { setRole("admin"); handleResetForm(); }}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                background: role === "admin" ? C.accent : "transparent",
                color: role === "admin" ? "#0B1410" : C.textSecondary,
                fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: FONT_BODY,
                transition: "all 0.2s"
              }}
            >
              Administrator
            </button>
            <button
              type="button"
              onClick={() => { setRole("nurse"); handleResetForm(); }}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                background: role === "nurse" ? C.accent : "transparent",
                color: role === "nurse" ? "#0B1410" : C.textSecondary,
                fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: FONT_BODY,
                transition: "all 0.2s"
              }}
            >
              Nurse
            </button>
          </div>
        )}

        {error && (
          <div style={{
            background: "rgba(241,100,86,0.12)", border: `1px solid ${C.critical}`, color: C.critical,
            padding: "10px 14px", borderRadius: 8, fontSize: 12.5, marginBottom: 18,
            display: "flex", alignItems: "center", gap: 8
          }}>
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        {success && (
          <div style={{
            background: "rgba(76,201,136,0.12)", border: `1px solid ${C.available}`, color: C.available,
            padding: "10px 14px", borderRadius: 8, fontSize: 12.5, marginBottom: 18,
            display: "flex", alignItems: "center", gap: 8
          }}>
            <CheckCircle2 size={15} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isForgotPass ? (
            recoveryStep === 1 ? (
              <div style={{ marginBottom: 20 }}>
                <FieldLabel>Work Email / Hospital ID</FieldLabel>
                <div style={{ position: "relative" }}>
                  <Mail size={16} color={C.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="nurse@hospital.org"
                    style={{ ...inputStyle, paddingLeft: 38 }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12, fontSize: 12, color: C.textSecondary, background: C.surfaceRaised, padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}` }}>
                  💡 Tip: If you don't see the code in your inbox, please check your <strong>spam or junk folder</strong>.
                </div>

                <div style={{ marginBottom: 16 }}>
                  <FieldLabel>6-Digit Verification Code</FieldLabel>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    style={{ ...inputStyle, letterSpacing: "0.25em", textAlign: "center", fontSize: 18, fontFamily: FONT_MONO }}
                  />
                  <div style={{ textAlign: "right", marginTop: 6 }}>
                    <button
                      type="button"
                      disabled={isSendingCode}
                      onClick={handleResendCode}
                      style={{ background: "transparent", border: "none", color: C.accent, fontSize: 11.5, cursor: "pointer", textDecoration: "underline", fontFamily: FONT_BODY }}
                    >
                      {isSendingCode ? "Resending..." : "Resend Code"}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <FieldLabel>Set New Password</FieldLabel>
                  <div style={{ position: "relative" }}>
                    <Lock size={16} color={C.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password..."
                      style={{ ...inputStyle, paddingLeft: 38, paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                        background: "transparent", border: "none", color: C.textMuted, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", padding: 4
                      }}
                      title={showNewPassword ? "Hide password" : "Show password"}
                    >
                      <EyeIcon visible={showNewPassword} />
                    </button>
                  </div>
                </div>
              </>
            )
          ) : isRegistering ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <FieldLabel>Full Name</FieldLabel>
                <div style={{ position: "relative" }}>
                  <User size={16} color={C.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    value={nurseName}
                    onChange={(e) => setNurseName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins, RN"
                    style={{ ...inputStyle, paddingLeft: 38 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <FieldLabel>Work Email / Hospital ID</FieldLabel>
                <div style={{ position: "relative" }}>
                  <Mail size={16} color={C.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="email"
                    value={nurseEmail}
                    onChange={(e) => setNurseEmail(e.target.value)}
                    placeholder="s.jenkins@hospital.org"
                    style={{ ...inputStyle, paddingLeft: 38 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <FieldLabel>Assigned Ward</FieldLabel>
                <select value={ward} onChange={(e) => setWard(e.target.value)} style={inputStyle}>
                  <option value="ER">Emergency Room (ER)</option>
                  <option value="ICU">Intensive Care Unit (ICU)</option>
                  <option value="MED">General Medical/Surgical</option>
                  <option value="PED">Pediatric Ward</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <FieldLabel>Password</FieldLabel>
                <div style={{ position: "relative" }}>
                  <Lock size={16} color={C.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ ...inputStyle, paddingLeft: 38, paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      background: "transparent", border: "none", color: C.textMuted, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", padding: 4
                    }}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <FieldLabel>{role === "admin" ? "Username" : "Nurse ID / Work Email"}</FieldLabel>
                <div style={{ position: "relative" }}>
                  <User size={16} color={C.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={role === "admin" ? "admin" : "nurse@hospital.org"}
                    style={{ ...inputStyle, paddingLeft: 38 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <FieldLabel>Password</FieldLabel>
                  {role === "nurse" && (
                    <button
                      type="button"
                      onClick={() => { setIsForgotPass(true); handleResetForm(); }}
                      style={{ background: "transparent", border: "none", color: C.accent, fontSize: 11, cursor: "pointer", textDecoration: "underline", fontFamily: FONT_BODY, marginTop: -6 }}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <Lock size={16} color={C.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ ...inputStyle, paddingLeft: 38, paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      background: "transparent", border: "none", color: C.textMuted, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", padding: 4
                    }}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
              </div>
            </>
          )}

          <button type="submit" disabled={isSendingCode} style={{
            width: "100%", padding: "12px 0", borderRadius: 8, border: "none",
            background: C.accent, color: "#0B1410", fontWeight: 700, fontSize: 14, cursor: "pointer",
            fontFamily: FONT_BODY, marginBottom: 12, marginTop: 8, opacity: isSendingCode ? 0.7 : 1
          }}>
            {isSendingCode 
              ? "Sending Code..." 
              : isForgotPass 
              ? recoveryStep === 1 ? "Send Verification Code" : "Verify Code & Reset Password"
              : isRegistering 
              ? "Register Account" 
              : `Sign In as ${role === "admin" ? "Administrator" : "Nurse"}`}
          </button>
        </form>

        <div style={{ textAlign: "center", marginBottom: 14 }}>
          {isForgotPass || isRegistering ? (
            <button
              type="button"
              onClick={() => { setIsRegistering(false); setIsForgotPass(false); handleResetForm(); }}
              style={{ background: "transparent", border: "none", color: C.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline", fontFamily: FONT_BODY }}
            >
              ← Back to Login Page
            </button>
          ) : (
            role === "nurse" && (
              <button
                type="button"
                onClick={() => { setIsRegistering(true); handleResetForm(); }}
                style={{ background: "transparent", border: "none", color: C.accent, fontSize: 12.5, cursor: "pointer", textDecoration: "underline", fontFamily: FONT_BODY }}
              >
                Don't have an account? Create Nurse Account
              </button>
            )
          )}
        </div>

        <button type="button" onClick={handleDemoSignIn} style={{
          width: "100%", padding: "11px 0", borderRadius: 8, border: `1px solid ${C.borderLight}`,
          background: C.surfaceRaised, color: C.textSecondary, fontWeight: 600, fontSize: 13,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: FONT_BODY
        }}>
          <Play size={14} color={C.accent} /> Quick Demo Access
        </button>

        <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${C.border}`, textAlign: "center", fontSize: 11.5, color: C.textMuted, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <ShieldCheck size={14} color={C.accent} /> Restricted to authorized clinical personnel
        </div>
      </div>
    </div>
  );
}

export default function BedFlowApp() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userSession, setUserSession] = useState(null);

  const [beds, setBeds] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [usersList, setUsersList] = useState([]);
  
  const [activeTab, setActiveTab] = useState("board");

  // Updated form state: removed dept, added clinicalCategory and age
  const [form, setForm] = useState({ name: "", acuity: 3, clinicalCategory: "general", age: 30, isolation: false });
  const [results, setResults] = useState(null); 
  const [successMsg, setSuccessMsg] = useState(null);
  const [now, setNow] = useState(null);
  const [historicalTrend, setHistoricalTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState(null);

  // --- NOTIFICATIONS STATE WITH ONE-WAY READ & MARK ALL AS READ ---
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // --- FEATURES STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [surgeMode, setSurgeMode] = useState(false);
  const [autoPoll, setAutoPoll] = useState(true);
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), timestamp: Date.now(), action: "SYSTEM INIT", details: "Connected to Spring Boot backend API." }
  ]);

  // Load session from sessionStorage immediately on mount to prevent flash
  useEffect(() => {
    const auth = sessionStorage.getItem("bedflow_auth") === "true";
    const user = sessionStorage.getItem("bedflow_user");
    const tab = sessionStorage.getItem("bedflow_active_tab");
    const notifs = sessionStorage.getItem("bedflow_notifications");

    if (auth && user) {
      setIsAuthenticated(true);
      try {
        setUserSession(JSON.parse(user));
      } catch (e) {
        setUserSession(null);
      }
    }
    if (tab) setActiveTab(tab);
    if (notifs) {
      try {
        setNotifications(JSON.parse(notifs));
      } catch (e) {}
    }
    setIsInitializing(false);
  }, []);

  // Global outside click listener to close notifications
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showNotifications && !e.target.closest(".notification-container")) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showNotifications]);

  // 2-Minute Auto-Clear Timer for Read Notifications and Audit Logs
  useEffect(() => {
    const interval = setInterval(() => {
      const nowTime = Date.now();
      
      // Clear notifications read > 2 mins ago
      setNotifications((prev) => {
        const filtered = prev.filter((n) => {
          if (n.unread) return true;
          return nowTime - (n.readAt || nowTime) < 120000;
        });
        if (filtered.length !== prev.length) {
          sessionStorage.setItem("bedflow_notifications", JSON.stringify(filtered));
        }
        return filtered;
      });

      // Clear audit logs older than 2 minutes
      setAuditLogs((prev) =>
        prev.filter((log) => {
          if (!log.timestamp) return true;
          return nowTime - log.timestamp < 120000;
        })
      );
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const addNotification = (title, desc) => {
    const newNotif = {
      id: Date.now(),
      title,
      desc,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: true,
      readAt: null
    };
    setNotifications((prev) => {
      const updated = [newNotif, ...prev];
      sessionStorage.setItem("bedflow_notifications", JSON.stringify(updated));
      return updated;
    });
  };

  const markAsRead = (id) => {
    setNotifications((prev) => {
      const updated = prev.map(n => {
        if (n.id === id && n.unread) {
          return {
            ...n,
            unread: false,
            readAt: Date.now()
          };
        }
        return n;
      });
      sessionStorage.setItem("bedflow_notifications", JSON.stringify(updated));
      return updated;
    });
  };

  const markAllAsRead = () => {
    const nowTime = Date.now();
    setNotifications((prev) => {
      const updated = prev.map(n => n.unread ? { ...n, unread: false, readAt: nowTime } : n);
      sessionStorage.setItem("bedflow_notifications", JSON.stringify(updated));
      return updated;
    });
  };

  const addLog = (action, details) => {
    setAuditLogs((prev) => [
      { id: Date.now(), time: new Date().toLocaleTimeString(), timestamp: Date.now(), action, details },
      ...prev
    ]);
  };

  const fetchData = async (silent = false) => {
    try {
      if (!silent && beds.length === 0) setLoading(true);
      const [bedsRes, deptRes] = await Promise.all([
        fetch(`${API_BASE_URL}/beds`),
        fetch(`${API_BASE_URL}/departments`),
      ]);
      const bedsData = await bedsRes.json();
      const deptData = await deptRes.json();

      setBeds(bedsData);
      setDepartments(deptData);

      try {
        const usersRes = await fetch(`${API_BASE_URL}/auth/users`);
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsersList(usersData);
        }
      } catch (e) {}
    } catch (err) {
      console.error("Error connecting to Spring Boot API:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.setItem("bedflow_auth", "true");
      sessionStorage.setItem("bedflow_user", JSON.stringify(userSession));
      sessionStorage.setItem("bedflow_active_tab", activeTab);

      fetchData();
      setNow(new Date());

      const days = ["6d ago", "5d ago", "4d ago", "3d ago", "2d ago", "Yesterday"];
      let val = 65 + Math.random() * 10;
      const trend = days.map((label) => {
        val = Math.max(40, Math.min(95, val + (Math.random() * 14 - 7)));
        return { label, utilization: Math.round(val) };
      });
      setHistoricalTrend(trend);

      const clockTimer = setInterval(() => setNow(new Date()), 1000);

      let pollTimer;
      if (autoPoll) {
        pollTimer = setInterval(() => {
          fetchData(true);
        }, 5000);
      }

      return () => {
        clearInterval(clockTimer);
        if (pollTimer) clearInterval(pollTimer);
      };
    }
  }, [autoPoll, isAuthenticated, userSession, activeTab]);

  function updateForm(patch) {
    setForm((f) => ({ ...f, ...patch }));
    setResults(null);
  }

  async function handleRun() {
    try {
      const payload = { ...form, surgeMode: surgeMode };
      const res = await fetch(`${API_BASE_URL}/beds/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResults({ patient: { ...form }, candidates: data });
      addLog("RUN ALLOCATION", `Calculated global smart-routing match candidates for patient '${form.name}' (Surge Mode: ${surgeMode ? 'ON' : 'OFF'}).`);
    } catch (err) {
      console.error("Allocation failed:", err);
    }
  }

  async function handleConfirm(bedId) {
    try {
      const patient = results.patient;
      const res = await fetch(`${API_BASE_URL}/beds/${bedId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: patient.name,
          acuity: patient.acuity,
          isolation: patient.isolation,
        }),
      });

      if (res.ok) {
        setSuccessMsg(`${patient.name || "Patient"} assigned to ${bedId}.`);
        addLog("PATIENT ADMITTED", `Assigned ${patient.name || 'Patient'} to bed ${bedId} (Acuity: ${patient.acuity}).`);
        addNotification("Patient Allocation", `${patient.name || "Patient"} successfully allocated & admitted to ${bedId}.`);
        setResults(null);
        setSelectedBed(null);
        setForm({ name: "", acuity: 3, clinicalCategory: "general", age: 30, isolation: false });
        fetchData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error("Assignment error:", err);
    }
  }

  async function handleReserve(bedId) {
    const patientName = prompt(`Enter patient name/ID to reserve bed ${bedId}:`);
    if (!patientName) return;

    try {
      const res = await fetch(`${API_BASE_URL}/beds/${bedId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientName: patientName, status: "RESERVED" }),
      });

      if (res.ok) {
        setSuccessMsg(`Bed ${bedId} reserved for ${patientName}.`);
        addLog("BED RESERVED", `Bed ${bedId} set to RESERVED for ${patientName}.`);
        addNotification("Bed Reserved", `Bed ${bedId} reserved for patient ${patientName}.`);
        setSelectedBed(null);
        fetchData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error("Reserve error:", err);
    }
  }

  async function handleAdmit(bedId) {
    const currentBed = Array.isArray(beds) ? beds.find((b) => b.id === bedId) : null;
    const patientName = prompt("Confirm patient name for admission:", currentBed?.patientName || "");
    if (!patientName) return;

    try {
      const res = await fetch(`${API_BASE_URL}/beds/${bedId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientName: patientName, status: "OCCUPIED", acuity: currentBed?.acuity || 3 }),
      });

      if (res.ok) {
        setSuccessMsg(`Patient ${patientName} admitted to bed ${bedId}.`);
        addLog("RESERVATION ADMITTED", `Reserved patient ${patientName} formally admitted to bed ${bedId}.`);
        addNotification("Patient Admission", `Reserved patient ${patientName} admitted to bed ${bedId}.`);
        setSelectedBed(null);
        fetchData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error("Admit error:", err);
    }
  }

  async function handleTransfer(sourceBedId, targetBedId) {
    if (!targetBedId) return;
    try {
      const sourceBed = Array.isArray(beds) ? beds.find((b) => b.id === sourceBedId) : null;

      await fetch(`${API_BASE_URL}/beds/${targetBedId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: sourceBed?.patientName,
          acuity: sourceBed?.acuity,
          isolation: sourceBed?.isolation,
          status: "OCCUPIED"
        }),
      });

      await fetch(`${API_BASE_URL}/beds/${sourceBedId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLEANING", patientName: null }),
      });

      addLog("PATIENT TRANSFER", `Transferred ${sourceBed?.patientName || 'Patient'} from ${sourceBedId} -> ${targetBedId}. ${sourceBedId} set to CLEANING.`);
      addNotification("Patient Transferred", `Patient transferred to ${targetBedId}. Bed ${sourceBedId} sent for cleaning.`);
      setSuccessMsg(`Patient transferred to ${targetBedId}. Bed ${sourceBedId} sent to cleaning.`);
      setSelectedBed(null);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Transfer error:", err);
    }
  }

  async function handleCleaning(bedId) {
    try {
      const res = await fetch(`${API_BASE_URL}/beds/${bedId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLEANING", patientName: null }),
      });

      if (res.ok) {
        setSuccessMsg(`Bed ${bedId} marked for cleaning / turnover.`);
        addLog("TURNOVER STARTED", `Bed ${bedId} placed into CLEANING status.`);
        addNotification("Marked for Cleaning", `Bed ${bedId} sent to cleaning / turnover.`);
        setSelectedBed(null);
        fetchData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error("Cleaning status error:", err);
    }
  }

  async function handleFinishCleaning(bedId) {
    try {
      const res = await fetch(`${API_BASE_URL}/beds/${bedId}/release`, { method: "PUT" });
      if (res.ok) {
        setSuccessMsg(`Bed ${bedId} cleaned and returned to available inventory.`);
        addLog("TURNOVER COMPLETE", `Bed ${bedId} sanitized and marked AVAILABLE.`);
        addNotification("Turnover Complete", `Bed ${bedId} sanitization finished and marked Available.`);
        setSelectedBed(null);
        fetchData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error("Finish cleaning error:", err);
    }
  }

  async function handleRelease(bedId) {
    if (!window.confirm(`Release/Discharge patient from bed ${bedId}?`)) return;
    try {
      const currentBed = Array.isArray(beds) ? beds.find((b) => b.id === bedId) : null;
      const pName = currentBed?.patientName || "Patient";
      const res = await fetch(`${API_BASE_URL}/beds/${bedId}/release`, { method: "PUT" });
      if (res.ok) {
        setSuccessMsg(`Unit slot ${bedId} returned to available inventory.`);
        addLog("PATIENT DISCHARGED", `Bed ${bedId} released to AVAILABLE inventory.`);
        addNotification("Patient Discharged", `${pName} discharged from bed ${bedId}.`);
        setSelectedBed(null);
        fetchData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error("Release error:", err);
    }
  }

  async function handleClearAll() {
    if (!window.confirm("Are you sure you want to discharge EVERY patient?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/beds/release-all`, { method: "POST" });
      if (res.ok) {
        setSuccessMsg("All beds have been discharged.");
        addLog("SYSTEM RESET", "Discharged all patients across all departments.");
        addNotification("Mass Discharge", "All patients across all wards have been discharged.");
        setSelectedBed(null);
        fetchData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error("Clear all error:", err);
    }
  }

  const handleDeleteUserAdmin = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to revoke and delete account for '${username}'?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setSuccessMsg(`User ${username} deleted successfully.`);
        addLog("USER DELETED", `Administrator removed user account: ${username}`);
        fetchData();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        alert("Failed to delete user account.");
      }
    } catch (err) {
      console.error("Admin user delete error:", err);
    }
  };

  const handleDeleteMyAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userSession?.username })
      });
      if (res.ok) {
        alert("Your account has been permanently deleted.");
        sessionStorage.clear();
        setIsAuthenticated(false);
        setUserSession(null);
      } else {
        alert("Failed to delete account.");
      }
    } catch (err) {
      console.error("Self account delete error:", err);
    }
  };

  const handleLogoutWithConfirmation = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      sessionStorage.clear();
      setIsAuthenticated(false);
      setUserSession(null);
    }
  };

  function exportCSV() {
    const safeBeds = Array.isArray(beds) ? beds : [];
    const headers = ["Bed ID", "Department", "Status", "Patient Name", "Acuity", "Isolation Flag"];
    const rows = safeBeds.map((b) => [
      b.id, b.dept.toUpperCase(), b.status, b.patientName || "N/A", b.acuity || "N/A", b.isolation ? "Yes" : "No"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bedflow_census_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog("EXPORT REPORT", "Exported complete current bed census to CSV.");
  }

  // Prevent any flash during initial hydration check
  if (isInitializing) {
    return <div style={{ minHeight: "100vh", background: C.bg }} />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={(session) => { 
      sessionStorage.setItem("bedflow_auth", "true");
      sessionStorage.setItem("bedflow_user", JSON.stringify(session));
      setUserSession(session); 
      setIsAuthenticated(true); 
    }} />;
  }

  const clockLabel = now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--";
  const totalBeds = Array.isArray(beds) && beds.length > 0 ? beds.length : 100;
  const availableCount = Array.isArray(beds) ? beds.filter((b) => (b.status || "").toLowerCase() === "available").length : 0;
  const overallUtil = totalBeds > 0 ? Math.round(((totalBeds - availableCount) / totalBeds) * 100) : 0;

  const isAdmin = userSession?.role === "ADMIN";
  const activeTabsList = TABS.filter(t => t.id !== "users" || isAdmin);

  const safeBedsList = Array.isArray(beds) ? beds : [];
  const safeDepartments = Array.isArray(departments) ? departments : [];

  const deptStats = safeDepartments.map((d) => {
    const list = safeBedsList.filter((b) => b.dept === d.id);
    const unavailable = list.filter((b) => (b.status || "").toLowerCase() !== "available").length;
    const pct = list.length ? Math.round((unavailable / list.length) * 100) : 0;
    return { ...d, total: list.length, unavailable, pct, alert: pct >= ALERT_THRESHOLD, isFull: pct === 100 };
  });

  const alertCount = deptStats.filter((d) => d.alert).length;
  const highCapacityDepts = deptStats.filter((d) => d.pct >= 90);

  const unreadCount = notifications.filter(n => n.unread).length;

  const filteredBeds = safeBedsList.filter((b) => {
    const matchesSearch = searchQuery === "" ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.patientName && b.patientName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || (b.status || "").toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const availableBedsList = safeBedsList.filter((b) => (b.status || "").toLowerCase() === "available");

  const censusData = [
    { name: "Available", value: safeBedsList.filter((b) => (b.status || "").toLowerCase() === "available").length, color: C.available },
    { name: "Occupied", value: safeBedsList.filter((b) => (b.status || "").toLowerCase() === "occupied").length, color: C.occupied },
    { name: "Reserved", value: safeBedsList.filter((b) => (b.status || "").toLowerCase() === "reserved").length, color: C.reserved },
    { name: "Cleaning", value: safeBedsList.filter((b) => (b.status || "").toLowerCase() === "cleaning").length, color: C.cleaning },
  ];

  const deptUtilData = deptStats.map((d) => ({ short: d.shortName || d.id.toUpperCase(), name: d.name, utilization: d.pct }));
  const trendData = [...historicalTrend, { label: "Today", utilization: overallUtil }];

  const occupiedList = safeBedsList.filter((b) => (b.status || "").toLowerCase() === "occupied");
  const avgAcuity = occupiedList.length
    ? (occupiedList.reduce((s, b) => s + (b.acuity || 0), 0) / occupiedList.length).toFixed(1)
    : "—";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.textPrimary, fontFamily: FONT_BODY, padding: "28px 18px 60px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Activity size={19} color={C.accent} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, letterSpacing: "0.01em" }}>BedFlow</h1>
                <span className="animate-pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: C.available, display: "inline-block" }} />
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: C.textSecondary }}>Dynamic Hospital Bed Allocation System</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", position: "relative" }}>
            
            <Badge tone="accent">
              <UserCheck size={12} /> {userSession?.role || "User"} ({userSession?.fullName || userSession?.username})
            </Badge>

            <button
              onClick={() => setAutoPoll(!autoPoll)}
              title="Toggle 5s Auto Refresh"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: autoPoll ? C.accentBg : "transparent",
                border: `1px solid ${autoPoll ? C.accentDim : C.border}`,
                color: autoPoll ? C.accent : C.textMuted,
                borderRadius: 7, padding: "6px 10px", fontSize: 11.5, cursor: "pointer", fontFamily: FONT_BODY
              }}
            >
              <Radio size={12} className={autoPoll ? "animate-pulse" : ""} />
              {autoPoll ? "Auto-Sync ON" : "Auto-Sync OFF"}
            </button>

            <button onClick={exportCSV} title="Export CSV Report" style={{
              display: "flex", alignItems: "center", gap: 5, background: "transparent",
              border: `1px solid ${C.border}`, color: C.textSecondary, borderRadius: 7,
              padding: "6px 10px", fontSize: 11.5, cursor: "pointer", fontFamily: FONT_BODY,
            }}>
              <Download size={12} /> Export CSV
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_MONO, fontSize: 12, color: C.textSecondary }}>
              <Clock size={13} />{clockLabel}
            </div>

            <button onClick={handleClearAll} title="Discharge all patients" style={{
              display: "flex", alignItems: "center", gap: 5, background: "rgba(241,100,86,0.12)",
              border: `1px solid ${C.critical}`, color: C.critical, borderRadius: 7,
              padding: "6px 10px", fontSize: 11.5, cursor: "pointer", fontFamily: FONT_BODY,
              fontWeight: 600
            }}>
              <AlertTriangle size={12} /> Discharge All
            </button>

            <button onClick={handleDeleteMyAccount} title="Delete My Account" style={{
              display: "flex", alignItems: "center", gap: 5, background: "rgba(241,100,86,0.12)",
              border: `1px solid ${C.critical}`, color: C.critical, borderRadius: 7,
              padding: "6px 10px", fontSize: 11.5, cursor: "pointer", fontFamily: FONT_BODY,
              fontWeight: 600
            }}>
              <Trash2 size={12} /> Delete Account
            </button>

            <button onClick={handleLogoutWithConfirmation} title="Sign Out" style={{
              display: "flex", alignItems: "center", gap: 5, background: "transparent",
              border: `1px solid ${C.border}`, color: C.textSecondary, borderRadius: 7,
              padding: "6px 10px", fontSize: 11.5, cursor: "pointer", fontFamily: FONT_BODY,
            }}>
              <LogOut size={12} /> Logout
            </button>

            {/* NOTIFICATION BELL BUTTON WITH CLICKABLE "MARK ALL AS READ" */}
            <div className="notification-container" style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: showNotifications ? C.accentBg : "transparent",
                  border: `1px solid ${showNotifications ? C.accentDim : C.border}`,
                  color: showNotifications ? C.accent : C.textSecondary,
                  borderRadius: 7, width: 34, height: 34, cursor: "pointer"
                }}
              >
                <BellIcon />
                {unreadCount > 0 && (
                  <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: "50%", background: C.critical }} />
                )}
              </button>

              {showNotifications && (
                <div style={{
                  position: "absolute", right: 0, top: 42, width: 320, background: C.surface,
                  border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: 14, zIndex: 50,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)", maxHeight: 400, overflowY: "auto"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
                    <strong style={{ fontSize: 13, fontFamily: FONT_DISPLAY }}>Alerts & Notifications</strong>
                    {unreadCount > 0 ? (
                      <button
                        onClick={markAllAsRead}
                        style={{
                          background: "transparent", border: "none", color: C.accent,
                          fontSize: 11, cursor: "pointer", fontFamily: FONT_MONO, textDecoration: "underline", padding: 0
                        }}
                      >
                        Mark all as read ({unreadCount})
                      </button>
                    ) : (
                      <span style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT_MONO }}>All Read</span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {notifications.length === 0 ? (
                      <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: "12px 0" }}>
                        No alerts or notifications recorded.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => { if (n.unread) markAsRead(n.id); }}
                          title={n.unread ? "Click to mark as read" : "Already read"}
                          style={{
                            background: n.unread ? C.surfaceRaised : C.surface,
                            padding: 10,
                            borderRadius: 6,
                            border: `1px solid ${n.unread ? C.borderLight : C.border}`,
                            cursor: n.unread ? "pointer" : "default",
                            opacity: n.unread ? 1 : 0.65,
                            transition: "all 0.15s ease"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, fontWeight: 600, color: C.textPrimary, marginBottom: 2 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {n.unread && <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent }} />}
                              <span>{n.title}</span>
                            </div>
                            <span style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT_MONO }}>{n.time}</span>
                          </div>
                          <div style={{ fontSize: 11.5, color: C.textSecondary, paddingLeft: n.unread ? 12 : 0 }}>{n.desc}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* HIGH CAPACITY ALERT BANNER */}
        {highCapacityDepts.length > 0 && (
          <div style={{
            background: "rgba(241,100,86,0.15)", border: `1px solid ${C.critical}`,
            borderRadius: 10, padding: "12px 16px", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 10, color: C.critical, fontSize: 13
          }}>
            <AlertTriangle size={18} />
            <div>
              <strong>SURGE ALERT:</strong> The following units are operating at critical capacity (&ge;90%):{" "}
              {highCapacityDepts.map(d => `${d.name} (${d.pct}%)`).join(", ")}
            </div>
          </div>
        )}

        {/* INSTRUMENT STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 1, background: C.border, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 26 }}>
          <StatBlock label="Total beds" value={totalBeds} />
          <StatBlock label="Available now" value={availableCount} tone="good" />
          <StatBlock label="Utilization" value={`${overallUtil}%`} tone={overallUtil >= ALERT_THRESHOLD ? "alert" : "default"} />
          <StatBlock label="Active alerts" value={alertCount} tone={alertCount > 0 ? "alert" : "default"} />
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
          {activeTabsList.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer",
                fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13,
                color: isActive ? C.textPrimary : C.textSecondary,
                borderBottom: isActive ? `2px solid ${C.accent}` : "2px solid transparent",
                marginBottom: -1,
              }}>
                <Icon size={15} />{t.label}
              </button>
            );
          })}
        </div>

        {successMsg && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(76,201,136,0.12)", border: "1px solid rgba(76,201,136,0.4)", color: C.available, borderRadius: 9, padding: "10px 14px", marginBottom: 18, fontSize: 13 }}>
            <CheckCircle2 size={15} /> {successMsg}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textSecondary }}>Connecting to backend...</div>
        ) : (
          <>
            {activeTab === "board" && (
              <div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 320 }}>
                    <Search size={15} color={C.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="text"
                      placeholder="Search bed ID or patient..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: 36, fontSize: 12.5 }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <Filter size={14} color={C.textMuted} style={{ marginRight: 4 }} />
                    {["all", "available", "occupied", "reserved", "cleaning"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        style={{
                          padding: "6px 12px", borderRadius: 20, border: `1px solid ${statusFilter === st ? C.accent : C.border}`,
                          background: statusFilter === st ? C.accentBg : C.surface,
                          color: statusFilter === st ? C.accent : C.textSecondary,
                          fontSize: 11.5, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                          fontFamily: FONT_BODY
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 22, fontSize: 12, color: C.textSecondary }}>
                  {LEGEND.map((l) => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color, display: "inline-block" }} />{l.label}
                    </div>
                  ))}
                </div>

                {deptStats.map((dept) => {
                  const deptBeds = filteredBeds
                    .filter((b) => b.dept === dept.id)
                    .sort((a, b) => {
                      const numA = parseInt(a.id.replace(/\D/g, ""), 10) || 0;
                      const numB = parseInt(b.id.replace(/\D/g, ""), 10) || 0;
                      return numA - numB;
                    });
                  if (deptBeds.length === 0 && (searchQuery || statusFilter !== "all")) return null;

                  return (
                    <div key={dept.id} style={{ marginBottom: 26 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 9, flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
                          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 14.5, letterSpacing: "0.01em" }}>{dept.name.toUpperCase()}</span>
                          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textMuted }}>{dept.shortName || dept.id.toUpperCase()}</span>
                          
                          {dept.isFull ? (
                            <Badge tone="alert"><AlertTriangle size={10} /> At Full Capacity</Badge>
                          ) : dept.alert ? (
                            <Badge tone="alert"><AlertTriangle size={10} /> Near Capacity ({dept.pct}%)</Badge>
                          ) : null}
                        </div>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textSecondary }}>
                          {dept.unavailable}/{dept.total} <span style={{ color: C.textMuted }}>· {dept.pct}%</span>
                        </span>
                      </div>
                      <div style={{ height: 3, background: C.border, borderRadius: 2, marginBottom: 11, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${dept.pct}%`, background: dept.alert ? C.critical : C.accent, borderRadius: 2, transition: "width .4s ease" }} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))", gap: 6 }}>
                        {deptBeds.map((bed) => (
                          <BedTile
                            key={bed.id}
                            bed={bed}
                            isSelected={selectedBed?.id === bed.id}
                            onClick={() => setSelectedBed(bed)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <ActionModal
              bed={selectedBed}
              availableBeds={availableBedsList}
              onClose={() => setSelectedBed(null)}
              onReserve={handleReserve}
              onAdmit={handleAdmit}
              onCleaning={handleCleaning}
              onFinishCleaning={handleFinishCleaning}
              onRelease={handleRelease}
              onTransfer={handleTransfer}
            />

            {activeTab === "allocate" && (
              <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 20 }}>
                <div style={cardStyle} className="lg:col-span-1">
                  <SectionHeading icon={ClipboardList}>PATIENT INTAKE</SectionHeading>

                  <div style={{
                    background: surgeMode ? "rgba(241,100,86,0.12)" : C.surfaceRaised,
                    border: `1px solid ${surgeMode ? C.critical : C.border}`,
                    borderRadius: 8, padding: 12, marginBottom: 16,
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                  }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: surgeMode ? C.critical : C.textPrimary, display: "flex", alignItems: "center", gap: 5 }}>
                        <Sliders size={14} /> SURGE OVERRIDE MODE
                      </span>
                      <span style={{ fontSize: 10.5, color: C.textMuted, display: "block", marginTop: 2 }}>
                        Prioritizes Acuity Fit over Load Balancing during ER surges
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={surgeMode}
                      onChange={(e) => setSurgeMode(e.target.checked)}
                      style={{ width: 18, height: 18, cursor: "pointer" }}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <FieldLabel>Patient name or ID</FieldLabel>
                    <input
                      value={form.name}
                      onChange={(e) => updateForm({ name: e.target.value })}
                      placeholder="e.g. A. Owusu or MRN-4471"
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <FieldLabel>Clinical Case Type / Category</FieldLabel>
                    <select
                      value={form.clinicalCategory}
                      onChange={(e) => updateForm({ clinicalCategory: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="general">General Medical / Surgical</option>
                      <option value="emergency">Emergency / Trauma</option>
                      <option value="icu">Critical Care / Intensive Monitoring</option>
                      <option value="pediatric">Pediatric Care</option>
                      <option value="maternity">Maternity / Obstetric Care</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <FieldLabel>Patient Age</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={form.age === "" ? "" : form.age}
                      onChange={(e) => {
                        const val = e.target.value;
                        const parsed = val === "" ? "" : parseInt(val, 10);
                        updateForm({ age: isNaN(parsed) ? "" : parsed });
                      }}
                      placeholder="e.g. 30"
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <FieldLabel>Acuity (1 stable – 5 critical)</FieldLabel>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => updateForm({ acuity: n })} style={{
                          flex: 1, padding: "9px 0", borderRadius: 7, cursor: "pointer",
                          border: `1px solid ${form.acuity === n ? C.accent : C.border}`,
                          background: form.acuity === n ? C.accentBg : C.surfaceRaised,
                          color: form.acuity === n ? C.accent : C.textSecondary,
                          fontFamily: FONT_MONO, fontWeight: 600, fontSize: 13,
                        }}>{n}</button>
                      ))}
                    </div>
                  </div>

                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 18, fontSize: 13, color: C.textSecondary }}>
                    <input type="checkbox" checked={form.isolation} onChange={(e) => updateForm({ isolation: e.target.checked })} />
                    Requires isolation precautions
                  </label>
                  <button onClick={handleRun} disabled={!form.name.trim()} style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    padding: "11px 0", borderRadius: 8, border: "none",
                    cursor: form.name.trim() ? "pointer" : "not-allowed",
                    background: form.name.trim() ? C.accent : C.surfaceRaised,
                    color: form.name.trim() ? "#0B1410" : C.textMuted,
                    fontWeight: 700, fontSize: 13.5, fontFamily: FONT_BODY,
                    opacity: form.name.trim() ? 1 : 0.6,
                  }}>
                    <Zap size={15} /> Run smart-routing allocation
                  </button>
                </div>

                <div style={cardStyle} className="lg:col-span-2">
                  <SectionHeading icon={Zap}>ALGORITHM OUTPUT (GLOBAL SMART-ROUTING)</SectionHeading>
                  {!results && (
                    <div style={{ padding: "30px 10px", textAlign: "center", color: C.textMuted, fontSize: 13 }}>
                      Enter patient clinical profile and run the auto-routing algorithm to scan all hospital wards simultaneously for optimal placement.
                    </div>
                  )}
                  {results && results.candidates.length === 0 && (
                    <div style={{ padding: "30px 10px", textAlign: "center", color: C.textMuted, fontSize: 13 }}>
                      No available beds across any department currently meet these clinical requirements.
                    </div>
                  )}
                  {results && results.candidates.map((r, i) => (
                    <CandidateRow
                      key={r.bed.id}
                      result={r}
                      rank={i + 1}
                      recommended={i === 0}
                      departments={safeDepartments}
                      onConfirm={() => handleConfirm(r.bed.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div>
                <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 20, marginBottom: 20 }}>
                  <div style={cardStyle}>
                    <SectionHeading icon={TrendingUp}>Occupancy trend · 7 days</SectionHeading>
                    <ResponsiveContainer width="100%" height={210}>
                      <LineChart data={trendData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid stroke={C.border} vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="label" stroke={C.textMuted} tick={{ fontSize: 10.5, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: C.border }} tickLine={false} />
                        <YAxis stroke={C.textMuted} tick={{ fontSize: 10.5, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="utilization" name="Utilization %" stroke={C.accent} strokeWidth={2.5} dot={{ r: 3, fill: C.accent, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={cardStyle}>
                    <SectionHeading icon={BarChart3}>Utilization by department</SectionHeading>
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={deptUtilData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid stroke={C.border} vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="short" stroke={C.textMuted} tick={{ fontSize: 10.5, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: C.border }} tickLine={false} />
                        <YAxis stroke={C.textMuted} tick={{ fontSize: 10.5, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="utilization" name="Utilization %" radius={[4, 4, 0, 0]}>
                          {deptUtilData.map((d, i) => <Cell key={i} fill={d.utilization >= ALERT_THRESHOLD ? C.critical : C.accent} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 20 }}>
                  <div style={cardStyle}>
                    <SectionHeading icon={Users}>Current census</SectionHeading>
                    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie data={censusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2} stroke="none">
                            {censusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {censusData.map((d) => (
                          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, display: "inline-block" }} />
                            <span style={{ color: C.textSecondary }}>{d.name}</span>
                            <span style={{ fontFamily: FONT_MONO, color: C.textPrimary, marginLeft: "auto", paddingLeft: 14 }}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={cardStyle}>
                    <SectionHeading icon={Activity}>Key metrics</SectionHeading>
                    <div>
                      {[
                        ["Total beds", totalBeds],
                        ["Available now", availableCount],
                        ["Overall utilization", `${overallUtil}%`],
                        ["Departments near capacity", alertCount],
                        ["Avg. acuity, occupied beds", avgAcuity],
                      ].map(([label, value], i) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: i === 0 ? "none" : `1px solid ${C.border}`, fontSize: 13 }}>
                          <span style={{ color: C.textSecondary }}>{label}</span>
                          <span style={{ fontFamily: FONT_MONO, fontWeight: 600 }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "audit" && (
              <div style={cardStyle}>
                <SectionHeading icon={History}>Operational Activity Trail</SectionHeading>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        background: C.surfaceRaised, border: `1px solid ${C.border}`,
                        borderRadius: 8, padding: "12px 16px", display: "flex",
                        justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <Badge tone="accent">{log.action}</Badge>
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{log.details}</span>
                        </div>
                      </div>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textMuted }}>{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "users" && isAdmin && (
              <div style={cardStyle}>
                <SectionHeading icon={Users}>Staff & Account Management</SectionHeading>
                <p style={{ fontSize: 12.5, color: C.textSecondary, marginBottom: 16 }}>
                  Administrator view to inspect registered system users and revoke clinical access credentials.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {usersList.length === 0 ? (
                    <div style={{ background: C.surfaceRaised, padding: 16, borderRadius: 8, fontSize: 13, color: C.textMuted }}>
                      No other staff accounts currently loaded.
                    </div>
                  ) : (
                    usersList.map((u) => (
                      <div key={u.id} style={{ background: C.surfaceRaised, padding: "12px 16px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${C.border}` }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <strong style={{ color: C.textPrimary, fontSize: 14 }}>{u.fullName || u.username}</strong>
                            <Badge tone={u.role === "ADMIN" ? "accent" : "default"}>{u.role}</Badge>
                            {u.ward && <span style={{ fontSize: 11, color: C.textSecondary }}>Ward: {u.ward}</span>}
                          </div>
                          <span style={{ fontSize: 12, color: C.textMuted, fontFamily: FONT_MONO }}>{u.username}</span>
                        </div>
                        {u.username !== "admin" && (
                          <button
                            onClick={() => handleDeleteUserAdmin(u.id, u.username)}
                            style={{
                              background: "rgba(241,100,86,0.12)", border: `1px solid ${C.critical}`, color: C.critical,
                              padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 5, fontFamily: FONT_BODY
                            }}
                          >
                            <Trash2 size={13} /> Revoke Account
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <p style={{ marginTop: 36, fontSize: 11, color: C.textMuted, textAlign: "center" }}>
          BIT 268 · Computational Systems for Problem Solving — Project 71 dashboard interface.
        </p>
      </div>
    </div>
  );
}