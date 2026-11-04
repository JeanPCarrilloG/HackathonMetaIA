var QuestionGeneratorModel = function() { 
  this.seen = new Set();
  this.lastResponse = null;
  this.aspectMap = {
    chronicle: "What happened today? Any moment you want to note?",
    emotional: "How did you feel today?",
    relational: "Did you interact with someone meaningful today?",
    reflexive: "What did you learn about yourself today?",
    projective: "Is there something you look forward to?"
  };
  this.closingBases = [
    "Thanks for noting today. You can return whenever you wish.",
    "Appreciate your time writing. Rest until next entry.",
    "Your entry is saved. See you in the next page.",
    "Grateful for your reflection today. Until next time.",
    "Thank you for this page. The diary awaits your next entry."
  ];
};

QuestionGeneratorModel.prototype.getApiKey = function() {
  try { return localStorage.getItem('META_API_KEY') || sessionStorage.getItem('META_API_KEY') || AppConfig.getApiKey?.() || null; } 
  catch(e){ return null; }
};

QuestionGeneratorModel.prototype.callWonder = async function(inputText) {
  var apiKey = this.getApiKey(); if (!apiKey) throw new Error('no key');
  const API_URL = "https://api.meta.ai/v1/responses"; const MODEL = "muse-wonder-1.0";
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      reasoning: { effort: "medium" },
      input: [{ role: "user", content: [{ type: "input_text", text: inputText }] }],
      stream: false,
    })
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  var text = data.output_text || data.output?.[0]?.content?.[0]?.text || '';
  return text.replace(/\s*\[[^\]]+\]\s*$/g, '').replace(/\s*\d{3,6}\s*$/g, '').trim();
};

// PREGUNTAS - SIEMPRE DIFERENTES, ALEATORIAS, RELACIONADAS, MUSE WONDER
QuestionGeneratorModel.prototype.getParaphrasedDiaryQuestion = async function(aspect) {
  var base = this.aspectMap[aspect] || this.aspectMap.chronicle;
  var prompt = "You are 【entity-Meta¦canonical_name=Meta】 Muse Wonder 1.0 reasoning effort medium. Paraphrase diary question RELATED but DIFFERENT every time, 1 sentence, English, warm, no diagnosis. Original: \""+base+"\" Aspect: "+aspect+" Generate unique variant related to original, different wording:";
  try {
    var ai = await this.callWonder(prompt + " rand:"+Math.random()+"-"+Date.now()+"-"+Math.random());
    if (!ai) throw new Error('empty');
    var attempts = 0;
    while (this.seen.has(ai) && attempts < 3) {
      ai = await this.callWonder(prompt + " Even more different rand:"+Math.random());
      attempts++;
    }
    if (ai) {
      this.seen.add(ai); this.lastResponse = ai;
      if (this.seen.size > 100) this.seen.delete(this.seen.values().next().value);
      console.log('[MUSE WONDER 1.0][QUESTION][ALWAYS DIFFERENT]['+aspect+'] '+ai);
      return ai;
    }
  } catch(e){}
  return this.localRandomRelatedQuestion(aspect);
};

QuestionGeneratorModel.prototype.localRandomRelatedQuestion = function(aspect) {
  var fallbacks = {
    chronicle: ["Could you tell me a moment from today you would like to keep?","What little piece of today stayed with you?","Was there something today worth noting down?","How did your day start and unfold?","What would you like to capture from today's story?"],
    emotional: ["What emotion visited you most today?","How did your heart feel through the day?","Any feeling today you want to put into words?","What mood colored your day?","How are you feeling right now about today?"],
    relational: ["Did someone make your day a bit brighter?","Was there a nice moment with someone today?","Who did you share time with today?","Any interaction today you want to remember?","Did you connect with someone meaningful?"],
    reflexive: ["What did today teach you about yourself?","Is there something you realized today?","What would you do differently, if anything?","What insight about you appeared today?","What part of today helped you understand yourself better?"],
    projective: ["What small wish do you hold for tomorrow?","Is there something you look forward to soon?","What would you like to try next?","How would you like tomorrow to feel?","Any dream or plan you want to keep for later?"]
  };
  var list = fallbacks[aspect] || fallbacks.chronicle;
  var pick; var tries = 0;
  do { pick = list[Math.floor(Math.random()*list.length)]; tries++; } while (this.seen.has(pick) && tries < 20);
  this.seen.add(pick);
  this.lastResponse = pick;
  return pick;
};

