(() => {
  'use strict';
  const form = document.getElementById('demo-form');
  if (!form) return;
  const t = text => window.siteI18n.t(text);
  const rows = document.getElementById('demo-rows');
  const feedback = document.getElementById('demo-feedback');
  const search = document.getElementById('demo-search');
  const filter = document.getElementById('demo-filter');
  const statuses = {new:'Yeni', active:'İşlemde', done:'Tamamlandı'};
  const seed = () => [
    {id:1001,customer:'A',amount:7500,status:'new'},
    {id:1002,customer:'B',amount:9000,status:'active'},
    {id:1003,customer:'C',amount:2250,status:'done'}
  ];
  let orders = seed(), nextId = 1004, message = '';
  rows.setAttribute('data-no-translate','');
  const money = amount => new Intl.NumberFormat(window.siteI18n.language === 'en' ? 'en-GB' : 'tr-TR', {style:'currency',currency:'TRY'}).format(amount);
  const customer = code => t('Örnek İşletme ' + code);
  function render() {
    document.getElementById('demo-total').textContent = orders.length;
    document.getElementById('demo-active').textContent = orders.filter(order => order.status !== 'done').length;
    document.getElementById('demo-amount').textContent = money(orders.reduce((sum, order) => sum + order.amount,0));
    const query = search.value.trim().toLocaleLowerCase(window.siteI18n.language);
    const visible = orders.filter(order => (filter.value === 'all' || filter.value === order.status) &&
      (`DEMO-${order.id} ${customer(order.customer)}`).toLocaleLowerCase(window.siteI18n.language).includes(query));
    rows.replaceChildren();
    visible.forEach(order => {
      const row = document.createElement('tr');
      for (const text of [`DEMO-${order.id}`,customer(order.customer),money(order.amount)]) {
        const cell = document.createElement('td'); cell.textContent = text; row.append(cell);
      }
      const cell = document.createElement('td'), select = document.createElement('select');
      select.setAttribute('aria-label', `DEMO-${order.id}: ${t('Durum')}`);
      Object.entries(statuses).forEach(([value,label]) => {
        const option = document.createElement('option'); option.value = value; option.textContent = t(label); select.append(option);
      });
      select.value = order.status;
      select.addEventListener('change', () => {order.status = select.value; message = 'Sipariş durumu güncellendi.'; render();});
      cell.append(select); row.append(cell); rows.append(row);
    });
    if (!visible.length) {
      const cell = document.createElement('td'), row = document.createElement('tr');
      cell.colSpan = 4; cell.textContent = t('Bu filtreye uygun örnek sipariş yok.'); row.append(cell); rows.append(row);
    }
    feedback.textContent = message ? t(message) : '';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const amount = Number(document.getElementById('demo-price').value);
    const selected = document.getElementById('demo-customer').value;
    if (!form.reportValidity() || !Number.isFinite(amount) || amount <= 0 || amount > 1000000 || !['A','B','C'].includes(selected)) return;
    if (orders.length >= 50) {message = 'Demo en fazla 50 sipariş içerir. Örnek verileri sıfırlayabilirsiniz.'; render(); return;}
    orders.unshift({id:nextId++,customer:selected,amount:Math.round(amount*100)/100,status:'new'});
    search.value = ''; filter.value = 'all'; message = 'Örnek sipariş eklendi.'; render();
  });
  document.getElementById('demo-reset').addEventListener('click', () => {
    orders = seed(); nextId = 1004; form.reset(); search.value = ''; filter.value = 'all'; message = 'Örnek veriler sıfırlandı.'; render();
  });
  search.addEventListener('input', render); filter.addEventListener('change', render);
  document.addEventListener('languagechange',render);
  render();
})();
