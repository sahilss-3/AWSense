import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Activity,
  Cpu,
  FileCheck2,
  Cloud,
  Leaf,
  Users,
  AlertCircle
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    // Strictly enforce requirement: Username must be 'AWSense' and Password '12345'
    setTimeout(() => {
      const trimmedUser = username.trim();
      if (trimmedUser === 'AWSense' && password === '12345') {
        if (rememberMe) {
          localStorage.setItem('awsense_auth', JSON.stringify({ user: 'AWSense', timestamp: Date.now() }));
        } else {
          sessionStorage.setItem('awsense_auth', JSON.stringify({ user: 'AWSense', timestamp: Date.now() }));
        }
        onLoginSuccess();
      } else {
        setErrorMessage('Invalid credentials. Required: Username "AWSense" and Password "12345"');
        setIsSubmitting(false);
      }
    }, 300);
  };

  const handleQuickFill = () => {
    setUsername('AWSense');
    setPassword('12345');
    setErrorMessage(null);
  };

  return (
    <div className="relative min-h-screen w-full flex bg-[#F8FAFC] text-[#1F2937] overflow-hidden select-none font-sans">
      
      {/* ========================================================================= */}
      {/* 4K BACKGROUND HERO IMAGE (RIGHT / FULL-BLEED)                            */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/aws_hero_4k.jpg"
          alt="Automatic Weather Station at Mountain Sunrise 4K"
          className="w-full h-full object-cover object-right filter brightness-[1.02] contrast-[1.01]"
        />
        {/* Subtle atmospheric vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* DYNAMIC SWOOP CURVE MASK (MATHEMATICALLY MATCHED TO REFERENCE IMAGE)      */}
      {/* ========================================================================= */}
      <div className="hidden lg:block absolute inset-0 z-10 pointer-events-none">
        <svg
          className="w-full h-full"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="waveNavyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1B4B79" />
              <stop offset="50%" stopColor="#12355B" />
              <stop offset="100%" stopColor="#0B213D" />
            </linearGradient>
            <linearGradient id="waveBlueAccent" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1E70BF" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Outer Soft Cyan/Blue Ribbon Wave */}
          <path
            d="M 0,0 
               L 1100,0 
               C 950,180 858,360 858,540 
               C 858,720 950,900 1080,1080 
               L 0,1080 
               Z"
            fill="url(#waveBlueAccent)"
            opacity="0.65"
          />

          {/* Secondary Deep Navy Blue Swoop Wave */}
          <path
            d="M 0,0 
               L 1070,0 
               C 930,180 844,360 844,540 
               C 844,720 930,900 1050,1080 
               L 0,1080 
               Z"
            fill="url(#waveNavyGradient)"
          />

          {/* Primary Solid White Left Fill Surface */}
          <path
            d="M 0,0 
               L 993,0 
               C 880,180 804,360 804,540 
               C 804,720 880,900 990,1080 
               L 0,1080 
               Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* LEFT SIDE: AUTHENTICATION FORM & METRICS                                   */}
      {/* ========================================================================= */}
      <div className="relative z-20 w-full lg:w-[44%] xl:w-[41%] 2xl:w-[39%] min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 bg-white lg:bg-transparent">
        
        {/* Subtle Topographical Elevation Contour Background */}
        <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
          <svg
            className="w-full h-full object-cover"
            viewBox="0 0 800 1000"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M-100 180 C 150 160, 250 260, 400 200 C 550 140, 650 280, 900 230" stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="3 3" />
            <path d="M-100 240 C 120 210, 280 320, 450 270 C 600 220, 720 350, 900 300" stroke="#E2E8F0" strokeWidth="1" />
            <path d="M-100 300 C 100 260, 310 380, 500 330 C 650 290, 780 410, 900 370" stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="4 4" />
            <path d="M-100 360 C 80 320, 330 440, 550 390 C 700 350, 820 480, 900 440" stroke="#E2E8F0" strokeWidth="1" />
            <path d="M-100 500 C 140 460, 300 600, 520 550 C 680 500, 800 640, 900 590" stroke="#CBD5E1" strokeWidth="1" />
            <path d="M-100 620 C 160 580, 340 710, 560 660 C 720 620, 830 750, 900 710" stroke="#E2E8F0" strokeWidth="1.2" strokeDasharray="3 3" />
            <path d="M-100 740 C 180 700, 380 820, 600 780 C 750 740, 860 860, 900 830" stroke="#CBD5E1" strokeWidth="0.8" />
          </svg>
        </div>

        {/* TOP BRANDING: LOGO */}
        <div className="relative z-10 pt-1">
          <div className="flex items-center gap-1">
            {/* Logo Cloud & Sun Graphic */}
            <div className="relative flex items-center">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#12355B] font-sans">
                AWS
              </span>
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E70BF] font-sans relative">
                ense
                {/* Curved orange sun/cloud accent arcs above the 'ense' */}
                <svg
                  className="absolute -top-3 sm:-top-3.5 left-1 w-12 h-6 pointer-events-none"
                  viewBox="0 0 50 25"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M 4 20 C 6 12, 14 6, 24 6 C 35 6, 43 12, 46 20"
                    stroke="#FF7A00"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 20 C 13 15, 18 11, 25 11 C 32 11, 37 15, 40 20"
                    stroke="#1E70BF"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <circle cx="24" cy="4" r="1.8" fill="#FF7A00" />
                </svg>
              </span>
            </div>
          </div>
          <p className="text-[11px] sm:text-xs font-semibold text-slate-800 tracking-tight mt-1">
            Intelligent Weather Station Monitoring Platform
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-500 tracking-wider font-medium">
            Reliable Data &nbsp;|&nbsp; Smarter Insights &nbsp;|&nbsp; Safer Tomorrow
          </p>
        </div>

        {/* CENTER: LOGIN FORM */}
        <div className="relative z-10 my-auto py-6 max-w-[420px] w-full">
          <div className="mb-6">
            <p className="text-[11px] font-bold text-slate-500 tracking-[0.28em] uppercase mb-1">
              W E L C O M E &nbsp; T O
            </p>
            <h1 className="text-4xl sm:text-5xl font-black text-[#12355B] tracking-tight leading-none mb-2">
              AWSense
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-snug">
              AI/ML Based Intelligent Anomaly Detection for
              <br />
              Automatic Weather Stations (AWS)
            </p>

            {/* Orange horizontal line accent matching reference */}
            <div className="w-12 h-1 bg-[#FF7A00] rounded-full my-3" />

            <p className="text-[11px] text-slate-500 leading-tight font-medium">
              Monitoring Today.
              <br />
              A More Resilient Tomorrow.
            </p>
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="username"
                  required
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E70BF]/30 focus:border-[#1E70BF] transition-all font-medium shadow-inner"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E70BF]/30 focus:border-[#1E70BF] transition-all font-medium shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 sm:py-3.5 px-6 bg-[#12355B] hover:bg-[#1A4574] active:bg-[#0B213D] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-[#12355B] focus:ring-[#1E70BF] focus:ring-offset-0 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              <a
                href="#forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Authorized Credentials:\nUsername: AWSense\nPassword: 12345');
                }}
                className="text-[#1E70BF] hover:underline font-medium"
              >
                Forgot password?
              </a>
            </div>
          </form>

          {/* Subtle Credentials Helper Pill */}
          <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/80 px-3 py-1.5 rounded-lg border border-slate-100">
            <span>Demo: <strong className="text-slate-700">AWSense</strong> / <strong className="text-slate-700">12345</strong></span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[#1E70BF] font-semibold hover:underline cursor-pointer"
            >
              Fill Credentials
            </button>
          </div>
        </div>

        {/* BOTTOM SECTION: 4 PILLARS & SCIENCE TAGLINE */}
        <div className="relative z-10 pt-2">
          {/* 4 Feature Pillars with vertical line dividers */}
          <div className="grid grid-cols-4 gap-1 text-center py-2">
            {/* Pillar 1: Real-time Monitoring */}
            <div className="flex flex-col items-center justify-start px-1">
              <div className="w-7 h-7 flex items-center justify-center text-[#12355B] mb-1">
                <Activity className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 leading-tight">
                Real-time
                <br />
                Monitoring
              </span>
            </div>

            {/* Pillar 2: Anomaly Detection */}
            <div className="flex flex-col items-center justify-start px-1 border-l border-slate-200">
              <div className="w-7 h-7 flex items-center justify-center text-[#12355B] mb-1">
                <ShieldCheck className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 leading-tight">
                Anomaly
                <br />
                Detection
              </span>
            </div>

            {/* Pillar 3: Sensor Health */}
            <div className="flex flex-col items-center justify-start px-1 border-l border-slate-200">
              <div className="w-7 h-7 flex items-center justify-center text-[#12355B] mb-1">
                <Cpu className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 leading-tight">
                Sensor
                <br />
                Health
              </span>
            </div>

            {/* Pillar 4: Data Reliability */}
            <div className="flex flex-col items-center justify-start px-1 border-l border-slate-200">
              <div className="w-7 h-7 flex items-center justify-center text-[#12355B] mb-1">
                <FileCheck2 className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 leading-tight">
                Data
                <br />
                Reliability
              </span>
            </div>
          </div>

          {/* Horizontal Rule with Center Tagline */}
          <div className="relative flex py-2 items-center mt-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[9px] font-semibold tracking-[0.25em] text-slate-400 uppercase">
              Science for a safer tomorrow
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SIDE: HERO CONTENT OVERLAYS                                         */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-1 relative z-20 flex-col justify-between p-10 xl:p-14 pointer-events-none">
        
        {/* TOP ROW: HEADLINE QUOTE (LEFT/CENTER SKY) + VERTICAL PILLAR (TOP RIGHT) */}
        <div className="flex justify-between items-start w-full">
          
          {/* Main Headline: 'TRUSTED OBSERVATIONS FOR A SAFER TOMORROW' */}
          <div style={{ marginLeft: '13vw' }} className="pt-6 select-none">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Blue vertical indicator bar */}
              <div className="w-1.5 h-28 sm:h-32 bg-[#1E70BF] rounded-full flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-[#12355B] tracking-tight leading-[1.15] drop-shadow-sm">
                  TRUSTED
                  <br />
                  OBSERVATIONS
                  <br />
                  FOR A SAFER
                  <br />
                  TOMORROW
                </h2>
                <p className="text-[10px] sm:text-xs font-bold text-slate-700 tracking-[0.28em] mt-3 uppercase">
                  PEOPLE &nbsp;|&nbsp; ENVIRONMENT &nbsp;|&nbsp; RESILIENCE
                </p>
              </div>
            </div>
          </div>

          {/* Top Right Vertical Pillar: MONITOR DETECT EXPLAIN ASSESS ALERT ACT */}
          <div className="text-right select-none pr-2 pt-2">
            <div className="flex flex-col items-end space-y-1 text-[11px] sm:text-xs font-bold text-[#12355B] tracking-[0.25em]">
              <span>MONITOR</span>
              <span>DETECT</span>
              <span>EXPLAIN</span>
              <span>ASSESS</span>
              <span>ALERT</span>
              <span>ACT</span>
              {/* Orange underline beneath ACT */}
              <div className="w-10 h-1 bg-[#FF7A00] rounded-full mt-1" />
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: FROSTED GLASS 3-PILL CARD (CENTER) + CLIMATE RESILIENT BHARAT (RIGHT) */}
        <div className="flex flex-col sm:flex-row items-end justify-between w-full gap-6 pb-2">
          
          {/* Frosted Glass 3-Item Pill (Cleaner Data | Resilient Environments | A Safer India) */}
          <div style={{ marginLeft: '10vw' }} className="backdrop-blur-md bg-black/45 border border-white/20 rounded-2xl px-6 py-3 shadow-2xl">
            <div className="flex items-center gap-6 sm:gap-8 divide-x divide-white/20 text-white">
              
              {/* Feature 1 */}
              <div className="flex flex-col items-center text-center pl-0">
                <Cloud className="w-5 h-5 text-white/90 mb-1" />
                <span className="text-[11px] font-bold tracking-wider uppercase text-white">
                  Cleaner Data
                </span>
                <span className="text-[9px] text-white/70 font-medium tracking-wide">
                  Better Insights
                </span>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center text-center pl-6 sm:pl-8">
                <Leaf className="w-5 h-5 text-white/90 mb-1" />
                <span className="text-[11px] font-bold tracking-wider uppercase text-white">
                  Resilient Environments
                </span>
                <span className="text-[9px] text-white/70 font-medium tracking-wide">
                  Stronger Communities
                </span>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center text-center pl-6 sm:pl-8">
                <Users className="w-5 h-5 text-white/90 mb-1" />
                <span className="text-[11px] font-bold tracking-wider uppercase text-white">
                  A Safer India
                </span>
                <span className="text-[9px] text-white/70 font-medium tracking-wide">
                  Brighter Tomorrow
                </span>
              </div>

            </div>
          </div>

          {/* Bottom Right Title: AUTOMATIC WEATHER STATIONS FOR A CLIMATE RESILIENT BHARAT */}
          <div className="text-right select-none pr-2">
            <p className="text-xs sm:text-sm font-black text-white uppercase tracking-wider drop-shadow-md leading-tight">
              AUTOMATIC WEATHER STATIONS
              <br />
              FOR A CLIMATE RESILIENT BHARAT
            </p>
            {/* Indian Tricolor Bar Indicator */}
            <div className="flex justify-end mt-1.5">
              <div className="flex w-24 h-1 rounded-full overflow-hidden shadow-sm">
                <div className="w-1/3 bg-[#FF9933]" />
                <div className="w-1/3 bg-white" />
                <div className="w-1/3 bg-[#138808]" />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
