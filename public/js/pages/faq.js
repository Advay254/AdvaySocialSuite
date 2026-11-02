const FaqPage = (() => {

  const items = (settings) => UI.parseJSON(settings.faq_items, []).filter(i => i && i.on !== false && i.q && i.a);

  function render() {
    return `<div class="container container--narrow">
      <div id="faq-head">${UI.head('', ' ', '')}</div>
      <div id="faq-list" class="qa-list" aria-busy="true">${UI.skeletonCards(1)}</div>
      <div id="faq-cta" class="more-row"></div>
    </div>`;
  }

  async function init() {
    const { settings, profile } = await App.shared();
    const box = document.getElementById('faq-list'); if (!box) return;
    const list = items(settings);
    document.getElementById('faq-head').innerHTML = UI.head(settings.site_tagline || profile.tagline, settings.nav_faq, settings.faq_subtitle);
    box.removeAttribute('aria-busy');
    box.innerHTML = list.length ? UI.accordion(list, true) : UI.emptyState(UI.S.noResults, '');
    const l = UI.resolveLink(settings.nav_cta_link);
    if (l && settings.home_cta_button) document.getElementById('faq-cta').innerHTML = UI.btn({ label: settings.home_cta_button, href: l.href, external: l.external, icon: 'arrow-right' });
  }

  return { render, init, items };
})();
