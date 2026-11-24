/* ---------------------------------------------------------------------------
 * Comportamento do site. Sem dependências, sem rede, sem backend.
 *
 * Progressivo: se este arquivo não carregar, a página continua legível e
 * navegável (os links de menu são âncoras reais e os CTAs caem em #contato).
 *
 * As funções puras ficam expostas em `window.SITE_MAIN` para a suíte de testes
 * poder exercitá-las fora do navegador.
 * ------------------------------------------------------------------------- */
(function () {
  'use strict';

  var CONFIG = (typeof window !== 'undefined' && window.SITE_CONFIG) || {};

  /* ------------------------------------------------------------ funções puras */

  /** Mantém apenas dígitos: aceita '+55 (11) 99999-8888'. */
  function somenteDigitos(valor) {
    return String(valor == null ? '' : valor).replace(/\D/g, '');
  }

  /**
   * Monta a URL do WhatsApp a partir de um número qualquer e de uma mensagem.
   * Devolve null quando não há dígito suficiente para formar um número — assim
   * nenhum link quebrado entra na página.
   */
  function montarLinkWhatsApp(numero, mensagem) {
    var digitos = somenteDigitos(numero);
    if (digitos.length < 10) return null;
    var base = 'https://wa.me/' + digitos;
    var texto = String(mensagem == null ? '' : mensagem).trim();
    return texto ? base + '?text=' + encodeURIComponent(texto) : base;
  }

  /** Compõe a mensagem do formulário em texto simples, sem HTML. */
  function montarMensagemContato(campos) {
    var dados = campos || {};
    var limpar = function (valor) {
      return String(valor == null ? '' : valor).replace(/\s+/g, ' ').trim();
    };
    var linhas = ['Olá, Dr. Lucas. Vim pelo site.'];
    var nome = limpar(dados.nome);
    var email = limpar(dados.email);
    var assunto = limpar(dados.assunto);
    var mensagem = String(dados.mensagem == null ? '' : dados.mensagem).trim();

    if (nome || email || assunto) linhas.push('');
    if (nome) linhas.push('Nome: ' + nome);
    if (email) linhas.push('E-mail: ' + email);
    if (assunto) linhas.push('Assunto: ' + assunto);
    if (mensagem) linhas.push('', mensagem);

    return linhas.join('\n');
  }

  if (typeof window !== 'undefined') {
    window.SITE_MAIN = {
      somenteDigitos: somenteDigitos,
      montarLinkWhatsApp: montarLinkWhatsApp,
      montarMensagemContato: montarMensagemContato,
    };
  }

  // A partir daqui só faz sentido no navegador (os testes rodam sem DOM).
  if (typeof document === 'undefined') return;

  var raiz = document.documentElement;

  /* ------------------------------------------------------------ config → texto */

  function hidratarConfig() {
    var alvos = document.querySelectorAll('[data-config]');
    for (var i = 0; i < alvos.length; i += 1) {
      var valor = CONFIG[alvos[i].getAttribute('data-config')];
      if (valor == null || valor === '') continue;
      alvos[i].textContent = valor;
    }
  }

  /* Ícones de contato (rodapé): só o href vem do config; o WhatsApp usa data-whatsapp. */
  function hidratarIcones() {
    var alvos = document.querySelectorAll('[data-link]');
    for (var i = 0; i < alvos.length; i += 1) {
      var chave = alvos[i].getAttribute('data-link');
      var valor = CONFIG[chave];
      if (!valor) continue;
      alvos[i].setAttribute('href', chave === 'email' ? 'mailto:' + valor : valor);
    }
  }

  /* ------------------------------------------------------------ CTAs WhatsApp */

  function hidratarWhatsApp() {
    var ctas = document.querySelectorAll('[data-whatsapp]');
    for (var i = 0; i < ctas.length; i += 1) {
      var cta = ctas[i];
      var mensagem = cta.getAttribute('data-whatsapp-msg') || CONFIG.mensagemPadrao || '';
      var link = montarLinkWhatsApp(CONFIG.whatsapp, mensagem);
      if (!link) continue;

      cta.setAttribute('href', link);
      cta.setAttribute('target', '_blank');
      cta.setAttribute('rel', 'noopener noreferrer');
    }
  }

  /* ------------------------------------------------------------ menu mobile */

  function iniciarMenu() {
    var menu = document.querySelector('[data-menu]');
    if (!menu) return;
    var botao = menu.querySelector('[data-menu-botao]');
    var painel = menu.querySelector('[data-menu-painel]');
    if (!botao || !painel) return;

    function estaAberto() {
      return menu.getAttribute('data-aberto') === 'true';
    }

    function definir(aberto, devolverFoco) {
      menu.setAttribute('data-aberto', aberto ? 'true' : 'false');
      botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      painel.hidden = !aberto && window.matchMedia('(max-width: 899px)').matches;
      if (!aberto && devolverFoco) botao.focus();
    }

    // Estado inicial coerente com o layout em que a página abriu.
    definir(window.matchMedia('(min-width: 900px)').matches, false);

    botao.addEventListener('click', function () {
      definir(!estaAberto(), false);
    });

    painel.addEventListener('click', function (evento) {
      var alvo = evento.target;
      if (alvo && alvo.closest && alvo.closest('a') && estaAberto()) definir(false, false);
    });

    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape' && estaAberto()) definir(false, true);
    });

    var largo = window.matchMedia('(min-width: 900px)');
    var aoMudar = function (evento) {
      definir(evento.matches, false);
    };
    if (typeof largo.addEventListener === 'function') largo.addEventListener('change', aoMudar);
    else if (typeof largo.addListener === 'function') largo.addListener(aoMudar);
  }

  /* ------------------------------------------------------------ formulário */

  function iniciarFormulario() {
    var form = document.querySelector('[data-form-contato]');
    if (!form) return;
    var status = document.querySelector('[data-form-status]');

    function anunciar(texto) {
      if (!status) return;
      status.textContent = texto;
    }

    form.addEventListener('submit', function (evento) {
      evento.preventDefault();

      // O <form> tem novalidate: a validação fica por conta do JS, que não deve
      // abrir o WhatsApp com campos obrigatórios vazios ou e-mail inválido.
      if (!form.checkValidity()) {
        anunciar('Preencha os campos obrigatórios (marcados com *) e um e-mail válido.');
        return;
      }

      var campos = {
        nome: form.elements.nome ? form.elements.nome.value : '',
        email: form.elements.email ? form.elements.email.value : '',
        assunto: form.elements.assunto ? form.elements.assunto.value : '',
        mensagem: form.elements.mensagem ? form.elements.mensagem.value : '',
      };

      var link = montarLinkWhatsApp(CONFIG.whatsapp, montarMensagemContato(campos));
      if (!link) {
        anunciar('O número de WhatsApp ainda não foi configurado. Envie um e-mail para o endereço acima.');
        return;
      }

      // Sem 'noopener' no terceiro argumento: com ele o navegador devolve null
      // mesmo tendo aberto a aba, e nunca saberíamos se abriu.
      var janela = window.open(link, '_blank');
      if (janela) {
        try {
          janela.opener = null;
        } catch (erro) {
          /* alguns navegadores bloqueiam a atribuição; a aba já abriu */
        }
        anunciar('Abrimos o WhatsApp em outra aba com a sua mensagem já preenchida.');
        form.reset();
      } else {
        anunciar(
          'O navegador bloqueou a nova aba. Copie o texto abaixo e envie pelo WhatsApp: ' +
            montarMensagemContato(campos),
        );
      }
    });
  }

  /* ------------------------------------------------------------ foto opcional */

  /* Duas fotos empilhadas: se ambas falham, vale o monograma; se só uma falha,
     a outra fica estática (sem crossfade). */
  function iniciarFoto() {
    var fotos = document.querySelectorAll('[data-foto]');
    if (!fotos.length) return;
    var moldura = fotos[0].closest('.retrato');
    if (!moldura) return;
    var falhas = 0;

    function atualizar() {
      var ok = fotos.length - falhas;
      moldura.removeAttribute('data-sem-foto');
      moldura.removeAttribute('data-uma-foto');
      if (ok === 0) moldura.setAttribute('data-sem-foto', 'true');
      else if (ok < fotos.length) moldura.setAttribute('data-uma-foto', 'true');
    }

    function falhou(foto) {
      return function () {
        falhas += 1;
        foto.setAttribute('data-falhou', 'true');
        atualizar();
      };
    }

    for (var i = 0; i < fotos.length; i += 1) {
      var foto = fotos[i];
      if (foto.complete && foto.naturalWidth === 0) falhou(foto)();
      else foto.addEventListener('error', falhou(foto), { once: true });
    }
  }

  /* ------------------------------------------------------------ carrossel */

  /* Loop: a faixa tem 3 clones antes e 3 depois dos 5 cards reais. Posição p
     na faixa mostra o card real (p - COPIAS) mod total. Quando a animação
     termina fora dos reais, reposiciona sem transição para o card equivalente
     (clone e original são idênticos, então não há salto visível). */
  function iniciarCarrossel() {
    var viewport = document.querySelector('[data-carrossel]');
    if (!viewport) return;
    var faixa = viewport.querySelector('[data-carrossel-faixa]');
    var reais = faixa.querySelectorAll('.area');
    var total = reais.length;
    var COPIAS = 3;
    var DURACAO = 450;
    var RECUO = 40; // px de arraste para trocar de card
    var pontos = document.querySelectorAll('[data-carrossel-ponto]');
    var anterior = document.querySelector('[data-carrossel-anterior]');
    var proximo = document.querySelector('[data-carrossel-proximo]');
    var reduzir = window.matchMedia('(prefers-reduced-motion: reduce)');
    var pos = COPIAS;
    var emMovimento = false;
    var temporizador = null;
    var arrasto = null;

    function clonar(el) {
      var copia = el.cloneNode(true);
      copia.setAttribute('aria-hidden', 'true');
      copia.setAttribute('inert', '');
      copia.removeAttribute('role');
      copia.removeAttribute('aria-roledescription');
      copia.removeAttribute('aria-label');
      return copia;
    }

    var primeiroReal = faixa.firstChild;
    for (var i = total - COPIAS; i < total; i += 1) {
      faixa.insertBefore(clonar(reais[i]), primeiroReal);
    }
    for (var j = 0; j < COPIAS; j += 1) {
      faixa.appendChild(clonar(reais[j]));
    }

    function real(p) {
      return (((p - COPIAS) % total) + total) % total;
    }

    /* Posição do card p sem medir nada: o passo entre cards é --largura + --gap
       (porcentagem da faixa + px), definido no CSS para cada largura. Assim o
       offset nunca usa layout antigo (antes de CSS/fontes) nem depende de
       redimensionar. Porcentagem em transform refere-se à própria faixa, que é
       a base de --largura. */
    function posicionar(p, animar, deslocamento) {
      // Scroll nativo residual do viewport (pré-JS) somaria ao transform: zera.
      if (viewport.scrollLeft) viewport.scrollLeft = 0;
      faixa.style.transition = animar ? 'transform ' + DURACAO + 'ms ease' : 'none';
      faixa.style.transform =
        'translate3d(calc(' + -p + ' * (var(--largura) + var(--gap)) + ' + (deslocamento || 0) + 'px), 0, 0)';
    }

    function atualizarPontos() {
      var atual = real(pos);
      for (var k = 0; k < pontos.length; k += 1) {
        pontos[k].setAttribute('aria-current', k === atual ? 'true' : 'false');
      }
    }

    // Fim de movimento: volta para a faixa real, sem animação, se estiver num clone.
    function fim() {
      clearTimeout(temporizador);
      if (!emMovimento) return;
      emMovimento = false;
      if (pos < COPIAS || pos >= COPIAS + total) pos = COPIAS + real(pos);
      posicionar(pos, false, 0);
    }

    function irPara(p) {
      // Fora de [COPIAS-1, COPIAS+total] não há clone pronto para mostrar.
      if (p < COPIAS - 1 || p > COPIAS + total) return;
      var animar = !reduzir.matches;
      emMovimento = true;
      pos = p;
      posicionar(p, animar, 0);
      atualizarPontos();
      clearTimeout(temporizador);
      if (animar) {
        temporizador = setTimeout(fim, DURACAO + 80);
      } else {
        fim();
      }
    }

    faixa.addEventListener('transitionend', function (evento) {
      if (evento.target === faixa && evento.propertyName === 'transform') fim();
    });

    anterior.addEventListener('click', function () {
      irPara(pos - 1);
    });
    proximo.addEventListener('click', function () {
      irPara(pos + 1);
    });
    for (var n = 0; n < pontos.length; n += 1) {
      (function (indice) {
        pontos[indice].addEventListener('click', function () {
          irPara(COPIAS + indice);
        });
      })(n);
    }

    viewport.addEventListener('keydown', function (evento) {
      if (evento.key === 'ArrowLeft') {
        evento.preventDefault();
        irPara(pos - 1);
      } else if (evento.key === 'ArrowRight') {
        evento.preventDefault();
        irPara(pos + 1);
      }
    });

    // Arraste com ponteiro (toque e mouse). Só troca de card passando RECUO.
    viewport.addEventListener('pointerdown', function (evento) {
      if (emMovimento || arrasto) return;
      if (evento.pointerType === 'mouse' && evento.button !== 0) return;
      arrasto = { id: evento.pointerId, x: evento.clientX, dx: 0, iniciado: false };
    });

    viewport.addEventListener('pointermove', function (evento) {
      if (!arrasto || evento.pointerId !== arrasto.id) return;
      arrasto.dx = evento.clientX - arrasto.x;
      if (!arrasto.iniciado) {
        if (Math.abs(arrasto.dx) < 6) return;
        arrasto.iniciado = true;
        viewport.classList.add('arrastando');
        try {
          viewport.setPointerCapture(arrasto.id);
        } catch (erro) {
          // Sem captura, o arraste continua funcionando dentro do viewport.
        }
      }
      posicionar(pos, false, arrasto.dx);
    });

    function soltar(evento) {
      if (!arrasto || evento.pointerId !== arrasto.id) return;
      var atual = arrasto;
      arrasto = null;
      viewport.classList.remove('arrastando');
      if (!atual.iniciado) return;
      if (atual.dx <= -RECUO) {
        irPara(pos + 1);
      } else if (atual.dx >= RECUO) {
        irPara(pos - 1);
      } else {
        irPara(pos);
      }
    }
    viewport.addEventListener('pointerup', soltar);
    viewport.addEventListener('pointercancel', soltar);

    // Redimensionar não precisa de JS: o CSS recalcula --largura e o transform acompanha.

    // Começo no card 01, sem animação. Ao voltar do cache (pageshow) volta ao 01.
    function irAoInicio() {
      if (emMovimento || arrasto) return;
      pos = COPIAS;
      posicionar(pos, false, 0);
      atualizarPontos();
    }

    // Após load/fontes só reposiciona se o usuário ainda não mexeu no slider.
    function reafirmarInicio() {
      if (pos === COPIAS) irAoInicio();
    }

    window.addEventListener('pageshow', irAoInicio);
    window.addEventListener('load', reafirmarInicio);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reafirmarInicio);

    irAoInicio();
  }

  /* ------------------------------------------------------------ boot */

  hidratarConfig();
  hidratarIcones();
  hidratarWhatsApp();
  iniciarMenu();
  iniciarFormulario();
  iniciarFoto();
  iniciarCarrossel();

  // Marca que o JS rodou: usado pelo CSS para os ajustes progressivos.
  raiz.setAttribute('data-js', 'pronto');
})();