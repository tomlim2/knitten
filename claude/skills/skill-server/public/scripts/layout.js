(async function () {
  try {
    var res = await fetch('/api/config');
    var config = await res.json();
    var pathname = window.location.pathname;

    // Determine active state
    var exactMatch = config.nav.some(function (item) {
      return item.href === pathname;
    });
    var isSkillSubPage = !exactMatch && pathname.startsWith('/skills/');

    // Render header
    var header = document.getElementById('site-header');
    if (header) {
      header.innerHTML =
        '<a href="/" class="logo">' + config.title + '</a>' +
        '<nav class="nav">' +
        config.nav.map(function (item) {
          var active = '';
          if (item.href === pathname) {
            active = ' class="active"';
          } else if (isSkillSubPage && item.href === '/') {
            active = ' class="active"';
          }
          return '<a href="' + item.href + '"' + active + '>' + item.label + '</a>';
        }).join('') +
        '</nav>';

      // Add breadcrumb for skill sub-pages
      if (isSkillSubPage) {
        var skillName = pathname.replace('/skills/', '');
        var breadcrumb = document.createElement('div');
        breadcrumb.className = 'breadcrumb';
        breadcrumb.innerHTML =
          '<a href="/">Skills</a>' +
          '<span class="breadcrumb-sep">/</span>' +
          '<span class="breadcrumb-current">' + skillName + '</span>';
        header.after(breadcrumb);
      }
    }

    // Render footer
    var footer = document.getElementById('site-footer');
    if (footer) {
      footer.innerHTML =
        '<div class="footer-content">' +
        '<span class="footer-copyright">' + config.copyright + '</span>' +
        '<span class="footer-version">v' + config.version + '</span>' +
        '</div>';
    }
  } catch (e) {
    console.error('Failed to load layout config:', e);
  }
})();
