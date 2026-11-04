var DiaryReaderView = function(){
  this.listEl = document.getElementById('diaryList');
  this.dateTitle = document.getElementById('selectedDateTitle');
  this.searchEl = document.getElementById('searchBar');
  this.editModal = document.getElementById('editModal');
  this.editTextarea = document.getElementById('editTextarea');
  this.saveEditBtn = document.getElementById('saveEditBtn');
  this.cancelEditBtn = document.getElementById('cancelEditBtn');
};
DiaryReaderView.prototype.renderList = function(entries, onEdit, onDelete){
  if (!this.listEl) return;
  this.listEl.innerHTML = '';
  if (!entries || entries.length === 0) {
    this.listEl.innerHTML = '<p style="color:#999">No entries for this day. Try another date or search.</p>';
    return;
  }
  var self = this;
  entries.forEach(function(e){
    var div = document.createElement('div');
    div.className = 'msg ' + e.role;
    div.style.padding = '12px'; div.style.margin = '8px 0'; div.style.borderRadius = '8px';
    div.style.background = e.role === 'user' ? '#0f172a' : '#1e293b';
    div.style.border = '1px solid #334155';
    var header = document.createElement('div');
    header.style.fontSize = '.75rem'; header.style.color = '#94a3b8';
    header.textContent = e.date + ' • ' + e.role + (e.edited ? ' (edited)' : '');
    var content = document.createElement('div');
    content.textContent = e.content;
    content.style.marginTop = '6px'; content.style.whiteSpace = 'pre-wrap';
    var actions = document.createElement('div');
    actions.style.marginTop = '8px'; actions.style.display = 'flex'; actions.style.gap = '8px';
    var editBtn = document.createElement('button');
    editBtn.textContent = 'Edit'; editBtn.className = 'SecondaryButton'; editBtn.style.fontSize = '.75rem';
    editBtn.onclick = function(){ onEdit(e.date, e.index, e.content); };
    var delBtn = document.createElement('button');
    delBtn.textContent = 'Delete'; delBtn.className = 'SecondaryButton'; delBtn.style.fontSize = '.75rem';
    delBtn.onclick = function(){ onDelete(e.date, e.index); };
    actions.appendChild(editBtn); actions.appendChild(delBtn);
    div.appendChild(header); div.appendChild(content); div.appendChild(actions);
    self.listEl.appendChild(div);
  });
};
DiaryReaderView.prototype.showEditModal = function(content){
  if (!this.editModal) return;
  this.editTextarea.value = content;
  this.editModal.style.display = 'flex';
  this.editTextarea.focus();
};
DiaryReaderView.prototype.hideEditModal = function(){
  if (this.editModal) this.editModal.style.display = 'none';
};

if (!AppConfig.isAuthenticated()) window.location.href = './login.html';
var s = new NickSessionModel().getCurrent();
if (s) document.getElementById('userBadge').textContent = s.nick.toUpperCase();
document.getElementById('logoutBtn').onclick = function(){ new NickSessionModel().logout(); };
document.addEventListener('DOMContentLoaded', function(){ new DiaryReaderController(); });