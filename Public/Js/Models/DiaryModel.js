var DiaryModel = function() {
  try {
    var key = AppConfig.getCurrentDiaryKey();
    if (!key) key = AppConfig.DiaryStorageKeyPrefix ? AppConfig.DiaryStorageKeyPrefix + 'default' : 'diary_global';
    this.storageKey = key;
    var raw = localStorage.getItem(this.storageKey);
    this.diary = raw ? JSON.parse(raw) : {};
  } catch (e) { 
    this.diary = {}; 
    this.storageKey = AppConfig.getCurrentDiaryKey() || 'diary_global';
  }
};
DiaryModel.prototype.getDay = function(isoDate) {
  if (!this.diary[isoDate]) {
    this.diary[isoDate] = {
      aspects: { chronicle: false, emotional: false, relational: false, reflexive: false, projective: false },
      entries: [],
      adviceModalShown: false,
      dailyAdvice: null
    };
  }
  if (typeof this.diary[isoDate].adviceModalShown === 'undefined') this.diary[isoDate].adviceModalShown = false;
  if (typeof this.diary[isoDate].dailyAdvice === 'undefined') this.diary[isoDate].dailyAdvice = null;
  return this.diary[isoDate];
};
DiaryModel.prototype.getAllDates = function() { return Object.keys(this.diary).sort(); };
DiaryModel.prototype.markAspect = function(isoDate, aspect) {
  var day = this.getDay(isoDate); day.aspects[aspect] = true; this.save();
};
DiaryModel.prototype.addEntry = function(isoDate, role, content) {
  var day = this.getDay(isoDate);
  day.entries.push({ role: role, content: content, ts: Date.now() });
  this.save(); return day.entries.length - 1;
};
DiaryModel.prototype.getMissingAspects = function(isoDate) {
  var day = this.getDay(isoDate); var missing = [];
  for (var k in day.aspects) if (!day.aspects[k]) missing.push(k);
  return missing;
};
DiaryModel.prototype.markAdviceModalShown = function(isoDate, adviceText) {
  var day = this.getDay(isoDate);
  day.adviceModalShown = true;
  if (adviceText) day.dailyAdvice = adviceText;
  this.save();
};
DiaryModel.prototype.clearAdviceModalFlag = function(isoDate) {
  var day = this.getDay(isoDate);
  day.adviceModalShown = false;
  this.save();
};
DiaryModel.prototype.isAdviceModalShown = function(isoDate) {
  return !!this.getDay(isoDate).adviceModalShown;
};
DiaryModel.prototype.getDailyAdvice = function(isoDate) {
  return this.getDay(isoDate).dailyAdvice || null;
};
DiaryModel.prototype.save = function() {
  localStorage.setItem(this.storageKey, JSON.stringify(this.diary));
};
DiaryModel.prototype.detectAspects = function(text) {
  var t = text.toLowerCase(); var found = {};
  if (/(school|home|family|work|class|today|morning|afternoon)/.test(t) || t.length > 20) found.chronicle = true;
  if (/(feel|felt|happy|sad|angry|excited|worried|scared|good|bad|tired)/.test(t)) found.emotional = true;
  if (/(friend|friends|family|mom|dad|brother|sister|together|played|talked)/.test(t)) found.relational = true;
  if (/(because|learn|think|realize|understand|should|why)/.test(t)) found.reflexive = true;
  if (/(tomorrow|next|want to|will|wish|dream|become|future|goal)/.test(t)) found.projective = true;
  return found;
};