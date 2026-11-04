var WellbeingSignalModel = function() {
  this.seenAdvice = new Set();
  this.lastAdvice = null;
};

WellbeingSignalModel.prototype.getApiKey = function(){
  try{ return localStorage.getItem('META_API_KEY') || sessionStorage.getItem('META_API_KEY') || AppConfig.getApiKey?.() || null; }catch(e){ return null; }
};

WellbeingSignalModel.prototype.assess = async function(text) {
  if (!text || text.trim().length < 2) return { state: 'stable', suggestion: '', needs_resources: false, base: '' };
  var lower = text.toLowerCase();
  var needs = false, state = 'stable', base = '';
  if (/(sad|depressed|lonely|anxious|hopeless|tired|stress|angry|upset|cry|worried|bad day)/.test(lower)) {
    state = 'mild'; needs = true;
    base = "It seems today was challenging. Remember to take breaks, breathe, and talk to someone you trust.";
  } else if (/(great|happy|good day|excited|proud|joy|wonderful|amazing|grateful)/.test(lower)) {
    state = 'stable'; base = "Great to hear positive moments today. Keep nurturing what brings you joy.";
  } else {
    state = 'stable'; base = "Thank you for sharing your reflections. Keeping a daily record helps build self-awareness.";
  }
  var aiVariant = await this.generateWonderAlert(base, state, text);
  return { state: state, suggestion: aiVariant, base: base, needs_resources: needs };
};

WellbeingSignalModel.prototype.getCompletionAdvice = function(isComplete) {
  if (!isComplete) return null;
  return "TEMP";
};

WellbeingSignalModel.prototype.localRelatedAdvice = function(fullDayConversation) {
  var txt = (fullDayConversation || '').toLowerCase();
  var templates = [
    "Today you mentioned {keyword}, which shows growth in your chronicle and emotional notes. Try carrying one gentle lesson from that moment into tomorrow with a calm breath.",
    "Your story today around {keyword} reflects your relational and reflexive awareness. Consider what felt meaningful and give yourself a small kind step for tomorrow.",
    "Noticing {keyword} in today's entries is a sign of your full 5 aspects at work. Honor what you felt and choose one small action to nurture tomorrow.",
    "The way you wrote about {keyword} today reveals emotional depth and projective hope. Pause tonight and keep one insight close for tomorrow.",
    "From your words about {keyword}, your diary shows all 5 aspects alive. Let one learning from today guide a gentle intention for tomorrow.",
    "Your reflection on {keyword} connects chronicle, emotion and relation beautifully. Take a moment to appreciate it and set one caring goal for tomorrow.",
    "Seeing {keyword} in your day, you completed a rich page. Keep the strength from today and offer yourself kindness as you move into tomorrow.",
    "Today's notes on {keyword} show reflexive care. Breathe with what you learned and let one positive thread continue tomorrow."
  ];
  var keywords = [];
  var m = txt.match(/\b\w{4,}\b/g);
  if (m && m.length > 0) {
    var filtered = m.filter(function(w){ return !['today','about','there','their','would','could','should','with','from','that','this','have','been'].includes(w); });
    if (filtered.length > 0) keywords = filtered.slice(-8);
  }
  if (keywords.length === 0) keywords = ["your day","your story","today's moments","your reflection"];
  var kw = keywords[Math.floor(Math.random()*keywords.length)];
  var tpl = templates[Math.floor(Math.random()*templates.length)];
  var result = tpl.replace("{keyword}", kw);
  var attempts = 0;
  while (this.seenAdvice.has(result) && attempts < 10) {
    kw = keywords[Math.floor(Math.random()*keywords.length)];
    tpl = templates[Math.floor(Math.random()*templates.length)];
    result = tpl.replace("{keyword}", kw) + " " + ["Take it slow.","Be gentle with yourself.","You are doing well."][Math.floor(Math.random()*3)];
    attempts++;
  }
  return result;
};

