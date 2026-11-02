/*
 * One place that decides which site_settings keys may leave the server and
 * which keys may be written through the general settings endpoint.
 */

// Keys the public website actually reads. Anything not listed here is never
// returned by GET /api/settings. Keep this list explicit and short.
const PUBLIC_SETTING_KEYS = Object.freeze([
  // General
  'site_name', 'site_tagline', 'meta_description', 'icon_pack', 'contact_email',
  // Navigation and footer labels
  'nav_home', 'nav_about', 'nav_repos', 'nav_tools', 'nav_collab', 'nav_faq',
  'support_label', 'footer_nav_heading', 'footer_connect_heading',
  'footer_support_heading', 'footer_support_text',
  // Home
  'home_headline', 'home_subheadline',
  'home_availability_label', 'home_cta_primary_label', 'home_cta_secondary_label',
  'home_tools_kicker', 'home_tools_heading', 'home_tools_more_label',
  'home_templates_kicker', 'home_templates_more_label', 'template_import_label',
  'home_services_kicker', 'home_services_heading', 'home_services_subtitle',
  'home_philosophy_kicker',
  'home_cta_heading', 'home_cta_text', 'home_cta_button',
  'home_stat_tools_label', 'home_stat_repos_label', 'home_stat_years_label', 'years_exp',
  'nav_cta_label', 'nav_cta_link', 'home_about_kicker', 'home_about_button',
  'tool_open_label', 'collab_success_title', 'collab_success_text', 'status_live_label', 'status_waking_label', 'status_down_label',
  'philosophy_quote', 'philosophy_sub',
  'templates_label', 'templates_visible', 'templates_subtitle',
  // Other pages
  'tools_subtitle', 'collab_subtitle', 'collab_intro',
  'collab_qi_1', 'collab_qi_2', 'collab_qi_3', 'collab_services',
  'specializations', 'funfact',
  // 1.2.0: page text, home sections, rotating words, typing phrases and questions
  'repos_subtitle', 'faq_subtitle', 'hero_words', 'cta_phrases', 'home_sections', 'faq_items',
  // 1.2.0: the theme engine (written only through /api/admin/themes)
  'theme_mode', 'theme_active', 'theme_rotation', 'theme_interval_sec', 'theme_transition',
  'theme_sync', 'theme_visitor_panel', 'theme_custom',
]);

const PUBLIC_SET = new Set(PUBLIC_SETTING_KEYS);

function isInternalKey(key) {
  return typeof key === 'string' && key.startsWith('_');
}

// Keys that may never be written through PUT /api/admin/settings. The AI keys
// have their own validated route, and underscore keys are internal.
function isWriteProtectedKey(key) {
  return isInternalKey(key) || (typeof key === 'string' && (key.startsWith('ai_') || key.startsWith('theme_')));
}

function pickPublic(rows) {
  const out = {};
  for (const r of rows) {
    if (PUBLIC_SET.has(r.key) && !isInternalKey(r.key)) out[r.key] = r.value;
  }
  return out;
}

const HEX_RE = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

// Returns a normalised lower case 6 digit hex string, or null if invalid.
function normaliseHex(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (!HEX_RE.test(v)) return null;
  let h = v.slice(1).toLowerCase();
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return '#' + h;
}

// Settings the admin screen may write, with a size limit for each. Anything else is rejected.
const ADMIN_TEXT_LIMITS = {
  site_name: 100, site_tagline: 200, meta_description: 300, repo_count: 6, years_exp: 6,
  home_subheadline: 600, philosophy_quote: 600, philosophy_sub: 300, timeline_1: 300, timeline_2: 300, timeline_3: 300,
  templates_label: 80, templates_subtitle: 300, tools_subtitle: 300, repos_subtitle: 300, faq_subtitle: 300, nav_faq: 40,
  collab_subtitle: 300, collab_intro: 1000, collab_qi_1: 200, collab_qi_2: 200, collab_qi_3: 200, funfact: 400,
};
// Lists edited in the Home tab. Each is stored as JSON and checked in routes/admin.js.
const ADMIN_LIST_KEYS = ['hero_words', 'cta_phrases', 'home_sections', 'faq_items'];
const ADMIN_SETTING_KEYS = Object.freeze([...Object.keys(ADMIN_TEXT_LIMITS), ...ADMIN_LIST_KEYS, 'templates_visible', 'icon_pack', 'webhook_url', 'specializations', 'collab_services', 'allowed_origins', 'contact_email']);
// Sent by an admin page that was opened before 1.2.0. Accepted and ignored so saving never fails: the accent
// colour became the Themes tab, and the cylinder words became the rotating words list.
const LEGACY_IGNORED_KEYS = Object.freeze(['accent_color', 'cylinder_labels']);
// The sections the home page can show, in their default order. The hero cannot be switched off.
const HOME_SECTIONS = Object.freeze(['hero', 'metrics', 'tools', 'services', 'templates', 'about', 'faq', 'cta']);
const ICON_PACKS = Object.freeze(['lucide', 'tabler', 'phosphor', 'heroicons', 'feather']);

module.exports = {
  ADMIN_TEXT_LIMITS, ADMIN_SETTING_KEYS, ADMIN_LIST_KEYS, LEGACY_IGNORED_KEYS, HOME_SECTIONS, ICON_PACKS,
  PUBLIC_SETTING_KEYS, pickPublic, isInternalKey, isWriteProtectedKey, normaliseHex,
};
