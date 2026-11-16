/* Gualberto Esportes: topo com filme (modelo do site do Marcelo), links do WhatsApp,
   quadro de horários e botão flutuante. */
(function () {
  var html = document.documentElement;
  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NUMERO = '5531986252185';
  var link = function (texto) { return 'https://wa.me/' + NUMERO + '?text=' + encodeURIComponent(texto); };

  // Todo link com data-wa ganha a mensagem pronta (sem emoji: vira losango no WhatsApp)
  document.querySelectorAll('[data-wa]').forEach(function (a) {
    a.href = link(a.getAttribute('data-wa'));
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* ---------- Topo: título em palavras mascaradas ---------- */
  var contador = 0;
  function quebrar(no) {
    Array.prototype.slice.call(no.childNodes).forEach(function (filho) {
      if (filho.nodeType === 3) {
        var frag = document.createDocumentFragment();
        filho.textContent.split(/(\s+)/).forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          var fora = document.createElement('span');
          fora.className = 'palavra';
          fora.setAttribute('aria-hidden', 'true');
          var dentro = document.createElement('span');
          dentro.textContent = p;
          dentro.style.setProperty('--i', contador++);
          fora.appendChild(dentro);
          frag.appendChild(fora);
        });
        no.replaceChild(frag, filho);
      } else if (filho.nodeType === 1) {
        quebrar(filho);
      }
    });
  }
  var titulo = document.querySelector('[data-palavras]');
  if (titulo) {
    titulo.setAttribute('aria-label', titulo.textContent.replace(/\s+/g, ' ').trim());
    quebrar(titulo);
  }

  /* ---------- Topo: filme e entrada ---------- */
  var video = document.querySelector('[data-topo-video]');
  function tocar() {
    if (!video || reduzido) return;
    video.addEventListener('playing', function () { video.classList.add('tocando'); }, { once: true });
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      html.classList.add('pronto');
      if (titulo) titulo.classList.add('visivel');
      tocar();
    });
  });

  /* ---------- Cabeçalho: transparente sobre o filme, sólido depois ---------- */
  var cabecalho = document.querySelector('.cabecalho');
  var solido = function () { cabecalho.classList.toggle('solido', window.scrollY > 40); };

  /* ---------- Menu de três traços (celular e tablet) ---------- */
  var menuBotao = document.querySelector('.menu-botao');
  var menuPainel = document.getElementById('menu-celular');
  function menu(abrir) {
    if (!menuBotao || !menuPainel) return;
    menuBotao.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    menuBotao.setAttribute('aria-label', abrir ? 'Fechar o menu' : 'Abrir o menu');
    menuPainel.classList.toggle('aberto', abrir);
    cabecalho.classList.toggle('menu-aberto', abrir);
    html.classList.toggle('menu-travado', abrir);
  }
  if (menuBotao && menuPainel) {
    menuBotao.addEventListener('click', function () { menu(menuBotao.getAttribute('aria-expanded') !== 'true'); });
    // tocou num link: fecha e deixa a âncora rolar com a página destravada
    menuPainel.addEventListener('click', function (e) { if (e.target.closest('a')) menu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBotao.getAttribute('aria-expanded') === 'true') { menu(false); menuBotao.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) menu(false); });
  }

  /* ---------- Topo coberto pelo scroll ----------
     A altura fica em cache (só relê no resize): por quadro, só window.scrollY. */
  var topo = document.querySelector('.topo');
  var alturaTopo = 0, inicioCobre = 0, pedido = false, cobertoAntes = false;
  function medir() {
    alturaTopo = topo.offsetHeight;
    // topo mais alto que a tela: trava só depois de mostrar o fim dele
    topo.style.setProperty('--topo-topo', Math.min(0, window.innerHeight - alturaTopo) + 'px');
    inicioCobre = Math.max(0, alturaTopo - window.innerHeight);
    atualizar();
  }
  function atualizar() {
    pedido = false;
    solido();
    var p = (window.scrollY - inicioCobre) / window.innerHeight;
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    topo.style.setProperty('--cobre', reduzido ? 0 : p.toFixed(3));
    // totalmente coberto: pausa o filme, que ninguém está vendo
    var coberto = p >= 1;
    if (video && !reduzido && coberto !== cobertoAntes) {
      if (coberto) video.pause(); else { var pv = video.play(); if (pv && pv.catch) pv.catch(function () {}); }
    }
    cobertoAntes = coberto;
  }
  if (topo) {
    window.addEventListener('scroll', function () {
      if (!pedido) { pedido = true; requestAnimationFrame(atualizar); }
    }, { passive: true });
    window.addEventListener('resize', medir);
    medir();
  }

  /* ---------- Quadro de horários: tocar na turma prepara a mensagem ---------- */
  var horas = document.querySelectorAll('.hora');
  var status = document.getElementById('escolha-status');
  var fichaHora = document.getElementById('ficha-hora');
  var agendar = document.getElementById('agendar');
  var textoBase = 'Olá! Vi o site e quero agendar uma aula experimental.';

  function escolher(hora) {
    horas.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.hora === hora ? 'true' : 'false'); });
    fichaHora.classList.remove('troca');
    void fichaHora.offsetWidth; // reinicia a animação da troca
    if (!hora) {
      fichaHora.textContent = '00:00';
      fichaHora.classList.remove('escolhida');
      status.textContent = 'Toque num horário do quadro.';
      agendar.querySelector('span').textContent = 'Agendar pelo WhatsApp';
      agendar.href = link(textoBase);
      return;
    }
    fichaHora.textContent = hora;
    fichaHora.classList.add('escolhida');
    if (!reduzido) fichaHora.classList.add('troca');
    status.textContent = 'Turma das ' + hora + ' escolhida. O coach confirma o dia pelo WhatsApp.';
    agendar.querySelector('span').textContent = 'Agendar a turma das ' + hora;
    agendar.href = link('Olá! Vi o site e quero agendar uma aula experimental na turma das ' + hora + '.');
  }

  horas.forEach(function (b, i) {
    b.style.setProperty('--n', i);
    b.addEventListener('click', function () {
      escolher(b.getAttribute('aria-pressed') === 'true' ? null : b.dataset.hora);
    });
  });

  /* ---------- Quando chega na tela: quadro acende, números contam ---------- */
  function aoAparecer(el, fn, margem) {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (e) {
      if (!e[0].isIntersecting) return;
      io.disconnect();
      fn();
    }, { rootMargin: margem || '0px 0px -25% 0px' });
    io.observe(el);
  }

  var quadro = document.querySelector('[data-quadro]');
  if (quadro && !reduzido) aoAparecer(quadro, function () { quadro.classList.add('acende'); });

  document.querySelectorAll('[data-conta]').forEach(function (el) {
    if (reduzido || !('IntersectionObserver' in window)) return;
    var alvo = parseFloat(el.dataset.conta);
    var casas = (el.dataset.conta.split('.')[1] || '').length;
    var escrever = function (v) { el.textContent = v.toFixed(casas).replace('.', ','); };
    escrever(0);
    aoAparecer(el, function () {
      var inicio = performance.now(), dur = 1400;
      (function passo(agora) {
        var t = Math.min(1, (agora - inicio) / dur);
        escrever(alvo * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(passo);
      })(inicio);
    }, '0px 0px -15% 0px');
  });

  /* ---------- Modalidades: painéis ----------
     Só o painel aberto toca o vídeo, e só com a seção na tela. */
  var paineis = Array.prototype.slice.call(document.querySelectorAll('.painel'));
  var secaoPaineis = document.querySelector('[data-paineis]');
  var paineisNaTela = false;
  var temMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function tocarAberto() {
    paineis.forEach(function (p) {
      var v = p.querySelector('video');
      if (p.classList.contains('is-aberto') && paineisNaTela && !reduzido) {
        v.preload = 'auto';
        var r = v.play(); if (r && r.catch) r.catch(function () {});
      } else {
        v.pause();
      }
    });
  }
  function abrir(alvo) {
    paineis.forEach(function (p) {
      var aberto = p === alvo;
      p.classList.toggle('is-aberto', aberto);
      p.querySelector('.painel__botao').setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });
    tocarAberto();
  }
  paineis.forEach(function (p) {
    p.querySelector('.painel__botao').addEventListener('click', function () { abrir(p); });
    if (temMouse) p.addEventListener('mouseenter', function () { if (!p.classList.contains('is-aberto')) abrir(p); });
  });
  if (secaoPaineis && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { paineisNaTela = e[0].isIntersecting; tocarAberto(); }, { threshold: .2 })
      .observe(secaoPaineis);
  }

  /* ---------- Parallax: data-vel = deslocamento em px quando a seção está a uma tela do centro ----------
     Usa a propriedade translate, não transform (animação com forwards venceria o transform). */
  var moveis = Array.prototype.slice.call(document.querySelectorAll('[data-vel]')).map(function (el) {
    return { el: el, sec: el.closest('section'), vel: parseFloat(el.dataset.vel) };
  });
  var pedidoP = false;
  function parallax() {
    pedidoP = false;
    var h = window.innerHeight;
    moveis.forEach(function (m) {
      var r = m.sec.getBoundingClientRect();
      if (r.bottom < -200 || r.top > h + 200) return;
      var p = (r.top + r.height / 2 - h / 2) / h;
      m.el.style.translate = '0 ' + (p * m.vel).toFixed(1) + 'px';
    });
  }
  if (moveis.length && !reduzido) {
    window.addEventListener('scroll', function () {
      if (!pedidoP) { pedidoP = true; requestAnimationFrame(parallax); }
    }, { passive: true });
    window.addEventListener('resize', parallax);
    parallax();
  }

  /* ---------- Botão flutuante ----------
     Some enquanto o topo está à mostra (os botões dele estão na tela) e na seção de contato.
     O topo fica travado atrás das seções, então quem diz se ele está à mostra é o --cobre,
     não o IntersectionObserver (que o enxergaria "visível" o tempo todo). */
  var flutuante = document.querySelector('.whats-flutuante');
  var contatoNaTela = false;
  function atualizarFlutuante() {
    if (!flutuante) return;
    var p = (window.scrollY - inicioCobre) / window.innerHeight;
    flutuante.classList.toggle('escondido', p < 0.55 || contatoNaTela);
  }
  if (flutuante) {
    window.addEventListener('scroll', atualizarFlutuante, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { contatoNaTela = e[0].isIntersecting; atualizarFlutuante(); })
        .observe(document.querySelector('.contato'));
    }
    atualizarFlutuante();
  }
})();
