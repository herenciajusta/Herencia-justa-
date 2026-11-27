(() => {
  const navigation = document.querySelector('.site-navigation');
  const menuButton = navigation.querySelector('.menu-button');
  const menu = document.getElementById(menuButton.getAttribute('aria-controls'));
  const compactNavigation = matchMedia('(max-width: 980px)');

  navigation.dataset.collapsible = '';
  const setMenu = (open) => menuButton.setAttribute('aria-expanded', String(open));
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') === 'false'));
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  navigation.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuButton.focus();
    }
  });
  compactNavigation.addEventListener('change', () => setMenu(false));

  function revealLinkedDetails() {
    const target = document.getElementById(location.hash.slice(1));
    const details = target?.closest('details');
    if (details && !details.open) {
      details.open = true;
      target.scrollIntoView({block: 'start'});
    }
  }

  revealLinkedDetails();
  window.addEventListener('hashchange', revealLinkedDetails);

  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    for (const link of document.querySelectorAll('[data-ig-mobile]')) {
      link.href = link.dataset.igMobile;
    }
  }

  const dates = new Intl.DateTimeFormat('es-EC', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
  });

  function text(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function articleText(value) {
    return text(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function webUrl(value) {
    if (!text(value)) return null;
    try {
      const url = new URL(value.trim(), location.href);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
    } catch {
      return null;
    }
  }

  function item(tag, className, label) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = label;
    return element;
  }

  function storyCard(record, news) {
    const card = item('article', 'story-card', '');
    const category = text(record.categoria) || (news ? 'Noticia' : 'Crónica Ciudadana');
    const imageUrl = webUrl(record.imagen);
    if (imageUrl) {
      const image = item('img', 'story-visual', '');
      image.src = imageUrl.href;
      image.alt = '';
      image.loading = 'lazy';
      card.append(image);
    } else {
      card.append(item('p', 'story-visual story-visual--empty', category));
    }

    const content = item('div', 'story-content', '');
    if (imageUrl) content.append(item('p', 'kicker', category));
    content.append(item('h3', '', text(record.titulo)));

    const date = new Date(text(record.fecha));
    const meta = [
      text(record.autor) || text(record.fuente),
      Number.isNaN(date.valueOf()) ? '' : dates.format(date)
    ].filter(Boolean);
    if (meta.length) content.append(item('p', 'story-meta', meta.join(' · ')));

    const full = articleText(record.contenido || record.bajada);
    const excerpt = articleText(record.resumen) || (full.length > 190 ? full.slice(0, 190).trimEnd() + '…' : full);
    if (excerpt) content.append(item('p', '', excerpt));
    if (full && full !== excerpt) {
      const details = item('details', 'disclosure', '');
      details.append(item('summary', '', 'Leer más'), item('p', '', full));
      content.append(details);
    }

    const rawLink = text(record.url || record.pdf);
    const destination = webUrl(news && /^[\w-]+(?:\.[\w-]+)+(?:\/|$)/.test(rawLink) ? 'https://' + rawLink : rawLink);
    if (destination) {
      const label = news ? 'Ir a la fuente' : (record.pdf && !record.url ? 'Leer artículo' : 'Leer el resumen');
      const link = item('a', 'text-link', label);
      link.href = destination.href;
      if (destination.origin !== location.origin || destination.pathname.endsWith('.pdf')) {
        link.target = '_blank';
        link.rel = news ? 'noopener noreferrer nofollow' : 'noopener noreferrer';
      }
      content.append(link);
    }

    card.append(content);
    return card;
  }

  function searchable(value) {
    return value.toLocaleLowerCase('es').normalize('NFD').replace(/\p{Diacritic}/gu, '');
  }

  async function loadStories(container) {
    const news = container.dataset.editorial === 'news';
    const search = document.getElementById('busqueda');
    const category = document.getElementById('categoria-select');

    try {
      const response = await fetch(news ? '/noticias.json' : '/articulos.json', {cache: 'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Formato editorial inesperado');
      const records = data.filter((record) => text(record?.titulo));

      function render() {
        const term = searchable(search?.value.trim() || '');
        const filtered = records.filter((record) => {
          const matchesCategory = !category?.value || record.categoria === category.value;
          const fields = [record.titulo, record.autor, record.categoria, record.resumen, record.contenido].map(articleText);
          return matchesCategory && searchable(fields.join(' ')).includes(term);
        });
        const visible = container.dataset.limit ? filtered.slice(0, Number(container.dataset.limit)) : filtered;
        container.replaceChildren(...visible.map((record) => storyCard(record, news)));
        if (!visible.length) {
          const message = news ? 'Aún no hay noticias publicadas.' : 'No se encontraron artículos.';
          container.append(item('p', 'story-note', message));
        }
      }

      if (category) {
        for (const value of new Set(records.map((record) => text(record.categoria)).filter(Boolean))) {
          category.add(new Option(value, value));
        }
        category.addEventListener('change', render);
      }
      search?.addEventListener('input', render);
      render();
    } catch {
      const message = news ? 'No pudimos cargar las noticias por ahora.' : 'No pudimos cargar los artículos por ahora.';
      container.replaceChildren(item('p', 'story-note', message));
    }
  }

  document.querySelectorAll('[data-editorial]').forEach(loadStories);

  if (document.getElementById('portada-titulo') && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
})();
