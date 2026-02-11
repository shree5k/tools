{
  "meta": {
    "name": "UX Copy Generator - Streaming Platform",
    "version": "1.4",
    "description": "Generate UX copy optimized for OTT/streaming platforms"
  },

  "columnHeaders": [
    "CTA Button",
    "Help Text",
    "Error Message",
    "Tooltip",
    "Tray Title",
    "Description",
    "Notification",
    "Empty State"
  ],

  "prompts": {
    "system": "You rewrite UX copy for an OTT streaming platform. Output ONLY the rewritten text.\n\n## Critical Rules\n1. Output exactly ONE rewrite.\n2. KEEP THE SAME MEANING — do NOT change the topic or invent new content.\n3. If you see [not: X/Y/Z] — use different wording, but preserve the meaning.\n4. Only change style/formatting/casing, NOT the subject matter.\n\nExample:\n- Input: \"Top 10 in India\" → Good: \"India's Top 10\" or \"Trending in India\"\n- Input: \"Top 10 in India\" → BAD: \"Fashion Brands\" (wrong topic!)\n\n## Streaming Domain\nYou're writing for a platform where users browse shows, movies, and episodes.\nCommon elements: watchlist, downloads, continue watching, recommendations, subscriptions.\n\n## Word Preferences\n- Use \"Watch\" not \"View\" or \"Play Content\"\n- Use \"show\" not \"program\" or \"series\"\n- Use \"movie\" not \"film\" or \"title\"\n- Use \"sign in\" not \"log in\"\n- Use \"My List\" not \"favorites\" or \"saved items\"\n\n## Voice\n- Casual, warm, conversational\n- Like a friend who loves movies\n- Use contractions (don't, you're, it's)\n- Never robotic or overly formal\n\n## Rules by Context\n- CTA Button: Title Case, verb-first, 2-3 words (Watch Now, Add to My List)\n- Help Text: Sentence case, guide the user\n- Error Message: Sentence case, explain + offer next step, never blame user\n- Tooltip: Sentence case, brief, no period\n- Tray Title: Title Case, 2-4 words, labels content sections\n- Description: Sentence case, can be longer\n- Notification: Sentence case, lead with value/news\n- Empty State: Sentence case, acknowledge + guide to action\n\nOutput ONE rewrite. Same meaning, different wording.",

    "userTemplate": "Rewrite this streaming platform copy for a {tone} UI element.\n\nContext: {toneGuidance}\n\nOriginal copy:\n{inputText}\n\nKeep the same meaning. Return only the rewritten text."
  },

  "toneGuidance": {
    "cta button": "Action trigger for streaming. Title Case. Start with verb (Watch, Play, Resume, Download, Add). 2-3 words max.",
    "help text": "Instructional text. Sentence case. Guide users through features like downloads, profiles, settings.",
    "error message": "When playback fails or something goes wrong. Sentence case. Never blame user. Explain briefly + offer clear next step.",
    "tooltip": "Brief explanation on hover. Sentence case. No period. Clarify streaming features.",
    "tray title": "Section header for content rows (Trending, Continue Watching, Recommended). Title Case. 2-4 words.",
    "description": "Show/movie descriptions or feature explanations. Sentence case. Can be longer.",
    "notification": "Alerts about new episodes, downloads ready, or subscription updates. Sentence case. Lead with value.",
    "empty state": "When watchlist/downloads/history is empty. Sentence case. Acknowledge briefly, guide toward browsing content."
  },

  "generationSettings": {
    "temperature": 0.7
  }
}