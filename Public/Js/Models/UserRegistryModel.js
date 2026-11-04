// UserRegistryModel - Counts logins as Entries, Days = days written
var UserRegistryModel = function(){
  try { this.registry = JSON.parse(localStorage.getItem(AppConfig.UsersRegistryKey) || '{}'); } catch(e){ this.registry = {}; }
};
UserRegistryModel.prototype.save = function(){
  localStorage.setItem(AppConfig.UsersRegistryKey, JSON.stringify(this.registry));
};
UserRegistryModel.prototype.exists = function(nick){
  return !!this.registry[nick];
};
UserRegistryModel.prototype.createUser = function(nick, ageRange){
  if (this.exists(nick)) throw new Error('Nick already exists, use Login instead');
  if (!nick || nick.length < 3) throw new Error('Nick min 3 chars');
  var cleanNick = nick.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0,20);
  if (!cleanNick) throw new Error('Invalid nick');
  if (!ageRange || ['13-15','16-18','18+'].indexOf(ageRange) === -1) throw new Error('Select valid age range 13+');
  
  this.registry[cleanNick] = {
    nick: cleanNick,
    age_range: ageRange,
    termsAccepted: true,
    created_at: new Date().toISOString(),
    loginCount: 1 // First login counts as entry
  };
  this.save();
  localStorage.setItem(AppConfig.ConsentKeyPrefix + cleanNick, 'yes');
  localStorage.setItem(AppConfig.PrefsKeyPrefix + cleanNick, JSON.stringify(this.registry[cleanNick]));
  return cleanNick;
};
UserRegistryModel.prototype.getUser = function(nick){ return this.registry[nick] || null; };
UserRegistryModel.prototype.getAllNicks = function(){ return Object.keys(this.registry); };
UserRegistryModel.prototype.incrementLogin = function(nick){
  if (!this.registry[nick]) return;
  this.registry[nick].loginCount = (this.registry[nick].loginCount || 0) + 1;
  this.save();
  localStorage.setItem(AppConfig.PrefsKeyPrefix + nick, JSON.stringify(this.registry[nick]));
};
UserRegistryModel.prototype.validateApiKey = async function(apiKey){
  if (!apiKey || apiKey.trim().length < 8) return { valid: false, error: 'API key must be at least 8 chars' };
  if (/\s/.test(apiKey)) return { valid: false, error: 'Invalid API key format' };
  return { valid: true };
};