var DateManagerModel = function() {
  this.currentDate = new Date();
  this.lastGreeting = null;
  this.seenGreetings = new Set();
};

DateManagerModel.prototype.getApiKey = function(){
  try{ return localStorage.getItem('META_API_KEY') || sessionStorage.getItem('META_API_KEY') || AppConfig.getApiKey?.() || null; }catch(e){ return null; }
};

DateManagerModel.prototype.callWonder = async function(inputText){
  var apiKey = this.getApiKey(); if(!apiKey) throw new Error('no key');
  const API_URL = "https://api.meta.ai/v1/responses"; const MODEL = "muse-wonder-1.0";
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      reasoning: { effort: "minimal" },
      input: [{ role: "user", content: [{ type: "input_text", text: inputText }] }],
      stream: false,
    })
  });
  if(!res.ok) throw new Error(await res.text());
  const data = await res.json();
  var text = data.output_text || data.output?.[0]?.content?.[0]?.text || '';
  return text.replace(/\s*\[[^\]]+\]\s*$/g, '').replace(/\s*\d{3,6}\s*$/g, '').trim();
};

DateManagerModel.prototype.getBaseGreeting = function() {
  var h = this.currentDate.getHours();
  if (h < 12) return "Good morning! Ready to write about your day?";
  if (h < 18) return "Good afternoon! How is your day going?";
  return "Good evening! Let's think about today together.";
};

DateManagerModel.prototype.getGreeting = function() {
  return this.getBaseGreeting();
};

DateManagerModel.prototype.getGreetingAsync = async function() {
  var base = this.getBaseGreeting();
  var h = this.currentDate.getHours();
  var period = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  var prompt = "You are 【entity-Meta Muse Wonder 1.0¦canonical_name=Meta】 reasoning effort medium. Task: rewrite greeting to be related but DIFFERENT every time, warm, supportive, 1 sentence, English. Base: \"" + base + "\" Period: " + period + " Generate unique variant, related but different wording:";
  try {
    var text = await this.callWonder(prompt + " rand:"+Math.random()+"-"+Date.now());
    if (!text) throw new Error('empty');
    var attempts = 0;
    while (this.seenGreetings.has(text) && attempts < 3) {
      text = await this.callWonder(prompt + " Different words, rand " + Math.random()+"-"+Date.now());
      attempts++;
    }
    this.seenGreetings.add(text);
    if (this.seenGreetings.size > 100) this.seenGreetings.delete(this.seenGreetings.values().next().value);
    this.lastGreeting = text;
    console.log('[MUSE WONDER 1.0][GREETING][ALWAYS DIFFERENT]', text);
    return text;
  } catch(e) {
    return this.localGreetingVariant(base, period);
  }
};

DateManagerModel.prototype.localGreetingVariant = function(base, period) {
  var variants = {
    morning: ["Good morning! What small moment from today would you like to keep?","Morning light! Ready to capture a piece of your day?","Good morning! How about noting how your day begins?","Hello morning! Shall we start with today's first thoughts?"],
    afternoon: ["Good afternoon! How has your day unfolded so far?","Afternoon hello! What part of today stays with you?","Good afternoon! Want to pause and note your day?","Hi afternoon! How is your story going today?"],
    evening: ["Good evening! Ready to reflect on what today brought?","Evening time! Let's gather today's threads together.","Good evening! How about a gentle review of today?","Hello evening! Shall we close the day with a note?"]
  };
  var list = variants[period] || variants.morning;
  var pick;
  do { pick = list[Math.floor(Math.random()*list.length)]; } while (pick === this.lastGreeting && list.length > 1);
  this.lastGreeting = pick;
  this.seenGreetings.add(pick);
  return pick;
};

DateManagerModel.prototype.getISODate = function() {
  var y = this.currentDate.getFullYear();
  var m = String(this.currentDate.getMonth()+1).padStart(2,'0');
  var d = String(this.currentDate.getDate()).padStart(2,'0');
  return y + '-' + m + '-' + d;
};

DateManagerModel.prototype.getFormattedDate = function() {
  return this.currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

DateManagerModel.prototype.prevDay = function() {
  this.currentDate.setDate(this.currentDate.getDate()-1);
};

DateManagerModel.prototype.nextDay = function() {
  this.currentDate.setDate(this.currentDate.getDate()+1);
};