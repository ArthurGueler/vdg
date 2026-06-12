/* ============================================================
   Para Amanda — interações (vanilla)
   ============================================================ */
(function () {
  'use strict';

  /* ---- Config (pode ser sobrescrito pelos Tweaks) ---- */
  const CONFIG = window.__PARA_AMANDA = window.__PARA_AMANDA || {
    startDate: '2025-12-31T00:00:00',
    meetDate: '2023-04-06T00:00:00',
    songName: 'When The Sun Hits',
    songArtist: 'Slowdive',
  };

  /* ---- Datas: formatar e diferença em anos/meses ---- */
  const fmtDate = (d) => pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
  function gapPhrase(from, to) {
    if (isNaN(from) || isNaN(to) || to <= from) return '';
    let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    if (to.getDate() < from.getDate()) months--;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    const parts = [];
    if (years) parts.push(years + (years === 1 ? ' ano' : ' anos'));
    if (rem) parts.push(rem + (rem === 1 ? ' mês' : ' meses'));
    return parts.join(' e ') || 'pouquinho tempo';
  }

  /* ---- Contador ao vivo ---- */
  const pad = (n) => String(n).padStart(2, '0');
  function tickCounter() {
    const el = document.querySelector('[data-clock]');
    if (!el) return;
    const start = new Date(CONFIG.startDate).getTime();
    const now = Date.now();
    let diff = Math.max(0, Math.floor((now - start) / 1000));
    const days = Math.floor(diff / 86400); diff -= days * 86400;
    const hrs = Math.floor(diff / 3600); diff -= hrs * 3600;
    const mins = Math.floor(diff / 60); const secs = diff - mins * 60;
    const set = (k, v) => { const n = el.querySelector('[data-' + k + ']'); if (n) n.textContent = v; };
    set('days', days);
    set('hrs', pad(hrs));
    set('mins', pad(mins));
    set('secs', pad(secs));
  }

  /* ---- Reveal ao rolar (à prova de falhas) ---- */
  function initReveal() {
    const items = [].slice.call(document.querySelectorAll('.rise'));
    const inView = (el) => {
      const r = el.getBoundingClientRect();
      return r.top < (window.innerHeight || 800) * 0.92 && r.bottom > 0;
    };
    // Esconde só o que está abaixo da dobra; o resto já aparece
    items.forEach((el) => { if (!inView(el)) el.classList.add('anim'); });
    const check = () => {
      for (let i = 0; i < items.length; i++) {
        const el = items[i];
        if (el.classList.contains('anim') && !el.classList.contains('in') && inView(el)) {
          el.classList.add('in');
        }
      }
    };
    check();
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { check(); ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  /* ---- Player / vinil ---- */
  function initPlayer() {
    const disc = document.querySelector('.disc');
    const btn = document.querySelector('.ctrls .play');
    const now = document.querySelector('.player .now span');
    const audio = document.querySelector('[data-audio]');
    const barFill = document.querySelector('.bar i');
    const times = document.querySelectorAll('.times span');
    if (!disc || !btn) return;

    const fmt = (s) => {
      if (!isFinite(s) || s < 0) return '0:00';
      return Math.floor(s / 60) + ':' + pad(Math.floor(s % 60));
    };
    const setPlaying = (p) => {
      disc.classList.toggle('spin', p);
      btn.innerHTML = p ? '❚❚' : '►';
      btn.setAttribute('aria-label', p ? 'pausar' : 'tocar');
      if (now) now.textContent = p ? 'tocando agora' : 'nossa música';
    };

    const hasAudio = audio && audio.getAttribute('src');
    const START_AT = 57; // a música começa em 00:57
    let autoStarting = false; // evita que o clique que iniciou o autoplay pause em seguida

    btn.addEventListener('click', () => {
      if (autoStarting) { autoStarting = false; return; }
      if (hasAudio) {
        if (audio.paused) audio.play().catch(() => {});
        else audio.pause();
      } else {
        // Sem arquivo de áudio: mantém só a animação do vinil
        setPlaying(!disc.classList.contains('spin'));
      }
    });

    if (audio) {
      let didInitialSeek = false;
      const seekToStart = () => {
        try { audio.currentTime = START_AT; } catch (e) {}
      };
      const initPosition = () => {
        if (times[1]) times[1].textContent = fmt(audio.duration);
        if (!didInitialSeek) { seekToStart(); didInitialSeek = true; }
      };

      audio.addEventListener('play', () => setPlaying(true));
      audio.addEventListener('pause', () => setPlaying(false));
      audio.addEventListener('ended', () => {
        setPlaying(false);
        seekToStart();
      });
      audio.addEventListener('loadedmetadata', initPosition);
      // Se os metadados já estavam carregados (cache), posiciona agora
      if (audio.readyState >= 1) initPosition();

      audio.addEventListener('timeupdate', () => {
        if (audio.duration && barFill) {
          barFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
        }
        if (times[0]) times[0].textContent = fmt(audio.currentTime);
      });

      // Clicar/arrastar na barra para pular o tempo
      const bar = document.querySelector('.bar');
      if (bar) {
        const seekFromEvent = (clientX) => {
          if (!audio.duration) return;
          const rect = bar.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
          audio.currentTime = ratio * audio.duration;
          didInitialSeek = true; // respeita o ponto escolhido pelo usuário
        };
        let dragging = false;
        bar.addEventListener('pointerdown', (e) => {
          dragging = true;
          bar.setPointerCapture(e.pointerId);
          seekFromEvent(e.clientX);
        });
        bar.addEventListener('pointermove', (e) => { if (dragging) seekFromEvent(e.clientX); });
        bar.addEventListener('pointerup', () => { dragging = false; });
      }

      // ⏮ / ⏭ reiniciam a faixa (só temos uma música)
      document.querySelectorAll('.ctrls button:not(.play)').forEach((b) => {
        b.addEventListener('click', seekToStart);
      });

      // Tocar automaticamente ao entrar (começando em 00:57).
      // Se o navegador bloquear o autoplay com som, começa na 1ª interação.
      const startFrom57AndPlay = () => {
        if (!didInitialSeek) { seekToStart(); didInitialSeek = true; }
        return audio.play();
      };
      const armFirstGesture = () => {
        const evs = ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'];
        const onFirst = () => {
          evs.forEach((ev) => window.removeEventListener(ev, onFirst));
          autoStarting = true; // se esse gesto for um clique no ►, não pausar logo depois
          startFrom57AndPlay().catch(() => { autoStarting = false; });
          setTimeout(() => { autoStarting = false; }, 500);
        };
        evs.forEach((ev) => window.addEventListener(ev, onFirst, { passive: true }));
      };
      const tryAutoplay = () => {
        startFrom57AndPlay().catch(() => armFirstGesture());
      };
      if (audio.readyState >= 1) tryAutoplay();
      else audio.addEventListener('loadedmetadata', tryAutoplay, { once: true });
    }
  }

  /* ---- Intro / abertura em carta ---- */
  function initIntro() {
    const intro = document.getElementById('intro');
    if (!intro) return;
    document.body.classList.add('intro-lock');

    // Esconde o hero para ele "entrar" quando a carta abrir
    const heroRise = [].slice.call(document.querySelectorAll('.hero .rise'));
    heroRise.forEach((el) => { el.classList.add('anim'); el.classList.remove('in'); });

    let opened = false;
    const open = () => {
      if (opened) return;
      opened = true;
      intro.classList.add('opening');
      document.body.classList.remove('intro-lock');
      // revela o hero junto da abertura da carta
      setTimeout(() => { heroRise.forEach((el) => el.classList.add('in')); }, 450);
      // esconde e remove o overlay ao fim da animação
      setTimeout(() => { intro.classList.add('done'); }, 1750);
      setTimeout(() => { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 2200);
    };

    intro.addEventListener('click', open);
    intro.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); open(); }
    });
  }

  /* ============================================================
     MOTIVOS — edite a imagem e a frase de cada carta aqui ↓
     (pode adicionar/remover cartas; cada uma vira ao tocar)
     ============================================================ */
  const TAROT = [
    { img: 'uploads/the-lovers-2.jpg', motivo: 'da sua risada que conserta meu dia' },
    { img: 'uploads/enforcado-1.jpg', motivo: 'da sua paciência comigo' },
    { img: 'uploads/the-lovers-3.jpg', motivo: 'de como você me faz sentir em casa' },
    { img: 'uploads/enforcado-2.jpg', motivo: 'de você existir do meu lado' },
    { img: 'uploads/the-lovers-4.jpg', motivo: 'de cantar música ruim alta com você' },
    { img: 'uploads/enforcado-3.jpg', motivo: 'de ver o mundo de cabeça pra baixo com você' }
  ];

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---- Carrossel de cartas The Lovers (viram ao tocar) ---- */
  function initDeck() {
    const rail = document.querySelector('[data-deck]');
    if (!rail) return;
    rail.innerHTML = TAROT.map((c) =>
      '<button class="tcard" type="button" aria-label="virar carta">' +
        '<span class="tcard-inner">' +
          '<span class="tcard-face tcard-front">' +
            '<img class="tcard-art" src="' + esc(c.img) + '" alt="carta de tarô" loading="lazy">' +
            '<span class="tcard-hint">toque para virar</span>' +
          '</span>' +
          '<span class="tcard-face tcard-back">' +
            '<span class="b-eyebrow">eu te amo</span>' +
            '<span class="b-reason">' + esc(c.motivo) + '</span>' +
          '</span>' +
        '</span></button>').join('');

    rail.querySelectorAll('.tcard').forEach((c) => {
      c.addEventListener('click', () => c.classList.toggle('flipped'));
    });

    // setas de navegação (rolam o carrossel por uma carta)
    const stage = rail.closest('.lovers-stage');
    if (stage) {
      const step = () => {
        const card = rail.querySelector('.tcard');
        return card ? card.offsetWidth + 18 : 260;
      };
      const prev = stage.querySelector('.lv-nav.prev');
      const next = stage.querySelector('.lv-nav.next');
      if (prev) prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
      if (next) next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
    }
  }

  /* ---- Coração que explode ---- */
  function initTapHeart() {
    const tap = document.querySelector('.tapheart');
    if (!tap) return;
    const glyphs = ['❤', '♥', '💗', '🖤', '❣'];
    tap.addEventListener('click', (ev) => {
      const rect = tap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      for (let i = 0; i < 12; i++) {
        const h = document.createElement('div');
        h.className = 'burst';
        h.textContent = glyphs[(Math.random() * glyphs.length) | 0];
        h.style.left = cx + 'px';
        h.style.top = cy + 'px';
        h.style.setProperty('--dx', (Math.random() * 180 - 90).toFixed(0) + 'px');
        h.style.setProperty('--rot', (Math.random() * 80 - 40).toFixed(0) + 'deg');
        h.style.animationDelay = (Math.random() * 0.25).toFixed(2) + 's';
        h.style.fontSize = (18 + Math.random() * 20).toFixed(0) + 'px';
        document.body.appendChild(h);
        setTimeout(() => h.remove(), 1700);
      }
    });
  }

  /* ---- Aplicar config (chamado pelos Tweaks) ---- */
  window.__applyConfig = function (cfg) {
    Object.assign(CONFIG, cfg || {});
    document.querySelectorAll('[data-song-name]').forEach((n) => n.textContent = CONFIG.songName);
    document.querySelectorAll('[data-song-artist]').forEach((n) => n.textContent = CONFIG.songArtist);
    const link = document.querySelector('[data-spotify]');
    if (link) link.href = 'https://open.spotify.com/search/' +
      encodeURIComponent(CONFIG.songName + ' ' + CONFIG.songArtist);
    const startD = new Date(CONFIG.startDate);
    if (!isNaN(startD)) {
      document.querySelectorAll('[data-since-date]').forEach((n) => n.textContent = fmtDate(startD));
    }
    const meetD = new Date(CONFIG.meetDate);
    if (!isNaN(meetD)) {
      document.querySelectorAll('[data-meet-date]').forEach((n) => n.textContent = fmtDate(meetD));
    }
    const gapEl = document.querySelector('[data-origin-gap]');
    if (gapEl) {
      const g = gapPhrase(meetD, startD);
      gapEl.textContent = g ? g + ' depois, viramos namorados ♥' : '';
    }
    tickCounter();
  };

  /* ---- Boot ---- */
  function boot() {
    initDeck();
    initReveal();
    initIntro();
    initPlayer();
    initTapHeart();
    window.__applyConfig(CONFIG);
    tickCounter();
    setInterval(tickCounter, 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
