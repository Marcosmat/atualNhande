// Botão "Começar Agora"
const startBtn = document.getElementById('btn-start');
if(startBtn){
  startBtn.addEventListener('click', function () {
    // Preferir rolar até o bloco de informações (#info) quando existir
    const info = document.getElementById('info');
    const target = info || document.getElementById('start');
    if(target) target.scrollIntoView({ behavior: 'smooth' });
  });
}

const moreBtn = document.getElementById('btn-more');
if(moreBtn){
  moreBtn.addEventListener('click', function () {
    const info = document.getElementById('info');
    const target = info || document.getElementById('start');
    if(target) target.scrollIntoView({ behavior: 'smooth' });
  });
}

// Rolagem suave dos links da navbar
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', function(e){
    const href = this.getAttribute('href');
    // Permitir navegação para páginas externas (contêm .html)
    if(href.includes('.html')) {
      return; // deixa o link funcionar normalmente
    }
    // Para âncoras locais, fazer scroll suave
    e.preventDefault();
    const target = document.querySelector(href);
    if(target) target.scrollIntoView({behavior:'smooth'});
  });
});

// ---------- Comportamento do modal de login ----------
(function(){
  const modal = document.getElementById('modal-entrar');
  const openButtons = document.querySelectorAll('a[href="#entrar"], .btn-login');
  const closeElements = modal ? modal.querySelectorAll('[data-close]') : [];
  const firstInput = modal ? modal.querySelector('#login-email') : null;
  let lastFocused = null;

  function openModal(){
    if(!modal) return;
    lastFocused = document.activeElement;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    firstInput && firstInput.focus();
  }

  function closeModal(){
    if(!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if(lastFocused) lastFocused.focus();
  }

  openButtons.forEach(btn => {
    btn.addEventListener('click', function(e){
      e.preventDefault();
      openModal();
    });
  });

  closeElements.forEach(el => el.addEventListener('click', closeModal));

  // Fechar com a tecla Escape
  window.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && modal && modal.getAttribute('aria-hidden') === 'false'){
      closeModal();
    }
  });

  // Proteção simples caso o formulário seja submetido — previne navegação
  const form = modal ? modal.querySelector('#login-form') : null;
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const payload = {
          email: form.querySelector('#login-email').value.trim(),
          password: form.querySelector('#login-pass').value.trim()
        };

        // Primeiro verifique se existe um usuário local no localStorage (modo offline/sem backend)
        try{
          const localMatch = window.NHANDE_LOCAL_USERS && window.NHANDE_LOCAL_USERS.find(payload.email, payload.password);
          if(localMatch){
            closeModal();
            // Redirecionar para as telas corretas localmente
            if(localMatch.role === 'professor') return window.location.href = 'professor.html';
            if(localMatch.role === 'aluno') return window.location.href = 'aluno.html';
            // visitantes ficam na home por enquanto
            return window.location.href = 'index.html';
          }
        }catch(err){ console.warn('Erro ao checar usuários locais', err); }

        // Tenta o endpoint do backend; se falhar, mantém o comportamento demo
        const API = 'http://127.0.0.1:5000/api/login';

        fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(r => r.json().then(body => ({ ok: r.ok, status: r.status, body })))
        .then(result => {
          if(result.ok && result.body && result.body.ok){
            closeModal();
            // redirecionar conforme role retornado pelo backend
            const role = result.body.user.role;
            if(role === 'professor') return window.location.href = 'professor.html';
            if(role === 'aluno') return window.location.href = 'aluno.html';
            return window.location.href = 'index.html';
          } else {
            if(result.status === 401){
              alert('Credenciais inválidas.');
            } else if(result.body && result.body.error){
              alert('Erro do servidor: ' + result.body.error);
            } else {
              closeModal();
              alert('Login (demo): formulário enviado — integre autenticação no backend.');
            }
          }
        })
        .catch(() => {
          closeModal();
          alert('Login (demo): formulário enviado — (backend inacessível)');
        });
    });
  }
})();

