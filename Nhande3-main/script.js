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

// ---------- Handlers para autenticação social (Google e Facebook) ----------
(function(){
  const googleBtn = document.querySelector('.btn-social-google');
  const facebookBtn = document.querySelector('.btn-social-facebook');

  if(googleBtn){
    googleBtn.addEventListener('click', function(e){
      e.preventDefault();
      console.log('Social auth: Google sign-in initiated');
      alert('Autenticação com Google — integração com OAuth 2.0 em desenvolvimento.');
      // Aqui será integrado o fluxo OAuth de Google (future implementation)
      // window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...`;
    });
  }

  if(facebookBtn){
    facebookBtn.addEventListener('click', function(e){
      e.preventDefault();
      console.log('Social auth: Facebook sign-in initiated');
      alert('Autenticação com Facebook — integração com OAuth em desenvolvimento.');
      // Aqui será integrado o fluxo OAuth do Facebook (future implementation)
      // window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=...&redirect_uri=...`;
    });
  }
})();

// ---------- Comportamento do modal de login ----------
(function(){
  const modal = document.getElementById('modal-entrar');
  // Apenas abrir modal para elementos que explicitamente apontam para '#entrar' ou marcados com data-open-login
  const openButtons = document.querySelectorAll('a[href="#entrar"], [data-open-login="true"]');
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
            if(localMatch.role === 'visitante') return window.location.href = 'visitante.html';
            // fallback
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
            if(role === 'visitante') return window.location.href = 'visitante.html';
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

// ---------- Simples alternador de views para Aluno e Visitante ----------
(function(){
  const body = document.body;
  if(!body.classList.contains('aluno') && !body.classList.contains('visitante')) return;

  const panelActions = document.querySelectorAll('.panel-actions .action');
  if(!panelActions || panelActions.length === 0) return;

  function toId(text){
    return 'view-' + text.toLowerCase().trim().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'');
  }

  function restoreDefault(){
    const main = document.querySelector('.panel-main');
    if(!main) return;
    // show grid and the first non-view list-section
    const grid = main.querySelector('.panel-grid'); if(grid) grid.style.display = 'grid';
    Array.from(main.querySelectorAll('[id^="view-"]')).forEach(el => el.style.display = 'none');
    const defaultList = main.querySelector('.list-section:not([id^="view-"])');
    if(defaultList) defaultList.style.display = 'block';
    // restore header title
    const title = main.querySelector('.panel-title'); if(title) title.textContent = body.classList.contains('aluno') ? 'Painel do Aluno' : 'Bem-vindo';
  }

  function showOnly(idToShow, label){
    // hide all view- sections inside .panel-main
    const main = document.querySelector('.panel-main');
    if(!main) return;
    Array.from(main.querySelectorAll('[id^="view-"]')).forEach(el => el.style.display = 'none');
    // also hide default grid/list
    const grid = main.querySelector('.panel-grid'); if(grid) grid.style.display = 'none';
    const defaultList = main.querySelector('.list-section:not([id^="view-"])');
    if(defaultList) defaultList.style.display = 'none';

    const target = document.getElementById(idToShow);
    if(target){
      target.style.display = '';
      const title = main.querySelector('.panel-title'); if(title && label) title.textContent = label;
    } else {
      // if there's no matching view, restore default
      restoreDefault();
    }
  }

  // Map clicks from side menu to views
  panelActions.forEach(btn => {
    btn.addEventListener('click', function(){
      // Extrair apenas o texto do rótulo (último <span>) para evitar incluir conteúdo do ícone
      const labelSpan = this.querySelector('span:last-of-type');
      const text = (labelSpan ? labelSpan.textContent : this.textContent || this.innerText || '').trim();
      const id = toId(text);
      // If user clicked 'Visão Geral' (or similar), restore default
      if(/visao|visão|visao-geral|visao-geral|geral/i.test(text)){
        restoreDefault();
        return;
      }
      showOnly(id, text);
    });
  });
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
    const passField = form.querySelector('#reg-pass');
    const passConfirmField = form.querySelector('#reg-pass-confirm');
    const password = passField ? passField.value.trim() : '';
    const passwordConfirm = passConfirmField ? passConfirmField.value.trim() : '';
    const matricula = form.querySelector('#reg-matricula');
    const matriculaFunc = form.querySelector('#reg-matricula-func');

    if(!name || !email){
      alert('Por favor preencha nome e e-mail.');
      return;
    }

    // Senha obrigatória para todos os tipos de conta
    if(!password){
      alert('Por favor informe uma senha.');
      return;
    }
    if(password !== passwordConfirm){
      alert('Senhas não conferem. Por favor verifique.');
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
      password: password,
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

// ---------- Gerenciamento dinâmico do painel do Professor (Turmas view) ----------
(function(){
  const body = document.body;
  // Verificar se estamos na página professor.html
  if(!body.classList.contains('professor')) return;

  const panelMain = document.querySelector('.panel-main');
  if(!panelMain) return;

  // Elementos principais
  const defaultContent = document.querySelector('.panel-header:not(#turmas-view .panel-header)'); // cabeçalho padrão
  const panelGrid = document.querySelector('.panel-grid');
  const turmasView = document.getElementById('turmas-view');
  const materiaisView = document.getElementById('materiais-view');
  const listSection = document.querySelector('.list-section:not(.turmas-list-section)');

  const panelActions = document.querySelectorAll('.panel-actions .action');
  const btnCreateTurma = document.getElementById('btn-create-turma');
  const modalCriarTurma = document.getElementById('modal-criar-turma');
  const formCriarTurma = document.getElementById('form-criar-turma');
  const turmasList = document.getElementById('turmas-list-container');

  // Função para mostrar apenas um conteúdo
  function showView(viewName){
    // Ocultar todos os conteúdos
    if(panelGrid) panelGrid.style.display = 'none';
    if(listSection) listSection.style.display = 'none';
    if(turmasView) turmasView.style.display = 'none';

    // Mostrar cabeçalho padrão dependendo da view
    if(defaultContent && viewName !== 'turmas'){
      defaultContent.style.display = 'block';
    } else if(defaultContent){
      defaultContent.style.display = 'none';
    }

    // Mostrar a view requisitada
    if(viewName === 'turmas'){
      if(turmasView) turmasView.style.display = 'block';
    } else if(viewName === 'materiais'){
      if(materiaisView) materiaisView.style.display = 'block';
    } else if(viewName === 'visao-geral'){
      if(panelGrid) panelGrid.style.display = 'grid';
      if(listSection) listSection.style.display = 'block';
      if(defaultContent) defaultContent.style.display = 'block';
    }
  }

  // Event listeners para os botões do menu lateral
  panelActions.forEach((btn, idx) => {
    btn.addEventListener('click', function(){
      // Extrair apenas o texto do rótulo (último <span>) para evitar incluir conteúdo do ícone
      const labelSpan = this.querySelector('span:last-of-type');
      const text = (labelSpan ? labelSpan.textContent : this.textContent || '').trim();
      if(text === 'Turmas'){
        showView('turmas');
      } else if(text === 'Visão Geral'){
        showView('visao-geral');
      } else if(text === 'Materiais'){
        showView('materiais');
      }
      // Outros botões podem ser implementados futuramente
    });
  });

  // Modal para criar turma
  function openModalCriarTurma(){
    if(!modalCriarTurma) return;
    modalCriarTurma.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  // ---------- Materiais: upload, anexar do repo e busca ----------
  const inputUpload = document.getElementById('input-upload-file');
  const repoFilesEl = document.getElementById('repo-files');
  const repoListEl = document.getElementById('repo-list');
  const btnAttachRepo = document.getElementById('btn-attach-repo');
  const materiaisListEl = document.getElementById('materiais-list');
  const searchInput = document.getElementById('materiais-search');
  const btnSearch = document.getElementById('btn-search');

  const MATERIALS_KEY = 'nhande_materials_v1';

  function loadMaterials(){
    try{ const raw = localStorage.getItem(MATERIALS_KEY); return raw ? JSON.parse(raw) : []; }catch(e){ return []; }
  }
  function saveMaterials(list){ try{ localStorage.setItem(MATERIALS_KEY, JSON.stringify(list)); }catch(e){} }

  function renderMaterials(){
    const items = loadMaterials();
    materiaisListEl.innerHTML = items.length ? items.map(it => `\n      <li class=\"material-item\">\n        <div style=\"display:flex;align-items:center;justify-content:space-between;gap:12px\">\n          <div style=\"display:flex;gap:12px;align-items:center\">${it.thumbnail ? `<img src=\"${it.thumbnail}\" style=\"width:52px;height:40px;object-fit:cover;border-radius:6px\">` : ''}<div><strong>${escapeHtml(it.name)}</strong><br/><small>${escapeHtml(it.source)}</small></div></div>\n          <div><a href=\"${it.url || '#'}\" target=\"_blank\" class=\"btn-secondary\">Abrir</a> <button class=\"btn-back material-delete\" data-id=\"${it.id}\">Remover</button></div>\n        </div>\n      </li>\n    `).join('') : '<li class="muted">Nenhum material enviado.</li>';
  }

  // Initialize render if view exists
  if(materiaisListEl) renderMaterials();

  // Handle file input upload
  if(inputUpload){
    inputUpload.addEventListener('change', function(e){
      const f = this.files && this.files[0];
      if(!f) return;
      const reader = new FileReader();
      reader.onload = function(ev){
        const dataUrl = ev.target.result;
        const list = loadMaterials();
        const item = { id: Date.now(), name: f.name, source: 'Local upload', url: dataUrl, thumbnail: dataUrl };
        list.unshift(item);
        saveMaterials(list);
        renderMaterials();
        alert('Arquivo anexado com sucesso.');
      };
      reader.readAsDataURL(f);
      // clear input
      this.value = '';
    });
  }

  // Toggle repo files list
  if(btnAttachRepo && repoFilesEl){
    btnAttachRepo.addEventListener('click', function(){
      repoFilesEl.style.display = repoFilesEl.style.display === 'none' ? 'block' : 'none';
    });
  }

  // Attach repo file click
  if(repoListEl){
    repoListEl.addEventListener('click', function(e){
      const btn = e.target.closest('.repo-attach');
      if(!btn) return;
      const src = btn.dataset.src;
      const name = src.split('/').pop();
      const list = loadMaterials();
      const item = { id: Date.now(), name: name, source: 'Repositório', url: src, thumbnail: src };
      list.unshift(item);
      saveMaterials(list);
      renderMaterials();
      alert('Arquivo do repositório anexado.');
    });
  }

  // Search repo (filter visible repo list items)
  if(btnSearch && searchInput && repoListEl){
    btnSearch.addEventListener('click', function(){
      const q = (searchInput.value || '').toLowerCase().trim();
      Array.from(repoListEl.querySelectorAll('li')).forEach(li => {
        const txt = li.textContent.toLowerCase();
        li.style.display = q ? (txt.indexOf(q) === -1 ? 'none' : '') : '';
      });
      // show repo list when searching
      if(repoFilesEl) repoFilesEl.style.display = 'block';
    });
  }

  // Remove material
  materiaisListEl && materiaisListEl.addEventListener('click', function(e){
    const btn = e.target.closest('.material-delete');
    if(!btn) return;
    const id = btn.dataset.id;
    if(!confirm('Remover este material?')) return;
    let list = loadMaterials();
    list = list.filter(i => String(i.id) !== String(id));
    saveMaterials(list);
    renderMaterials();
  });

  // ---------- Pesquisa global (barra superior) ----------
  const globalSearch = document.getElementById('global-search');
  const globalSearchBtn = document.getElementById('global-search-btn');

  function performGlobalSearch(q){
    if(!q) return;
    q = q.toLowerCase();
    // Se estamos na view Materiais, encaminhar para pesquisa específica
    if(materiaisView && materiaisView.style.display !== 'none'){
      if(searchInput){ searchInput.value = q; btnSearch && btnSearch.click(); }
      return;
    }
    // Se estamos na view Turmas, filtrar a lista de turmas
    if(turmasView && turmasView.style.display !== 'none'){
      Array.from(document.querySelectorAll('#turmas-list-container .turmas-item')).forEach(li => {
        const name = li.querySelector('.turmas-item-name')?.textContent.toLowerCase() || '';
        li.style.display = name.indexOf(q) === -1 ? 'none' : '';
      });
      return;
    }
    // Caso geral: filtrar cards e listas na área principal
    if(panelGrid){
      Array.from(panelGrid.querySelectorAll('.card')).forEach(card => {
        const txt = card.textContent.toLowerCase();
        card.style.display = txt.indexOf(q) === -1 ? 'none' : '';
      });
    }
    if(listSection){
      Array.from(listSection.querySelectorAll('li')).forEach(li => {
        const txt = li.textContent.toLowerCase();
        li.style.display = txt.indexOf(q) === -1 ? 'none' : '';
      });
    }
  }

  if(globalSearchBtn){ globalSearchBtn.addEventListener('click', function(){ performGlobalSearch(globalSearch.value || ''); }); }
  if(globalSearch){ globalSearch.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ performGlobalSearch(globalSearch.value || ''); } }); }

  function closeModalCriarTurma(){
    if(!modalCriarTurma) return;
    modalCriarTurma.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Limpar formulário
    if(formCriarTurma) formCriarTurma.reset();
  }

  // Botão para criar turma
  if(btnCreateTurma){
    btnCreateTurma.addEventListener('click', openModalCriarTurma);
  }

  // Fechar modal ao clicar no backdrop ou em botões com data-close
  if(modalCriarTurma){
    modalCriarTurma.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', closeModalCriarTurma);
    });
    modalCriarTurma.querySelector('.modal-backdrop')?.addEventListener('click', closeModalCriarTurma);
  }

  // ESC para fechar modal
  window.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && modalCriarTurma && modalCriarTurma.getAttribute('aria-hidden') === 'false'){
      closeModalCriarTurma();
    }
  });

  // Submissão do formulário
  if(formCriarTurma){
    formCriarTurma.addEventListener('submit', function(e){
      e.preventDefault();
      const nome = document.getElementById('turma-nome').value.trim();
      const serie = document.getElementById('turma-serie').value.trim();
      const capacidade = document.getElementById('turma-capacidade').value.trim();

      if(!nome || !serie || !capacidade){
        alert('Por favor, preencha todos os campos.');
        return;
      }

      // Criar novo item na lista
      const novoItem = document.createElement('li');
      novoItem.className = 'turmas-item';
      novoItem.innerHTML = `
        <div class="turmas-item-content">
          <span class="turmas-item-name">${escapeHtml(nome)}</span>
          <button class="turmas-item-action" data-turma="${slugify(nome)}">Gerenciar</button>
        </div>
      `;

      if(turmasList){
        turmasList.appendChild(novoItem);
      }

      // Limpar e fechar modal
      closeModalCriarTurma();
      alert(`Turma "${nome}" criada com sucesso!`);
    });
  }

  // Função auxiliar: escape HTML
  function escapeHtml(str){
    if(!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Função auxiliar: converter para slug
  function slugify(str){
    return str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  // --- Gerenciar: menu contextual e modal de disciplinas ---
  // Estrutura em memória para disciplinas por turma (slug -> array)
  // Persistência de disciplinas por turma em localStorage
  const TURMA_DISC_KEY = 'nhande_turma_disciplines_v1';
  function loadTurmaDisc(){
    try{ const raw = localStorage.getItem(TURMA_DISC_KEY); return raw ? JSON.parse(raw) : {}; }catch(e){ return {}; }
  }
  function saveTurmaDisc(obj){ try{ localStorage.setItem(TURMA_DISC_KEY, JSON.stringify(obj)); }catch(e){} }

  let turmaDisciplines = loadTurmaDisc();

  // Inicializar com turmas existentes (garantir chaves mesmo sem disciplinas)
  if(turmasList){
    Array.from(turmasList.querySelectorAll('.turmas-item')).forEach(li => {
      const btn = li.querySelector('.turmas-item-action');
      const slug = btn ? btn.dataset.turma : null;
      if(slug && !turmaDisciplines[slug]) turmaDisciplines[slug] = [];
    });
    // se criamos novas chaves, persistir
    saveTurmaDisc(turmaDisciplines);
  }

  // Criar menu contextual único (floating)
  const contextMenu = document.createElement('div');
  contextMenu.className = 'context-menu';
  contextMenu.style.display = 'none';
  contextMenu.innerHTML = `
    <button data-action="rename">Renomear turma</button>
    <button data-action="delete">Excluir turma</button>
    <button data-action="list">Listar disciplinas</button>
    <button data-action="add">Adicionar nova disciplina</button>
  `;
  document.body.appendChild(contextMenu);

  let activeMenuTarget = null; // elemento botão que abriu o menu

  function closeContextMenu(){
    contextMenu.style.display = 'none';
    activeMenuTarget = null;
  }

  // Abrir menu na posição do botão
  function openContextMenuFor(button){
    const rect = button.getBoundingClientRect();
    // Mostrar temporariamente para medir largura/altura
    contextMenu.style.display = 'flex';
    contextMenu.style.position = 'absolute';
    contextMenu.style.visibility = 'hidden';
    // Calcular posição: abaixo do item (rect.bottom), alinhado à esquerda do botão
    const desiredLeft = window.scrollX + rect.left;
    const desiredTop = window.scrollY + rect.bottom + 8; // pequeno gap

    // Forçar leitura da largura do menu
    const menuWidth = contextMenu.offsetWidth || 200;
    const maxRight = window.scrollX + window.innerWidth - 12; // margem
    let left = desiredLeft;
    if(left + menuWidth > maxRight){
      left = Math.max(window.scrollX + 12, maxRight - menuWidth);
    }

    contextMenu.style.left = left + 'px';
    contextMenu.style.top = desiredTop + 'px';
    contextMenu.style.visibility = 'visible';
    activeMenuTarget = button;
  }

  // Delegação de cliques na lista de turmas
  if(turmasList){
    turmasList.addEventListener('click', function(e){
      const target = e.target;
      if(target.classList.contains('turmas-item-action')){
        e.stopPropagation();
        // Toggle menu
        if(activeMenuTarget === target && contextMenu.style.display === 'flex'){
          closeContextMenu();
          return;
        }
        openContextMenuFor(target);
      }
    });
  }

  // Fechar menu ao clicar fora
  document.addEventListener('click', function(e){
    if(!contextMenu.contains(e.target)) closeContextMenu();
  });

  // Handlers das ações do menu
  contextMenu.addEventListener('click', function(e){
    const action = e.target.getAttribute('data-action');
    if(!action || !activeMenuTarget) return;
    const li = activeMenuTarget.closest('.turmas-item');
    const nameEl = li.querySelector('.turmas-item-name');
    const slug = activeMenuTarget.dataset.turma;

        if(action === 'rename'){
      const novo = prompt('Novo nome da turma:', nameEl.textContent.trim());
      if(novo && novo.trim()){
        nameEl.textContent = novo.trim();
        // atualizar slug no botão
        const newSlug = slugify(novo);
        activeMenuTarget.dataset.turma = newSlug;
            // manter disciplinas se mudarmos a chave
            if(turmaDisciplines[slug]){
              turmaDisciplines[newSlug] = turmaDisciplines[slug];
              delete turmaDisciplines[slug];
              saveTurmaDisc(turmaDisciplines);
            }
      }
    } else if(action === 'delete'){
      if(confirm('Excluir esta turma? Esta ação não pode ser desfeita.')){
        // remover do DOM e da memória
            if(turmaDisciplines[slug]) { delete turmaDisciplines[slug]; saveTurmaDisc(turmaDisciplines); }
        li.parentElement.removeChild(li);
      }
    } else if(action === 'list' || action === 'add'){
      // Abrir modal de disciplinas
      const modal = document.getElementById('modal-disciplinas');
      const modalTurmaName = document.getElementById('modal-turma-name');
      const disciplinasListEl = document.getElementById('disciplinas-list');
      const inputDisc = document.getElementById('disc-nome');

        if(modal && modalTurmaName && disciplinasListEl){
        modalTurmaName.textContent = nameEl.textContent.trim();
        // popular lista
          const arr = turmaDisciplines[slug] || [];
        disciplinasListEl.innerHTML = arr.length ? arr.map(d => `<li>${escapeHtml(d)}</li>`).join('') : '<li class="muted">Nenhuma disciplina cadastrada.</li>';
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        // focar no input se for adicionar
        if(action === 'add' && inputDisc){
          inputDisc.focus();
        }
        // armazenar a turma atual no atributo do modal
        modal.dataset.currentTurma = slug;
      }
    }

    closeContextMenu();
  });

  // Hooks para modal-disciplinas: fechar, backdrop, submissão de nova disciplina
  const modalDisciplinas = document.getElementById('modal-disciplinas');
  if(modalDisciplinas){
    modalDisciplinas.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', function(){
      modalDisciplinas.setAttribute('aria-hidden','true');
      document.body.style.overflow = '';
    }));
    modalDisciplinas.querySelector('.modal-backdrop')?.addEventListener('click', function(){
      modalDisciplinas.setAttribute('aria-hidden','true');
      document.body.style.overflow = '';
    });

    // ESC fecha modal
    window.addEventListener('keydown', function(e){ if(e.key === 'Escape' && modalDisciplinas.getAttribute('aria-hidden') === 'false'){ modalDisciplinas.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; } });

    const formAddDisc = document.getElementById('form-add-disciplina');
    if(formAddDisc){
      formAddDisc.addEventListener('submit', function(ev){
        ev.preventDefault();
        const input = document.getElementById('disc-nome');
        const nome = input && input.value.trim();
        const modal = document.getElementById('modal-disciplinas');
        const slug = modal ? modal.dataset.currentTurma : null;
        const disciplinasListEl = document.getElementById('disciplinas-list');
        if(!nome){ alert('Informe o nome da disciplina.'); return; }
        turmaDisciplines[slug] = turmaDisciplines[slug] || [];
        turmaDisciplines[slug].push(nome);
        // persistir e atualizar lista no modal
        saveTurmaDisc(turmaDisciplines);
        disciplinasListEl.innerHTML = turmaDisciplines[slug].map(d => `<li>${escapeHtml(d)}</li>`).join('');
        formAddDisc.reset();
      });
    }
  }
})();

