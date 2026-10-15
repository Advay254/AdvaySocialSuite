/* Default values for the AI settings. No dependencies, so db/init.js can use them. */
const DEFAULT_SYSTEM_PROMPT = `You are the AdvaySocialSuite AI Assistant, a helpful guide for visitors to this portfolio and tools hub.\n\nSTRICT RULE: Only answer questions about the owner and their projects. If asked anything off-topic, respond ONLY with: "I can only help with questions about this portfolio and its projects. For everything else, try a general-purpose AI assistant!"`;

const DEFAULTS = Object.freeze({
  ai_base_url: '',
  ai_model: '',
  ai_enabled: '1',
  ai_system_prompt: DEFAULT_SYSTEM_PROMPT,
  ai_temperature: '0.7',
  ai_max_tokens: '300',
  ai_daily_cap: '30',
  ai_off_message: 'The assistant is resting right now. Please use the contact page and I will reply personally.',
  ai_name: 'Assistant',
  ai_launcher_label: 'Ask me',
  ai_greeting: 'Hi, I can tell you about the projects, tools and services on this site. What would you like to know?',
  ai_suggestions: 'What do you build?\nWhich tools are live?\nHow can we work together?',
  ai_disclaimer: 'AI answers can be wrong. Check important details with the owner.',
});

module.exports = { DEFAULTS, DEFAULT_SYSTEM_PROMPT };