WellbeingSignalModel.prototype.getCompletionAdviceAsync = async function(fullDayConversation) {
  var conversation = (fullDayConversation || '').trim();
  if (!conversation) conversation = "today user wrote about their day";
  var shortConv = conversation.substring(0, 900);
  var uniqueId = Date.now() + "-" + Math.random().toString(36).slice(2,12) + "-" + Math.random() + "-" + Date.now();
  var avoid = this.lastAdvice ? " MUST NOT repeat previous advice: \""+this.lastAdvice.substring(0,120)+"\"" : "";
  var aiAdvice = null;

  try {
    var prompt1 = "You are Meta Muse Wonder 1.0 reasoning effort medium. Generate PERSONALIZED daily advice based on FULL day conversation. Recognize chronicle, emotional, relational, reflexive, projective aspects from what person wrote. 2-3 sentences, warm, English, supportive, actionable, related to story. No prefix Daily advice, no codes like , no numbers at end, no brackets. Full day conversation: \""+shortConv+"\""+avoid+" Unique seed: "+uniqueId+" . Generate ONLY advice text, always different wording, directly related to what person wrote:";
    aiAdvice = await this.callWonder(prompt1);
    aiAdvice = aiAdvice.replace(/\s*\[[^\]]+\]\s*$/g, '').replace(/\s*\d{3,6}\s*$/g, '').replace(/^Daily advice of your diary:\s*/i, '').trim();
  } catch(e){ aiAdvice = null; }

  var attempts = 0;
  while ((!aiAdvice || aiAdvice.length < 25 || this.seenAdvice.has(aiAdvice)) && attempts < 4) {
    try {
      var p = "Muse Wonder 1.0 diary advice for: \""+shortConv.substring(0,600)+"\" warm supportive 2 sentences English unique seed "+Math.random()+"-"+Date.now()+"-"+attempts+avoid+" :";
      var retry = await this.callWonder(p);
      retry = retry.replace(/\s*\[[^\]]+\]\s*$/g, '').replace(/\s*\d{3,6}\s*$/g, '').trim();
      if (retry && retry.length > 25 && !this.seenAdvice.has(retry)) { aiAdvice = retry; break; }
      if (retry && retry.length > 25) aiAdvice = retry;
    } catch(e){}
    attempts++;
  }

  if (!aiAdvice || aiAdvice.length < 25) {
    aiAdvice = this.localRelatedAdvice(conversation);
  }

  this.seenAdvice.add(aiAdvice);
  this.lastAdvice = aiAdvice;
  if (this.seenAdvice.size > 200) this.seenAdvice.delete(this.seenAdvice.values().next().value);

  console.log('[MUSE WONDER 1.0][ADVICE][RANDOM][RECOGNIZING DAY]', aiAdvice);
  return aiAdvice;
};

WellbeingSignalModel.prototype.callWonder = async function(inputText){
  var apiKey = this.getApiKey(); if(!apiKey) throw new Error('no key');
  const API_URL = "https://api.meta.ai/v1/responses"; const MODEL = "muse-wonder-1.0";
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      reasoning: { effort: "medium" },
      input: [{ role: "user", content: [{ type: "input_text", text: inputText }] }],
      stream: false,
      max_output_tokens: 400
    })
  });
  if(!res.ok) throw new Error(await res.text());
  const data = await res.json();
  var text = data.output_text || data.output?.[0]?.content?.[0]?.text || '';
  return text.replace(/\s*\[[^\]]+\]\s*$/g, '').replace(/\s*\d{3,6}\s*$/g, '').trim();
};

WellbeingSignalModel.prototype.generateWonderAlert = async function(baseSuggestion, state, userText) {
  var uniqueId = Date.now() + "-" + Math.random().toString(36).slice(2,9);
  var prompt = "You are Meta Muse Wonder 1.0 reasoning effort medium. Rewrite wellbeing suggestion RELATED but DIFFERENT EVERY TIME, empathetic, supportive, never diagnostic, no codes, no numbers. 1-2 sentences, English. Base: \""+baseSuggestion+"\" State: "+state+" Context: \""+(userText||'').substring(0,120)+"\" Seed: "+uniqueId+" Generate unique variant:";
  try{
    var text = await this.callWonder(prompt);
    if(!text) throw new Error('empty');
    return text;
  }catch(e){
    return baseSuggestion;
  }
};