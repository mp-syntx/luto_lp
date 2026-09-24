/*
 * Inscrição — envio direto para a ActiveCampaign (conta bastasentir) via JSONP,
 * o mesmo mecanismo usado pelo embed oficial da AC (proc.php?jsonp=true).
 *
 * Para ativar: preencher u/f/or com os valores do formulário criado na AC
 * (campos ocultos do "Incorporação completa") e, se existir, o id do campo
 * personalizado de experiência. Enquanto `f` estiver vazio, o formulário
 * não envia nada e mostra aviso de configuração pendente.
 */
var AC_CONFIG = {
  endpoint: 'https://bastasentir.activehosted.com/proc.php',
  // formulário #10 "LP Masterclass Luto Parental"
  u: '10',
  f: '10',
  or: '40ea0646-19e8-40b8-99c4-0c039d38c834',
  // campo personalizado qual_a_sua_experincia_em_relao_ao_luto_parental
  experienciaField: 'field[54]'
};

(function () {
  var form = document.getElementById('form-inscricao');
  if (!form) return;

  var body = form.querySelector('.form-body');
  var ok = document.getElementById('f-ok');
  var errBox = document.getElementById('f-err');
  var submit = document.getElementById('f-submit');
  var fields = {
    nome: document.getElementById('f-nome'),
    email: document.getElementById('f-email'),
    whats: document.getElementById('f-whats'),
    exp: document.getElementById('f-exp')
  };
  var pending = false;
  var timer = null;

  // máscara simples de telefone BR: (11) 90000-0000
  fields.whats.addEventListener('input', function () {
    var d = this.value.replace(/\D/g, '').slice(0, 11);
    var out = d;
    if (d.length > 2) out = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length > 7) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
    this.value = out;
  });

  function setFieldError(input, msg) {
    var id = input.id + '-err';
    var el = document.getElementById(id);
    if (msg) {
      if (!el) {
        el = document.createElement('span');
        el.id = id;
        el.className = 'field-err';
        input.insertAdjacentElement('afterend', el);
      }
      el.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', id);
    } else {
      if (el) el.remove();
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  }

  function validate() {
    var first = null;
    var nome = fields.nome.value.trim();
    var email = fields.email.value.trim();
    var digits = fields.whats.value.replace(/\D/g, '');

    var checks = [
      [fields.nome, nome.length < 2 ? 'Conte pra gente o seu nome.' : ''],
      [fields.email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? 'Confira o seu e-mail.' : ''],
      [fields.whats, (digits.length < 10 || digits.length > 11) ? 'Informe o WhatsApp com DDD.' : '']
    ];
    checks.forEach(function (c) {
      setFieldError(c[0], c[1]);
      if (c[1] && !first) first = c[0];
    });
    if (first) first.focus();
    return !first;
  }

  [fields.nome, fields.email, fields.whats].forEach(function (input) {
    input.addEventListener('blur', function () {
      if (input.getAttribute('aria-invalid') === 'true') validate();
    });
  });

  function showError(msg) {
    errBox.textContent = msg;
    errBox.hidden = false;
    submit.disabled = false;
    submit.textContent = 'Quero me inscrever';
    pending = false;
    clearTimeout(timer);
  }

  function showSuccess() {
    clearTimeout(timer);
    pending = false;
    body.hidden = true;
    ok.hidden = false;
    ok.focus();
  }

  // callbacks chamados pela resposta JSONP da ActiveCampaign
  window._show_thank_you = function () { showSuccess(); };
  window._show_unsubscribe = function () { showSuccess(); };
  window._show_error = function (id, message) {
    var tmp = document.createElement('div');
    tmp.innerHTML = message || '';
    showError(tmp.textContent.trim() || 'Não conseguimos concluir sua inscrição. Tente novamente.');
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (pending) return;
    errBox.hidden = true;
    if (!validate()) return;

    if (!AC_CONFIG.f) {
      showError('As inscrições estão sendo configuradas. Tente novamente em alguns minutos.');
      return;
    }

    var params = [
      ['u', AC_CONFIG.u], ['f', AC_CONFIG.f], ['s', ''], ['c', '0'], ['m', '0'],
      ['act', 'sub'], ['v', '2'], ['or', AC_CONFIG.or],
      ['fullname', fields.nome.value.trim()],
      ['email', fields.email.value.trim()],
      ['phone', '+55' + fields.whats.value.replace(/\D/g, '')]
    ];
    if (AC_CONFIG.experienciaField && fields.exp.value) {
      params.push([AC_CONFIG.experienciaField, fields.exp.value]);
    }
    var qs = params.map(function (p) {
      return encodeURIComponent(p[0]) + '=' + encodeURIComponent(p[1]);
    }).join('&');

    pending = true;
    submit.disabled = true;
    submit.textContent = 'Enviando…';

    var script = document.createElement('script');
    script.src = AC_CONFIG.endpoint + '?' + qs + '&jsonp=true';
    script.onerror = function () {
      showError('Não conseguimos concluir sua inscrição. Verifique sua conexão e tente novamente.');
    };
    timer = setTimeout(function () {
      if (pending) showError('A inscrição está demorando mais que o normal. Tente novamente.');
    }, 15000);
    document.head.appendChild(script);
  });
})();
