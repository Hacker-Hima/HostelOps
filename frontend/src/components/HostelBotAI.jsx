import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setAiDrawerOpen, addTicket, addToast } from '../redux/ticketSlice';
import { audioFx } from '../utils/audioFx';
import { useTranslation } from '../utils/translations';

const SMART_PROMPTS = [
  { id: 'diag_ac', icon: '❄️', label: 'Diagnose AC cooling defect', query: 'My AC is turning on but blowing room-temperature air. What should I check?' },
  { id: 'plumb_est', icon: '💧', label: 'Estimate plumbing repair time & cost', query: 'What is the estimated cost and worker requirement to replace a bathroom water mixer in Block A?' },
  { id: 'warden_memo', icon: '📝', label: 'Draft Warden approval memo', query: 'Draft a formal approval memo for Residential Warden to release ₹45,000 for Mess Chimney overhaul.' },
  { id: 'worker_assign', icon: '⚡', label: 'Recommend best technician', query: 'Which technician is best suited for urgent geyser short-circuiting in Room A-215?' },
  { id: 'energy_audit', icon: '🌱', label: 'Hostel power & asset health audit', query: 'Summarize the current maintenance load and high-risk assets across all hostel blocks.' },
];

const PRESET_RESPONSES = {
  diag_ac: {
    text: `### 🤖 HostelOps AI Diagnostic: Split AC Issue
**Probable Causes:**
1. **Dust-clogged air filter** (75% probability) — reduces airflow over evaporator coil.
2. **Refrigerant gas leak** (R32 / R410A) — compressor runs without cooling.
3. **Capacitor degradation** — fan runs but compressor fails to engage.

**Recommended Action:**
- Isolate power at MCB board.
- Dispatch **Sarathi Kamal (Electrical/AC Specialist)** with digital manifold gauge and coil cleaner.
- *Estimated resolution time: 45 minutes.*`,
    suggestTicket: { title: 'AC Cooling Failure — Gas & Filter Check', category: 'Electrical', priority: 'High' }
  },
  plumb_est: {
    text: `### 🤖 HostelOps AI Cost & SLA Estimation
**Scope:** Bathroom Water Mixer & Pressure Joint Overhaul
- **Labor:** ₹400 – ₹600 (Plumber 1.5 hrs)
- **Parts (Brass Mixer + Teflon Seal + SS Braided Pipe):** ₹1,800 – ₹2,400
- **Total Estimated Cost:** **₹2,200 – ₹3,000**
- **Recommended Technician:** **Dhariq Anwar** (Plumber, Rating 4.6⭐)
- **SLA:** Can be scheduled for today's afternoon maintenance slot (2:00 PM – 4:00 PM).`,
    suggestTicket: { title: 'Water Mixer & Joint Replacement', category: 'Plumbing', priority: 'Medium' }
  },
  warden_memo: {
    text: `### 📝 Formal Approval Memorandum
**TO:** Residential Warden / Principal Office
**FROM:** Assistant Warden & Mess Committee
**SUBJECT:** Urgent Approval & Budget Release for Mess Chimney Overhaul (REQ-4092)

*Respected Sir/Madam,*
This is to request expedited financial sanction of **₹45,000** for the total cleaning and motor rewinding of the main dining hall exhaust chimney. Heavy grease build-up poses an immediate fire hazard and impairs ventilation during peak mess operations.

- **Vendor Quotation Attached:** ₹45,000 inclusive of GST & 6-month warranty.
- **Budget Head:** Annual Kitchen Maintenance (Utilized: 68%).
*Kindly approve the expenditure to initiate vendor procurement immediately.*`,
    suggestTicket: null
  },
  worker_assign: {
    text: `### ⚡ AI Dispatch Recommendation
For ticket **TKT-318 (Geyser Sparking in A-215)**:
- **Recommended Worker:** **Mohan Kumar** (Master Electrician, Rating 4.7⭐, 210 jobs completed)
- **Current Availability:** Available (1 active job in queue)
- **Safety Precaution:** Issue immediate remote alert to student: *Do not switch ON geyser until technician arrives.*`,
    suggestTicket: { title: 'Urgent Geyser Rewiring & Heating Element', category: 'Electrical', priority: 'High' }
  },
  energy_audit: {
    text: `### 📊 Hostel Operations & Asset Health Summary
- **Total Physical Assets:** 147 mapped items
- **Overall Health Score:** **92.4% Optimal**
- **High-Risk Items:**
  - 1x Geyser (Room A-215) — Sparking noted (Immediate attention required)
  - 1x Ceiling Fan (Room B-112) — Bent blade vibration
  - 1x Washroom Tap (Room A-204) — Water leak (Dispatched)
- **Budget Trajectory:** 68% utilized (On track with -4% variance below cap).`,
    suggestTicket: null
  }
};