// ---------- Comportamento do modal de cadastro (Aluno/Professor/Visitante) ----------
(function(){
  const modal = document.getElementById('modal-cadastrar');
  if(!modal) return;

  const openTriggers = document.querySelectorAll('a[href="#cadastrar"]');
  const closeEls = modal.querySelectorAll('[data-close]');
  const choices = modal.querySelectorAll('.register-choices .choice');
  const form = modal.querySelector('#register-form');

  function openModal(){
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // definir seleção padrão para 'aluno' caso nenhuma esteja selecionada
    const selected = modal.querySelector('.register-choices .choice[aria-checked="true"]') || choices[0];
    selectRole(selected ? selected.dataset.role : 'aluno');
    // focar no primeiro campo visível
    setTimeout(()=>{
      const firstVisible = modal.querySelector('.form-field:not([style*="display:none"]) input');
      if(firstVisible) firstVisible.focus();
    }, 50);
  }

  function closeModal(){
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openTriggers.forEach(t => t.addEventListener('click', function(e){
    e.preventDefault();
    // se o modal de login estiver aberto, fechá-lo
    const loginModal = document.getElementById('modal-entrar');
    if(loginModal && loginModal.getAttribute('aria-hidden') === 'false'){
      loginModal.setAttribute('aria-hidden','true');
    }
    openModal();
  }));

  closeEls.forEach(el => el.addEventListener('click', closeModal));

  // tratar cliques nas opções (Aluno/Professor/Visitante)
  function selectRole(role){
    choices.forEach(btn => {
      const is = (btn.dataset.role === role);
      btn.setAttribute('aria-checked', is ? 'true' : 'false');
      btn.classList.toggle('selected', is);
    });

    // mostrar/esconder campos com base no atributo data-for-role
    modal.querySelectorAll('.form-field').forEach(field => {
      const roles = (field.getAttribute('data-for-role') || '').split(/\s+/).filter(Boolean);
      if(roles.length === 0 || roles.includes('all')){
        field.style.display = '';
      } else if(roles.includes(role)){
        field.style.display = '';
      } else {
        field.style.display = 'none';
      }
    });
  }

  choices.forEach(btn => {
    btn.addEventListener('click', function(){ selectRole(this.dataset.role); });
    btn.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectRole(this.dataset.role); } });
  });

  // ESC para fechar
  window.addEventListener('keydown', function(e){ if(e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal(); });

  // Validação mínima do envio do formulário
  form.addEventListener('submit', function(e){
    e.preventDefault();
    const role = modal.querySelector('.register-choices .choice[aria-checked="true"]').dataset.role;
    const name = form.querySelector('#reg-nome').value.trim();
    const email = form.querySelector('#reg-email').value.trim();
    const matricula = form.querySelector('#reg-matricula');
    const matriculaFunc = form.querySelector('#reg-matricula-func');

    if(!name || !email){
      alert('Por favor preencha nome e e-mail.');
      return;
    }

    if(role === 'aluno' && (!matricula || !matricula.value.trim())){
      alert('Por favor informe a matrícula do aluno.');
      return;
    }

    if(role === 'professor' && (!matriculaFunc || !matriculaFunc.value.trim())){
      alert('Por favor informe a matrícula funcional do professor.');
      return;
    }

    // Tentativa de envio para backend (com fallback demo se server indisponível)
    const payload = {
      role,
      name,
      email,
      password: 'demo-password',
      matricula: matricula && matricula.value.trim() ? matricula.value.trim() : undefined,
      matricula_funcional: matriculaFunc && matriculaFunc.value.trim() ? matriculaFunc.value.trim() : undefined
    };

    // Primeiro salve localmente — sempre funcionará mesmo sem backend
    try{
      const added = window.NHANDE_LOCAL_USERS && window.NHANDE_LOCAL_USERS.add({ name, email, password: payload.password, role, matricula: payload.matricula, matricula_funcional: payload.matricula_funcional });
      if(added && added.ok){
        closeModal();
        alert('Cadastro realizado (local). Usuário: ' + (added.user.name || added.user.email));
      } else if(added && added.error === 'email_exists'){
        alert('E-mail já cadastrado (local).');
        return;
      }
    }catch(err){ console.warn('Erro ao salvar localmente', err); }

    // Tenta também enviar para o backend — se estiver online irá sincronizar
    const API = 'http://127.0.0.1:5000/api/register';

    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(r => r.json().then(body => ({ ok: r.ok, status: r.status, body })))
      .then(result => {
        if(result.ok && result.body && result.body.ok){
          closeModal();
          alert('Cadastro realizado (backend). Usuário: ' + (result.body.user.name || result.body.user.email));
          form.reset();
          selectRole('aluno');
        } else if(result.status === 409){
          alert('E-mail já cadastrado.');
        } else if(result.body && result.body.error){
          alert('Erro: ' + result.body.error);
        } else {
          closeModal();
          alert('Cadastro (demo): ' + role + ' registrado (integre com backend).');
          form.reset();
          selectRole('aluno');
        }
      })
      .catch(() => {
        closeModal();
        alert('Cadastro (demo): ' + role + ' registrado — backend inacessível.');
        form.reset();
        selectRole('aluno');
      });
  });
})();

