/* Chat + Suggestion merged widget */
const ChatWidget = (() => {
  let messages = [];
  let isOpen = false;
  let activeTab = 'chat';
  let isTyping = false;

  const WELCOME = "Hey! I'm Advay's assistant 👋 Ask me about his projects, tools, or how to collaborate.";

  function init() {
    const root = document.getElementById('chat-widget-root');
    if (!root) return;

    root.innerHTML = `
      <!-- FAB -->
      <button id="chat-fab" onclick="ChatWidget._toggle()" title="Chat or send a suggestion"
        style="position:fixed;bottom:24px;right:24px;width:54px;height:54px;border-radius:50%;
          background:linear-gradient(135deg,var(--cyan),var(--violet));border:none;cursor:pointer;
          z-index:999;display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 24px color-mix(in srgb,var(--cyan) 35%,transparent);transition:all .3s ease;">
        <svg id="fab-open" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <svg id="fab-close" class="hidden" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>

      <!-- Panel -->
      <div id="chat-panel" class="chat-widget-panel hidden">
        <!-- Header with tabs -->
        <div class="chat-header" style="flex-direction:column;gap:0;padding:0;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px 0;">
            <div class="chat-agent-info">
              <div class="chat-agent-avatar">🤖</div>
              <div>
                <div style="font-weight:700;color:white;font-size:13px;">Advay's Assistant</div>
                <div class="chat-status">Online</div>
              </div>
            </div>
            <button onclick="ChatWidget._toggle()" style="background:none;border:none;cursor:pointer;color:var(--text-dim);padding:4px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <!-- Tab bar -->
          <div style="display:flex;border-bottom:1px solid rgba(255,255,255,.07);margin-top:10px;">
            <button id="tab-chat-btn" onclick="ChatWidget._switchTab('chat')"
              style="flex:1;padding:8px;font-size:12px;font-weight:600;border:none;cursor:pointer;background:none;
                     color:var(--cyan);border-bottom:2px solid var(--cyan);transition:all .2s;font-family:inherit;">
              💬 AI Assistant
            </button>
            <button id="tab-suggest-btn" onclick="ChatWidget._switchTab('suggest')"
              style="flex:1;padding:8px;font-size:12px;font-weight:600;border:none;cursor:pointer;background:none;
                     color:rgba(255,255,255,.4);border-bottom:2px solid transparent;transition:all .2s;font-family:inherit;">
              💡 Suggest
            </button>
          </div>
        </div>

        <!-- Chat tab -->
        <div id="tab-chat" style="display:flex;flex-direction:column;flex:1;overflow:hidden;">
          <div class="chat-messages" id="chat-messages"></div>
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

        <!-- Suggest tab -->
        <div id="tab-suggest" style="display:none;flex:1;overflow-y:auto;padding:16px;">
          <p style="font-size:12px;color:rgba(255,255,255,.4);margin-bottom:14px;">Have an idea, found a bug, or want to give feedback? Drop it here.</p>
          <div style="margin-bottom:12px;">
            <label style="display:block;font-size:11px;font-weight:600;color:rgba(255,255,255,.4);margin-bottom:5px;">Your suggestion *</label>
            <textarea id="suggest-content" class="chat-input" rows="4" style="width:100%;height:auto;resize:vertical;"
              placeholder="Ideas, feedback, bug reports..."></textarea>
          </div>
          <div style="margin-bottom:14px;">
            <label style="display:block;font-size:11px;font-weight:600;color:rgba(255,255,255,.4);margin-bottom:5px;">Email (optional)</label>
            <input type="email" id="suggest-email" class="chat-input" style="width:100%" placeholder="your@email.com">
          </div>
          <button onclick="ChatWidget._submitSuggest()" class="btn-primary" style="width:100%;justify-content:center;font-size:13px;">
            Submit Suggestion
          </button>
          <p id="suggest-success" class="hidden" style="text-align:center;font-size:12px;color:var(--emerald);margin-top:10px;">✓ Thanks! Suggestion received.</p>
        </div>
      </div>
    `;

    _addMessage('assistant', WELCOME);
  }

  function _toggle() {
    isOpen = !isOpen;
    document.getElementById('chat-panel').classList.toggle('hidden', !isOpen);
    document.getElementById('fab-open').classList.toggle('hidden', isOpen);
    document.getElementById('fab-close').classList.toggle('hidden', !isOpen);
    if (isOpen) setTimeout(() => document.getElementById('chat-input')?.focus(), 200);
  }

  function _switchTab(tab) {
    activeTab = tab;
    document.getElementById('tab-chat').style.display = tab==='chat' ? 'flex' : 'none';
    document.getElementById('tab-suggest').style.display = tab==='suggest' ? 'block' : 'none';
    const chatBtn = document.getElementById('tab-chat-btn');
    const sugBtn = document.getElementById('tab-suggest-btn');
    chatBtn.style.color = tab==='chat' ? 'var(--cyan)' : 'rgba(255,255,255,.4)';
    chatBtn.style.borderBottomColor = tab==='chat' ? 'var(--cyan)' : 'transparent';
    sugBtn.style.color = tab==='suggest' ? 'var(--cyan)' : 'rgba(255,255,255,.4)';
    sugBtn.style.borderBottomColor = tab==='suggest' ? 'var(--cyan)' : 'transparent';
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
    div.className = 'chat-typing'; div.id = 'typing-indicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function _hideTyping() { document.getElementById('typing-indicator')?.remove(); }

  async function _send() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    if (!input) return;
    const text = input.value.trim();
    if (!text || isTyping) return;
    input.value = ''; input.style.height = 'auto';
    _addMessage('user', text);
    isTyping = true; sendBtn.disabled = true;
    _showTyping();
    try {
      const res = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ messages: messages.filter(m=>m.role!=='system').slice(-10) }),
      });
      const data = await res.json();
      _hideTyping();
      _addMessage('assistant', data.error ? 'Sorry, ran into an issue. Try again.' : data.reply);
    } catch {
      _hideTyping();
      _addMessage('assistant', 'Connection error. Please try again.');
    } finally { isTyping = false; sendBtn.disabled = false; }
  }

  function _keydown(e) { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); _send(); } }
  function _autoResize(el) { el.style.height='auto'; el.style.height = Math.min(el.scrollHeight,100)+'px'; }

  async function _submitSuggest() {
    const content = document.getElementById('suggest-content').value.trim();
    const email = document.getElementById('suggest-email').value.trim();
    const msg = document.getElementById('suggest-success');
    if (!content) return;
    try {
      await App.api('/api/suggest', { method:'POST', body:{ content, email } });
      document.getElementById('suggest-content').value = '';
      document.getElementById('suggest-email').value = '';
      msg.classList.remove('hidden');
      setTimeout(() => msg.classList.add('hidden'), 3000);
    } catch { App.showToast('Failed to submit.','error'); }
  }

  return { init, _toggle, _switchTab, _send, _keydown, _autoResize, _submitSuggest };
})();
