var ChatView = function() {
  this.historyEl = document.getElementById('history');
  this.promptEl = document.getElementById('prompt');
  this.btn = document.getElementById('btn');
  this.clearBtn = document.getElementById('clearBtn');
  this.prevDayBtn = document.getElementById('prevDayBtn');
  this.nextDayBtn = document.getElementById('nextDayBtn');
  this.finishBtn = document.getElementById('finishBtn');
  this.currentDateLabel = document.getElementById('currentDateLabel');
  this.dailyProgress = document.getElementById('dailyProgress');
  this.userBadge = document.getElementById('userBadge');
};
ChatView.prototype.render = function(history) {
  var self = this; this.historyEl.innerHTML = '';
  history.forEach(function(m) {
    var div = document.createElement('div');
    div.className = 'msg ' + m.role;
    div.textContent = m.content;
    self.historyEl.appendChild(div);
  });
  if (self.historyEl.lastChild) self.historyEl.lastChild.scrollIntoView({ behavior: 'smooth' });
};
ChatView.prototype.updateDate = function(dateStr) { if (this.currentDateLabel) this.currentDateLabel.textContent = 'Date: ' + dateStr; };
ChatView.prototype.updateProgress = function(aspects) {
  var self = this; if (!self.dailyProgress) return;
  self.dailyProgress.innerHTML = '';
  ['chronicle','emotional','relational','reflexive','projective'].forEach(function(k){
    var span = document.createElement('span');
    span.className = 'badge ' + (aspects[k] ? 'done' : '');
    span.textContent = (aspects[k] ? '✓ ' : '○ ') + k;
    self.dailyProgress.appendChild(span);
  });
};
