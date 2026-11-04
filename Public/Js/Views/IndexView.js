document.addEventListener('DOMContentLoaded', function(){
  var lb = document.getElementById('logoutBtn');
  if (lb) lb.onclick = function(){ new NickSessionModel().logout(); };
});