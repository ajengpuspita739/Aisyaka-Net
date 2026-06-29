import React, { useState } from 'react';
import { Shield, Key, User, Wifi, Cpu, Loader2 } from 'lucide-react';
import NeonBox from './NeonBox';
// @ts-ignore
import logoImg from '../assets/images/aisyaka_logo_dark_1782661999850.jpg';

interface LoginScreenProps {
  onLoginSuccess: (username: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('admin_ftth');
  const [password, setPassword] = useState('fibersecured100');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Harap masukkan Username dan Password.');
      return;
    }

    setLoading(true);

    // Simulate cybernetic firewall handshake
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(username);
    }, 1200);
  };

  const autofill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen cyber-grid text-slate-100 flex flex-col justify-center items-center p-4 md:p-8 relative overflow-hidden font-sans">
      <div className="cyber-scanline" />

      {/* Cyber Background Accents */}
      <div className="absolute top-6 left-10 pointer-events-none opacity-20 hidden lg:block">
        <p className="font-mono text-xs text-cyan-400">HOST_IP::106.70.42.54</p>
        <p className="font-mono text-xs text-slate-400">NODE_STATUS::SECURE</p>
        <p className="font-mono text-xs text-slate-400">FREQUENCY::5.8Ghz / 2.4Ghz</p>
      </div>
      <div className="absolute bottom-6 right-10 pointer-events-none opacity-20 hidden lg:block text-right">
        <p className="font-mono text-xs text-fuchsia-400">GPON_PROTOCOL_ENG_v4.2</p>
        <p className="font-mono text-xs text-slate-400">ENCRYPTION::AES-128-GCM</p>
      </div>

      {/* Split Login Container Card */}
      <div className="w-full max-w-5xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-md rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-col md:flex-row min-h-[550px] z-10">
        
        {/* Left Column: Login Form Panel */}
        <div className="w-full md:w-1/2 p-6 sm:p-10 md:p-12 flex flex-col justify-between bg-slate-950/95 border-r border-cyan-500/10">
          <div>
            {/* Title block like uploaded image */}
            <div className="mb-6 mt-4">
              <h1 className="font-orbitron font-black text-xl md:text-2xl tracking-wide text-cyan-400 neon-glow-cyan uppercase">
                MASUK DASHBOARD
              </h1>
              <p className="text-slate-400 font-mono text-[11px] mt-1.5 leading-relaxed">
                Login ke Portal Monitor untuk mengelola OLT, ONU, dan monitoring jaringan FTTH.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-red-950/40 border border-red-500/50 text-red-300 font-mono text-xs rounded flex gap-2 items-center">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username field */}
              <div>
                <label className="block text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-1.5">
                  Operator Username / ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4 text-cyan-500/60" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-cyan-500/20 focus:border-cyan-400 rounded-lg focus:outline-none text-slate-100 placeholder-slate-600 font-mono text-xs transition-all shadow-inner"
                    placeholder="Masukkan username NOC..."
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-1.5">
                  Sandi Keamanan (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4 text-cyan-500/60" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-cyan-500/20 focus:border-cyan-400 rounded-lg focus:outline-none text-slate-100 placeholder-slate-600 font-mono text-xs transition-all"
                    placeholder="Masukkan sandi..."
                  />
                </div>
              </div>

              {/* Submit button like the bright solid button in uploaded image */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-none text-slate-950 font-orbitron text-xs font-black tracking-widest uppercase rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>MEMVERIFIKASI FIREWALL...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    <span>LOG IN DASHBOARD</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom part of Left Panel: Credentials Hint & Footer */}
          <div className="mt-8 pt-4 border-t border-white/5">
            <p className="text-[9px] font-mono text-slate-500 mb-2 uppercase tracking-wider">
              Autofill Credentials Hint:
            </p>
            <button
              type="button"
              onClick={() => autofill('admin_ftth', 'fibersecured100')}
              className="w-full p-2 bg-cyan-950/20 hover:bg-cyan-900/30 border border-cyan-500/10 hover:border-cyan-500/20 rounded-md text-left text-[10px] font-mono text-cyan-400 cursor-pointer transition-colors"
            >
              <span className="font-semibold">NOC Admin</span> — <span className="text-slate-500 font-normal">Click to auto-fill</span>
            </button>
            <p className="text-[8px] text-slate-600 font-mono text-center mt-3">
              Lupa sandi? Hubungi divisi pusat NOC AISYAKA.NET
            </p>
          </div>
        </div>

        {/* Right Column: Graphic Illustration Panel */}
        <div className="w-full md:w-1/2 relative overflow-hidden bg-gradient-to-br from-cyan-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center p-8 text-center border-t md:border-t-0 md:border-l border-cyan-500/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/40 via-transparent to-transparent pointer-events-none" />
          
          {/* Logo container mimicking network nodes */}
          <div className="relative z-10 w-full max-w-md md:max-w-[460px] mx-auto flex flex-col items-center">
            <img 
              src={logoImg} 
              alt="AISYAKA.NET Connecting Indonesia" 
              className="w-full h-auto object-contain rounded-2xl border border-cyan-500/15 p-4 bg-slate-950/60 shadow-[0_0_35px_rgba(6,182,212,0.3)] hover:scale-[1.03] transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            
            <div className="mt-6">
              <h3 className="font-orbitron font-extrabold text-sm md:text-base tracking-wider text-cyan-300">
                INTERNAL TOOL
              </h3>
              <p className="text-[10px] md:text-xs text-slate-400 font-mono mt-1 max-w-xs mx-auto leading-relaxed">
                On-Cloud Tools System untuk monitoring transmisi data FTTH di seluruh pelosok Indonesia.
              </p>
            </div>
          </div>

          {/* Decorative network metrics bottom right overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center opacity-40 font-mono text-[9px] text-slate-500 pointer-events-none">
            <span>LINK_RATE::10Gbps</span>
            <span>SYSTEM::READY</span>
          </div>
        </div>

      </div>

      <div className="mt-6 text-center z-10">
        <p className="text-[9px] font-mono text-slate-600 tracking-widest">
          POWERED BY AISYAKA.NET CORE INFRASTRUCTURE © 2026 • ALL RIGHTS RESERVED
        </p>
      </div>
    </div>
  );
}
