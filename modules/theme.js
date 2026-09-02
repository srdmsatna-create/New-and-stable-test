(()=>{
  const KEY='srdm-theme';
  const root=document.documentElement;
  function current(){return root.dataset.theme==='dark'?'dark':'light'}
  function render(){
    const btn=document.getElementById('themeToggleBtn');
    if(!btn)return;
    const dark=current()==='dark';
    btn.setAttribute('aria-pressed',String(dark));
    btn.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');
    const icon=btn.querySelector('.theme-toggle-icon');
    const label=btn.querySelector('.theme-toggle-label');
    if(icon)icon.textContent=dark?'☀️':'🌙';
    if(label)label.textContent=dark?'Light mode':'Dark mode';
  }
  function setTheme(theme){
    root.dataset.theme=theme==='dark'?'dark':'light';
    try{localStorage.setItem(KEY,root.dataset.theme)}catch(e){}
    render();
  }
  document.addEventListener('DOMContentLoaded',()=>{
    if(current()!=='dark')root.dataset.theme='light';
    render();
    document.getElementById('themeToggleBtn')?.addEventListener('click',()=>setTheme(current()==='dark'?'light':'dark'));
  });
})();
