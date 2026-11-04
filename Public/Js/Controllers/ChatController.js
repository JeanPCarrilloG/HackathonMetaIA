var ChatController = function() {
  this.model = new ChatModel();
  this.wellbeingModel = new WellbeingSignalModel();
  this.diaryModel = new DiaryModel();
  this.dateModel = new DateManagerModel();
  this.view = new ChatView();
  this.isModalActive = false;
  this.modalTimer = null;
  this.currentAdvice = null;
  this.init();
};
ChatController.prototype.init = function() {
  if (!AppConfig.isAuthenticated()) { window.location.href = './login.html'; return; }
  var session = new NickSessionModel().getCurrent();
  if (!session) { window.location.href = './login.html'; return; }
  if (this.view.userBadge) this.view.userBadge.textContent = session.nick.toUpperCase();
  var self = this;
  this.loadDay(this.dateModel.getISODate());
  this.view.btn.onclick = function() { self.send(); };
  if (this.view.nextDayBtn) this.view.nextDayBtn.onclick = function() { self.nextDay(); };
  if (this.view.prevDayBtn) this.view.prevDayBtn.onclick = function() { self.prevDay(); };
  this.view.promptEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); self.send(); }
  });
  this.view.promptEl.focus();
  this.adviceModal = document.getElementById('adviceModal');
  this.adviceBody = document.getElementById('adviceModalBody');
  if (this.adviceModal) {
    var closeX = document.getElementById('closeAdviceX');
    var closeBtn = document.getElementById('closeAdviceBtn');
    var continueBtn = document.getElementById('continueWritingBtn');
    if (closeX) closeX.onclick = function(){ self.closeWithDailyAdvice(); };
    if (closeBtn) closeBtn.onclick = function(){ self.closeWithDailyAdvice(); };
    if (continueBtn) continueBtn.onclick = function(){ self.continueWriting(); };
    this.adviceModal.onclick = function(e){ if (e.target === self.adviceModal) self.closeWithDailyAdvice(); };
  }
};
ChatController.prototype.getFullDayConversation = function(isoDate) {
  var day = this.diaryModel.getDay(isoDate);
  if (!day || !day.entries || day.entries.length === 0) return "";
  var userTexts = day.entries.filter(function(en){ return en.role === 'user'; }).map(function(en){ return en.content; }).join(" ");
  if (!userTexts) userTexts = day.entries.map(function(en){ return en.content; }).join(" ");
  return userTexts;
};
ChatController.prototype.showAdviceModal = function(advice){
  this.isModalActive = true;
  if (this.modalTimer) { clearTimeout(this.modalTimer); this.modalTimer = null; }
  var cleanAdvice = (advice || '').replace(/\s*\[[^\]]+\]\s*$/g, '').replace(/\s*\d{3,6}\s*$/g, '').replace(/^Daily advice of your diary:\s*/i, '').trim();
  this.currentAdvice = cleanAdvice;
  if (this.adviceBody) this.adviceBody.textContent = cleanAdvice;
  if (this.adviceModal) this.adviceModal.classList.add('show');
  if (this.view.btn) { this.view.btn.disabled = true; this.view.btn.textContent = 'Waiting for modal choice...'; }
};
ChatController.prototype.hideAdviceModal = function(){
  this.isModalActive = false;
  if (this.adviceModal) this.adviceModal.classList.remove('show');
  if (this.view.btn) { this.view.btn.disabled = false; this.view.btn.textContent = 'Send'; }
  this.view.promptEl.focus();
};
ChatController.prototype.closeWithDailyAdvice = async function(){
  if (this.modalTimer) { clearTimeout(this.modalTimer); this.modalTimer = null; }
  this.isModalActive = false;
  this.hideAdviceModal();
  var iso = this.dateModel.getISODate();
  var advice = this.currentAdvice || this.diaryModel.getDailyAdvice(iso) || "Daily reflection complete.";
  advice = advice.replace(/\s*\[[^\]]+\]\s*$/g, '').replace(/\s*\d{3,6}\s*$/g, '').replace(/^Daily advice of your diary:\s*/i, '').trim();
  var dailyEntry = "Daily advice of your diary: " + advice;
  this.model.add('assistant', 'Assistant: ' + dailyEntry);
  this.diaryModel.addEntry(iso, 'assistant', dailyEntry);
  this.view.render(this.model.getAll());
  try {
    var qGen = new QuestionGeneratorModel();
    var closing = await qGen.getParaphrasedClosing();
    closing = closing.replace(/\s*\[[^\]]+\]\s*$/g, '').replace(/\s*\d{3,6}\s*$/g, '').trim();
    this.model.add('assistant', 'Assistant: ' + closing);
    this.diaryModel.addEntry(iso, 'assistant', closing);
  } catch(e) {
    var fallbackClosing = "Thanks for noting today. You can return whenever you wish.";
    this.model.add('assistant', 'Assistant: ' + fallbackClosing);
    this.diaryModel.addEntry(iso, 'assistant', fallbackClosing);
  }
  var day = this.diaryModel.getDay(iso);
  day.adviceModalShown = true;
  day.dailyAdvice = advice;
  this.diaryModel.save();
  this.view.render(this.model.getAll());
  this.currentAdvice = null;
};
ChatController.prototype.continueWriting = async function(){
  if (this.modalTimer) { clearTimeout(this.modalTimer); this.modalTimer = null; }
  this.isModalActive = false;
  this.hideAdviceModal();
  var iso = this.dateModel.getISODate();
  var day = this.diaryModel.getDay(iso);
  day.adviceModalShown = false;
  if (this.currentAdvice) day.dailyAdvice = this.currentAdvice;
  this.diaryModel.save();
  try {
    var qGen = new QuestionGeneratorModel();
    var nextQ = await qGen.getParaphrasedGeneric();
    nextQ = nextQ.replace(/\s*\[[^\]]+\]\s*$/g, '').replace(/\s*\d{3,6}\s*$/g, '').trim();
    this.model.add('assistant', 'Assistant: ' + nextQ);
    this.diaryModel.addEntry(iso, 'assistant', nextQ);
  } catch(e) {
    var fallbackQ = "Would you like to share more about your day?";
    this.model.add('assistant', 'Assistant: ' + fallbackQ);
    this.diaryModel.addEntry(iso, 'assistant', fallbackQ);
  }
  this.view.render(this.model.getAll());
  this.currentAdvice = null;
};
ChatController.prototype.loadDay = async function(isoDate){
  var self = this;
  if (self.modalTimer) { clearTimeout(self.modalTimer); self.modalTimer = null; }
  self.isModalActive = false;
  self.currentAdvice = null;
  self.view.updateDate(self.dateModel.getFormattedDate());
  var day = self.diaryModel.getDay(isoDate);
  self.view.updateProgress(day.aspects);
  self.model.clear(); self.model.history = [];
  day.entries.forEach(function(en){ self.model.add(en.role, en.content); });
  if (day.entries.length === 0) {
    try {
      var greet = await self.dateModel.getGreetingAsync();
      greet = greet.replace(/\s*\[[^\]]+\]\s*$/g, '').replace(/\s*\d{3,6}\s*$/g, '').trim();
      self.model.add('assistant', 'Assistant: ' + greet);
      self.diaryModel.addEntry(isoDate, 'assistant', greet);
    } catch(e) {
      var greet2 = self.dateModel.getGreeting();
      self.model.add('assistant', 'Assistant: ' + greet2);
      self.diaryModel.addEntry(isoDate, 'assistant', greet2);
    }
  }
  self.view.render(self.model.getAll());
  self.view.btn.disabled = false;
  self.view.btn.textContent = 'Send';
  if (self.view.promptEl) self.view.promptEl.disabled = false;
  var missing = self.diaryModel.getMissingAspects(isoDate);
  var alreadyShown = self.diaryModel.isAdviceModalShown(isoDate);
  if (missing.length === 0 && day.entries.length > 0 && !alreadyShown) {
    self.modalTimer = setTimeout(async function(){
      try {
        if (self.isModalActive) return;
        if (self.diaryModel.isAdviceModalShown(isoDate)) return;
        var fullConversation = self.getFullDayConversation(isoDate);
        var aiAdvice = await self.wellbeingModel.getCompletionAdviceAsync(fullConversation);
        if (self.diaryModel.isAdviceModalShown(isoDate)) return;
        self.showAdviceModal(aiAdvice);
      } catch(err) {
        console.log('[MODAL ERROR]', err);
      }
    }, 800);
  }
};
ChatController.prototype.prevDay = function() {
  if (this.isModalActive) return;
  if (this.modalTimer) { clearTimeout(this.modalTimer); this.modalTimer = null; }
  this.dateModel.prevDay();
  this.diaryModel = new DiaryModel();
  this.loadDay(this.dateModel.getISODate());
};
ChatController.prototype.nextDay = function() {
  if (this.isModalActive) return;
  if (this.modalTimer) { clearTimeout(this.modalTimer); this.modalTimer = null; }
  this.dateModel.nextDay();
  this.diaryModel = new DiaryModel();
  this.loadDay(this.dateModel.getISODate());
};
ChatController.prototype.isClosingIntent = function(text) {
  var t = text.toLowerCase().trim();
  return /^(no|nope|nothing|no more|that's it|close|finish|bye|end)$/.test(t) || t.length < 3;
};
ChatController.prototype.send = async function() {
  if (this.isModalActive) return;
  var text = this.view.promptEl.value.trim();
  if (!text) return;
  var iso = this.dateModel.getISODate();
  var detected = this.diaryModel.detectAspects(text);
  for (var k in detected) this.diaryModel.markAspect(iso, k);
  this.view.updateProgress(this.diaryModel.getDay(iso).aspects);
  this.model.add('user', 'You: ' + text);
  this.diaryModel.addEntry(iso, 'user', text);
  this.view.promptEl.value = '';
  this.view.render(this.model.getAll());
  this.view.btn.disabled = true; this.view.btn.textContent = 'Generating...';
  var self = this;
  var missingAfter = self.diaryModel.getMissingAspects(iso);
  var alreadyShown = self.diaryModel.isAdviceModalShown(iso);
  if (missingAfter.length === 0 && !alreadyShown) {
    try {
      var fullConversation = self.getFullDayConversation(iso);
      var aiAdvice = await self.wellbeingModel.getCompletionAdviceAsync(fullConversation);
      if (self.diaryModel.isAdviceModalShown(iso)) {
        self.view.btn.disabled = false;
        self.view.btn.textContent = 'Send';
        return;
      }
      self.showAdviceModal(aiAdvice);
      self.view.render(self.model.getAll());
    } catch(err) {
      console.log('[SEND ADVICE ERROR]', err);
      self.view.btn.disabled = false;
      self.view.btn.textContent = 'Send';
    }
    return;
  }
  try {
    var qGen = new QuestionGeneratorModel();
    var responseText = "";
    if (self.isClosingIntent(text)) responseText = await qGen.getParaphrasedClosing();
    else {
      var missing = self.diaryModel.getMissingAspects(iso);
      if (missing.length > 0) responseText = await qGen.getParaphrasedDiaryQuestion(missing[0]);
      else responseText = await qGen.getParaphrasedGeneric();
    }
    responseText = responseText.replace(/\s*\[[^\]]+\]\s*$/g, '').replace(/\s*\d{3,6}\s*$/g, '').trim();
    self.model.add('assistant', 'Assistant: ' + responseText);
    self.diaryModel.addEntry(iso, 'assistant', responseText);
  } catch (e) {
    console.log('[CHAT ERROR]', e);
  } finally {
    if (!self.isModalActive) {
      self.view.render(self.model.getAll());
      self.view.updateProgress(self.diaryModel.getDay(iso).aspects);
      self.view.btn.disabled = false; self.view.btn.textContent = 'Send';
      if (self.view.promptEl) self.view.promptEl.disabled = false;
      self.view.promptEl.focus();
    }
  }
};