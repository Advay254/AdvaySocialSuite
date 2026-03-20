const ChatWidget = (() => {

  let messages = [];
  let isOpen = false;
  let isTyping = false;

  const WELCOME = "Hey! I'm Advay's assistant 👋 I can help you learn about his projects, tools, and services. What would you like to know?";

  function init() {
    const root = document.getElementById('chat-widget-root');
    if (!root) return;

    root.innerHTML = `
      <!-- Suggestion button (bottom-left) -->
      <button id="suggest-btn" class="suggest-float-btn" title="Send a suggestion" onclick="ChatWidget._openSuggest()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </button>

      <!-- Suggestion modal -->
      <div id="suggest-modal" class="suggest-modal hidden">
        <div class="suggest-box">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-heading font-700 text-white text-base">Send a Suggestion</h4>
            <button onclick="ChatWidget._closeSuggest()" class="text-slate-500 hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="form-group">
            <label class="form-label">Your suggestion</label>
            <textarea id="suggest-content" class="form-textarea" rows="4" placeholder="Ideas, feedback, bugs, feature requests..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Email (optional)</label>
            <input type="email" id="suggest-email" class="form-input" placeholder="your@email.com">
          </div>
          <button onclick="ChatWidget._submitSuggest()" class="btn-primary w-full justify-center text-sm">
            Submit Suggestion
          </button>
          <p id="suggest-msg" class="hidden mt-3 text-center text-emerald text-xs">✓ Suggestion received! Thanks.</p>
        </div>
      </div>

      <!-- Chat trigger button -->
      <button id="chat-trigger-btn" class="chat-widget-btn" onclick="ChatWidget._toggle()" title="Chat with Advay's AI">
        <svg id="chat-open-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <svg id="chat-close-icon" class="hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>

      <!-- Chat panel -->
      <div id="chat-panel" class="chat-widget-panel hidden">
        <!-- Header -->
        <div class="chat-header">
          <div class="chat-agent-info">
            <div class="chat-agent-avatar">🤖</div>
            <div>
              <div class="font-heading font-700 text-white text-sm">Advay's Assistant</div>
              <div class="chat-status">Online</div>
            </div>
          </div>
          <button onclick="ChatWidget._toggle()" class="text-slate-500 hover:text-white transition-colors p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Messages -->
        <div class="chat-messages" id="chat-messages"></div>

        <!-- Input area -->
        <div class="chat-input-area">
          <textarea id="chat-input" class="chat-input" rows="1"
                    placeholder="Ask about Advay's projects..."
                    onkeydown="ChatWidget._keydown(event)"
                    oninput="ChatWidget._autoResize(this)"></textarea>
          <button class="chat-send-btn" id="chat-send-btn" onclick="ChatWidget._send()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      </div>
    `;

    // Inject suggest button styles
    const style = document.createElement('style');
    style.textContent = `
      .suggest-float-btn {
        position: fixed; bottom: 24px; left: 24px;
        width: 44px; height: 44px; border-radius: 50%;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        cursor: pointer; z-index: 999;
        display: flex; align-items: center; justify-content: center;
        color: rgba(255,255,255,0.4); transition: all .3s ease;
      }
      .suggest-float-btn:hover {
        background: rgba(139,92,246,0.15);
        border-color: rgba(139,92,246,0.4);
        color: #8b5cf6;
        box-shadow: 0 0 16px rgba(139,92,246,0.2);
      }
      .suggest-modal {
        position: fixed; inset: 0; z-index: 9998;
        background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
      }
      .suggest-modal.hidden { display: none; }
      .suggest-box {
        background: #0a0f23;
        border: 1px solid rgba(0,229,255,0.2);
        border-radius: 18px;
        padding: 28px;
        width: 100%;
        max-width: 440px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      }
    `;
    document.head.appendChild(style);

    // Add welcome message
    _addMessage('assistant', WELCOME);
  }

  function _toggle() {
    isOpen = !isOpen;
    const panel = document.getElementById('chat-panel');
    const openIcon = document.getElementById('chat-open-icon');
    const closeIcon = document.getElementById('chat-close-icon');
    panel.classList.toggle('hidden', !isOpen);
    openIcon.classList.toggle('hidden', isOpen);
    closeIcon.classList.toggle('hidden', !isOpen);
    if (isOpen) {
      setTimeout(() => document.getElementById('chat-input')?.focus(), 200);
    }
  }

  function _addMessage(role, content) {
    messages.push({ role, content });
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = `chat-bubble ${role}`;
    div.textContent = content;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function _showTyping() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'chat-typing';
    div.id = 'typing-indicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function _hideTyping() {
    document.getElementById('typing-indicator')?.remove();
  }

  async function _send() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    if (!input) return;

    const text = input.value.trim();
    if (!text || isTyping) return;

    input.value = '';
    input.style.height = 'auto';
    _addMessage('user', text);
    isTyping = true;
    sendBtn.disabled = true;
    _showTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.filter(m => m.role !== 'system').slice(-10),
        }),
      });
      const data = await res.json();
      _hideTyping();

      if (data.error) {
        _addMessage('assistant', 'Sorry, I ran into an issue. Please try again.');
      } else {
        _addMessage('assistant', data.reply);
      }
    } catch {
      _hideTyping();
      _addMessage('assistant', 'Connection error. Please try again.');
    } finally {
      isTyping = false;
      sendBtn.disabled = false;
    }
  }

  function _keydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      _send();
    }
  }

  function _autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  }

  function _openSuggest() {
    document.getElementById('suggest-modal').classList.remove('hidden');
    document.getElementById('suggest-msg').classList.add('hidden');
  }

  function _closeSuggest() {
    document.getElementById('suggest-modal').classList.add('hidden');
  }

  async function _submitSuggest() {
    const content = document.getElementById('suggest-content').value.trim();
    const email = document.getElementById('suggest-email').value.trim();
    const msg = document.getElementById('suggest-msg');

    if (!content) return;

    try {
      await App.api('/api/suggest', { method: 'POST', body: { content, email } });
      document.getElementById('suggest-content').value = '';
      document.getElementById('suggest-email').value = '';
      msg.classList.remove('hidden');
      setTimeout(() => {
        msg.classList.add('hidden');
        _closeSuggest();
      }, 2500);
    } catch {
      App.showToast('Failed to submit suggestion.', 'error');
    }
  }

  return { init, _toggle, _send, _keydown, _autoResize, _openSuggest, _closeSuggest, _submitSuggest };
})();
