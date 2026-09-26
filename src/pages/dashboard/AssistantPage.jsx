import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../../components/ThemeToggle';
import { GlassCard } from '../../components/GlassCard';
import { useToast } from '../../components/Toast';
import { LanguageSelector } from '../../components/LanguageSelector';
import { useLanguage } from '../../context/LanguageContext';
import { VoiceInput } from '../../components/VoiceInput';
import { VoiceOutput } from '../../components/VoiceOutput';
import api from '../../services/api';
import {
  GraduationCap,
  ArrowLeft,
  Sparkles,
  Send,
  User,
  Brain,
  Compass,
  ArrowRight,
  TrendingUp,
  Bookmark,
  Calendar,
  Award,
  BookOpen,
  Info,
  Clock,
  Sparkle,
  PlusCircle,
  Trash2
} from 'lucide-react';

export const AssistantPage = () => {
  const { currentLang, t } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello ${user?.fullName || 'Student'}! How can I help you today? Ask me anything about your scholarships.`,
      time: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmNewChat, setConfirmNewChat] = useState(false);
  const messagesEndRef = useRef(null);

  const handleNewChat = async () => {
    if (!confirmNewChat) {
      setConfirmNewChat(true);
      setTimeout(() => setConfirmNewChat(false), 3000); // auto-reset after 3s if not confirmed
      return;
    }
    try {
      await api.delete('/chat');
      setMessages([
        {
          sender: 'ai',
          text: `Hello ${user?.fullName || 'Student'}! New conversation started. How can I help you today?`,
          time: 'Just now'
        }
      ]);
      setConfirmNewChat(false);
      showToast('New conversation started!', 'success');
    } catch (err) {
      console.error('Failed to clear chat:', err);
      showToast('Failed to clear conversation.', 'error');
      setConfirmNewChat(false);
    }
  };

  const suggestedQuestions = [
    { text: 'Why am I eligible?', icon: Info },
    { text: 'Improve my profile', icon: User },
    { text: 'Compare scholarships', icon: Compass },
    { text: 'Best scholarship', icon: Award },
    { text: 'Deadline reminder', icon: Clock },
    { text: 'Required documents', icon: BookOpen }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    api.get('/chat')
      .then((res) => {
        if (res.data.length > 0) {
          const loaded = res.data.map(m => ({
            sender: m.sender === 'assistant' ? 'ai' : 'user',
            text: m.message,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setMessages(loaded);
        }
      })
      .catch((err) => {
        console.error('Failed to load chat history:', err);
      });
  }, []);

  const handleSend = (textToSend) => {
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    api.post('/chat', { message: textToSend, language: currentLang })
      .then((res) => {
        const aiMsg = {
          sender: 'ai',
          text: res.data.assistant.message,
          time: new Date(res.data.assistant.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiMsg]);
        setLoading(false);
      })
      .catch((err) => {
        showToast('Failed to connect to Gemini AI Advisor.', 'error');
        setLoading(false);
        console.error(err);
      });
  };

  return (
    <div className="min-h-screen bg-custom-image flex flex-col justify-between overflow-x-hidden relative transition-colors duration-300">
      <div className="absolute top-[-5%] left-[-10%] w-[600px] h-[600px] rounded-full bg-sky-400/10 blur-[130px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[5%] right-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-400/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>

      {/* Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg flex items-center">
            <GraduationCap className="w-6 h-6" />
          </Link>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400">
            ScholarAI
          </span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Link to="/dashboard" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-350 font-semibold text-sm transition-all">
            <ArrowLeft className="w-4.5 h-4.5" /> {t('back', 'Back')}
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Content: Chat Layout */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-6 flex flex-col lg:flex-row gap-6 relative z-10 h-[calc(100vh-140px)]">
        
        {/* Suggested Prompts Sidebar */}
        <div className="w-full lg:w-72 flex flex-col gap-4 animate-slide-up">
          <GlassCard className="border border-slate-200/80 dark:border-white/20 p-5 shadow-lg bg-white/70 dark:bg-slate-900/60">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Suggested Questions
            </h3>
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-thin">
              {suggestedQuestions.map((q, idx) => {
                const Icon = q.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(q.text)}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white/90 dark:bg-slate-900/40 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-500 text-left text-xs font-bold text-slate-900 dark:text-slate-100 transition-all whitespace-nowrap cursor-pointer shadow-sm focus:outline-none"
                  >
                    <Icon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>{q.text}</span>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Chat Console */}
        <GlassCard className="flex-1 border border-slate-200/80 dark:border-white/20 flex flex-col justify-between p-0 overflow-hidden relative min-h-[450px] shadow-2xl shadow-cyan-500/[0.03] bg-white/80 dark:bg-slate-900/60">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-850/30 bg-white/80 dark:bg-slate-950/40 backdrop-blur flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  🤖 ScholarAI Assistant
                </h2>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> AI Online
                </span>
              </div>
            </div>

            {/* + New Chat Button */}
            <button
              onClick={handleNewChat}
              title={confirmNewChat ? "Click again to confirm" : "Start a new conversation"}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm border focus:outline-none
                ${confirmNewChat
                  ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400 animate-pulse'
                  : 'bg-white/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-400'
                }`}
            >
              {confirmNewChat ? (
                <><Trash2 className="w-3.5 h-3.5" /> Confirm Clear?</>
              ) : (
                <><PlusCircle className="w-3.5 h-3.5" /> New Chat</>
              )}
            </button>
          </div>

          {/* Messages Output Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 max-h-[50vh] lg:max-h-[55vh] scrollbar-thin">
            
            {/* Example Questions Box (only shown if chat is empty except for welcome) */}
            {messages.length === 1 && (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/30 space-y-2.5 animate-slide-up mb-4">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">Example Questions</span>
                <ul className="text-xs text-slate-800 dark:text-slate-200 space-y-1.5 font-bold">
                  <li>• Why am I eligible for NSP Merit?</li>
                  <li>• Which scholarship should I apply first?</li>
                  <li>• How can I improve my profile?</li>
                  <li>• Why was State Scholarship rejected?</li>
                </ul>
              </div>
            )}

            {messages.map((msg, idx) => {
              const renderMessageText = (txt) => {
                if (!txt) return null;

                const lines = txt.split('\n');
                
                const badgeElements = [];
                const bodyElements = [];
                const sourceElements = [];
                const buttonElements = [];
                
                let tableHeaders = null;
                let tableRows = [];
                let inTable = false;
                let listItems = [];
                let inList = false;

                const renderTable = (headers, rows, key) => (
                  <div key={key} className="my-3 overflow-x-auto rounded-xl border border-slate-300/80 dark:border-white/10 shadow-sm">
                    <table className="w-full text-[11px] text-left border-collapse bg-slate-50 dark:bg-slate-950/60">
                      <thead>
                        <tr className="bg-slate-200/90 dark:bg-slate-900/80 text-slate-900 dark:text-sky-200 border-b border-slate-300 dark:border-white/10">
                          {headers.map((h, i) => (
                            <th key={i} className="px-3 py-2 font-black uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );

                const renderList = (items, key) => (
                  <ul key={key} className="my-2.5 space-y-2 text-slate-900 dark:text-slate-100 font-bold text-xs list-none pl-1">
                    {items.map((it, i) => {
                      // Support red/yellow status indicator dots
                      let dotColor = "bg-amber-500";
                      if (it.toLowerCase().includes('sona') || it.toLowerCase().includes('deadline is 2026-08-25') || it.toLowerCase().includes('red')) {
                        dotColor = "bg-rose-500";
                      }
                      return (
                        <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                          <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0 mt-1.5`}></span>
                          <span>{it}</span>
                        </li>
                      );
                    })}
                  </ul>
                );

                for (let idx = 0; idx < lines.length; idx++) {
                  const line = lines[idx].trim();

                  // Table Parsing
                  if (line.startsWith('|')) {
                    inTable = true;
                    if (inList && listItems.length > 0) {
                      bodyElements.push(renderList(listItems, `list-${idx}`));
                      listItems = [];
                      inList = false;
                    }
                    const cells = line.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
                    if (line.includes('---')) {
                      continue;
                    }
                    if (!tableHeaders) {
                      tableHeaders = cells;
                    } else {
                      tableRows.push(cells);
                    }
                    continue;
                  } else {
                    if (inTable) {
                      if (tableHeaders && tableRows.length > 0) {
                        bodyElements.push(renderTable(tableHeaders, tableRows, `table-${idx}`));
                      }
                      tableHeaders = null;
                      tableRows = [];
                      inTable = false;
                    }
                  }

                  // Checkmark Badges (top bar status indicators)
                  if (line.startsWith('✔') || line.startsWith('✓')) {
                    const cleanBadge = line.replace(/^[✔✓]\s*/, '');
                    badgeElements.push(
                      <div key={`badge-${idx}`} className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">✔</span>
                        <span>{cleanBadge}</span>
                      </div>
                    );
                    continue;
                  }

                  // Bullet Lists
                  if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
                    inList = true;
                    const cleanText = line.replace(/^[-•*]\s*/, '');
                    listItems.push(cleanText);
                    continue;
                  } else {
                    if (inList) {
                      bodyElements.push(renderList(listItems, `list-${idx}`));
                      listItems = [];
                      inList = false;
                    }
                  }

                  // Action Buttons (Outside/Below card)
                  if (line.startsWith('[') && line.endsWith(']')) {
                    const buttons = line.split(']').map(b => b.replace('[', '').trim()).filter(Boolean);
                    buttons.forEach((btnText, i) => {
                      if (btnText.toLowerCase().includes('certificate generator')) {
                        return; // Exclude certificate generator button
                      }
                      buttonElements.push(
                        <button
                          key={`${idx}-${i}`}
                          onClick={() => {
                            const lower = btnText.toLowerCase();
                            if (lower.includes('upload document') || lower.includes('upload') || lower.includes('documents') || lower.includes('document')) {
                              navigate('/dashboard/documents');
                            } else if (lower.includes('edit profile') || lower.includes('improve my profile') || lower.includes('profile')) {
                              navigate('/dashboard/profile');
                            } else if (lower.includes('check eligibility') || lower.includes('eligibility') || lower.includes('eligible scholarships')) {
                              navigate('/dashboard/eligibility');
                            } else if (lower.includes('view deadline') || lower.includes('deadlines') || lower.includes('compare') || lower.includes('scholarship')) {
                              navigate('/dashboard/scholarships');
                            } else {
                              handleSend(btnText);
                            }
                          }}
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-[11px] flex items-center gap-1 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none"
                        >
                          <span>{btnText}</span>
                        </button>
                      );
                    });
                    continue;
                  }

                  // Sources
                  if (line.includes('SOURCES & GROUNDING RULES:') || line.startsWith('📖') || line.toLowerCase().startsWith('source:')) {
                    const cleanSource = line.replace(/^📖\s*/, '').replace(/SOURCES & GROUNDING RULES:?/i, '').replace(/^Sources?:?/i, '').trim();
                    if (cleanSource) {
                      const urlMatch = cleanSource.match(/(https?:\/\/[^\s\)]+)/i);
                      const url = urlMatch ? urlMatch[1] : null;
                      const displayText = url ? cleanSource.replace(url, '').replace(/[—\-–\(\)]+$/, '').trim() : cleanSource;

                      sourceElements.push(
                        <div key={`source-${idx}`} className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-sky-50/80 dark:bg-slate-950/60 border border-sky-200/80 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-sky-200">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
                            <span>{displayText || cleanSource}</span>
                          </div>
                          {url && (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline font-black flex items-center gap-0.5 shrink-0"
                            >
                              Visit Source ↗
                            </a>
                          )}
                        </div>
                      );
                    }
                    continue;
                  }

                  // Default text paragraph
                  if (line !== '') {
                    bodyElements.push(
                      <p key={`text-${idx}`} className="text-slate-900 dark:text-slate-100 font-bold text-xs leading-relaxed">
                        {line}
                      </p>
                    );
                  }
                }

                if (inTable && tableHeaders && tableRows.length > 0) {
                  bodyElements.push(renderTable(tableHeaders, tableRows, 'table-final'));
                }
                if (inList && listItems.length > 0) {
                  bodyElements.push(renderList(listItems, 'list-final'));
                }

                return (
                  <div className="flex flex-col gap-2.5">
                    {/* Top status bar */}
                    {badgeElements.length > 0 && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 p-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-900 shadow-inner">
                        {badgeElements.map((b, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span className="text-slate-400 dark:text-slate-700 font-bold select-none">•</span>}
                            {b}
                          </React.Fragment>
                        ))}
                      </div>
                    )}

                    {/* AI Response Bubble: Solid crisp background with dark bold readable text in light mode, sleek glowing dark in dark mode */}
                    <div className="bg-slate-50/95 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col gap-3">
                      {bodyElements}

                      {/* Source grounding block */}
                      {sourceElements.length > 0 && (
                        <div className="mt-1 pt-3.5 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2">
                          <span className="text-[9px] font-black text-slate-600 dark:text-sky-300 uppercase tracking-widest block">Sources & Grounding Rules:</span>
                          {sourceElements}
                        </div>
                      )}
                    </div>

                    {/* Action buttons (placed outside the bubble card) */}
                    {buttonElements.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 mt-1.5 pl-0.5">
                        {buttonElements}
                      </div>
                    )}
                  </div>
                );
              };

              return (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`p-2 h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.sender === 'user' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-sky-500/10 text-sky-500'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-4.5 h-4.5" /> : <Sparkles className="w-4.5 h-4.5" />}
                  </div>
                  <div>
                    {msg.sender === 'user' ? (
                      <div className="p-4 rounded-2xl text-xs shadow-sm bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-tr-none font-bold">
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    ) : (
                      <>
                        {renderMessageText(msg.text)}
                      </>
                    )}
                    <div className={`flex items-center gap-2 mt-1 ${msg.sender === 'user' ? 'justify-end' : 'justify-between'}`}>
                      {msg.sender !== 'user' && (
                        <VoiceOutput text={msg.text} />
                      )}
                      <span className="block text-[9px] font-bold text-slate-400">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="p-2 h-9 w-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/80 to-blue-600/80 text-white rounded-tl-none border border-cyan-500/10 flex flex-col gap-1 shadow-sm">
                    <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest">ScholarAI</span>
                    <span className="text-xs">ScholarAI is thinking...</span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input Bar with Voice Microphone and Cyan Glow border */}
          <div className="p-4 border-t border-slate-300/30 dark:border-slate-850/30 bg-white/30 dark:bg-slate-950/20 backdrop-blur flex items-center gap-2">
            <VoiceInput
              onTranscript={(transcript) => setInputValue(transcript)}
              disabled={loading}
            />
            <input
              type="text"
              placeholder={t('askAssistantPlaceholder', 'Ask ScholarAI anything...')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
              className="flex-1 py-3 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-cyan-500/80 focus:shadow-[0_0_8px_rgba(6,182,212,0.3)] transition-all"
            />
            <button
              onClick={() => handleSend(inputValue)}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-md hover:opacity-95 transition-all focus:outline-none cursor-pointer disabled:opacity-50"
            >
              {t('send', 'Send')}
            </button>
          </div>
        </GlassCard>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-300/30 dark:border-slate-800/30 z-10 relative">
        <p>© {new Date().getFullYear()} ScholarAI. All rights reserved.</p>
      </footer>
    </div>
  );
};
