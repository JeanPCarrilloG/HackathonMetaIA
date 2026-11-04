var NickSessionModel = function(){};

NickSessionModel.prototype.login = async function(nick, apiKey){
  var registry = new UserRegistryModel();
  var cleanNick = nick.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0,20);
  if (!registry.exists(cleanNick)) throw new Error('User not found. Please create user first.');
  var validation = await registry.validateApiKey(apiKey);
  if (!validation.valid) throw new Error(validation.error);
  
  registry.incrementLogin(cleanNick);
  localStorage.setItem(AppConfig.SessionNickKey, cleanNick);
  sessionStorage.setItem('temp_api_key_v3', apiKey.trim());
  return cleanNick;
};

NickSessionModel.prototype.createAndLogin = async function(nick, apiKey, ageRange){
  var registry = new UserRegistryModel();
  var validation = await registry.validateApiKey(apiKey);
  if (!validation.valid) throw new Error('Invalid API key: ' + validation.error);
  var createdNick = registry.createUser(nick, ageRange);
  localStorage.setItem(AppConfig.SessionNickKey, createdNick);
  sessionStorage.setItem('temp_api_key_v3', apiKey.trim());
  return createdNick;
};

NickSessionModel.prototype.getCurrent = function(){
  var nick = AppConfig.getSessionNick();
  if (!nick) return null;
  var registry = new UserRegistryModel();
  var user = registry.getUser(nick);
  return {
    nick: nick,
    age_range: user ? user.age_range : 'unknown',
    loginCount: user ? user.loginCount : 0,
    user: user,
    api_present: !!AppConfig.getApiKey()
  };
};

NickSessionModel.prototype.logout = function(){
  AppConfig.clearSession();
  window.location.href = './login.html';
};