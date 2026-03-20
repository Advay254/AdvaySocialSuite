const CollabPage = (() => {

  function render() {
    return `
      <div class="page-hero">
        <div class="hero-grid"></div>
        <div class="max-w-7xl mx-auto container-pad relative z-10">
          <div class="section-label justify-center">Work Together</div>
          <h1 class="page-hero-title gradient-text-2">COLLABORATE</h1>
          <p class="text-slate-400 max-w-xl mx-auto">Got a project idea? Need automation, a bot, or a web tool built? Let's talk.</p>
        </div>
      </div>

      <div class="neon-line"></div>

      <div class="max-w-5xl mx-auto container-pad py-12">

        <!-- What I'm open to -->
        <div class="mb-10">
          <div class="section-label">Open To</div>
          <h2 class="font-heading font-700 text-white text-2xl mb-6">What I Work On</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            ${[
              { icon: '⚙️', title: 'Automation Systems',    desc: 'n8n workflows, API pipelines, scheduled tasks and complex multi-step automation.' },
              { icon: '🤖', title: 'Bot Development',       desc: 'WhatsApp bots (Baileys), Telegram bots, webhook-driven messaging systems.' },
              { icon: '🌐', title: 'Web Tools & Apps',      desc: 'Downloaders, utilities, dashboards — fast, mobile-first, deployable on free tier.' },
              { icon: '🔌', title: 'API Integrations',      desc: 'Connecting third-party services, building proxy layers, REST API microservices.' },
              { icon: '📊', title: 'Data Pipelines',        desc: 'Automated data collection, transformation, and delivery workflows.' },
              { icon: '💡', title: 'Technical Consulting',  desc: 'Architecture reviews, workflow optimization, free-tier scaling strategy.' },
            ].map(item => `
              <div class="collab-method">
                <div class="collab-method-icon">${item.icon}</div>
                <div>
                  <h4 class="font-heading font-700 text-white text-sm mb-1">${item.title}</h4>
                  <p class="text-slate-400 text-xs leading-relaxed">${item.desc}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Main 2-col layout -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">

          <!-- Contact Form -->
          <div class="lg:col-span-3">
            <div class="glass-card p-8">
              <div class="section-label">Send a Message</div>
              <h3 class="font-heading font-700 text-white text-xl mb-6">Start the Conversation</h3>

              <form id="collab-form" onsubmit="CollabPage._submitCollab(event)">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="form-group">
                    <label class="form-label">Your Name *</label>
                    <input type="text" name="name" class="form-input" placeholder="Jane Doe" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email Address *</label>
                    <input type="email" name="email" class="form-input" placeholder="jane@example.com" required>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Subject</label>
                  <input type="text" name="subject" class="form-input" placeholder="What's this about?">
                </div>

                <div class="form-group">
                  <label class="form-label">Message *</label>
                  <textarea name="message" class="form-textarea" rows="5"
                            placeholder="Describe your project, idea, or how you want to collaborate..." required></textarea>
                </div>

                <button type="submit" class="btn-primary w-full justify-center" id="collab-submit-btn">
                  <span id="collab-btn-text">Send Message</span>
                  <svg id="collab-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
              </form>

              <p id="collab-success" class="hidden mt-4 text-center text-emerald text-sm py-3 px-4 rounded-xl border border-emerald/20 bg-emerald/5">
                ✓ Message sent! I'll get back to you soon.
              </p>
              <p id="collab-error" class="hidden mt-4 text-center text-red-400 text-sm"></p>
            </div>
          </div>

          <!-- Right sidebar -->
          <div class="lg:col-span-2 space-y-5">

            <!-- Quick info -->
            <div class="glass-card p-6">
              <h4 class="font-heading font-700 text-white text-base mb-4">Quick Info</h4>
              <div class="space-y-3 text-sm text-slate-400">
                <div class="flex items-start gap-3">
                  <span class="text-cyan mt-0.5">📍</span>
                  <span>Based in Kenya · Remote only · Open to global clients</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-cyan mt-0.5">⚡</span>
                  <span>Usually responds within 24 hours</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-cyan mt-0.5">🛠️</span>
                  <span>Specializes in free-tier, zero-cost production systems</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-cyan mt-0.5">🎯</span>
                  <span>Prefers small-to-medium scoped projects with clear goals</span>
                </div>
              </div>
            </div>

            <!-- GitHub link -->
            <div class="glass-card p-6">
              <h4 class="font-heading font-700 text-white text-base mb-3">GitHub</h4>
              <p class="text-slate-400 text-sm mb-4">Prefer GitHub Discussions for public conversations that help the community.</p>
              <a href="https://github.com/Advay254/Advay254/discussions" target="_blank" rel="noopener"
                 class="btn-ghost w-full justify-center text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                Open Discussion
              </a>
            </div>

            <!-- BMC -->
            <div class="glass-card p-6 text-center" style="background: rgba(255,213,79,0.03); border-color: rgba(255,213,79,0.12);">
              <div class="text-2xl mb-2">☕</div>
              <p class="text-slate-400 text-xs mb-4">If my work has been useful, a coffee goes a long way.</p>
              <a href="https://www.buymeacoffee.com/advay254" target="_blank" rel="noopener"
                 class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                 style="background: rgba(255,213,79,0.1); border: 1px solid rgba(255,213,79,0.25); color: #ffd54f;">
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
      success.classList.remove('hidden');
      btn.disabled = false;
      btnText.textContent = 'Send Message';
    } catch (err) {
      error.textContent = err.message || 'Failed to send. Try again.';
      error.classList.remove('hidden');
      btn.disabled = false;
      btnText.textContent = 'Send Message';
    }
  }

  return { render, init: () => {}, _submitCollab };
})();