/* Alternador de acessibilidade / alto contraste */
;(function (){
  const toggle = document.getElementById('accessibility-toggle');
  const body = document.body;

  if(!toggle) return;

  function setState(on){
    if(on){
      body.classList.add('high-contrast');
      toggle.setAttribute('aria-pressed', 'true');
      toggle.setAttribute('title', 'Desativar alto contraste');
      toggle.querySelector('.a11y-label').textContent = 'Contraste: ON';
      localStorage.setItem('nhande_highContrast', '1');
    } else {
      body.classList.remove('high-contrast');
      toggle.setAttribute('aria-pressed', 'false');
      toggle.setAttribute('title', 'Ativar alto contraste');
      toggle.querySelector('.a11y-label').textContent = 'Alto contraste';
      localStorage.setItem('nhande_highContrast', '0');
    }
  }

  // Inicializar a partir da preferência salva
  const stored = localStorage.getItem('nhande_highContrast');
  setState(stored === '1');

  toggle.addEventListener('click', function(){
    const isOn = body.classList.contains('high-contrast');
    setState(!isOn);
  });

  // Atalho de teclado: Alt+Shift+C
  window.addEventListener('keydown', function(e){
    if((e.altKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c'){
      e.preventDefault();
      toggle.click();
      toggle.focus();
    }
  });

  // Respeitar preferência de 'reduced-motion' para transições, se desejado
})();

  /* ---------- Controles de Tamanho de Fonte (Aumentar / Diminuir) ---------- */
  ;(function(){
    const incBtn = document.getElementById('font-increase');
    const decBtn = document.getElementById('font-decrease');
    if(!incBtn && !decBtn) return; // nenhum controle presente

    const STORAGE_KEY = 'nhande_fontScale';
    const STEP = 0.1;
    const MIN = 0.8;
    const MAX = 1.5;

    // Element selectors que queremos escalar (texto visível)
    const selectors = ['h1','h2','h3','h4','h5','p','li','a','button','label','span','.panel-title','.panel-sub','.brand','.nav-links a','.muted','.lead','input','textarea','.info-card h3','.card','small'];

    // Construir lista de elementos (evitar controles de a11y para não escalar os botões)
    let elements = Array.from(document.querySelectorAll(selectors.join(','))).filter(el => !el.closest('.a11y-controls'));

    // Guardar tamanhos originais na primeira inicialização
    elements.forEach(el => {
      if(!el.dataset.baseFont){
        const size = window.getComputedStyle(el).fontSize;
        el.dataset.baseFont = size ? parseFloat(size) : 16;
      }
    });

    // Ler scale atual (persistido) ou default = 1
    let scale = parseFloat(localStorage.getItem(STORAGE_KEY)) || 1;

    function applyScale(s){
      elements.forEach(el => {
        const base = parseFloat(el.dataset.baseFont) || 16;
        el.style.fontSize = (base * s) + 'px';
      });
      // salvar
      localStorage.setItem(STORAGE_KEY, String(s));
      updateButtons(s);
    }

    function updateButtons(s){
      const disabledInc = s >= MAX - 0.0001;
      const disabledDec = s <= MIN + 0.0001;
      if(incBtn){ incBtn.setAttribute('aria-disabled', String(disabledInc)); incBtn.disabled = disabledInc; }
      if(decBtn){ decBtn.setAttribute('aria-disabled', String(disabledDec)); decBtn.disabled = disabledDec; }
    }

    if(incBtn){
      incBtn.addEventListener('click', function(){
        scale = Math.min(MAX, +(scale + STEP).toFixed(2));
        applyScale(scale);
      });
    }

    if(decBtn){
      decBtn.addEventListener('click', function(){
        scale = Math.max(MIN, +(scale - STEP).toFixed(2));
        applyScale(scale);
      });
    }

    // Atalhos: Alt+Shift+> / Alt+Shift+< (mais/menos) — opcional
    window.addEventListener('keydown', function(e){
      if((e.altKey || e.metaKey) && e.shiftKey){
        if(e.key === '+' || e.key === '=' || e.key === '>'){
          e.preventDefault(); if(incBtn && !incBtn.disabled) incBtn.click();
        } else if(e.key === '-' || e.key === '_'){
          e.preventDefault(); if(decBtn && !decBtn.disabled) decBtn.click();
        }
      }
    });

    // Aplicar scale salvo
    applyScale(scale);
  })();

// ---------- Armazenamento local de usuários (localStorage) ----------
// O objetivo: permitir registro/login sem backend para testes rápidos.
(function(){
  const KEY = 'nhande_users_v1';

  function loadLocalUsers(){
    try{
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ console.warn('Erro ao ler localStorage', e); return null; }
  }

  function saveLocalUsers(list){
    try{ localStorage.setItem(KEY, JSON.stringify(list)); return true; }
    catch(e){ console.warn('Erro ao salvar localStorage', e); return false; }
  }

  function seedLocalUsers(){
    let users = loadLocalUsers();
    if(users && users.length) return users;

    users = [
      { id: 1, name: 'João Aluno', email: 'joao@example.com', password: '1234', role: 'aluno', matricula: 'A12345' },
      { id: 2, name: 'Maria Prof', email: 'maria@example.com', password: 'abc123', role: 'professor', matricula_funcional: 'PF-9988' },
      { id: 3, name: 'Carlos Visit', email: 'carlos@example.com', password: 'visitor', role: 'visitante' }
    ];
    saveLocalUsers(users);
    return users;
  }

  function nextLocalId(users){
    if(!users || users.length === 0) return 1;
    return users.reduce((m,u)=> u.id > m ? u.id : m, users[0].id) + 1;
  }

  function findLocalUser(email, password){
    const users = loadLocalUsers() || [];
    return users.find(u => u.email === email && u.password === password) || null;
  }

  function addLocalUser(user){
    const users = loadLocalUsers() || [];
    if(users.find(u => u.email === user.email)) return { ok:false, error:'email_exists' };
    user.id = nextLocalId(users);
    users.push(user);
    saveLocalUsers(users);
    return { ok:true, user };
  }

  // Seed local users on first load (only for testing/dev)
  seedLocalUsers();

  // Expose helpers to other blocks on window for debugging (optional)
  window.NHANDE_LOCAL_USERS = {
    load: loadLocalUsers,
    save: saveLocalUsers,
    add: addLocalUser,
    find: findLocalUser
  };
})();

// ---------- Verificação do backend (status) ----------
(function(){
  const statusEl = document.getElementById('backend-status');
  if(!statusEl) return;

  function setStatus(ok){
    statusEl.setAttribute('aria-hidden','false');
    if(ok){
      statusEl.textContent = 'BACKEND: ONLINE';
      statusEl.classList.remove('offline');
      statusEl.classList.add('ok');
    } else {
      statusEl.textContent = 'BACKEND: OFFLINE';
      statusEl.classList.remove('ok');
      statusEl.classList.add('offline');
    }
  }

  // Basic probe: GET /health to check connectivity
  const probe = 'http://127.0.0.1:5000/health';
  fetch(probe, { method: 'GET' })
    .then(r => r.json().then(body => ({ ok: r.ok, status: r.status, body })))
    .then(result => {
      if(result.ok && result.body && result.body.status === 'ok'){
        setStatus(true);
        console.log('Backend health:', result.body);
      } else {
        setStatus(false);
        console.warn('Backend health check returned', result);
      }
    })
    .catch(err => { setStatus(false); console.warn('Erro ao checar backend:', err); });
})();
