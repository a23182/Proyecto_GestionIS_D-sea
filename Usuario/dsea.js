/* ==========================================================
   D'SEA · Simulación de funcionamiento (solo front-end)
   Todo se guarda en localStorage del navegador. No hay backend.
   Cuentas de prueba:
     Cliente → cliente@dsea.mx / 1234
     Admin   → admin@dsea.mx   / admin123
   ========================================================== */
(function () {
  'use strict';

  var K = {
    users: 'dsea_users', sesCliente: 'dsea_session_cliente', sesAdmin: 'dsea_session_admin', cart: 'dsea_cart',
    orders: 'dsea_orders', checkout: 'dsea_checkout', menu: 'dsea_menu',
    last: 'dsea_last_order', seq: 'dsea_seq', ver: 'dsea_ver'
  };
  var VERSION = '2';

  /* ---------- utilidades ---------- */
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function money(n) { return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function qs(name) { return new URLSearchParams(location.search).get(name); }
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var MESES_L = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var DIAS_L = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fechaCorta(ts) { var d = new Date(ts); return d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear() + ' · ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function fechaLarga(ts) { var d = ts ? new Date(ts) : new Date(); return DIAS_L[d.getDay()] + ' ' + d.getDate() + ', ' + MESES_L[d.getMonth()] + ' ' + d.getFullYear(); }

  /* ---------- semillas de datos ---------- */
  var IMG = { marq: 'marquesita.jpeg', beb: 'frappe.jpeg' };
  var MENU_SEED = [
    { id: 'marq-clasica', cat: 'Marquesita', nombre: 'Marquesita Clásica', precio: 55, disp: true },
    { id: 'marq-platano', cat: 'Marquesita', nombre: 'Marquesita Plátano', precio: 60, disp: true },
    { id: 'marq-fresa', cat: 'Marquesita', nombre: 'Marquesita Fresa', precio: 65, disp: true },
    { id: 'marq-durazno', cat: 'Marquesita', nombre: 'Marquesita Durazno', precio: 65, disp: true },
    { id: 'marq-kiwi', cat: 'Marquesita', nombre: 'Marquesita Kiwi', precio: 70, disp: true },
    { id: 'marq-marquesa', cat: 'Marquesita', nombre: 'La marquesa', precio: 85, disp: true },
    { id: 'beb-frappe', cat: 'Bebidas', nombre: 'Frappe', precio: 40, disp: true },
    { id: 'beb-smoothie', cat: 'Bebidas', nombre: 'Smoothie', precio: 45, disp: true },
    { id: 'beb-chocomil', cat: 'Bebidas', nombre: 'Chocomil', precio: 23, disp: true }
  ];

  function it(prod, precio, cant, det) { return { producto: prod, precioUnit: precio, cantidad: cant || 1, detalle: det || [], img: /Frappe|Smoothie|Chocomil/.test(prod) ? IMG.beb : IMG.marq }; }
  function seedOrders() {
    var base = new Date(); base.setHours(9, 0, 0, 0);
    function t(h, m) { var d = new Date(); d.setHours(h, m, 0, 0); return d.getTime(); }
    function o(folio, nombre, email, hor, estado, items, hh, mm, extra) {
      var total = items.reduce(function (a, i) { return a + i.precioUnit * i.cantidad; }, 0);
      var r = { folio: folio, cliente: { nombre: nombre, email: email, tel: '477 123 1234' }, items: items, total: total, metodo: 'recoger', horario: hor, estado: estado, fecha: t(hh, mm), calificacion: null };
      if (extra) for (var k in extra) r[k] = extra[k];
      return r;
    }
    return [
      o('D001', 'María López', 'cliente@dsea.mx', '10:45', 'En preparación', [it('Marquesita Fresa', 65)], 10, 5),
      o('D002', 'Carlos Ruiz', 'carlos@correo.com', '10:30', 'Recibido', [it('Frappe Matcha', 65), it('Chocomil Rompope', 33)], 9, 58),
      o('D003', 'María Pérez', 'mperez@correo.com', '09:45', 'Listo', [it('Marquesita Kiwi', 70, 3)], 9, 10),
      o('D004', 'Jorge Díaz', 'jorge@correo.com', '10:15', 'Entregado', [it('Frappe Oreo', 40), it('Chocomil Chocolate', 23)], 9, 40),
      o('D005', 'Lucía Gómez', 'lucia@correo.com', '10:30', 'Listo', [it('Marquesita La marquesa', 85), it('Smoothie Mango', 45)], 9, 55),
      o('D006', 'Pedro Sánchez', 'pedro@correo.com', '10:00', 'En preparación', [it('Marquesita Plátano', 60), it('Chocomil Fresa', 25)], 9, 30),
      o('D007', 'Carlos Medina', 'cmedina@correo.com', '09:30', 'Entregado', [it('Marquesita Clásica', 55), it('Frappe Cajeta', 40)], 8, 50),
      o('D008', 'Sofía Torres', 'sofia@correo.com', '10:35', 'Entregado', [it('Frappe Nutella', 50), it('Marquesita Durazno', 65)], 9, 45),
      o('D009', 'Diego Medina', 'diego@correo.com', '09:40', 'Entregado', [it('Smoothie Fresa', 48), it('Frappe Mazapán', 45)], 9, 5),
      // pedido ya entregado de la cliente demo (para probar "Calificar")
      o('D030', 'María López', 'cliente@dsea.mx', '21:00', 'Entregado', [it('Chocomil Fresa', 25)], 21, 0, { fecha: Date.now() - 7 * 86400000, metodo: 'linea' })
    ];
  }

  function seed() {
    if (load(K.ver) !== VERSION) {
      save(K.users, [
        { nombre: 'María López', email: 'cliente@dsea.mx', tel: '477 123 1234', password: '1234', rol: 'cliente', notas: '' },
        { nombre: 'Carla Ramírez', email: 'admin@dsea.mx', tel: '479 430 00 14', password: 'admin123', rol: 'admin', notas: '' }
      ]);
      save(K.orders, seedOrders());
      save(K.menu, MENU_SEED);
      save(K.seq, 42);
      save(K.ver, VERSION);
    }
  }
  seed();

  /* ---------- sesión ---------- */
  var Auth = {
    area: function () { return document.body && document.body.getAttribute('data-area') === 'admin' ? 'admin' : 'cliente'; },
    key: function (rol) { return rol === 'admin' ? K.sesAdmin : K.sesCliente; },
    user: function () { return load(Auth.key(Auth.area()), null); },
    login: function (email, pass, rol) {
      email = (email || '').trim().toLowerCase();
      var u = load(K.users, []).filter(function (x) { return x.email.toLowerCase() === email && x.password === pass; })[0];
      if (!u) return { ok: false, msg: 'Correo o contraseña incorrectos.' };
      if (rol && u.rol !== rol) return { ok: false, msg: rol === 'admin' ? 'Esta cuenta no es de administrador.' : 'Esta cuenta es de administrador. Usa el acceso de administración.' };
      save(Auth.key(u.rol), { email: u.email, nombre: u.nombre, tel: u.tel, rol: u.rol });
      return { ok: true, user: u };
    },
    register: function (d) {
      var users = load(K.users, []);
      var email = (d.email || '').trim().toLowerCase();
      if (!d.nombre || !email || !d.password) return { ok: false, msg: 'Completa todos los campos.' };
      if (d.password !== d.confirm) return { ok: false, msg: 'Las contraseñas no coinciden.' };
      if (d.password.length < 4) return { ok: false, msg: 'La contraseña debe tener al menos 4 caracteres.' };
      if (users.some(function (x) { return x.email.toLowerCase() === email; })) return { ok: false, msg: 'Ya existe una cuenta con ese correo.' };
      var u = { nombre: d.nombre.trim(), email: email, tel: (d.tel || '').trim(), password: d.password, rol: 'cliente', notas: '' };
      users.push(u); save(K.users, users);
      save(K.sesCliente, { email: u.email, nombre: u.nombre, tel: u.tel, rol: 'cliente' });
      return { ok: true, user: u };
    },
    logout: function () { localStorage.removeItem(Auth.key(Auth.area())); },
    /* rol: 'cliente' | 'admin'. Si no cumple, redirige. */
    require: function (rol, redirect) {
      var u = Auth.user();
      if (!u || (rol && u.rol !== rol)) { location.replace(redirect); return null; }
      return u;
    }
  };

  /* ---------- carrito ---------- */
  var Cart = {
    items: function () { return load(K.cart, []); },
    add: function (item) {
      var c = Cart.items();
      var key = item.producto + '|' + JSON.stringify(item.detalle);
      var ex = c.filter(function (x) { return x.key === key; })[0];
      if (ex) ex.cantidad += item.cantidad; else { item.key = key; item.id = 'i' + Date.now() + Math.floor(Math.random() * 999); c.push(item); }
      save(K.cart, c);
    },
    setQty: function (id, q) { var c = Cart.items(); c.forEach(function (x) { if (x.id === id) x.cantidad = Math.max(1, q); }); save(K.cart, c); },
    remove: function (id) { save(K.cart, Cart.items().filter(function (x) { return x.id !== id; })); },
    clear: function () { localStorage.removeItem(K.cart); },
    count: function () { return Cart.items().reduce(function (a, i) { return a + i.cantidad; }, 0); },
    total: function () { return Cart.items().reduce(function (a, i) { return a + i.precioUnit * i.cantidad; }, 0); }
  };

  /* ---------- pedidos ---------- */
  var ESTADOS = ['Recibido', 'En preparación', 'Listo', 'Entregado'];
  var Orders = {
    all: function () { return load(K.orders, []); },
    byFolio: function (f) { return Orders.all().filter(function (o) { return o.folio === f; })[0]; },
    byUser: function (email) { return Orders.all().filter(function (o) { return o.cliente.email.toLowerCase() === (email || '').toLowerCase(); }).sort(function (a, b) { return b.fecha - a.fecha; }); },
    nextFolio: function () { var n = load(K.seq, 42) + 1; save(K.seq, n); return 'D' + String(n).padStart(3, '0'); },
    create: function (opts) {
      var u = Auth.user(), items = Cart.items();
      var o = {
        folio: Orders.nextFolio(),
        cliente: { nombre: u.nombre, email: u.email, tel: u.tel || '' },
        items: items.map(function (i) { return { producto: i.producto, precioUnit: i.precioUnit, cantidad: i.cantidad, detalle: i.detalle, img: i.img }; }),
        total: Cart.total(), metodo: opts.metodo, horario: opts.horario || null,
        estado: 'Recibido', fecha: Date.now(), calificacion: null
      };
      var all = Orders.all(); all.push(o); save(K.orders, all);
      save(K.last, o.folio);
      return o;
    },
    update: function (folio, patch) {
      var all = Orders.all();
      all.forEach(function (o) { if (o.folio === folio) for (var k in patch) o[k] = patch[k]; });
      save(K.orders, all);
    },
    lastFolio: function () { return load(K.last, null); }
  };
  var Checkout = {
    get: function () { return load(K.checkout, { metodo: 'linea', horario: null }); },
    set: function (p) { var c = Checkout.get(); for (var k in p) c[k] = p[k]; save(K.checkout, c); }
  };
  var MenuStore = {
    all: function () { return load(K.menu, MENU_SEED); },
    save: function (m) { save(K.menu, m); }
  };

  /* ---------- toast ---------- */
  function toast(msg, ok) {
    var d = document.createElement('div');
    d.textContent = msg;
    d.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:9999;padding:10px 18px;border-radius:999px;font:500 13px "DM Sans",sans-serif;color:#FAF4EC;background:' + (ok === false ? '#B85C54' : '#2B211D') + ';box-shadow:0 6px 20px rgba(0,0,0,.2)';
    document.body.appendChild(d);
    setTimeout(function () { d.style.transition = 'opacity .4s'; d.style.opacity = 0; setTimeout(function () { d.remove(); }, 450); }, 2200);
  }
  function showError(form, msg) {
    var e = form.querySelector('[data-error]');
    if (!e) {
      e = document.createElement('p'); e.setAttribute('data-error', '1');
      e.style.cssText = 'color:#B85C54;font-size:12px;font-weight:600;margin-top:6px';
      form.insertBefore(e, form.firstChild);
    }
    e.textContent = msg;
  }

  /* ---------- cabecera común ---------- */
  var BTN_OUT = 'px-5 py-1.5 rounded-full border border-espresso text-espresso text-sm font-medium hover:bg-espresso hover:text-cremaVainilla transition-all duration-200 inline-block text-center';
  function patchHeader() {
    // contador del carrito
    document.querySelectorAll('a[href="carritodecompras.html"]').forEach(function (a) {
      var spans = a.querySelectorAll('span'); var last = spans[spans.length - 1];
      if (last && /^\d+$/.test(last.textContent.trim())) {
        var n = Cart.count(); last.textContent = n; last.style.display = n ? '' : 'none';
      }
    });
    // botones Ingresar / Únete → si hay sesión, mostrar nombre + salir
    var ing = document.querySelector('header a[href="iniciosesion.html"]');
    var u = Auth.user();
    if (ing && u && u.rol === 'cliente') {
      var box = ing.parentElement; box.innerHTML = '';
      var perfil = document.createElement('a'); perfil.href = 'datoscliente.html'; perfil.className = BTN_OUT; perfil.textContent = u.nombre.split(' ')[0];
      var out = document.createElement('a'); out.href = '#'; out.className = 'px-5 py-1.5 rounded-full bg-espresso text-cremaVainilla text-sm font-medium hover:bg-cafeTostado transition-all duration-200 shadow-sm inline-block text-center'; out.textContent = 'Salir';
      out.onclick = function (e) { e.preventDefault(); Auth.logout(); location.href = 'inicio.html'; };
      box.appendChild(perfil); box.appendChild(out);
    }
    // páginas con ícono de perfil (sin botones Ingresar/Únete): añadir "Salir" si hay sesión
    var ico = document.querySelector('header a[href="datoscliente.html"]');
    if (ico && u && u.rol === 'cliente' && !document.getElementById('cliente-salir')) {
      var so = document.createElement('a'); so.id = 'cliente-salir'; so.href = '#'; so.textContent = 'Salir';
      so.className = 'text-xs font-semibold text-cafeTostado hover:text-espresso transition-colors';
      so.onclick = function (e) { e.preventDefault(); Auth.logout(); location.href = 'inicio.html'; };
      ico.parentNode.insertBefore(so, ico.nextSibling);
    }
    // enlace "perfil" del header sin sesión → login
    document.querySelectorAll('header a[href="datoscliente.html"]').forEach(function (a) {
      if (!u) a.setAttribute('href', 'iniciosesion.html');
    });
    // cabecera admin: nombre y salir
    var adm = document.body.getAttribute('data-area') === 'admin';
    if (adm && u) {
      var right = document.querySelector('header .relative, header button[title="Notificaciones"]');
      var hdr = document.querySelector('header > div');
      if (hdr && !document.getElementById('admin-salir')) {
        var s = document.createElement('a'); s.id = 'admin-salir'; s.href = '#'; s.textContent = 'Salir';
        s.className = 'ml-4 px-4 py-1.5 rounded-full border border-espresso text-espresso text-xs font-medium hover:bg-espresso hover:text-cremaVainilla transition-all';
        s.onclick = function (e) { e.preventDefault(); Auth.logout(); location.href = 'iniciosesionadmin.html'; };
        hdr.appendChild(s);
      }
      document.querySelectorAll('main h1').forEach(function (h) { if (/Buen día/.test(h.textContent)) h.textContent = 'Buen día, ' + u.nombre.split(' ')[0]; });
      document.querySelectorAll('main p').forEach(function (p) { if (/^\w+ \d+, \w+ \d{4}$/.test(p.textContent.trim())) p.textContent = fechaLarga(); });
    }
  }

  /* ---------- bloques HTML reutilizables (mismas clases del diseño) ---------- */
  function detalleLinea(i) { return (i.detalle || []).map(function (d) { return d.valor; }).join(', '); }
  function rowItem(i, cls) {
    return '<div class="flex items-center justify-between text-xs text-espresso"><div class="flex items-center space-x-2"><span class="font-bold text-cafeTostado">' + i.cantidad + ' ×</span><span>' + esc(i.producto) + '</span></div><span class="font-semibold">' + money(i.precioUnit * i.cantidad) + '</span></div>';
  }
  function badgeEstado(est) {
    var m = {
      'Recibido': 'bg-[#FCEBEA] text-[#B85C54]|#B85C54', 'En preparación': 'bg-[#FAF3EC] text-[#8C6239]|#8C6239',
      'Listo': 'bg-[#F3EFEA] text-[#694430]|#694430', 'Entregado': 'bg-[#EBF4EC] text-[#4A7C59]|#4A7C59'
    }[est].split('|');
    return '<span class="inline-flex items-center px-3 py-1 rounded-full ' + m[0] + ' text-[11px] font-semibold space-x-2"><span class="w-1.5 h-1.5 rounded-full" style="background:' + m[1] + '"></span><span>' + est + '</span></span>';
  }
  function pedidoPorContexto() {
    var f = qs('folio') || Orders.lastFolio();
    var o = f && Orders.byFolio(f);
    if (!o) { var u = Auth.user(); var l = u && Orders.byUser(u.email)[0]; o = l; }
    return o;
  }
  function setText(sel, txt, root) { var e = (root || document).querySelector(sel); if (e) e.textContent = txt; return e; }
  function fillItems(container, o) { if (container) container.innerHTML = o.items.map(function (i) { return rowItem(i); }).join(''); }
  function totalEl(label) {
    var r = null;
    document.querySelectorAll('span').forEach(function (s) { if (!r && /^Total\s*[-·]\s*MXN$/.test(s.textContent.trim())) r = s.nextElementSibling; });
    return r;
  }
  function replaceAllText(from, to) {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n, list = [];
    while ((n = w.nextNode())) if (n.nodeValue.indexOf(from) > -1 && !/SCRIPT|STYLE/.test(n.parentNode.tagName)) list.push(n);
    list.forEach(function (n) { n.nodeValue = n.nodeValue.split(from).join(to); });
  }
  function horarioTexto(h) { return h ? (/^\d/.test(h) ? 'Hoy · ' + h : h) : 'Por elegir'; }

  /* ================== PÁGINAS ================== */
  var Pages = {};

  /* ---- Login cliente ---- */
  Pages.login = function () {
    var f = document.querySelector('form'); if (!f) return;
    var email = f.querySelector('input[type=email]'), pass = f.querySelector('input[type=password]');
    var btn = f.querySelector('a[href="menu.html"]');
    function go(e) {
      if (e) e.preventDefault();
      var r = Auth.login(email.value, pass.value, null);
      if (!r.ok) return showError(f, r.msg);
      location.href = r.user.rol === 'admin' ? '../Administrador/dashboardadministrador.html' : (qs('next') || 'menu.html');
    }
    if (btn) btn.addEventListener('click', go);
    f.addEventListener('submit', go);
    var forgot = f.querySelector('button[type=button]');
    if (forgot) forgot.addEventListener('click', function () { toast('Demo: usa cliente@dsea.mx / 1234'); });
    var hint = document.createElement('p');
    hint.className = 'text-[11px] text-cafeTostado/70 text-center pt-1';
    hint.innerHTML = 'Demo cliente: <b>cliente@dsea.mx</b> / <b>1234</b> · <a href="../Administrador/iniciosesionadmin.html" class="text-mango hover:underline">Acceso administrador</a>';
    f.appendChild(hint);
  };

  /* ---- Registro ---- */
  Pages.registro = function () {
    var f = document.querySelector('form'); if (!f) return;
    var ins = f.querySelectorAll('input'); var btn = f.querySelector('a[href="menu.html"]');
    function go(e) {
      e.preventDefault();
      var r = Auth.register({ nombre: ins[0].value, email: ins[1].value, tel: ins[2].value, password: ins[3].value, confirm: ins[4].value });
      if (!r.ok) return showError(f, r.msg);
      location.href = 'menu.html';
    }
    btn.addEventListener('click', go); f.addEventListener('submit', go);
  };

  /* ---- Login admin (página nueva) ---- */
  Pages.loginadmin = function () {
    var f = document.getElementById('form-admin');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var r = Auth.login(f.email.value, f.password.value, 'admin');
      if (!r.ok) return showError(f, r.msg);
      location.href = 'dashboardadministrador.html';
    });
  };

  /* ---- Menú: se genera desde MenuStore (lo que edita el administrador) ---- */
  var MARQ_ID = { 'marq-clasica': 'clasica', 'marq-platano': 'platano', 'marq-fresa': 'fresa', 'marq-durazno': 'durazno', 'marq-kiwi': 'kiwi', 'marq-marquesa': 'marquesa' };
  var BEB_PAG = { 'beb-frappe': 'detallefrappe.html', 'beb-smoothie': 'detallesmoothie.html', 'beb-chocomil': 'detallechocomil.html' };
  var BEB_RANGO = { 'beb-frappe': [40, 65], 'beb-smoothie': [45, 48], 'beb-chocomil': [23, 33] };
  var ICO_MAS = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v12m6-6H6"/></svg>';
  function sinAcentos(t) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  function tarjetaMenu(p) {
    var bebida = p.cat === 'Bebidas', agot = p.disp === false;
    var seed = MENU_SEED.filter(function (m) { return m.id === p.id; })[0];
    var precio = money(p.precio);
    if (bebida && seed && BEB_RANGO[p.id]) { var d = p.precio - seed.precio; precio = money(BEB_RANGO[p.id][0] + d) + ' – ' + money(BEB_RANGO[p.id][1] + d); }
    var href = MARQ_ID[p.id] ? 'detallemarquesita.html?p=' + MARQ_ID[p.id] : (BEB_PAG[p.id] || null);
    var cuerpo = '<div class="space-y-3"><div class="w-full h-40 sm:h-48 bg-cremaVainilla rounded-none overflow-hidden"><img src="' + (bebida ? 'frappe.jpeg' : 'marquesita.jpeg') + '" alt="' + esc(p.nombre) + '" class="w-full h-full object-cover rounded-none"></div><div><h3 class="font-playfair font-bold text-base text-espresso">' + esc(p.nombre) + '</h3><p class="font-playfair font-bold text-sm text-mango mt-1">' + precio + ' <span class="text-[10px] font-normal text-cafeTostado/60">MXN</span></p>' + (agot ? '<p class="text-[11px] font-bold mt-1" style="color:#B85C54">Agotado</p>' : '') + '</div></div>';
    var BTN = 'mt-4 w-full py-2 bg-espresso text-cremaVainilla rounded-xl text-xs font-medium hover:bg-cafeTostado transition-colors flex items-center justify-center space-x-1.5 text-center';
    var RND = 'w-9 h-9 rounded-full bg-espresso text-cremaVainilla hover:bg-cafeTostado transition-colors flex items-center justify-center shadow-sm';
    var accion;
    if (agot) accion = bebida ? '<span class="mt-4 w-full py-2 bg-borderBeige text-cafeTostado rounded-xl text-xs font-medium flex items-center justify-center cursor-not-allowed">Agotado</span>'
      : '<div class="flex justify-center mt-4"><span class="w-9 h-9 rounded-full bg-borderBeige text-cafeTostado flex items-center justify-center cursor-not-allowed" title="Agotado">×</span></div>';
    else if (bebida) accion = href ? '<a href="' + href + '" class="' + BTN + '" title="Personalizar ' + esc(p.nombre) + '"><span>Personalizar</span></a>'
      : '<button type="button" data-add="' + esc(p.id) + '" class="' + BTN + '"><span>Agregar</span></button>';
    else accion = '<div class="flex justify-center mt-4">' + (href ? '<a href="' + href + '" class="' + RND + '" title="Agregar al carrito">' + ICO_MAS + '</a>'
      : '<button type="button" data-add="' + esc(p.id) + '" class="' + RND + '" title="Agregar al carrito">' + ICO_MAS + '</button>') + '</div>';
    return '<div class="bg-blancoCalido rounded-xl-custom border border-borderBeige/50 p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"' + (agot ? ' style="opacity:.6"' : '') + '>' + cuerpo + accion + '</div>';
  }
  Pages.menu = function () {
    var secs = document.querySelectorAll('main section');
    var grids = [secs[0].querySelector('.grid'), secs[1].querySelector('.grid')], cats = ['Marquesita', 'Bebidas'];
    var raw = qs('q') || '', q = sinAcentos(raw);
    var aviso = document.createElement('p'); aviso.className = 'text-sm font-medium text-cafeTostado/80'; aviso.style.display = 'none';
    secs[0].parentNode.insertBefore(aviso, secs[0]);
    function render() {
      var m = MenuStore.all(), total = 0;
      cats.forEach(function (c, i) {
        var lista = m.filter(function (x) { return x.cat === c && (!q || sinAcentos(x.nombre).indexOf(q) > -1); });
        total += lista.length; grids[i].innerHTML = lista.map(tarjetaMenu).join(''); secs[i].style.display = lista.length ? '' : 'none';
      });
      if (q) { aviso.style.display = ''; aviso.innerHTML = (total ? 'Resultados para “' + esc(raw) + '”' : 'No encontramos productos que coincidan con “' + esc(raw) + '”') + ' · <a href="#" data-clear class="text-mango hover:underline">Ver todo el menú</a>'; }
      else aviso.style.display = 'none';
    }
    Pages._filtrarMenu = function (v) { raw = v.trim(); q = sinAcentos(raw); render(); };
    document.querySelector('main').addEventListener('click', function (e) {
      var b = e.target.closest('[data-add]');
      if (b) {
        var p = MenuStore.all().filter(function (x) { return x.id === b.getAttribute('data-add'); })[0];
        if (!p || p.disp === false) return toast('Este producto no está disponible', false);
        Cart.add({ producto: p.nombre, precioUnit: p.precio, cantidad: 1, detalle: [], img: p.cat === 'Bebidas' ? 'frappe.jpeg' : 'marquesita.jpeg', url: 'menu.html' });
        toast('“' + p.nombre + '” agregado al carrito'); patchHeader(); return;
      }
      if (e.target.closest('[data-clear]')) { e.preventDefault(); var bi = document.querySelector('#dsea-buscador input'); if (bi) bi.value = ''; Pages._filtrarMenu(''); }
    });
    // si el administrador cambia algo en otra pestaña, el menú se actualiza solo
    window.addEventListener('storage', render);
    window.addEventListener('focus', render);
    render();
  };

  /* ---- Buscador del encabezado (lupa) ---- */
  function initBuscador() {
    if (document.body.getAttribute('data-area') === 'admin') return;
    var btn = document.querySelector('header button[title="Buscar"]'), hdr = document.querySelector('header');
    if (!btn || !hdr || document.getElementById('dsea-buscador')) return;
    var enMenu = document.body.getAttribute('data-page') === 'menu';
    var bar = document.createElement('div'); bar.id = 'dsea-buscador'; bar.className = 'max-w-7xl mx-auto pt-3'; bar.style.display = 'none';
    bar.innerHTML = '<input type="search" placeholder="Buscar producto por nombre…" autocomplete="off" class="w-full rounded-full border border-borderBeige bg-cremaVainilla px-5 py-2 text-sm text-espresso placeholder-cafeTostado/50 focus:outline-none focus:border-espresso">';
    hdr.appendChild(bar);
    var inp = bar.firstChild;
    function abrir() { bar.style.display = ''; inp.focus(); }
    function cerrar() { bar.style.display = 'none'; if (enMenu && inp.value) { inp.value = ''; Pages._filtrarMenu(''); } }
    function buscar() { var v = inp.value.trim(); if (enMenu) Pages._filtrarMenu(v); else location.href = 'menu.html' + (v ? '?q=' + encodeURIComponent(v) : ''); }
    btn.addEventListener('click', function () { bar.style.display === 'none' ? abrir() : cerrar(); });
    inp.addEventListener('input', function () { if (enMenu) Pages._filtrarMenu(inp.value); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); buscar(); } else if (e.key === 'Escape') cerrar(); });
    if (enMenu && qs('q')) { inp.value = qs('q'); abrir(); }
  }

  /* ---- Detalle de producto (4 páginas) ---- */
  var MARQ = {
    clasica: { n: 'Marquesita Clásica', p: 55, fruta: null },
    platano: { n: 'Marquesita Plátano', p: 60, fruta: 'platano' },
    fresa: { n: 'Marquesita Fresa', p: 65, fruta: 'fresa' },
    durazno: { n: 'Marquesita Durazno', p: 65, fruta: 'durazno' },
    kiwi: { n: 'Marquesita Kiwi', p: 70, fruta: 'kiwi' },
    marquesa: { n: 'La marquesa', p: 85, fruta: null }
  };
  Pages.detalle = function (tipo) {
    var h1 = document.querySelector('main h1'); var precioEl = h1.closest('.flex').querySelector('span.font-playfair');
    var img = document.querySelector('main img');
    var cantEl = document.getElementById('cantidad-val');
    var cant = 1, base = 0, nombreBase = h1.textContent.trim();
    // OJO: el encabezado también tiene un enlace a carritodecompras.html; el botón real está dentro de <main>
    var addBtn = document.querySelector('main a[href="carritodecompras.html"]');

    // producto en el menú que edita el administrador (precio, nombre, disponibilidad)
    var ID_BEB = { 'Frappe': 'beb-frappe', 'Smoothie': 'beb-smoothie', 'Chocomil': 'beb-chocomil' };
    var claveMarq = MARQ[qs('p')] ? qs('p') : 'fresa';
    var prodId = tipo === 'marquesita' ? 'marq-' + claveMarq : ID_BEB[nombreBase];
    function buscarProd() { return MenuStore.all().filter(function (m) { return m.id === prodId; })[0]; }
    var prodSt = buscarProd();
    var prodSeed = MENU_SEED.filter(function (m) { return m.id === prodId; })[0];
    if (!prodSt) { toast('Este producto ya no está en el menú', false); setTimeout(function () { location.replace('menu.html'); }, 1200); return; }
    var agotado = prodSt.disp === false;
    var delta = 0;

    if (tipo === 'marquesita') {
      var p = MARQ[claveMarq]; base = prodSt.precio; nombreBase = prodSt.nombre;
      h1.textContent = prodSt.nombre; img.alt = prodSt.nombre; document.title = "D'SEA | " + prodSt.nombre;
      // fruta incluida según el producto
      document.querySelectorAll('input[name^="fruta_"]').forEach(function (c) {
        var inc = p.fruta && c.name === 'fruta_' + p.fruta;
        c.checked = !!inc; c.disabled = !!inc;
        var lab = c.closest('label'); lab.className = 'flex items-center space-x-2 ' + (inc ? 'cursor-not-allowed opacity-90' : 'cursor-pointer');
        c.nextElementSibling.className = inc ? 'font-semibold' : '';
      });
    }

    if (tipo !== 'marquesita') {
      nombreBase = prodSt.nombre; h1.textContent = prodSt.nombre;
      delta = prodSeed ? prodSt.precio - prodSeed.precio : 0;
      if (delta) document.querySelectorAll('main input[type=radio]').forEach(function (r) {
        var l = r.closest('label'); var sp = l.children[l.children.length - 1];
        var v = parseFloat(sp.textContent.replace(/[^0-9.]/g, '')); sp.textContent = money(v + delta);
      });
    }

    function grupos() {
      var out = [];
      document.querySelectorAll('main h3').forEach(function (h) {
        var cont = h.closest('.space-y-2'); if (!cont) return;
        var inputs = cont.querySelectorAll('input[type=checkbox],input[type=radio]'); if (!inputs.length) return;
        out.push({ titulo: h.textContent.trim(), inputs: inputs });
      });
      return out;
    }
    function selec(g) { var r = []; g.inputs.forEach(function (i) { if (i.checked) r.push(i); }); return r; }
    function nombreOpt(i) { return i.closest('label').querySelector('span:not(.font-playfair)').textContent.trim().replace(/\s+/g, ' '); }
    function nombreOptRadio(i) { var l = i.closest('label'); return l.querySelector('span span').textContent.trim(); }
    function precioRadio(i) { var l = i.closest('label'); var s = l.children[l.children.length - 1]; return parseFloat(s.textContent.replace(/[^0-9.]/g, '')); }

    function calcular() {
      var gs = grupos(), total = base, det = [];
      gs.forEach(function (g) {
        var t = g.titulo;
        if (tipo === 'marquesita') {
          var extraUnit = { 'Queso': 15, 'Fruta': 10, 'Untable': 10, 'Topping': 10 }[t];
          var incluidoPrimero = t !== 'Fruta';
          var sel = selec(g).filter(function (i) { return !i.disabled; });
          var fijos = selec(g).filter(function (i) { return i.disabled; });
          fijos.forEach(function (i) { det.push({ label: t, valor: nombreOpt(i) }); });
          sel.forEach(function (i, idx) {
            var pagado = incluidoPrimero ? idx >= 1 : true;
            // el primer queso/untable/topping está incluido; fruta adicional siempre cuesta
            if (pagado) total += extraUnit;
            det.push({ label: t, valor: nombreOpt(i) + (pagado ? ' (+' + money(extraUnit).replace('.00', '') + ')' : '') });
          });
        } else if (t === 'Sabor') {
          var r = selec(g)[0]; if (r) { total = precioRadio(r); nombreBase = h1.textContent.trim() + ' ' + nombreOptRadio(r); det.push({ label: 'Sabor', valor: nombreOptRadio(r) }); }
        } else if (t === 'Tapioca') {
          selec(g).forEach(function (i) { total += 10; det.push({ label: 'Tapioca', valor: 'Tapioca (+$10)' }); });
        } else if (t === 'Perlas Explosivas') {
          selec(g).forEach(function (i) { total += 10; det.push({ label: 'Perla explosiva', valor: nombreOpt(i) + ' (+$10)' }); });
        }
      });
      return { total: total, detalle: det, nombre: tipo === 'marquesita' ? nombreBase : nombreBase };
    }
    function pintar() {
      var c = calcular(); precioEl.textContent = money(c.total);
      if (cantEl) cantEl.textContent = cant;
      if (addBtn) addBtn.textContent = agotado ? 'Agotado' : 'Agregar al carrito · ' + money(c.total * cant);
    }
    // si es bebida, el nombre base del h1 se conserva para armar "Frappe Oreo"
    var tituloOriginal = h1.textContent.trim();
    document.querySelectorAll('main input').forEach(function (i) { i.addEventListener('change', pintar); });
    document.getElementById('btn-disminuir').addEventListener('click', function () { if (cant > 1) { cant--; pintar(); } });
    document.getElementById('btn-incrementar').addEventListener('click', function () { cant++; pintar(); });
    pintar();
    if (agotado) { addBtn.style.opacity = '.45'; addBtn.style.pointerEvents = 'none'; toast('Este producto está agotado por ahora', false); }

    addBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var st = buscarProd();
      if (!st || st.disp === false) return toast('Este producto ya no está disponible', false);
      var c = calcular();
      var nombre = tipo === 'marquesita' ? c.nombre : tituloOriginal + ' ' + (c.detalle.filter(function (d) { return d.label === 'Sabor'; })[0] || { valor: '' }).valor;
      var det = c.detalle.filter(function (d) { return d.label !== 'Sabor' || tipo === 'marquesita'; });
      Cart.add({ producto: nombre.trim(), precioUnit: c.total, cantidad: cant, detalle: det, img: img.getAttribute('src'), url: location.pathname.split('/').pop() + location.search });
      location.href = 'carritodecompras.html';
    });
  };

  /* ---- Carrito ---- */
  Pages.carrito = function () {
    var list = document.querySelector('main .lg\\:col-span-8 .space-y-6');
    var subLista = document.getElementById('subtotal-lista'), resSub = document.getElementById('resumen-subtotal'), resTot = document.getElementById('resumen-total');
    var pagar = document.querySelector('a[href="identificacionpago.html"]');
    function render() {
      var items = Cart.items();
      if (!items.length) {
        list.innerHTML = '<div class="text-center py-16 space-y-4"><p class="font-playfair text-2xl font-bold text-espresso">Tu carrito está vacío</p><p class="text-sm text-cafeTostado/80">Agrega una marquesita o una bebida para empezar.</p><a href="menu.html" class="inline-block px-6 py-2.5 rounded-xl bg-espresso text-cremaVainilla text-xs font-medium hover:bg-cafeTostado transition-colors">Ver menú</a></div>';
      } else {
        list.innerHTML = items.map(function (i) {
          var det = (i.detalle || []).map(function (d) { return '<p>• ' + esc(d.label) + ': <span class="text-cafeTostado">' + esc(d.valor) + '</span></p>'; }).join('');
          return '<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-borderBeige/60"><div class="flex items-start space-x-4"><div class="w-20 h-20 sm:w-24 sm:h-24 bg-cremaVainilla rounded-lg overflow-hidden border border-borderBeige/40 flex-shrink-0"><img src="' + esc(i.img) + '" alt="' + esc(i.producto) + '" class="w-full h-full object-cover"></div><div class="space-y-1"><h2 class="font-playfair text-xl font-bold text-espresso">' + esc(i.producto) + '</h2><p class="text-xs text-cafeTostado/80">' + money(i.precioUnit) + ' c/u</p><div class="pt-1 text-xs text-espresso/90 font-medium space-y-0.5">' + (det || '<p class="text-cafeTostado/70">Sin extras adicionales</p>') + '</div><div class="flex items-center space-x-2 pt-3"><a href="' + esc(i.url || 'menu.html') + '" class="px-3 py-1 rounded-full border border-borderBeige text-xs text-espresso hover:bg-cremaVainilla transition-colors inline-block">Ver producto</a><button type="button" data-del="' + i.id + '" class="px-3 py-1 rounded-full border border-borderBeige text-xs text-espresso hover:bg-cremaVainilla transition-colors">Eliminar</button></div></div></div><div class="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 gap-3"><span class="font-playfair text-xl font-bold text-mango">' + money(i.precioUnit * i.cantidad) + '</span><div class="flex items-center border border-borderBeige rounded-lg bg-cremaVainilla overflow-hidden"><button type="button" data-dec="' + i.id + '" class="px-2.5 py-1 text-espresso hover:bg-borderBeige/50 transition-colors font-bold text-xs">−</button><span class="px-3 py-1 text-xs font-bold text-espresso">' + i.cantidad + '</span><button type="button" data-inc="' + i.id + '" class="px-2.5 py-1 text-espresso hover:bg-borderBeige/50 transition-colors font-bold text-xs">+</button></div></div></div>';
        }).join('');
      }
      var t = money(Cart.total()); subLista.textContent = t; resSub.textContent = t; resTot.textContent = t;
      if (!items.length) { pagar.style.opacity = '.4'; pagar.style.pointerEvents = 'none'; } else { pagar.style.opacity = ''; pagar.style.pointerEvents = ''; }
      patchHeader();
    }
    list.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var id = b.getAttribute('data-del') || b.getAttribute('data-inc') || b.getAttribute('data-dec');
      var it = Cart.items().filter(function (x) { return x.id === id; })[0]; if (!it) return;
      if (b.hasAttribute('data-del')) Cart.remove(id);
      else if (b.hasAttribute('data-inc')) Cart.setQty(id, it.cantidad + 1);
      else Cart.setQty(id, it.cantidad - 1);
      render();
    });
    // si ya hay sesión, ir directo a método de pago
    pagar.addEventListener('click', function (e) {
      e.preventDefault();
      var u = Auth.user();
      location.href = u && u.rol === 'cliente' ? 'metodopago.html' : 'identificacionpago.html';
    });
    render();
  };

  /* ---- Resumen lateral del carrito (identificación / crear cuenta) ---- */
  function resumenCarritoLateral() {
    var items = Cart.items();
    var box = document.querySelector('.lg\\:col-span-5');
    if (!box) return;
    var wrap = Array.prototype.filter.call(box.querySelectorAll('p'), function (p) { return /^Tu carrito/.test(p.textContent); })[0];
    if (!wrap) return;
    var card = wrap.parentElement;
    var n = items.reduce(function (a, i) { return a + i.cantidad; }, 0);
    card.innerHTML = '<p class="text-xs font-bold text-espresso uppercase tracking-wider">Tu carrito · ' + n + ' producto' + (n === 1 ? '' : 's') + '</p>' +
      items.map(function (i) { return '<div class="flex items-center space-x-4"><div class="w-16 h-16 bg-cremaVainilla rounded-lg overflow-hidden border border-borderBeige/40 flex-shrink-0"><img src="' + esc(i.img) + '" alt="" class="w-full h-full object-cover"></div><div class="flex-grow"><h3 class="font-playfair text-base font-bold text-espresso">' + esc(i.producto) + '</h3><p class="text-xs text-cafeTostado font-medium">' + i.cantidad + ' × ' + money(i.precioUnit) + '</p></div></div>'; }).join('') +
      '<div class="pt-3 border-t border-borderBeige/60 flex justify-between items-center text-espresso"><span class="text-xs font-semibold">Total · MXN</span><span class="font-playfair text-xl font-bold text-mango">' + money(Cart.total()) + '</span></div>';
  }

  /* ---- Identificación en el pago (login) ---- */
  Pages.identificacion = function () {
    var u = Auth.user();
    if (u && u.rol === 'cliente') { location.replace('metodopago.html'); return; }
    if (!Cart.items().length) { location.replace('carritodecompras.html'); return; }
    resumenCarritoLateral();
    var f = document.querySelector('form');
    f.removeAttribute('action'); f.removeAttribute('method');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var r = Auth.login(f.querySelector('#email').value, f.querySelector('#password').value, 'cliente');
      if (!r.ok) return showError(f, r.msg);
      location.href = 'metodopago.html';
    });
    var olv = f.querySelector('a[href="datoscliente.html"]');
    if (olv) olv.addEventListener('click', function (e) { e.preventDefault(); toast('Demo: usa cliente@dsea.mx / 1234'); });
  };

  /* ---- Crear cuenta en el pago ---- */
  Pages.crearcuenta = function () {
    if (!Cart.items().length) { location.replace('carritodecompras.html'); return; }
    resumenCarritoLateral();
    var f = document.querySelector('form');
    f.removeAttribute('action'); f.removeAttribute('method');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var r = Auth.register({ nombre: f.querySelector('#nombre').value, email: f.querySelector('#email').value, tel: f.querySelector('#telefono').value, password: f.querySelector('#password').value, confirm: f.querySelector('#confirm_password').value });
      if (!r.ok) return showError(f, r.msg);
      location.href = 'metodopago.html';
    });
  };

  /* ---- Método de pago ---- */
  function fillResumenPedido(opts) {
    var u = Auth.user(); var items = Cart.items();
    var main = document.querySelector('main');
    var side = Array.prototype.filter.call(main.querySelectorAll('span'), function (s) { return s.textContent.trim() === 'Detalles'; })[0];
    if (!side) return;
    var card = side.closest('.bg-blancoCalido') || side.parentElement.parentElement;
    var folioPrev = 'D' + String(load(K.seq, 42) + 1).padStart(3, '0');
    var h2 = card.querySelector('h2'); if (h2) h2.textContent = 'Pedido #' + folioPrev;
    var nom = card.querySelector('p.font-semibold'); if (nom) { nom.textContent = u.nombre; nom.nextElementSibling.textContent = fechaCorta(Date.now()); }
    var lista = card.querySelector('.space-y-4.pt-2'); if (lista) lista.innerHTML = items.map(function (i) { return rowItem(i); }).join('');
    var tot = totalEl(); if (tot) tot.textContent = money(Cart.total());
  }
  Pages.metodopago = function () {
    var u = Auth.require('cliente', 'identificacionpago.html'); if (!u) return;
    if (!Cart.items().length) { location.replace('carritodecompras.html'); return; }
    fillResumenPedido();
    var total = money(Cart.total());
    var btn = document.getElementById('btn-confirmar');
    var metodo = 'linea';
    // reutiliza la función existente y la amplía
    var orig = window.seleccionarMetodo;
    window.seleccionarMetodo = function (m) { metodo = m; orig(m); btn.innerText = m === 'linea' ? 'Confirmar pago de ' + total : 'Confirmar pedido y pagar al recoger'; };
    document.querySelectorAll('strong').forEach(function (s) { if (/MXN/.test(s.textContent)) s.textContent = total + ' MXN'; });
    btn.innerText = 'Confirmar pago de ' + total;
    var titular = document.querySelector('#form-tarjeta input[value]'); if (titular) titular.value = u.nombre;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (metodo === 'linea') {
        var ins = document.querySelectorAll('#form-tarjeta input');
        var num = ins[0].value.replace(/\s/g, '');
        if (num.length < 12 || !/^\d+$/.test(num)) return toast('Escribe un número de tarjeta válido (demo: 4242 4242 4242 4242)', false);
        if (!/^\d{2}\/\d{2}$/.test(ins[1].value.trim())) return toast('Fecha de vencimiento con formato MM/AA', false);
        if (ins[2].value.trim().length < 3) return toast('Escribe el CVC', false);
        btn.innerText = 'Procesando pago…'; btn.style.pointerEvents = 'none';
        setTimeout(function () { Checkout.set({ metodo: 'linea' }); location.href = 'horariorecoleccion.html'; }, 1200);
      } else {
        Checkout.set({ metodo: 'recoger' }); location.href = 'horariorecoleccion.html';
      }
    });
    // abrir con "Pago en línea" seleccionado
    var cl = document.getElementById('card-pago-linea'); if (cl && cl.className.indexOf('border-2') < 0) window.seleccionarMetodo('linea');
  };

  /* ---- Horario de recolección (aquí se crea el pedido al confirmar) ---- */
  function slots() {
    var r = [], mins = 19 * 60 + 30;
    for (; mins < 23 * 60; mins += 30) {
      var a = pad(Math.floor(mins / 60)) + ':' + pad(mins % 60), b = pad(Math.floor((mins + 30) / 60)) + ':' + pad((mins + 30) % 60);
      r.push(a + ' – ' + b);
    }
    return r;
  }
  Pages.horario = function () {
    var u = Auth.require('cliente', 'identificacionpago.html'); if (!u) return;
    if (!Cart.items().length) { location.replace(Orders.lastFolio() ? 'comprobantepedido.html' : 'carritodecompras.html'); return; }
    fillResumenPedido();
    var chk = Checkout.get();
    document.querySelectorAll('span').forEach(function (s) { if (s.textContent.trim() === 'Pago confirmado') s.textContent = chk.metodo === 'linea' ? 'Pago confirmado' : 'Pago al recoger'; });
    var intro = Array.prototype.filter.call(document.querySelectorAll('main p'), function (p) { return /pago ya fue confirmado/.test(p.textContent); })[0];
    if (intro && chk.metodo !== 'linea') intro.textContent = '¡Tu pedido está registrado! Pagarás al recoger.';
    var hint = Array.prototype.filter.call(document.querySelectorAll('main p'), function (p) { return /Horarios de ejemplo/.test(p.textContent); })[0];
    if (hint) hint.textContent = 'Elige el bloque en el que pasarás por tu pedido hoy.';
    var cont = document.querySelector('.space-y-3');
    var ss = slots(); var sel = 0;
    cont.innerHTML = ss.map(function (s, i) {
      return '<div onclick="seleccionarHorario(this)" class="bg-blancoCalido rounded-xl-custom border border-borderBeige/60 p-4 sm:p-5 shadow-sm flex items-center justify-between cursor-pointer hover:border-borderBeige transition-all"><div class="space-y-0.5"><p class="text-xs font-bold text-espresso">Hoy - ' + s + '</p><p class="text-[11px] text-cafeTostado/60">Disponible</p></div><div class="w-6 h-6 rounded-full border-2 border-borderBeige flex-shrink-0"></div></div>';
    }).join('');
    // reemplaza la función original para mostrar "Disponible"
    window.seleccionarHorario = function (el) {
      cont.querySelectorAll(':scope > div').forEach(function (t) {
        t.className = 'bg-blancoCalido rounded-xl-custom border border-borderBeige/60 p-4 sm:p-5 shadow-sm flex items-center justify-between cursor-pointer hover:border-borderBeige transition-all';
        t.children[0].children[1].textContent = 'Disponible'; t.children[0].children[1].className = 'text-[11px] text-cafeTostado/60';
        t.children[1].className = 'w-6 h-6 rounded-full border-2 border-borderBeige flex-shrink-0'; t.children[1].innerHTML = '';
      });
      el.className = 'bg-blancoCalido rounded-xl-custom border-2 border-espresso p-4 sm:p-5 shadow-sm flex items-center justify-between cursor-pointer transition-all';
      el.children[0].children[1].textContent = 'Seleccionado'; el.children[0].children[1].className = 'text-[11px] text-cafeTostado/70';
      el.children[1].className = 'w-6 h-6 rounded-full bg-espresso flex items-center justify-center text-white flex-shrink-0'; el.children[1].innerHTML = '✓';
      var txt = el.querySelector('p').textContent.replace('Hoy - ', '');
      Checkout.set({ horario: txt });
      var line = document.querySelector('.bg-cremaVainilla\\/60 .text-cafeTostado.text-\\[11px\\]'); if (line) line.textContent = 'Hoy · ' + txt;
    };
    window.seleccionarHorario(cont.children[0]);
    var confirmar = document.querySelector('a[href="comprobantepedido.html"]');
    confirmar.addEventListener('click', function (e) {
      e.preventDefault();
      var h = Checkout.get().horario; if (!h) return toast('Elige un horario', false);
      var o = Orders.create({ metodo: Checkout.get().metodo, horario: h });
      Cart.clear(); localStorage.removeItem(K.checkout);
      location.href = 'comprobantepedido.html?folio=' + o.folio;
    });
    var det = Array.prototype.filter.call(document.querySelectorAll('button'), function (b) { return b.textContent.trim() === 'Ver detalles'; })[0];
    if (det) det.addEventListener('click', function () {
      var l = Cart.items().map(function (i) { return i.cantidad + '× ' + i.producto + (detalleLinea(i) ? ' (' + detalleLinea(i) + ')' : ''); }).join('\n');
      alert(l);
    });
  };

  /* ---- Comprobante ---- */
  Pages.comprobante = function () {
    var u = Auth.require('cliente', 'iniciosesion.html'); if (!u) return;
    var o = pedidoPorContexto(); if (!o) { location.replace('menu.html'); return; }
    setText('main p.font-medium.pt-1', o.cliente.nombre + ' · Tu pedido está confirmado.');
    document.querySelector('main .text-4xl').textContent = '#' + o.folio;
    var h = Array.prototype.filter.call(document.querySelectorAll('main p'), function (p) { return /Horario de recolección/.test(p.textContent); })[0]; if (h) h.nextElementSibling.textContent = horarioTexto(o.horario);
    fillItems(document.querySelector('.space-y-3.pt-1'), o);
    var t = totalEl(); if (t) t.textContent = money(o.total);
    var fp = Array.prototype.filter.call(document.querySelectorAll('h3'), function (x) { return x.textContent.trim() === 'Forma de pago'; })[0];
    if (fp) fp.nextElementSibling.textContent = o.metodo === 'linea' ? 'Pago en línea · Confirmado' : 'Pago al recoger · Pendiente de cobro en tienda';
    var seg = document.querySelector('a[href="estadopedido2.html"]'); if (seg) seg.href = 'estadopedido2.html?folio=' + o.folio;
    var sp = document.querySelector('main span.italic'); if (sp && o.metodo !== 'linea') sp.textContent = 'Pedido registrado';
  };

  /* ---- Seguimiento del pedido ---- */
  var PASOS = [['Recibido', 'Recibido'], ['Preparando', 'En curso'], ['Listo', 'Listo para recoger'], ['Entregado', 'Entregado']];
  var ESTADO_IDX = { 'Recibido': 0, 'En preparación': 1, 'Listo': 2, 'Entregado': 3 };
  var CHECK = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>';
  Pages.seguimiento = function () {
    var u = Auth.require('cliente', 'iniciosesion.html'); if (!u) return;
    var o = pedidoPorContexto(); if (!o) { location.replace('menu.html'); return; }
    if (o.estado === 'Entregado' && !qs('ver')) { location.replace('pedidoentregado.html?folio=' + o.folio); return; }
    function render() {
      o = Orders.byFolio(o.folio);
      if (o.estado === 'Entregado') { location.replace('pedidoentregado.html?folio=' + o.folio); return; }
      var idx = ESTADO_IDX[o.estado];
      var top = document.querySelector('main > div > span'); if (top) top.textContent = 'Pedido #' + o.folio;
      var hs = document.querySelectorAll('main h2'); if (hs[0]) { hs[0].textContent = 'Pedido #' + o.folio; hs[0].nextElementSibling.textContent = fechaCorta(o.fecha); }
      var badge = document.querySelector('main span.inline-flex'); badge.textContent = '• ' + o.estado;
      var hz = horarioTexto(o.horario);
      document.querySelectorAll('main p.font-bold.text-sm').forEach(function (p) { if (/^Hoy|^\d/.test(p.textContent.trim())) p.textContent = hz; });
      var hh = Array.prototype.filter.call(document.querySelectorAll('main h3'), function (h) { return /Horario de recolección/.test(h.textContent); })[0];
      if (hh) hh.nextElementSibling.textContent = (o.horario || '').replace(' – ', '–');
      var rows = document.querySelectorAll('main .space-y-5 > div');
      rows.forEach(function (r, i) {
        var circ = r.children[0], p = r.children[1].querySelectorAll('p');
        var hecho = i < idx, actual = i === idx;
        circ.className = 'w-7 h-7 rounded-full ' + (hecho ? 'bg-verdeMatcha text-blancoCalido' : actual ? 'bg-cafeTostado text-blancoCalido' : 'bg-borderBeige/60 text-cafeTostado') + ' flex items-center justify-center flex-shrink-0 text-xs font-bold';
        circ.innerHTML = hecho ? CHECK : String(i + 1);
        p[1].textContent = hecho ? 'Completado' : actual ? (i === 0 ? 'Recibido' : PASOS[i][1]) : 'Pendiente';
      });
      var cont = Array.prototype.filter.call(document.querySelectorAll('main h3'), function (h) { return /Detalles del pedido/.test(h.textContent); })[0];
      if (cont) { var lst = cont.parentElement.querySelector('.space-y-3.pt-1'); fillItems(lst, o); }
      var t = totalEl(); if (t) t.textContent = money(o.total);
      var msg = document.querySelector('main .text-center p, main p.text-\\[11px\\]');
    }
    render();
    // refresco automático: el admin cambia el estado en otra pestaña
    setInterval(render, 2500);
    window.addEventListener('storage', render);
  };

  /* ---- Entregado ---- */
  Pages.entregado = function () {
    var u = Auth.require('cliente', 'iniciosesion.html'); if (!u) return;
    var o = pedidoPorContexto(); if (!o) { location.replace('menu.html'); return; }
    if (o.estado !== 'Entregado') { location.replace('estadopedido2.html?folio=' + o.folio); return; }
    var d = new Date(o.fecha);
    document.querySelector('main span.uppercase, main > div > span').textContent = 'PEDIDO #' + o.folio + ' · ' + d.getDate() + ' ' + MESES[d.getMonth()].toUpperCase() + ' ' + d.getFullYear();
    var gr = document.querySelector('main h1 + p'); if (gr) gr.textContent = 'Gracias, ' + o.cliente.nombre.split(' ')[0] + '. Esperamos que hayas disfrutado tu pedido.';
    var hs = document.querySelectorAll('main h2');
    var side = Array.prototype.filter.call(hs, function (h) { return /^Pedido #/.test(h.textContent); })[0];
    if (side) { side.textContent = 'Pedido #' + o.folio; var ps = side.nextElementSibling.querySelectorAll('p'); ps[0].textContent = o.cliente.nombre; ps[1].textContent = d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear(); }
    document.querySelectorAll('main p.font-medium, main p.text-espresso').forEach(function (p) { if (/^Hoy \d/.test(p.textContent.trim())) p.textContent = horarioTexto(o.horario); });
    fillItems(document.querySelector('.space-y-4.pt-2'), o);
    var t = totalEl(); if (t) t.textContent = money(o.total);
    var pg = Array.prototype.filter.call(document.querySelectorAll('span'), function (s) { return /Pago en línea confirmado/.test(s.textContent); })[0];
    if (pg) pg.textContent = o.metodo === 'linea' ? 'Pago en línea confirmado' : 'Pago cobrado en tienda';
    var cal = document.querySelector('a[href="calificarpedido.html"]');
    if (cal) {
      if (o.calificacion) { cal.textContent = 'Ver mi calificación'; cal.href = 'calificacionenviada.html?folio=' + o.folio; }
      else cal.href = 'calificarpedido.html?folio=' + o.folio;
    }
  };

  /* ---- Calificar ---- */
  var ETIQ = ['', 'Mala', 'Regular', 'Buena', 'Muy buena', 'Excelente'];
  function pedidoResumenLateral(o) {
    var d = new Date(o.fecha);
    var h2 = Array.prototype.filter.call(document.querySelectorAll('main h2'), function (h) { return /^Pedido #/.test(h.textContent); })[0];
    if (h2) { h2.textContent = 'Pedido #' + o.folio; var ps = h2.nextElementSibling.querySelectorAll('p'); ps[0].textContent = o.cliente.nombre; ps[1].textContent = d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear(); }
    document.querySelectorAll('main p.font-medium').forEach(function (p) { if (/^Hoy \d/.test(p.textContent.trim())) p.textContent = horarioTexto(o.horario); });
    fillItems(document.querySelector('.space-y-4.pt-2'), o);
    var t = totalEl(); if (t) t.textContent = money(o.total);
  }
  // La 5ª estrella viene en el HTML como contorno (fill-none): se normaliza para que las 5 se puedan rellenar igual
  function estrella(svg, activa, tam) {
    svg.setAttribute('class', tam + ' fill-current');
    svg.style.color = activa ? '#E5A93B' : '#E4D7CA';
    svg.style.fill = 'currentColor'; svg.style.stroke = 'none';
  }
  Pages.calificar = function () {
    var u = Auth.require('cliente', 'iniciosesion.html'); if (!u) return;
    var o = pedidoPorContexto(); if (!o) { location.replace('menu.html'); return; }
    if (o.estado !== 'Entregado') { location.replace('estadopedido2.html?folio=' + o.folio); return; }
    pedidoResumenLateral(o);
    document.querySelector('main h1 + p').textContent = o.cliente.nombre.split(' ')[0] + ', nos encantará saber cómo estuvo tu pedido.';
    var starsBox = document.querySelector('main .space-y-2 > .flex.items-center.space-x-2');
    var stars = starsBox.querySelectorAll('button'); var label = starsBox.nextElementSibling;
    var val = 0; var ta = document.getElementById('comentario'); ta.value = ''; ta.placeholder = 'Cuéntanos qué te pareció (opcional)';
    function pintar() { stars.forEach(function (b, i) { estrella(b.querySelector('svg'), i < val, 'w-8 h-8'); }); label.textContent = val ? val + ' de 5 estrellas · ' + ETIQ[val] : 'Elige de 1 a 5 estrellas'; }
    stars.forEach(function (b, i) { b.addEventListener('click', function () { val = i + 1; pintar(); }); });
    pintar();
    document.querySelector('a[href="calificacionenviada.html"]').addEventListener('click', function (e) {
      e.preventDefault();
      if (!val) return toast('Elige una calificación de 1 a 5 estrellas', false);
      Orders.update(o.folio, { calificacion: { estrellas: val, comentario: ta.value.trim(), fecha: Date.now() } });
      location.href = 'calificacionenviada.html?folio=' + o.folio;
    });
  };
  Pages.calificada = function () {
    var u = Auth.require('cliente', 'iniciosesion.html'); if (!u) return;
    var o = pedidoPorContexto(); if (!o || !o.calificacion) { location.replace('menu.html'); return; }
    pedidoResumenLateral(o);
    var c = o.calificacion;
    var h2 = document.querySelector('main h2.text-xl, main h2'); // "¡Gracias, ...!"
    Array.prototype.forEach.call(document.querySelectorAll('main h2'), function (h) { if (/Gracias,/.test(h.textContent)) { h.textContent = '¡Gracias, ' + o.cliente.nombre.split(' ')[0] + '!'; h.nextElementSibling.textContent = 'Recibimos tu valoración del pedido #' + o.folio + '.'; } });
    var sv = Array.prototype.filter.call(document.querySelectorAll('main h3'), function (h) { return /Tu valoración/.test(h.textContent); })[0];
    if (sv) {
      var box = sv.nextElementSibling; box.querySelectorAll('svg').forEach(function (s, i) { estrella(s, i < c.estrellas, 'w-6 h-6'); });
      box.nextElementSibling.textContent = c.estrellas + ' de 5 estrellas · ' + ETIQ[c.estrellas];
    }
    var tc = Array.prototype.filter.call(document.querySelectorAll('main span'), function (s) { return /Tu comentario/.test(s.textContent); })[0];
    if (tc) { tc.nextElementSibling.textContent = c.comentario || 'Sin comentario.'; }
    var d = new Date(c.fecha);
    Array.prototype.forEach.call(document.querySelectorAll('main p'), function (p) { if (/^Enviada el/.test(p.textContent)) p.textContent = 'Enviada el ' + d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear(); });
  };

  /* ---- Perfil + historial ---- */
  Pages.perfil = function () {
    var u = Auth.require('cliente', 'iniciosesion.html'); if (!u) return;
    var users = load(K.users, []); var me = users.filter(function (x) { return x.email === u.email; })[0] || {};
    var f = document.querySelector('form');
    var ins = f.querySelectorAll('input'), ta = f.querySelector('textarea');
    function llenar() { ins[0].value = me.nombre || ''; ins[1].value = me.email || ''; ins[2].value = me.tel || ''; ta.value = me.notas || ''; }
    llenar(); ins[1].readOnly = true; ins[1].style.opacity = '.7';
    var btns = f.querySelectorAll('button');
    btns[0].addEventListener('click', llenar);
    btns[1].addEventListener('click', function () {
      me.nombre = ins[0].value.trim() || me.nombre; me.tel = ins[2].value.trim(); me.notas = ta.value;
      save(K.users, users.map(function (x) { return x.email === me.email ? me : x; }));
      save(K.sesCliente, { email: me.email, nombre: me.nombre, tel: me.tel, rol: me.rol });
      toast('Datos guardados'); patchHeader();
    });
    // historial
    var hist = Array.prototype.filter.call(document.querySelectorAll('h2'), function (h) { return h.textContent.trim() === 'Historial'; })[0].nextElementSibling;
    function pintarHist() {
    var os = Orders.byUser(u.email);
    var CLS = { 'Recibido': 'bg-rosaFresa/30 text-[#B85C54]|bg-[#B85C54]', 'En preparación': 'bg-caramelo/15 text-caramelo|bg-caramelo', 'Listo': 'bg-mango/15 text-mango|bg-mango', 'Entregado': 'bg-emerald-100 text-emerald-800|bg-emerald-600' };
    hist.innerHTML = os.length ? os.map(function (o) {
      var c = CLS[o.estado].split('|');
      var accion = o.estado === 'Entregado' ? '<a href="pedidoentregado.html?folio=' + o.folio + '" class="px-5 py-2 rounded-xl border border-borderBeige text-espresso text-xs font-medium hover:bg-cremaVainilla transition-colors inline-block text-center">' + (o.calificacion ? 'Ver calificación' : 'Calificar') + '</a>' : '<a href="estadopedido2.html?folio=' + o.folio + '" class="px-5 py-2 rounded-xl border border-borderBeige text-espresso text-xs font-medium hover:bg-cremaVainilla transition-colors inline-block text-center">Ver estado</a>';
      return '<div class="bg-blancoCalido rounded-xl-custom shadow-sm border border-borderBeige/50 p-6 space-y-4"><div class="flex items-center justify-between"><h3 class="font-playfair text-xl font-bold text-espresso">Pedido <span class="font-sans text-base font-normal opacity-80">#' + o.folio + '</span></h3><span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ' + c[0] + '"><span class="w-1.5 h-1.5 rounded-full ' + c[1] + ' mr-1.5"></span>' + o.estado + '</span></div><div class="text-xs text-cafeTostado/80 space-y-0.5"><p class="font-medium text-espresso text-sm">' + esc(o.cliente.nombre) + '</p><p>' + fechaCorta(o.fecha) + '</p></div><div class="bg-cremaVainilla/80 rounded-xl p-3 text-xs text-espresso"><p class="text-[10px] text-cafeTostado/70 font-semibold">Recolección en tienda</p><p class="font-medium">' + horarioTexto(o.horario) + '</p></div>' +
        o.items.map(function (i) { return '<div class="pt-2 border-t border-borderBeige/40 flex items-center justify-between text-xs text-espresso"><p><span class="font-medium text-cafeTostado mr-1">' + i.cantidad + ' ×</span> ' + esc(i.producto) + '</p><p class="font-medium">' + money(i.precioUnit * i.cantidad) + '</p></div>'; }).join('') +
        '<div class="pt-2 border-t border-borderBeige/40 flex items-center justify-between"><div class="text-xs"><span class="text-cafeTostado/70 block text-[11px]">Total · MXN</span><p class="font-playfair text-xl font-bold text-espresso">' + money(o.total) + '</p></div>' + accion + '</div></div>';
    }).join('') : '<p class="text-sm text-cafeTostado/80">Aún no tienes pedidos. <a href="menu.html" class="text-mango hover:underline">Ir al menú</a></p>';
    }
    pintarHist(); window.addEventListener('storage', pintarHist); setInterval(pintarHist, 3000);
  };

  /* ================== ADMIN ================== */
  Pages.dashboard = function () {
    var u = Auth.require('admin', 'iniciosesionadmin.html'); if (!u) return;
    var os = Orders.all();
    var cnt = { 'Recibido': 0, 'En preparación': 0, 'Listo': 0, 'Entregado': 0 }; os.forEach(function (o) { cnt[o.estado]++; });
    var vals = [cnt['Recibido'], cnt['En preparación'], cnt['Listo'], cnt['Entregado']];
    document.querySelectorAll('main .text-5xl').forEach(function (s, i) { s.textContent = vals[i]; });
    // más vendidos
    var ag = {}; os.forEach(function (o) { o.items.forEach(function (i) { var k = i.producto; ag[k] = ag[k] || { n: 0, t: 0 }; ag[k].n += i.cantidad; ag[k].t += i.cantidad * i.precioUnit; }); });
    var top = Object.keys(ag).sort(function (a, b) { return ag[b].n - ag[a].n; }).slice(0, 3);
    var rows = Array.prototype.filter.call(document.querySelectorAll('main h2'), function (h) { return /Más vendidos/.test(h.textContent); })[0];
    var lst = rows.parentElement.nextElementSibling;
    var tpl = lst.children[0];
    lst.innerHTML = top.map(function (k, i) { var c = tpl.cloneNode(true); c.querySelector('h3').textContent = k; c.querySelectorAll('p')[0].textContent = ag[k].n + ' vendidos'; c.querySelector('span:last-child').textContent = money(ag[k].t).replace('.00', ''); var num = c.querySelector('div > div > div'); if (num) num.textContent = i + 1; return c.outerHTML; }).join('');
  };

  Pages.pedidos = function () {
    var u = Auth.require('admin', 'iniciosesionadmin.html'); if (!u) return;
    var tbody = document.querySelector('tbody'); var filtro = 'Todos', q = '';
    var tabs = document.querySelector('main .space-x-6');
    var defs = [['Todos', null], ['Recibidos', 'Recibido'], ['Preparados', 'En preparación'], ['Listos', 'Listo'], ['Entregados', 'Entregado']];
    function pintarTabs() {
      tabs.innerHTML = defs.map(function (d) { var a = d[0] === filtro; return '<a href="#" data-tab="' + d[0] + '" class="relative pb-1 ' + (a ? 'text-espresso font-bold' : 'hover:text-espresso transition-colors') + '">' + d[0] + (a ? '<span class="absolute bottom-0 left-0 w-full h-0.5 bg-espresso"></span>' : '') + '</a>'; }).join('');
    }
    function render() {
      var est = defs.filter(function (d) { return d[0] === filtro; })[0][1];
      var list = Orders.all().sort(function (a, b) { return b.fecha - a.fecha; }).filter(function (o) { return (!est || o.estado === est) && (!q || (o.folio + ' ' + o.cliente.nombre).toLowerCase().indexOf(q) > -1); });
      tbody.innerHTML = list.length ? list.map(function (o) {
        return '<tr class="hover:bg-cremaVainilla/20 transition-colors"><td class="py-4 px-6 font-semibold">#' + o.folio + '</td><td class="py-4 px-6">' + esc(o.cliente.nombre) + '</td><td class="py-4 px-6 text-cafeTostado/80">' + esc((o.horario || '—').split(' ')[0]) + '</td><td class="py-4 px-6 font-semibold">' + money(o.total) + '</td><td class="py-4 px-6">' + badgeEstado(o.estado) + '</td><td class="py-4 px-6 text-center"><a href="detallepedidoadmin.html?folio=' + o.folio + '" class="inline-flex items-center justify-center w-9 h-7 rounded-lg bg-espresso text-cremaVainilla hover:bg-cafeTostado transition-colors shadow-sm" title="Ver detalle"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12z"/></svg></a></td></tr>';
      }).join('') : '<tr><td colspan="6" class="py-10 text-center text-cafeTostado/70">No hay pedidos con ese filtro.</td></tr>';
    }
    tabs.addEventListener('click', function (e) { var a = e.target.closest('a[data-tab]'); if (!a) return; e.preventDefault(); filtro = a.getAttribute('data-tab'); pintarTabs(); render(); });
    document.querySelector('input[placeholder^="Buscar"]').addEventListener('input', function (e) { q = e.target.value.trim().toLowerCase().replace('#', ''); render(); });
    pintarTabs(); render();
    window.addEventListener('storage', render); setInterval(render, 3000);
  };

  Pages.detalleadmin = function () {
    var u = Auth.require('admin', 'iniciosesionadmin.html'); if (!u) return;
    var f = qs('folio'); var o = f && Orders.byFolio(f); if (!o) { location.replace('gestionpedidos.html'); return; }
    var sel = o.estado;
    var h1 = document.querySelector('main h1'); h1.nextElementSibling.querySelector('span').textContent = '#' + o.folio;
    var card = Array.prototype.filter.call(document.querySelectorAll('main h2'), function (h) { return /^Pedido #/.test(h.textContent); })[0];
    card.textContent = 'Pedido #' + o.folio;
    var badge = card.nextElementSibling;
    var cli = card.parentElement.nextElementSibling; cli.querySelector('p').textContent = o.cliente.nombre;
    var hor = card.parentElement.parentElement.querySelector('.bg-cremaVainilla\\/60 p.font-medium, .bg-cremaVainilla\\/60 p.text-espresso, .bg-cremaVainilla\\/60 div p:last-child');
    Array.prototype.forEach.call(document.querySelectorAll('main p'), function (p) { if (/^Hoy · /.test(p.textContent.trim())) p.textContent = horarioTexto(o.horario) + (o.metodo === 'recoger' ? ' · Pago al recoger' : ' · Pago en línea'); });
    fillItems(Array.prototype.filter.call(document.querySelectorAll('main .space-y-4'), function (e) { return e.querySelector('.font-bold.text-cafeTostado'); })[0] || document.querySelector('main .space-y-4'), o);
    var t = totalEl(); if (t) t.textContent = money(o.total);
    var infos = Array.prototype.filter.call(document.querySelectorAll('main h3'), function (h) { return /Información del cliente/.test(h.textContent); })[0].parentElement.querySelectorAll('p.font-medium, p.font-semibold, p.text-espresso');
    var rowsInfo = Array.prototype.filter.call(document.querySelectorAll('main p'), function (p) { return ['Nombre', 'Telefono', 'Correo'].indexOf(p.textContent.trim()) > -1; });
    rowsInfo.forEach(function (p) { var k = p.textContent.trim(); p.nextElementSibling.textContent = k === 'Nombre' ? o.cliente.nombre : k === 'Telefono' ? (o.cliente.tel || '—') : o.cliente.email; });

    // selector de estado
    var lista = document.getElementById('lista-estados') || document.querySelector('main .divide-y'); // id propio: la tarjeta de contacto comparte clases con esta lista
    var LAPIZ = '<svg class="w-4 h-4 text-espresso" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>';
    var COLOR = { 'Recibido': '#B85C54', 'En preparación': '#8C6239', 'Listo': '#E29A53', 'Entregado': '#4A7C59' };
    function pintar() {
      badge.outerHTML = '<span class="' + badge.className + '">' + badgeEstado(sel).replace(/^<span[^>]*>|<\/span>$/g, '') + '</span>';
      badge = card.nextElementSibling;
      badge.className = 'inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold space-x-2';
      badge.style.cssText = 'background:' + { 'Recibido': '#FCEBEA', 'En preparación': '#FAF3EC', 'Listo': '#F3EFEA', 'Entregado': '#EBF4EC' }[sel] + ';color:' + COLOR[sel];
      // El estado seleccionado va primero (con lápiz); los demás debajo en su orden normal, igual que el diseño
      lista.innerHTML = [sel].concat(ESTADOS.filter(function (e) { return e !== sel; })).map(function (e, i) {
        if (i === 0) return '<div data-est="' + e + '" class="p-3.5 bg-[#FAF3EC] flex items-center justify-between cursor-pointer"><div class="flex items-center space-x-3"><span class="w-2.5 h-2.5 rounded-full bg-espresso"></span><span class="text-xs font-bold text-espresso">' + e + '</span></div>' + LAPIZ + '</div>';
        return '<div data-est="' + e + '" class="p-3.5 hover:bg-cremaVainilla/40 flex items-center space-x-3 cursor-pointer transition-colors"><span class="w-2.5 h-2.5 rounded-full" style="background:' + COLOR[e] + '"></span><span class="text-xs font-medium text-espresso">' + e + '</span></div>';
      }).join('');
      var idx = ESTADO_IDX[sel];
      var pasos = document.querySelectorAll('main .relative.z-10');
      pasos.forEach(function (p, i) {
        var c = p.children[0], s = p.children[1];
        c.className = 'w-8 h-8 rounded-full ' + (i <= idx ? 'bg-[#94A17B] text-white' : 'bg-[#EAE0D5] text-cafeTostado/80') + ' flex items-center justify-center text-xs font-bold flex-shrink-0';
        s.className = 'text-xs ' + (i <= idx ? 'font-bold text-espresso' : 'font-medium text-cafeTostado');
      });
    }
    lista.addEventListener('click', function (e) { var d = e.target.closest('[data-est]'); if (!d) return; sel = d.getAttribute('data-est'); pintar(); });
    var guardar = Array.prototype.filter.call(document.querySelectorAll('button'), function (b) { return b.textContent.trim() === 'Guardar'; })[0];
    guardar.addEventListener('click', function () { Orders.update(o.folio, { estado: sel }); toast('Estado actualizado a "' + sel + '". El cliente lo verá en su seguimiento.'); });
    pintar();
  };

  /* ---- Administración del menú ---- */
  Pages.adminmenu = function () {
    var u = Auth.require('admin', 'iniciosesionadmin.html'); if (!u) return;
    var form = document.querySelector('form'); var ins = form.querySelectorAll('input'); var sel = form.querySelector('select');
    sel.innerHTML = '<option value="Marquesita">Marquesita</option><option value="Bebidas">Bebidas</option>';
    var cat = 'Marquesita', q = '';
    var cards = document.querySelector('main .grid.md\\:grid-cols-2');
    var titulo = Array.prototype.filter.call(document.querySelectorAll('main h2'), function (h) { return /D'SEA/.test(h.textContent); })[0];
    var etiq = titulo.previousElementSibling;
    // pestañas de categoría
    var tabs = document.createElement('div'); tabs.className = 'flex items-center space-x-5 text-xs font-medium text-cafeTostado';
    titulo.parentElement.appendChild(tabs);
    function pintarTabs() {
      tabs.innerHTML = ['Marquesita', 'Bebidas'].map(function (c) { var a = c === cat; return '<a href="#" data-c="' + c + '" class="relative pb-1 ' + (a ? 'text-espresso font-bold' : '') + '">' + c + (a ? '<span class="absolute bottom-0 left-0 w-full h-0.5 bg-espresso"></span>' : '') + '</a>'; }).join('');
      titulo.textContent = cat === 'Marquesita' ? "Marquesitas D'SEA" : "Bebidas D'SEA";
    }
    function render() {
      var m = MenuStore.all().filter(function (x) { return x.cat === cat && (!q || x.nombre.toLowerCase().indexOf(q) > -1); });
      cards.innerHTML = m.map(function (p) {
        var disp = p.disp;
        return '<div class="bg-blancoCalido rounded-xl-custom border border-borderBeige/60 shadow-sm p-6 space-y-6 flex flex-col justify-between"><div class="space-y-4"><div class="w-full h-48 bg-cremaVainilla rounded-xl overflow-hidden border border-borderBeige/40"><img src="' + (p.cat === 'Bebidas' ? 'frappe.jpeg' : 'marquesita.jpeg') + '" alt="' + esc(p.nombre) + '" class="w-full h-full object-cover" ' + (disp ? '' : 'style="opacity:.5"') + '></div><div class="flex items-start justify-between"><div><h3 class="font-playfair text-lg font-bold text-espresso">' + esc(p.nombre) + '</h3><p class="font-playfair text-xl font-bold text-espresso mt-1">' + money(p.precio) + '</p></div><button type="button" data-tog="' + p.id + '" class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold space-x-1.5 mt-1" style="background:' + (disp ? '#EBF4EC' : '#FCEBEA') + ';color:' + (disp ? '#4A7C59' : '#B85C54') + '" title="Clic para cambiar"><span class="w-1.5 h-1.5 rounded-full mr-1.5" style="background:' + (disp ? '#4A7C59' : '#B85C54') + '"></span><span>' + (disp ? 'Disponible' : 'Agotado') + '</span></button></div></div><div class="grid grid-cols-2 gap-3 pt-2"><button type="button" data-edit="' + p.id + '" class="py-2.5 rounded-xl border border-borderBeige bg-white text-xs font-medium text-espresso hover:bg-cremaVainilla/50 transition-colors shadow-sm text-center">Editar</button><button type="button" data-del="' + p.id + '" class="py-2.5 rounded-xl bg-espresso text-cremaVainilla text-xs font-medium hover:bg-cafeTostado transition-colors shadow-sm text-center">Eliminar</button></div></div>';
      }).join('') || '<p class="text-sm text-cafeTostado/70">Sin productos en esta categoría.</p>';
    }
    var editId = null; var btnAdd = form.querySelector('button[type=submit] span');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombre = ins[0].value.trim(), precio = parseFloat(ins[1].value.replace(/[^0-9.]/g, ''));
      if (!nombre || !(precio > 0)) return toast('Escribe un nombre y un precio válido', false);
      var m = MenuStore.all();
      if (editId) { m.forEach(function (x) { if (x.id === editId) { x.nombre = nombre; x.precio = precio; x.cat = sel.value; } }); toast('Producto actualizado'); editId = null; btnAdd.textContent = 'Agregar'; }
      else { m.push({ id: 'x' + Date.now(), cat: sel.value, nombre: nombre, precio: precio, disp: true }); toast('Producto agregado'); }
      MenuStore.save(m); cat = sel.value; ins[0].value = ''; ins[1].value = ''; pintarTabs(); render();
    });
    cards.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; var m = MenuStore.all();
      if (b.dataset.tog) { m.forEach(function (x) { if (x.id === b.dataset.tog) x.disp = !x.disp; }); MenuStore.save(m); render(); }
      else if (b.dataset.del) { if (confirm('¿Eliminar este producto?')) { MenuStore.save(m.filter(function (x) { return x.id !== b.dataset.del; })); render(); } }
      else if (b.dataset.edit) { var p = m.filter(function (x) { return x.id === b.dataset.edit; })[0]; ins[0].value = p.nombre; ins[1].value = p.precio; sel.value = p.cat; editId = p.id; btnAdd.textContent = 'Guardar'; ins[0].focus(); }
    });
    tabs.addEventListener('click', function (e) { var a = e.target.closest('a[data-c]'); if (!a) return; e.preventDefault(); cat = a.dataset.c; pintarTabs(); render(); });
    document.querySelector('input[placeholder="Buscar producto"]').addEventListener('input', function (e) { q = e.target.value.trim().toLowerCase(); render(); });
    pintarTabs(); render();
  };

  Pages.horarioadmin = function () { Auth.require('admin', 'iniciosesionadmin.html'); };

  /* ---------- arranque ---------- */
  window.DSEA = { Auth: Auth, Cart: Cart, Orders: Orders, Menu: MenuStore, money: money, toast: toast,
    reset: function () { Object.keys(K).forEach(function (k) { localStorage.removeItem(K[k]); }); location.reload(); } };

  document.addEventListener('DOMContentLoaded', function () {
    var page = document.body.getAttribute('data-page');
    try { if (page && Pages[page.split(':')[0]]) Pages[page.split(':')[0]](page.split(':')[1]); } catch (e) { console.error('DSEA', page, e); }
    patchHeader();
    try { initBuscador(); } catch (e) { console.error('DSEA buscador', e); }
  });
})();
