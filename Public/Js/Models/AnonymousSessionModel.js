// AnonymousSessionModel - REPLACES AuthModel.js
// No PII, COPPA compliant, 13+ only
var AnonymousSessionModel = function() {};

AnonymousSessionModel.prototype.create = function(ageRange, generalRegion) {
  if (!ageRange || ['13-15','16-18','18+'].indexOf(ageRange) === -1) {
    throw new Error('Please select a valid age range (13+)');
  }
  var anonId = 'anon_' + Math.random().toString(36).slice(2,10) + Date.now().toString(36);
  localStorage.setItem(AppConfig.SessionKey, anonId);
  localStorage.setItem(AppConfig.ConsentKey, 'yes');
  var prefs = {
    age_range: ageRange,
    region_general: (generalRegion || 'not-shared').slice(0,30),
    created_at: new Date().toISOString()
  };
  localStorage.setItem(AppConfig.PrefsKey, JSON.stringify(prefs));
  return anonId;
};

AnonymousSessionModel.prototype.getCurrent = function() {
  return {
    id: AppConfig.getSessionId(),
    prefs: JSON.parse(localStorage.getItem(AppConfig.PrefsKey) || '{}'),
    consented: AppConfig.getConsent()
  };
};

AnonymousSessionModel.prototype.logout = function() {
  AppConfig.clearAll();
  window.location.href = './login.html';
};
