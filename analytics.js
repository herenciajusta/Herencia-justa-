(() => {
  const measurementId = 'G-2D3SYFCWEC'; // ID del flujo web de herenciajustaec.com.
  if (location.hostname !== 'herenciajustaec.com' || !/^G-[A-Z0-9]+$/.test(measurementId)) return;

  const preferenceKey = 'hj-analytics-consent';
  const disableKey = `ga-disable-${measurementId}`;
  const settings = document.getElementById('analytics-preferences');
  let preference;
  let notice;
  let analyticsStarted = false;

  try {
    preference = localStorage.getItem(preferenceKey);
  } catch {
    // The visitor can still choose for this page if storage is unavailable.
  }

  function gtag() {
    window.dataLayer.push(arguments);
  }

  function trackSocialClick(event) {
    if (!(event.target instanceof Element) || event.button !== (event.type === 'auxclick' ? 1 : 0)) return;
    const link = event.target.closest('a[data-analytics-event]');
    if (link) gtag('event', link.dataset.analyticsEvent);
  }

  function startAnalytics() {
    if (analyticsStarted) return;
    analyticsStarted = true;

    const path = location.pathname === '/index.html' ? '/' : location.pathname;
    const pageLocation = `${location.origin}${path}`;
    const pageReferrer = document.referrer ? new URL(document.referrer).origin : '';

    window.dataLayer = window.dataLayer || [];
    window.gtag = gtag;
    gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    gtag('js', new Date());
    gtag('config', measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: pageLocation,
      page_referrer: pageReferrer
    });
    gtag('event', 'page_view');

    document.addEventListener('click', trackSocialClick, true);
    document.addEventListener('auxclick', trackSocialClick, true);

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.referrerPolicy = 'no-referrer';
    document.head.append(script);
  }

  function updatePreference() {
    if (preference === 'granted') {
      startAnalytics();
    } else if (analyticsStarted) {
      window[disableKey] = true;
      for (const name of ['_ga', `_ga_${measurementId.slice(2)}`]) {
        document.cookie = `${name}=; Max-Age=0; Path=/`;
        document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${location.hostname}`;
      }
      location.reload();
    }

    if (notice && (preference === 'granted' || preference === 'denied')) notice.remove();
    if (settings) {
      const status = settings.querySelector('[role="status"]');
      status.textContent = preference === 'granted'
        ? 'Medición activada.'
        : 'Medición desactivada.';
    }
  }

  const actions = document.createElement('div');
  actions.className = 'analytics-actions';
  actions.innerHTML = `
    <button type="button" data-analytics-choice="granted">Aceptar medición</button>
    <button type="button" data-analytics-choice="denied">Rechazar medición</button>
  `;
  actions.addEventListener('click', (event) => {
    const choice = event.target.dataset.analyticsChoice;
    if (!choice) return;
    preference = choice;
    try {
      localStorage.setItem(preferenceKey, preference);
    } catch {
      // Apply the choice even when it cannot be saved for future pages.
    }
    updatePreference();
  });

  if (settings) {
    settings.hidden = false;
    settings.append(actions);
  } else if (preference !== 'granted' && preference !== 'denied') {
    notice = document.createElement('section');
    notice.className = 'analytics-notice';
    notice.setAttribute('aria-label', 'Preferencias de medición');
    notice.innerHTML = `
      <p>Con tu permiso, usamos Google Analytics para medir visitas y clics en WhatsApp e Instagram.
      <a href="/legal.html#cookies">Política de privacidad</a></p>
    `;
    notice.append(actions);
    document.body.append(notice);
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== preferenceKey) return;
    preference = event.newValue;
    updatePreference();
  });
  updatePreference();
})();
