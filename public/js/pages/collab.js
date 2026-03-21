const CollabPage = (() => {

  function render() {
    return `
      <div class="page-hero">
        <div class="hero-grid"></div>
        <div class="max-w-7xl mx-auto container-pad relative z-10">
          <div class="section-label justify-center">Work Together</div>
          <h1 class="page-hero-title gradient-text-2">COLLABORATE</h1>
          <p id="collab-page-subtitle" class="text-slate-400 max-w-xl mx-auto">Got a project idea? Let\'s talk.</p>
        </div>
      </div>

      <div class="neon-line"></div>

      <div class="max-w-5xl mx-auto container-pad py-12">

        <!-- What I Work On — populated from settings -->
        <div class="mb-10" id="collab-services-section">
          <div class="section-label">Open To</div>
          <h2 class="font-heading font-700 text-white text-2xl mb-6">What I Work On</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" id="collab-services-grid">
            <!-- populated in init() -->
          </div>
        </div>

        <!-- Main 2-col layout -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">

          <!-- Contact Form -->
          <div class="lg:col-span-3">
            <div class="glass-card p-8">
              <div class="section-label">Send a Message</div>
              <h3 class="font-heading font-700 text-white text-xl mb-4">Start the Conversation</h3>

              <!-- Intro text from admin settings -->
              <p id="collab-intro-text" class="collab-intro-text" style="display:none;"></p>

              <form id="collab-form" onsubmit="CollabPage._submitCollab(event)">

                <!-- What do you need? -->
                <div class="form-group">
                  <label class="form-label">What do you need? *</label>
                  <select name="subject" class="form-input" required style="appearance:none;cursor:pointer;">
                    <option value="" disabled selected>Select a category...</option>
                    <option value="Collaboration">Collaboration</option>
                    <option value="Automation">Automation</option>
                    <option value="Web App">Web App</option>
                    <option value="Website">Website</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Bot Development">Bot Development</option>
                    <option value="API Integration">API Integration</option>
                    <option value="Something else">Something else</option>
                  </select>
                </div>

                <!-- Message -->
                <div class="form-group">
                  <label class="form-label">Message * <span style="font-size:11px;color:#7a8499;">(max 1000 chars)</span></label>
                  <textarea name="message" class="form-textarea" rows="5"
                            placeholder="Describe your project or idea in as much detail as you can..."
                            required maxlength="1000" id="collab-message"></textarea>
                  <div style="text-align:right;font-size:11px;color:#7a8499;margin-top:4px;">
                    <span id="msg-count">0</span>/1000
                  </div>
                </div>

                <!-- Email -->
                <div class="form-group">
                  <label class="form-label">Your Email *</label>
                  <input type="email" name="email" class="form-input"
                         placeholder="your@email.com" required maxlength="200">
                </div>

                <button type="submit" class="btn-primary w-full justify-center" id="collab-submit-btn">
                  <span id="collab-btn-text">Send Message</span>
                  <svg id="collab-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
              </form>

              <div id="collab-success" class="hidden mt-5 rounded-xl px-5 py-4 text-sm"
                   style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);color:#6ee7b7;">
                <div style="font-weight:700;font-size:15px;margin-bottom:4px;">✓ Message sent!</div>
                <div style="color:rgba(255,255,255,.5);">I\'ll review it and get back to you within 24 hours.</div>
              </div>
              <p id="collab-error" class="hidden mt-4 text-center text-red-400 text-sm"></p>
            </div>
          </div>

          <!-- Right sidebar -->
          <div class="lg:col-span-2 space-y-5">

            <div class="glass-card p-6">
              <h4 class="font-heading font-700 text-white text-base mb-4">Quick Info</h4>
              <div class="space-y-3 text-sm text-slate-400">
                <div class="flex items-start gap-3">
                  <span class="text-cyan mt-0.5">📍</span>
                  <span id="collab-qi-location">Based in Kenya · Remote only · Open to global clients</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-cyan mt-0.5">⚡</span>
                  <span id="collab-qi-1">Usually responds within 24 hours</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-cyan mt-0.5">🛠️</span>
                  <span id="collab-qi-2">Specializes in free-tier, zero-cost production systems</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-cyan mt-0.5">🎯</span>
                  <span id="collab-qi-3">Prefers small-to-medium scoped projects with clear goals</span>
                </div>
              </div>
            </div>

            <div class="glass-card p-6 text-center" style="background:rgba(255,213,79,0.03);border-color:rgba(255,213,79,0.12);">
              <div class="text-2xl mb-2">☕</div>
              <p class="text-slate-400 text-xs mb-4">If my work has been useful, a coffee goes a long way.</p>
              <a href="https://www.buymeacoffee.com/advay254" target="_blank" rel="noopener"
                 class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                 style="background:rgba(255,213,79,.1);border:1px solid rgba(255,213,79,.25);color:#ffd54f;">
                Buy me a coffee
              </a>
            </div>
          </div>
        </div>
      </div>

      <footer class="site-footer max-w-7xl mx-auto container-pad">
        <div class="text-sm text-slate-500">
          Built by <a href="#/about" class="text-cyan hover:underline">Advay</a> · Kenya
        </div>
      </footer>
    `;
  }

  function safeJSON(val, fallback) {
    try { return typeof val === 'string' ? JSON.parse(val) : (val || fallback); }
    catch { return fallback; }
  }

  async function init() {
    try {
      const [settings, profile] = await Promise.all([
        App.api('/api/settings'),
        App.api('/api/profile'),
      ]);

      // Page subtitle
      const sub = document.getElementById('collab-page-subtitle');
      if (sub && settings.collab_subtitle) sub.textContent = settings.collab_subtitle;

      // Intro text above form
      const introEl = document.getElementById('collab-intro-text');
      if (introEl && settings.collab_intro && settings.collab_intro.trim()) {
        introEl.textContent = settings.collab_intro;
        introEl.style.display = 'block';
      }

      // Quick Info — location from profile, others from settings
      const qi0 = document.getElementById('collab-qi-location');
      if (qi0 && profile.location) qi0.textContent = `Based in ${profile.location} · Remote only · Open to global clients`;
      const qi1 = document.getElementById('collab-qi-1');
      if (qi1 && settings.collab_qi_1) qi1.textContent = settings.collab_qi_1;
      const qi2 = document.getElementById('collab-qi-2');
      if (qi2 && settings.collab_qi_2) qi2.textContent = settings.collab_qi_2;
      const qi3 = document.getElementById('collab-qi-3');
      if (qi3 && settings.collab_qi_3) qi3.textContent = settings.collab_qi_3;

      // "What I Work On" service cards from settings
      const services = safeJSON(settings.collab_services, []);
      const grid = document.getElementById('collab-services-grid');
      if (grid && services.length) {
        grid.innerHTML = services.map(item => `
          <div class="collab-method">
            <div class="collab-method-icon">${item.icon || '⚙️'}</div>
            <div>
              <h4 class="font-heading font-700 text-white text-sm mb-1">${item.title || ''}</h4>
              <p class="text-slate-400 text-xs leading-relaxed">${item.desc || ''}</p>
            </div>
          </div>
        `).join('');
      } else if (grid) {
        // Default fallback if no settings yet
        const defaults = [
          { icon:'⚙️', title:'Automation Systems', desc:'n8n workflows, API pipelines, scheduled tasks and complex multi-step automation.' },
          { icon:'🤖', title:'Bot Development', desc:'WhatsApp bots (Baileys), Telegram bots, webhook-driven messaging systems.' },
          { icon:'🌐', title:'Web Tools & Apps', desc:'Downloaders, utilities, dashboards — fast, mobile-first, deployable on free tier.' },
          { icon:'🔌', title:'API Integrations', desc:'Connecting third-party services, building proxy layers, REST API microservices.' },
          { icon:'📊', title:'Data Pipelines', desc:'Automated data collection, transformation, and delivery workflows.' },
          { icon:'💡', title:'Technical Consulting', desc:'Architecture reviews, workflow optimization, free-tier scaling strategy.' },
        ];
        grid.innerHTML = defaults.map(item => `
          <div class="collab-method">
            <div class="collab-method-icon">${item.icon}</div>
            <div>
              <h4 class="font-heading font-700 text-white text-sm mb-1">${item.title}</h4>
              <p class="text-slate-400 text-xs leading-relaxed">${item.desc}</p>
            </div>
          </div>
        `).join('');
      }

    } catch {}

    // Message character counter
    const msgArea = document.getElementById('collab-message');
    const msgCount = document.getElementById('msg-count');
    if (msgArea && msgCount) {
      msgArea.addEventListener('input', () => {
        msgCount.textContent = msgArea.value.length;
        msgCount.style.color = msgArea.value.length > 900 ? '#f87171' : '#7a8499';
      });
    }
  }

  async function _submitCollab(e) {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('collab-submit-btn');
    const btnText = document.getElementById('collab-btn-text');
    const success = document.getElementById('collab-success');
    const error = document.getElementById('collab-error');

    btn.disabled = true;
    btnText.textContent = 'Sending...';
    success.classList.add('hidden');
    error.classList.add('hidden');

    const data = Object.fromEntries(new FormData(form));

    try {
      await App.api('/api/collab', { method: 'POST', body: data });
      form.reset();
      document.getElementById('msg-count').textContent = '0';
      success.classList.remove('hidden');
      btn.disabled = false;
      btnText.textContent = 'Send Message';
      success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      error.textContent = err.message || 'Failed to send. Please try again.';
      error.classList.remove('hidden');
      btn.disabled = false;
      btnText.textContent = 'Send Message';
    }
  }

  return { render, init, _submitCollab };
})();
