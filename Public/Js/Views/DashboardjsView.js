if (!AppConfig.isAuthenticated()) window.location.href = './login.html';
var session = new NickSessionModel().getCurrent();
document.getElementById('userBadge').textContent = session ? session.nick.toUpperCase() : 'NICK';
var diaryKey = AppConfig.getCurrentDiaryKey();
var diary = JSON.parse(localStorage.getItem(diaryKey) || '{}');
var totalDays = Object.keys(diary).filter(function(d){ return diary[d].entries && diary[d].entries.length > 0; }).length;
var totalEntries = session ? (session.loginCount || 0) : 0;
document.getElementById('totalDays').textContent = totalDays;
document.getElementById('totalEntries').textContent = totalEntries;
var body = document.getElementById('usersBody');
var tr = document.createElement('tr');
tr.innerHTML = '<td>'+ session.nick.toUpperCase() +'</td><td>'+ (session.age_range||'-') +'</td><td>'+ totalDays +'</td><td>'+ totalEntries +'</td>';
body.appendChild(tr);
document.getElementById('logoutBtn').onclick = function(){ new NickSessionModel().logout(); };

var appModal = document.getElementById('appModal');
var modalTitle = document.getElementById('modalTitle');
var modalBody = document.getElementById('modalBody');
var closeModalBtn = document.getElementById('closeModalBtn');
var confirmModalBtn = document.getElementById('confirmModalBtn');
var closeX = document.getElementById('closeX');
var modalMode = null;

function openModal(mode){
  modalMode = mode;
  appModal.classList.add('show');
  if (mode === 'terms') {
    modalTitle.innerHTML = '<h2>Terms and Conditions<h2>';
    modalBody.innerHTML = `
    <h3 style="margin:0;">Global Privacy Notice - Worldwide Compliant</h3>
    <h4 style="margin:0;">Principles Global Child Safety, GDPR, COPPA, no national-specific)</h4>
    <ul style="margin:0;">
      <li><strong>13+ only</strong>: Age gate required. No service for under 13.</li>
      <li><strong>Nick only login</strong>: User chooses nick (not real name). No email, no phone, no real name collection.</li>
      <li><strong>Password = Access Code (API key Meta test version)</strong>: Field labeled "Access Code" or "Password". Stored locally only in this browser, never transmitted to third parties.</li>
      <li><strong>Age range</strong>: Collected only as range 13-15 / 16-18 / 18+ for user differentiation and safety, not displayed publicly in chat.</li>
      <li><strong>Data minimization</strong>: No DOB exact, no address, no gender, no sexual orientation, no device fingerprint.</li>
      <li><strong>Local-only</strong>: Diary entries stored in localStorage of this browser. No server storage.</li>
      <li><strong>5-aspect completion advice</strong>: When chronicle, emotional, relational, reflexive, projective are all true for a day, system provides supportive advice.</li>
      <li><strong>Right to be forgotten</strong>: Delete All Data button clears Diary, Session, Prefs, Access Code.</li>
      <li><strong>Resources</strong>: If user expresses need for support, show generic message to talk to trusted adult and contact local support resources.</li>
    </ul>
    <p class="privacy-footer">This design follows Meta's global policies: no sexualization of minors, no collection of sensitive personal data of minors, no medical advice, minimal data, user control.</p>
    `;
    closeModalBtn.textContent = 'Close';
    confirmModalBtn.style.display = 'none';
  } else if (mode === 'deleteTest') {
    modalTitle.textContent = 'Delete Test Data';
    modalBody.textContent = "Are you sure you want to delete all test data? This will delete all users, all diaries, all passwords and return to login page. This action cannot be undone.";
    closeModalBtn.textContent = 'Close';
    confirmModalBtn.textContent = 'Confirm';
    confirmModalBtn.style.display = 'block';
  }
}
function closeModal(){ appModal.classList.remove('show'); modalMode = null; }

document.getElementById('termsBtn').onclick = function(){ openModal('terms'); };
document.getElementById('deleteTestDataBtn').onclick = function(){ openModal('deleteTest'); };
closeX.onclick = closeModal;
closeModalBtn.onclick = closeModal;
appModal.onclick = function(e){ if (e.target === appModal) closeModal(); };

confirmModalBtn.onclick = function(){
  if (modalMode === 'deleteTest') {
    var keysToRemove = [];
    for (var i=0; i<localStorage.length; i++){
      var k = localStorage.key(i);
      if (k && (k.startsWith('diary_user_') || k.startsWith('prefs_') || k.startsWith('consent_13plus_') || k === 'users_registry_v3' || k === 'session_current_nick_v3')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(function(k){ localStorage.removeItem(k); });
    sessionStorage.clear();
    window.location.href = './login.html';
  }
};