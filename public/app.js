'use strict';

const form = document.querySelector('#search-form');
const district = document.querySelector('#district');
const item = document.querySelector('#item');
const summary = document.querySelector('#result-summary');
const list = document.querySelector('#result-list');
const empty = document.querySelector('#empty');
const emptyTitle = document.querySelector('#empty-title');
const emptyText = document.querySelector('#empty-text');
const reset = document.querySelector('#reset');
const demo = document.querySelector('#demo');
const searchError = document.querySelector('#search-error');
const submit = form.querySelector('button[type=submit]');
const endpoint = '/titik-pengumpulan';
let searchRequest;
let detailRequest;
let optionsReady = false;

const detail = document.querySelector('#detail');
const detailTitle = document.querySelector('#detail-title');
const detailType = document.querySelector('#detail-type');
const detailBody = document.querySelector('#detail-body');

const normalize = value => value.trim().toLocaleLowerCase('id-ID');
const label = value => value.replace(/(^|\s)\p{L}/gu, letter => letter.toLocaleUpperCase('id-ID'));

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content) node.textContent = content;
  return node;
}

function icon(name) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  node.setAttribute('class', 'icon');
  node.setAttribute('aria-hidden', 'true');
  node.setAttribute('fill', 'none');
  node.setAttribute('stroke', 'currentColor');
  node.setAttribute('stroke-width', '1.65');
  node.setAttribute('stroke-linecap', 'round');
  node.setAttribute('stroke-linejoin', 'round');
  const use = document.createElementNS(node.namespaceURI, 'use');
  use.setAttribute('href', '#' + name);
  node.append(use);
  return node;
}

function addOptions(select, values) {
  [...new Set(values)].sort((a, b) => a.localeCompare(b, 'id-ID')).forEach(value => {
    select.add(new Option(label(value), value));
  });
}

function itemTags(goods, match, limit = goods.length) {
  const tags = element('span', 'items');
  const ordered = match && goods.includes(match) ? [match, ...goods.filter(value => value !== match)] : goods;
  for (const value of ordered.slice(0, limit)) {
    tags.append(element('span', value === match ? 'item match' : 'item', label(value)));
  }
  if (goods.length > limit) {
    const count = goods.length - limit;
    const more = element('span', 'more-items', '+' + count);
    more.setAttribute('aria-label', count + ' barang lainnya');
    tags.append(more);
  }
  return tags;
}

function detailSection(heading, content) {
  const section = element('section', 'detail-section');
  section.append(element('h3', '', heading), content);
  return section;
}

function renderDetail(location, match) {
  detailTitle.textContent = location.nama;
  detailType.textContent = location.tipe === 'dropbox' ? 'Dropbox' : 'Pos pengumpulan';
  detailBody.replaceChildren(
    detailSection('Barang diterima', itemTags(location.barangDiterima, match)),
    detailSection('Alamat', element('p', '', location.alamat)),
    detailSection('Jam layanan', element('p', '', location.jamLayanan || 'Informasi jam layanan belum tersedia.'))
  );

  if (location.simulasi) {
    detailBody.append(detailSection('Data simulasi', element('p', '', 'Alamat dan layanan di atas adalah contoh untuk demo.')));
  } else if (location.sumberUrl || location.terakhirDicek) {
    const source = element('div');
    if (location.sumberUrl && /^https?:\/\//i.test(location.sumberUrl)) {
      const link = element('a', 'source-link', 'Buka sumber');
      link.href = location.sumberUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.append(icon('external'));
      source.append(link);
    }
    if (location.terakhirDicek) {
      const checked = new Date(location.terakhirDicek + 'T00:00:00Z');
      const date = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'UTC' }).format(checked);
      source.append(element('p', '', 'Dicek ' + date));
    }
    detailBody.append(detailSection('Sumber informasi', source));
  }
}

async function requestData(url, signal) {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const payload = await response.json();
  return payload.data;
}

