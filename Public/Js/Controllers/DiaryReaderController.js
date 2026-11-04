var DiaryReaderController = function() {
  this.diaryModel = new DiaryModel();
  this.calendarView = new CalendarView();
  this.readerView = new DiaryReaderView();
  var today = new Date().toISOString().split('T')[0];
  var all = this.diaryModel.getAllDates();
  this.currentSelectedDate = all.length > 0 ? all[all.length-1] : today;
  this.currentEditContext = null;
  this.init();
};
DiaryReaderController.prototype.init = function() {
  var self = this;
  var allDates = this.diaryModel.getAllDates();
  this.calendarView.render(allDates, this.currentSelectedDate, function(date){
    self.currentSelectedDate = date; self.showDate(date);
  });
  this.showDate(this.currentSelectedDate);

  if (this.readerView.searchEl) {
    this.readerView.searchEl.addEventListener('input', function(){
      var q = self.readerView.searchEl.value.trim();
      if (q) {
        var results = self.diaryModel.search(q);
        self.readerView.renderList(results, self.handleEdit.bind(self), self.handleDelete.bind(self));
        if (self.readerView.dateTitle) self.readerView.dateTitle.textContent = 'Search results for: "' + q + '" (' + results.length + ')';
      } else {
        self.showDate(self.currentSelectedDate);
      }
    });
  }
  if (this.readerView.saveEditBtn) this.readerView.saveEditBtn.onclick = function(){ self.saveEdit(); };
  if (this.readerView.cancelEditBtn) this.readerView.cancelEditBtn.onclick = function(){ self.readerView.hideEditModal(); };
  if (this.readerView.editModal) {
    this.readerView.editModal.onclick = function(e){ if (e.target === self.readerView.editModal) self.readerView.hideEditModal(); };
  }
};
DiaryReaderController.prototype.showDate = function(isoDate) {
  var day = this.diaryModel.getDay(isoDate);
  var entries = day.entries.map(function(en, idx){ return { date: isoDate, index: idx, role: en.role, content: en.content, ts: en.ts || Date.now(), edited: en.edited }; });
  this.readerView.renderList(entries, this.handleEdit.bind(this), this.handleDelete.bind(this));
  if (this.readerView.dateTitle) this.readerView.dateTitle.textContent = 'Diary Entries for ' + isoDate + ' (' + entries.length + ')';
};
DiaryReaderController.prototype.handleEdit = function(date, index, content) {
  this.currentEditContext = { date: date, index: index };
  this.readerView.showEditModal(content);
};
DiaryReaderController.prototype.handleDelete = function(date, index) {
  if (!confirm('Delete entry from ' + date + '?')) return;
  this.diaryModel.deleteEntry(date, index); this.showDate(date);
  var allDates = this.diaryModel.getAllDates(); var self = this;
  this.calendarView.render(allDates, this.currentSelectedDate, function(d){ self.currentSelectedDate = d; self.showDate(d); });
};
DiaryReaderController.prototype.saveEdit = function() {
  var newContent = this.readerView.editTextarea.value.trim();
  if (!newContent || !this.currentEditContext) return;
  var ctx = this.currentEditContext;
  this.diaryModel.editEntry(ctx.date, ctx.index, newContent);
  this.readerView.hideEditModal(); this.showDate(ctx.date);
};