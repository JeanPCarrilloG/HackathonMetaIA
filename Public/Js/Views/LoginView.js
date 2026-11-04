// LoginView v3.2 - No dropdown, nick exact, API same as creation
var tabCreateBtn = document.getElementById('tabCreateBtn');
var tabLoginBtn = document.getElementById('tabLoginBtn');
var createPanel = document.getElementById('createPanel');
var loginPanel = document.getElementById('loginPanel');

function showCreate(){
  createPanel.style.display = 'block';
  loginPanel.style.display = 'none';
  tabCreateBtn.className = 'PrimaryButton';
  tabLoginBtn.className = 'SecondaryButton';
}
function showLogin(){
  createPanel.style.display = 'none';
  loginPanel.style.display = 'block';
  tabLoginBtn.className = 'PrimaryButton';
  tabCreateBtn.className = 'SecondaryButton';
}

if (tabCreateBtn) tabCreateBtn.onclick = showCreate;
if (tabLoginBtn) tabLoginBtn.onclick = showLogin;

// Default: Login first
showLogin();

// CREATE USER - age and terms only once
document.getElementById('createUserBtn').onclick = async function(){
  var nick = document.getElementById('createNickInput').value.trim();
  var apiKey = document.getElementById('createApiInput').value.trim();
  var ageRange = document.getElementById('createAgeSelect').value;
  var terms = document.getElementById('createTermsCheck').checked;
  var err = document.getElementById('createError');
  var btn = this;
  try {
    if (!terms) throw new Error('You must accept terms and conditions (once). Age 13+ only.');
    btn.disabled = true; btn.textContent = 'Validating API...';
    var session = new NickSessionModel();
    await session.createAndLogin(nick, apiKey, ageRange);
    window.location.href = './index.html';
  } catch(e){
    err.textContent = e.message;
    err.style.display = 'block';
    btn.disabled = false; btn.textContent = 'Create User';
  }
};

// LOGIN - exact nick + same API as creation, API never stored
document.getElementById('loginBtn').onclick = async function(){
  var nick = document.getElementById('loginNickInput').value.trim();
  var apiKey = document.getElementById('loginApiInput').value.trim();
  var err = document.getElementById('loginError');
  var btn = this;
  try {
    if (!nick || !apiKey) throw new Error('Nick and API key required - type exact nick as created');
    btn.disabled = true; btn.textContent = 'Validating...';
    var session = new NickSessionModel();
    await session.login(nick, apiKey);
    window.location.href = './index.html';
  } catch(e){
    err.textContent = e.message;
    err.style.display = 'block';
    btn.disabled = false; btn.textContent = 'Login';
  }
};