QuestionGeneratorModel.prototype.getParaphrasedGeneric = async function() {
  var base = "Would you like to share more about your day?";
  var prompt = "You are 【entity-Meta Muse Wonder 1.0¦canonical_name=Meta】 reasoning effort medium. Paraphrase generic prompt RELATED but DIFFERENT every time. Original: \""+base+"\" Generate unique variant:";
  try {
    var ai = await this.callWonder(prompt + " rand:"+Math.random()+"-"+Date.now());
    if (ai && ai.trim()) {
      ai = ai.trim();
      if (this.seen.has(ai)) {
        var retry = await this.callWonder(prompt + " More different rand:"+Math.random());
        if (retry && !this.seen.has(retry)) ai = retry;
      }
      this.seen.add(ai);
      this.lastResponse = ai;
      return ai;
    }
  } catch(e){}
  return this.localRandomRelatedQuestion('chronicle');
};

QuestionGeneratorModel.prototype.getParaphrasedClosing = async function() {
  var base = this.closingBases[Math.floor(Math.random()*this.closingBases.length)];
  var prompt = "You are 【entity-Meta Muse Wonder 1.0¦canonical_name=Meta】 with reasoning effort medium. Task: rewrite closing phrase to be RELATED but DIFFERENT every time. Must be based on these originals: " +
    JSON.stringify(this.closingBases) + 
    " Original selected: \""+base+"\" Generate unique variant, warm, English, 1-2 sentences, must mention diary/page/entry/writing, related to originals but different wording every time, never repeat exactly, no codes, no numbers:";
  try {
    var ai = await this.callWonder(prompt + " rand:"+Math.random()+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,7));
    if (!ai) throw new Error('empty');
    if (this.seen.has(ai)) {
      ai = await this.callWonder(prompt + " More different, rand:"+Math.random());
    }
    this.seen.add(ai);
    this.lastResponse = ai;
    if (this.seen.size > 100) this.seen.delete(this.seen.values().next().value);
    console.log('[MUSE WONDER 1.0][CLOSING][ALWAYS DIFFERENT] Base:"'+base+'" -> AI:"'+ai+'"');
    return ai;
  } catch(e) {
    return this.localClosingVariant();
  }
};

QuestionGeneratorModel.prototype.localClosingVariant = function() {
  var intros = ["Thank you for this page,","Thanks for noting today,","Appreciate your time writing,","Your entry is saved,","Grateful for your reflection today,"];
  var middles = ["the diary awaits your next entry","you can return whenever you wish","rest until next entry","see you in the next page","until next time"];
  var endings = [" Take care."," Rest well."," See you soon."," Wishing you a gentle rest."," Until your next reflection."];
  var r1 = intros[Math.floor(Math.random()*intros.length)];
  var r2 = middles[Math.floor(Math.random()*middles.length)];
  var r3 = endings[Math.floor(Math.random()*endings.length)];
  var result = r1 + " " + r2 + r3;
  var tries = 0;
  while (this.seen.has(result) && tries < 20) {
    r1 = intros[Math.floor(Math.random()*intros.length)];
    r2 = middles[Math.floor(Math.random()*middles.length)];
    r3 = endings[Math.floor(Math.random()*endings.length)];
    result = r1 + " " + r2 + r3;
    tries++;
  }
  this.seen.add(result);
  this.lastResponse = result;
  return result;
};