import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  Brain,
  Search,
  CheckCircle,
  FileText,
  MessageSquare,
  UserCheck,
  Cpu,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../hooks/useAuth';

export const LandingPage = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const agents = [
    {
      name: 'Supervisor Agent',
      role: 'The Brain',
      icon: Cpu,
      description: 'Understands the student goal, identifies missing criteria, and coordinates the specialized agents.',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      name: 'Profile Agent',
      role: 'Information Gatherer',
      icon: UserCheck,
      description: 'Collects academic details, family income, and demographics through conversational, contextual follow-ups.',
      color: 'from-sky-500 to-cyan-500'
    },
    {
      name: 'Document Verification Agent',
      role: 'OCR & Verification Expert',
      icon: FileText,
      description: 'Extracts credentials from marksheets and certificates using OCR, comparing details to prevent data mismatches.',
      color: 'from-violet-500 to-purple-500'
    },
    {
      name: 'Knowledge Agent (RAG)',
      role: 'Official Rules Navigator',
      icon: Search,
      description: 'Scans official scholarship PDF guidelines, eligibility documents, and FAQs to retrieve precise matching clauses.',
      color: 'from-teal-500 to-emerald-500'
    },
    {
      name: 'Recommendation Agent',
      role: 'Eligibility Matchmaker',
      icon: Brain,
      description: 'Compares eligibility, scores match compatibility percentages, and provides structured explanations for each rank.',
      color: 'from-amber-500 to-orange-500'
    },
    {
      name: 'Deadline & Application Agent',
      role: 'Deadline & Application Guide',
      icon: Bell,
      description: 'Tracks scholarship deadlines, monitors application progress, and guides students through the next steps to complete their applications on time.',
      color: 'from-rose-500 to-pink-500'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Quick Registration',
      description: 'Create your account in seconds with your name, email, and password.'
    },
    {
      number: '02',
      title: 'Goal Expression',
      description: 'Simply tell the AI: "I want scholarships for my engineering studies" in plain English.'
    },
    {
      number: '03',
      title: 'Agentic Verification',
      description: 'Our specialized AI agents verify documents and cross-check matching criteria automatically.'
    },
    {
      number: '04',
      title: 'One-Click Apply',
      description: 'Get ranked recommendations with reasoning, and follow guided steps to apply.'
    }
  ];

  return (
    <div className="min-h-screen bg-custom-image flex flex-col justify-between overflow-x-hidden relative transition-colors duration-300">
      
      {/* Decorative Orbs */}
      <div className="absolute top-[-5%] left-[-10%] w-[600px] h-[600px] rounded-full bg-sky-400/10 blur-[130px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-400/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-400/10 blur-[140px] pointer-events-none animate-pulse-slow"></div>

      {/* Top Header / Navigation Bar (Full Page Width - Edge to Edge) */}
      <header className="w-full relative z-30 border-b border-slate-200/80 dark:border-slate-800/60 bg-white/90 dark:bg-[#050b18]/80 backdrop-blur-md transition-colors duration-300">
        <nav className="w-full px-4 sm:px-8 py-3.5 flex items-center justify-between">
          
          {/* Left Section: Logo positioned at leftmost corner */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25 flex items-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400">
                ScholarAI
              </span>
            </Link>
          </div>

          {/* Right Section: Navigation Links + Theme Toggle + Actions all aligned on the Right */}
          <div className="flex items-center gap-6 lg:gap-8 shrink-0">
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <a href="#how-it-works" className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                How It Works
              </a>
              <a href="#agents" className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                Meet the Agents
              </a>
              <a href="#features" className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                Features
              </a>
            </div>

            <div className="flex items-center gap-3.5 sm:gap-4">
              <ThemeToggle />
              {user ? (
                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95 shadow-md shadow-sky-500/20 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="hidden sm:flex items-center gap-2.5">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-all cursor-pointer"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95 shadow-md shadow-sky-500/20 font-bold text-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    Register <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden w-full border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#071126]/95 backdrop-blur-xl px-6 py-4 flex flex-col gap-3.5 animate-slide-up">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 py-1"
            >
              How It Works
            </a>
            <a
              href="#agents"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 py-1"
            >
              Meet the Agents
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 py-1"
            >
              Features
            </a>
            {!user && (
              <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Link
                  to="/login"
                  className="flex-1 text-center py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex-1 text-center py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Hero Section - Elevated Content in Sky Area Above Students */}
      <section className="relative z-10 w-full min-h-[85vh] lg:min-h-[88vh] flex flex-col justify-between items-center overflow-hidden">
        {/* Full-Width Bright Background Image */}
        <div className="absolute inset-0 w-full h-full z-0">
          <img
            src="/home_hero.jpg"
            alt="ScholarAI Campus Background"
            className="w-full h-full object-cover object-bottom sm:object-[center_bottom] scale-[1.01] brightness-105 contrast-[1.02]"
          />
          {/* Subtle translucent top gradient to keep text crisp while keeping image vivid and bright */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/65 via-transparent to-[#030712]/40 dark:from-[#030712]/65 dark:via-transparent dark:to-[#030712]/40"></div>
          {/* Bright Sunlit Sky Glow */}
          <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-sky-400/20 blur-[120px] rounded-full pointer-events-none"></div>
        </div>

        {/* Elevated Hero Content Container Positioned Higher Up into the Sky */}
        <div className="relative z-10 px-6 max-w-6xl mx-auto w-full pt-3 sm:pt-5 lg:pt-6 pb-2 flex flex-col items-center justify-start text-center animate-slide-up">
          
          {/* 1. Small Top Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/85 dark:bg-slate-900/90 backdrop-blur-md border border-sky-400/40 text-sky-300 dark:text-sky-400 text-[10px] sm:text-xs font-black uppercase tracking-wider mb-2.5 shadow-xl">
            <span>✦</span> POWERED BY AUTONOMOUS AI AGENTS
          </div>
          
          {/* 2. Main Centered Heading - ONE SINGLE LINE */}
          <h1 className="text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-[2.15rem] font-black tracking-tight leading-tight mb-2 text-center drop-shadow-lg max-w-6xl whitespace-normal sm:whitespace-nowrap">
            <span className="text-white">AGENTIC AI SCHOLARSHIP </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400">
              DISCOVERY & VERIFICATION PLATFORM
            </span>
          </h1>
          
          {/* 3. Centered 1-2 Line Description */}
          <p className="text-xs sm:text-sm text-slate-200 dark:text-slate-300 max-w-xl mx-auto leading-relaxed font-medium drop-shadow text-center">
            AI agents match students with eligible scholarships, verify documents, and guide them through the application process.
          </p>
        </div>
      </section>

      {/* How ScholarAI Works Section */}
      <section id="how-it-works" className="relative z-10 px-6 max-w-7xl mx-auto w-full py-16 border-t border-slate-300/20 dark:border-slate-800/20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">How ScholarAI Works</h2>
          <p className="text-slate-600 dark:text-slate-400">
            From registration to recommended plans, our agentic workflow removes manual filters and replaces them with direct guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl relative border border-white/20">
              <span className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-500 opacity-60 absolute top-4 right-4">
                {step.number}
              </span>
              <h3 className="text-lg font-bold mb-3 mt-6 text-slate-800 dark:text-slate-200">{step.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Meet the AI Agents Section */}
      <section id="agents" className="relative z-10 px-6 max-w-7xl mx-auto w-full py-16 border-t border-slate-300/20 dark:border-slate-800/20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Meet Your AI Agents</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Our platform operates with multiple specialized agents acting collaboratively to build your personalized plan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {agents.map((agent, i) => {
            const IconComponent = agent.icon;
            return (
              <div key={i} className="glass-panel p-6 rounded-2xl border border-white/20 flex flex-col justify-between glass-panel-hover">
                <div>
                  <div className={`p-3 rounded-xl bg-gradient-to-tr ${agent.color} text-white w-fit mb-6 shadow-md`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">{agent.name}</h3>
                  <p className="text-xs font-semibold text-sky-500 uppercase tracking-wider mb-4">{agent.role}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{agent.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 max-w-7xl mx-auto w-full py-16 border-t border-slate-300/20 dark:border-slate-800/20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Powerful Features</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Intelligent features built to streamline documents, eligibility analysis, and application pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-6 rounded-2xl border border-white/20">
            <h3 className="text-lg font-bold mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-sky-500" /> Document Verification
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Verify your marksheets, caste, and income certificates using smart OCR and database checks to verify compliance.
            </p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/20">
            <h3 className="text-lg font-bold mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sky-500" /> AI Conversational Assistant
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Ask specific questions about scholarship rules, deadlines, or document formats, and get RAG-driven answers.
            </p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/20">
            <h3 className="text-lg font-bold mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-500" /> Matches with Explanations
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              See exact reasons why you qualified or didn't qualify for a scholarship, explained in clear, natural language.
            </p>
          </div>
        </div>
      </section>

      {/* Redesigned 5-Column Polished Modern Footer (Full Width Edge to Edge) */}
      <footer className="w-full pt-12 pb-8 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#050b18]/80 backdrop-blur-md z-10 relative transition-colors duration-300">
        <div className="w-full px-4 sm:px-8 lg:px-12">
          
          {/* Main 5-Column Grid spanning full page width */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 items-start mb-10 text-left w-full">
            
            {/* Column 1: ScholarAI Brand */}
            <div className="lg:col-span-1 pr-2">
              <Link to="/" className="flex items-center gap-2.5 mb-3.5">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20 flex items-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400">
                  ScholarAI
                </span>
              </Link>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Agentic AI-powered scholarship discovery, eligibility matching, document verification, and application assistance.
              </p>
            </div>

            {/* Column 2: Platform */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3.5 text-xs sm:text-sm uppercase tracking-wider">
                Platform
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                <li>
                  <a href="#how-it-works" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#agents" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    Meet the Agents
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <Link to="/dashboard/recommendations" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    Scholarships
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3.5 text-xs sm:text-sm uppercase tracking-wider">
                Resources
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                <li>
                  <Link to="/dashboard/journey" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    Scholarship Guide
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard/eligibility" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    Eligibility Help
                  </Link>
                </li>
                <li>
                  <a href="#features" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <Link to="/dashboard/history" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    Application History
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Security */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3.5 text-xs sm:text-sm uppercase tracking-wider">
                Security
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                <li>
                  <a href="#privacy" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#terms" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#security" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    Data Security
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 5: Contact */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3.5 text-xs sm:text-sm uppercase tracking-wider">
                Contact
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                <a href="mailto:support@scholarai.edu" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  support@scholarai.edu
                </a>
                <br />
                Tamil Nadu, India
              </p>
            </div>
          </div>

          {/* Thin Divider & Bottom Bar */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <p>© 2026 ScholarAI. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#privacy" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#terms" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
