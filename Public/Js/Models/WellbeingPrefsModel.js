// WellbeingPrefsModel - REPLACES ProfileModel.js
// Only coarse, non-sensitive prefs. No DOB, gender, orientation, device
var WellbeingPrefsModel = function() {
  try {
    this.prefs = JSON.parse(localStorage.getItem(AppConfig.PrefsKey) || '{}');
  } catch(e) { this.prefs = {}; }
};
WellbeingPrefsModel.prototype.getAll = function() { return this.prefs; };
WellbeingPrefsModel.prototype.save = function() {
  localStorage.setItem(AppConfig.PrefsKey, JSON.stringify(this.prefs));
};
