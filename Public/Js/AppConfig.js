var AppConfig = {
  ChatApiUrl: "https://api.meta.ai/v1/chat/completions",
  WellbeingApiUrl: "https://api.meta.ai/v1/responses",
  ChatModel: "muse-spark-1.3",
  WellbeingModel: "muse-wonder-1.0",
  DiaryStorageKeyPrefix: "diary_user_",
  DateStorageKey: "diary_date_global_v3",
  SessionNickKey: "session_current_nick_v3",
  UsersRegistryKey: "users_registry_v3",
  ConsentKeyPrefix: "consent_13plus_",
  PrefsKeyPrefix: "prefs_",

  getSessionNick: function(){ return localStorage.getItem(this.SessionNickKey) || null; },
  getCurrentDiaryKey: function(){ var nick = this.getSessionNick(); return nick ? this.DiaryStorageKeyPrefix + nick : null; },
  getCurrentPrefsKey: function(){ var nick = this.getSessionNick(); return nick ? this.PrefsKeyPrefix + nick : null; },
  getCurrentConsentKey: function(){ var nick = this.getSessionNick(); return nick ? this.ConsentKeyPrefix + nick : null; },
  getConsentForNick: function(nick){ return localStorage.getItem(this.ConsentKeyPrefix + nick) === 'yes'; },
  getApiKey: function(){ return sessionStorage.getItem('temp_api_key_v3') || null; },
  isAuthenticated: function(){ return !!this.getSessionNick() && !!this.getApiKey(); },
  clearSession: function(){
    sessionStorage.removeItem('temp_api_key_v3');
    localStorage.removeItem(this.SessionNickKey);
  },
  clearAllUserData: function(nick){
    if (!nick) return;
    localStorage.removeItem(this.DiaryStorageKeyPrefix + nick);
    localStorage.removeItem(this.PrefsKeyPrefix + nick);
    localStorage.removeItem(this.ConsentKeyPrefix + nick);
    var registry = JSON.parse(localStorage.getItem(this.UsersRegistryKey) || '{}');
    delete registry[nick];
    localStorage.setItem(this.UsersRegistryKey, JSON.stringify(registry));
  }
};