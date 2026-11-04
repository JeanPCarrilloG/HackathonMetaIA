var CalendarView = function(){
  this.container = document.getElementById('calendarContainer');
  this.dateInput = document.getElementById('calendarDateInput');
  this.nativeInput = document.getElementById('nativeDateIcon');
  this.currentMonth = new Date();
  this.selectedDate = null;
  this.allDatesSet = new Set();
};

CalendarView.prototype.render = function(allDates, selectedDate, onSelect){
  var self = this;
  this.onSelect = onSelect;
  this.allDatesSet = new Set(allDates || []);
  this.selectedDate = selectedDate;
  if (selectedDate) {
    var parts = selectedDate.split('-');
    if (parts.length === 3) this.currentMonth = new Date(parseInt(parts[0]), parseInt(parts[1])-1, 1);
  }
  this.draw();
  this.bindDateInputs(onSelect);
};

CalendarView.prototype.draw = function(){
  var self = this;
  if (!this.container) return;
  this.container.innerHTML = '';

  var year = this.currentMonth.getFullYear();
  var month = this.currentMonth.getMonth();
  var monthName = this.currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Header
  var header = document.createElement('div');
  header.className = 'CalendarHeader';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '8px';

  var prevBtn = document.createElement('button');
  prevBtn.id = 'prevM';
  prevBtn.textContent = '◀';
  prevBtn.className = 'SecondaryButton';
  prevBtn.style.width = 'auto';
  prevBtn.onclick = function(){ self.currentMonth = new Date(year, month-1, 1); self.draw(); };

  var nextBtn = document.createElement('button');
  nextBtn.id = 'nextM';
  nextBtn.textContent = '▶';
  nextBtn.className = 'SecondaryButton';
  nextBtn.style.width = 'auto';
  nextBtn.onclick = function(){ self.currentMonth = new Date(year, month+1, 1); self.draw(); };

  var title = document.createElement('span');
  title.textContent = monthName;

  header.appendChild(prevBtn);
  header.appendChild(title);
  header.appendChild(nextBtn);
  this.container.appendChild(header);

  // Grid
  var grid = document.createElement('div');
  grid.className = 'CalendarGrid';
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
  grid.style.gap = '4px';

  var dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  dayNames.forEach(function(n){
    var dn = document.createElement('div');
    dn.className = 'cal-day-name';
    dn.style.textAlign = 'center';
    dn.style.fontSize = '.75rem';
    dn.style.color = '#94a3b8';
    dn.textContent = n;
    grid.appendChild(dn);
  });

  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month+1, 0).getDate();

  for (var i=0;i<firstDay;i++){
    var empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

  for (var d=1; d<=daysInMonth; d++){
    var iso = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    var hasData = self.allDatesSet.has(iso);
    var isSelected = iso === self.selectedDate;

    var dayEl = document.createElement('div');
    dayEl.className = 'cal-day' + (hasData ? ' has-data' : '') + (isSelected ? ' selected' : '');
    dayEl.setAttribute('data-date', iso);
    dayEl.textContent = d;
    dayEl.style.textAlign = 'center';
    dayEl.style.padding = '8px 4px';
    dayEl.style.borderRadius = '6px';
    dayEl.style.cursor = 'pointer';
    dayEl.style.background = isSelected ? '#6366f1' : (hasData ? '#1e293b' : 'transparent');
    dayEl.style.color = isSelected ? 'white' : (hasData ? '#e2e8f0' : '#64748b');
    dayEl.style.border = hasData ? '1px solid #334155' : '1px solid transparent';
    dayEl.style.fontWeight = hasData ? '600' : '400';

    dayEl.onclick = (function(isoDate){
      return function(){
        self.selectedDate = isoDate;
        if (self.onSelect) self.onSelect(isoDate);
        self.syncInputs(isoDate);
        self.draw();
      };
    })(iso);

    grid.appendChild(dayEl);
  }

  this.container.appendChild(grid);
  this.syncInputs(this.selectedDate);
};

CalendarView.prototype.bindDateInputs = function(onSelect){
  var self = this;
  if (this.dateInput) {
    this.dateInput.onchange = function(){
      var val = this.value.replace(/\//g, '-');
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        self.selectedDate = val;
        var parts = val.split('-');
        self.currentMonth = new Date(parseInt(parts[0]), parseInt(parts[1])-1, 1);
        if (onSelect) onSelect(val);
        self.draw();
      }
    };
    this.dateInput.addEventListener('input', function(){
      var v = this.value.replace(/[^0-9\/]/g, '');
      if (v.length === 4 && !v.includes('/')) v = v + '/';
      if (v.length === 7 && v.split('/').length === 2) v = v + '/';
      this.value = v.slice(0,10);
    });
  }
  if (this.nativeInput) {
    this.nativeInput.onchange = function(){
      if (this.value) {
        self.selectedDate = this.value;
        var p = this.value.split('-');
        self.currentMonth = new Date(parseInt(p[0]), parseInt(p[1])-1, 1);
        if (onSelect) onSelect(this.value);
        self.draw();
      }
    };
  }
};

CalendarView.prototype.syncInputs = function(date){
  if (!date) return;
  if (this.dateInput) this.dateInput.value = date.replace(/-/g, '/');
  if (this.nativeInput) this.nativeInput.value = date;
};