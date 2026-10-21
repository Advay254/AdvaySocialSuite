/*
 * One place that decides which site_settings keys may leave the server and
 * which keys may be written through the general settings endpoint.
 */

// Keys the public website actually reads. Anything not listed here is never
// returned by GET /api/settings. Keep this list explicit and short.
const PUBLIC_SETTING_KEYS = Object.freeze([
  // General
  'site_name', 'site_tagline', 'meta_description', 'accent_color', 'icon_pack',
  // Navigation and footer labels
  'nav_home', 'nav_about', 'nav_repos', 'nav_tools', 'nav_collab',
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
]);

const PUBLIC_SET = new Set(PUBLIC_SETTING_KEYS);

function isInternalKey(key) {
  return typeof key === 'string' && key.startsWith('_');
}

// Keys that may never be written through PUT /api/admin/settings. The AI keys
// have their own validated route, and underscore keys are internal.
function isWriteProtectedKey(key) {
  return isInternalKey(key) || (typeof key === 'string' && key.startsWith('ai_'));
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
  templates_label: 80, templates_subtitle: 300, tools_subtitle: 300, cylinder_labels: 600,
  collab_subtitle: 300, collab_intro: 1000, collab_qi_1: 200, collab_qi_2: 200, collab_qi_3: 200, funfact: 400,
};
const ADMIN_SETTING_KEYS = Object.freeze([...Object.keys(ADMIN_TEXT_LIMITS), 'templates_visible', 'accent_color', 'icon_pack', 'webhook_url', 'specializations', 'collab_services', 'allowed_origins']);
const ICON_PACKS = Object.freeze(['lucide', 'tabler', 'phosphor', 'heroicons', 'feather']);

module.exports = {
  ADMIN_TEXT_LIMITS, ADMIN_SETTING_KEYS, ICON_PACKS,
  PUBLIC_SETTING_KEYS, pickPublic, isInternalKey, isWriteProtectedKey, normaliseHex,
};
