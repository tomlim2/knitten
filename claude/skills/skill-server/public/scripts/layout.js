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
      var navLinks = config.nav.map(function (item) {
        var active = '';
        if (item.href === pathname) {
          active = ' class="active"';
        } else if (isSkillSubPage && item.href === '/') {
          active = ' class="active"';
        }
        var html = '<a href="' + item.href + '"' + active + '>' + item.label + '</a>';

        // Insert sub-page indicator right after Skills link
        if (isSkillSubPage && item.href === '/') {
          var skillName = pathname.replace('/skills/', '');
          html += '<span class="nav-sub"><span class="nav-sub-sep">/</span>' + skillName + '</span>';
        }

        return html;
      }).join('');

      header.innerHTML =
        '<a href="/" class="logo">' + config.title + '</a>' +
        '<nav class="nav">' + navLinks + '</nav>';
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
