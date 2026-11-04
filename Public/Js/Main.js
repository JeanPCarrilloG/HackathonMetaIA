(function() {
  function boot() {
    if (document.getElementById('history') && document.getElementById('prompt')) {
      if (!AppConfig.isAuthenticated() && !window.location.pathname.includes('login.html')) {
        window.location.href = './login.html';
        return;
      }
      window.app = new ChatController();
      console.log('Protection Client MVC loaded with session guard');
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();