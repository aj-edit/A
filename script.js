(() => {
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const year = document.querySelector('[data-year]');

  if (year) year.textContent = new Date().getFullYear();

  const updateHeader = () =>
    header?.classList.toggle('is-scrolled', window.scrollY > 24);

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    nav?.classList.toggle('is-open', !open);
  });

  nav?.querySelectorAll('a').forEach((link) =>
    link.addEventListener('click', () => {
      menuButton?.setAttribute('aria-expanded', 'false');
      nav?.classList.remove('is-open');
    })
  );

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((element) => element.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -40px' }
    );
    reveals.forEach((element) => observer.observe(element));
  }

  const tilt = document.querySelector('[data-tilt]');
  if (tilt && !reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    tilt.addEventListener('pointermove', (event) => {
      const rect = tilt.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      tilt.style.transform =
        `perspective(950px) rotateX(${y * -2.5}deg) ` +
        `rotateY(${x * 3}deg) translateY(-2px)`;
    });
    tilt.addEventListener('pointerleave', () => {
      tilt.style.transform = '';
    });
  }

  const tabs = [...document.querySelectorAll('[data-work-tab]')];
  const panels = [...document.querySelectorAll('[data-work-panel]')];

  tabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      const target = tab.dataset.workTab;
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });
      panels.forEach((panel) =>
        panel.classList.toggle('is-active', panel.dataset.workPanel === target)
      );
    })
  );

  const amount = document.querySelector('[data-budget-amount]');
  const currency = document.querySelector('[data-currency]');
  const preview = document.querySelector('[data-currency-preview]');

  const fallbackRates = {
    INR: 1, USD: 83, GBP: 106, EUR: 90,
    AED: 22.6, CAD: 61, AUD: 55, SGD: 62, JPY: 0.56
  };

  const rateCache = { INR: 1 };
  let conversionTimer;

  const inrFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });

  async function rateToINR(code) {
    if (rateCache[code]) return rateCache[code];

    try {
      const response = await fetch(
        `https://api.frankfurter.dev/v2/rate/${code}/INR`,
        { cache: 'force-cache' }
      );
      if (!response.ok) throw new Error('Rate unavailable');

      const data = await response.json();
      const rate = Number(data.rate);

      if (rate) {
        rateCache[code] = rate;
        return rate;
      }
    } catch (error) {
      // The fallback keeps the form useful when offline.
    }

    return fallbackRates[code] || 1;
  }

  async function updateConversion() {
    const value = Number(amount?.value || 0);
    const code = currency?.value || 'INR';

    if (!preview) return;

    if (!value) {
      preview.textContent =
        'Enter a budget to see an approximate INR conversion.';
      return;
    }

    preview.textContent = 'Calculating approximate conversion…';
    const rate = await rateToINR(code);

    preview.textContent =
      code === 'INR'
        ? `Budget preview: ${inrFormatter.format(value)}`
        : `Approximate INR value: ${inrFormatter.format(value * rate)} · reference estimate`;
  }

  [amount, currency].forEach((element) =>
    element?.addEventListener('input', () => {
      clearTimeout(conversionTimer);
      conversionTimer = setTimeout(updateConversion, 350);
    })
  );

  const bookingForm = document.querySelector('[data-booking-form]');

  bookingForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const form = new FormData(bookingForm);
    const budget = form.get('budgetAmount')
      ? `${form.get('budgetAmount')} ${form.get('currency')}`
      : 'Not specified';

    const countryCode =
      form.get('countryCode') === 'other' ? '' : form.get('countryCode');

    const message = [
      'Hello Ajay, I want to discuss a project.',
      '',
      `Name: ${form.get('name') || ''}`,
      `Email: ${form.get('email') || 'Not provided'}`,
      `Phone: ${countryCode || ''} ${form.get('phone') || ''}`,
      `Service: ${form.get('service') || ''}`,
      `Timeline: ${form.get('timeline') || ''}`,
      `Budget: ${budget}`,
      `Project details: ${form.get('details') || ''}`,
      '',
      'Sent from AJAY NXT portfolio.'
    ].join('\n');

    window.open(
      `https://wa.me/919929562585?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  });

  document.querySelectorAll('[data-play-video]').forEach((button) => {
    button.addEventListener('click', () => {
      const video = button.closest('.portfolio-video-card')?.querySelector('video');
      if (!video) return;
      video.play();
      video.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

})();