export default function HostelBotAI({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();

  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'bot',
      text: `👋 **Hello ${currentUser.name}!** I am **HostelBot AI**, your intelligent hostel operations copilot.
How can I assist you today? You can choose a quick diagnostic below or ask me any hostel maintenance question!`,
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendPrompt = (promptKey, queryText) => {
    audioFx.playClick();
    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: queryText,
      time: 'Just now',
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const resp = PRESET_RESPONSES[promptKey] || {
        text: `### 🤖 HostelBot AI Analysis
I have processed your query: **"${queryText}"**

Based on our real-time hostel maintenance logs and asset health index:
- **Status:** Logged for automated review.
- **Priority Estimation:** Medium/High based on equipment category.
- **Next Step:** You can raise a ticket directly or consult with Block A Warden Dr. Meena Sharma.`,
        suggestTicket: { title: queryText.substring(0, 35), category: 'Electrical', priority: 'Medium' }
      };

      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: resp.text,
          time: 'Just now',
          suggestTicket: resp.suggestTicket,
        },
      ]);
      audioFx.playChime();
    }, 700);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');

    const matchedKey = Object.keys(PRESET_RESPONSES).find(k =>
      text.toLowerCase().includes(k.replace('_', ' ')) ||
      (k === 'diag_ac' && text.toLowerCase().includes('ac')) ||
      (k === 'plumb_est' && (text.toLowerCase().includes('plumb') || text.toLowerCase().includes('water'))) ||
      (k === 'warden_memo' && (text.toLowerCase().includes('memo') || text.toLowerCase().includes('approv'))) ||
      (k === 'worker_assign' && (text.toLowerCase().includes('technician') || text.toLowerCase().includes('electrician')))
    );

    handleSendPrompt(matchedKey || 'custom', text);
  };

  const handleCreateTicketFromAI = (suggested) => {
    if (!suggested) return;
    const newId = `TKT-${Math.floor(100 + Math.random() * 900)}`;
    const tk = {
      id: newId,
      title: suggested.title,
      student: currentUser.name,
      room: currentUser.room || 'A-204',
      category: suggested.category || 'Electrical',
      priority: suggested.priority || 'High',
      status: 'Pending',
      assignedWorker: 'Unassigned',
      assetTag: `QR-${currentUser.room || 'A-204'}-AI-01`,
      createdAt: 'Just now',
      creatorRole: 'HostelBot AI',
      description: `Auto-generated from AI Copilot diagnostic for ${currentUser.name}.`,
    };
    dispatch(addTicket(tk));
    audioFx.playSuccess();
    dispatch(addToast({
      id: `toast-ai-tk-${Date.now()}`,
      message: `AI Ticket ${newId} logged successfully!`,
      type: 'success',
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="ai-drawer-overlay" onClick={onClose}>
      <div className="ai-drawer" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="ai-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="ai-bot-avatar">
              <span className="ai-bot-icon">🤖</span>
              <span className="ai-live-glow" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>HostelBot AI Copilot</h3>
              <p style={{ fontSize: 11, color: 'var(--accent-cyan)' }}>
                ● Real-time Diagnostics & Asset Intelligence
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Quick Prompt Chips Carousel */}
        <div className="ai-prompts-bar">
          {SMART_PROMPTS.map((p) => (
            <button
              key={p.id}
              className="ai-prompt-pill"
              onClick={() => handleSendPrompt(p.id, p.query)}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Message Stream */}
        <div className="ai-messages-container" ref={scrollRef}>
          {messages.map((m) => (
            <div key={m.id} className={`ai-message-bubble ${m.sender}`}>
              <div className="ai-msg-header">
                <span className="ai-msg-author">{m.sender === 'bot' ? '🤖 HostelBot AI' : `👤 ${currentUser.name}`}</span>
                <span className="ai-msg-time">{m.time}</span>
              </div>
              <div className="ai-msg-content" style={{ whiteSpace: 'pre-line' }}>
                {m.text}
              </div>

              {/* Suggest Ticket Action Button */}
              {m.suggestTicket && (
                <div className="ai-ticket-action-box">
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    ⚡ AI Action Suggestion: <strong>{m.suggestTicket.title}</strong> ({m.suggestTicket.category})
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 6 }}
                    onClick={() => handleCreateTicketFromAI(m.suggestTicket)}
                  >
                    🚀 Auto-Log Ticket Now
                  </button>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="ai-typing-indicator">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>HostelBot is analyzing...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleCustomSubmit} className="ai-input-form">
          <input
            className="ai-input-field"
            placeholder="Ask HostelBot anything (e.g. diagnose water leak, repair cost)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 18px', height: 42 }}>
            ➤
          </button>
        </form>

      </div>
    </div>
  );
}