async function openDetail(location, match) {
  detailRequest?.abort();
  const request = new AbortController();
  detailRequest = request;
  detailType.textContent = 'Detail lokasi';
  detailTitle.textContent = location.nama;
  const pending = element('p', 'detail-section', 'Memuat informasi lokasi…');
  pending.setAttribute('role', 'status');
  detailBody.replaceChildren(pending);
  detail.showModal();

  try {
    const data = await requestData(endpoint + '/' + encodeURIComponent(location._id), request.signal);
    if (!request.signal.aborted) {
      if (data.status !== 'aktif') {
        detailBody.replaceChildren(element('p', 'detail-section', 'Lokasi ini sudah nonaktif.'));
        return;
      }
      renderDetail(data, match);
    }
  } catch (error) {
    if (request.signal.aborted) return;
    const message = error.message === 'HTTP 404'
      ? 'Lokasi ini sudah tidak tersedia.'
      : 'Detail lokasi gagal dimuat. Tutup lalu buka kembali untuk mencoba lagi.';
    const notice = element('p', 'detail-section', message);
    notice.setAttribute('role', 'alert');
    detailBody.replaceChildren(notice);
  }
}

detail.addEventListener('close', () => detailRequest?.abort());

function createRow(location, match, showSimulation) {
  const row = element('li');
  const button = element('button', 'result-row');
  button.type = 'button';
  button.setAttribute('aria-haspopup', 'dialog');
  const box = location.tipe === 'dropbox';
  const badge = element('span', box ? 'place-icon dropbox' : 'place-icon');
  badge.append(icon(box ? 'box' : 'point'));
  const copy = element('span', 'place-copy');
  copy.append(
    element('span', 'place-name', location.nama),
    element('span', 'place-address', location.alamat)
  );
  if (showSimulation && location.simulasi) {
    copy.append(element('span', 'demo-inline', 'Data simulasi'));
  }
  const arrow = element('span', 'row-arrow');
  arrow.append(icon('arrow'));
  button.append(badge, copy, itemTags(location.barangDiterima, match, 3), arrow);
  button.addEventListener('click', () => openDetail(location, match));
  row.append(button);
  return row;
}

async function search({ refreshOptions = false } = {}) {
  searchRequest?.abort();
  const request = new AbortController();
  searchRequest = request;
  const selectedDistrict = normalize(district.value);
  const selectedItem = normalize(item.value);
  const filterSummary = [selectedDistrict, selectedItem].filter(Boolean).map(label);
  const params = new URLSearchParams({ status: 'aktif' });
  if (selectedDistrict) params.set('kecamatan', selectedDistrict);
  if (selectedItem) params.set('barang', selectedItem);

  submit.disabled = true;
  list.hidden = empty.hidden = demo.hidden = searchError.hidden = true;
  summary.textContent = 'Memuat lokasi…';

  try {
    const matches = await requestData(endpoint + '?' + params, request.signal);
    if (request.signal.aborted) return;
    if (refreshOptions || !optionsReady) {
      district.options.length = 1;
      item.options.length = 1;
      addOptions(district, matches.map(location => location.kecamatan));
      addOptions(item, matches.flatMap(location => location.barangDiterima));
      optionsReady = true;
    }

    const allSimulated = matches.length > 0 && matches.every(location => location.simulasi);
    summary.textContent = matches.length + ' lokasi' + (filterSummary.length ? ' · ' + filterSummary.join(' · ') : '');
    demo.hidden = !allSimulated;
    list.hidden = matches.length === 0;
    empty.hidden = matches.length > 0;
    emptyTitle.textContent = filterSummary.length ? 'Belum ada titik yang cocok' : 'Belum ada titik pengumpulan';
    emptyText.textContent = filterSummary.length ? 'Coba ganti kecamatan atau jenis barang.' : 'Daftar lokasi aktif masih kosong.';
    reset.hidden = filterSummary.length === 0;
    list.replaceChildren(...matches.map(location => createRow(location, selectedItem, !allSimulated)));
  } catch {
    if (request.signal.aborted) return;
    summary.textContent = '';
    searchError.hidden = false;
  } finally {
    if (searchRequest === request) submit.disabled = false;
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  search({ refreshOptions: !district.value && !item.value });
});
reset.addEventListener('click', () => {
  form.reset();
  search({ refreshOptions: true });
  district.focus();
});
search({ refreshOptions: true });
