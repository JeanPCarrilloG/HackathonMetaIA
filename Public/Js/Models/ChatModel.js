var ChatModel = function() {
  try {
    this.history = JSON.parse(localStorage.getItem(AppConfig.StorageKey) || '[]');
    if (!Array.isArray(this.history)) this.history = [];
  } catch (e) {
    this.history = [];
  }
};
ChatModel.prototype.add = function(role, content) {
  this.history.push({ role: role, content: content, ts: Date.now() });
  this.save();
};
ChatModel.prototype.save = function() {
  try { localStorage.setItem(AppConfig.StorageKey, JSON.stringify(this.history)); } catch(e){}
};
ChatModel.prototype.clear = function() { this.history = []; this.save(); };
ChatModel.prototype.getLastMessages = function(limit) {
  limit = limit || 10;
  return this.history.slice(-limit).filter(function(m){
    return m.role === 'user' || m.role === 'assistant';
  }).map(function(m){
    return { role: m.role, content: m.content.replace(/^You: |^Assistant: /g, '') };
  });
};
ChatModel.prototype.getAll = function() { return this.history; };