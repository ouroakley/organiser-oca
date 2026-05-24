/**
 * Decap CMS preview template for the `events` collection — mirrors Our Oakley
 * Hugo event single layout (see main/layouts/events/single.html).
 */
(function () {
  var CMS = window.CMS;
  var h = window.h;
  var createClass = window.createClass;
  if (!CMS || !h || !createClass) {
    console.warn('OCA event preview: Decap CMS globals (CMS, h, createClass) not found.');
    return;
  }

  function normalizeList(val) {
    if (!val) return [];
    if (typeof val.toArray === 'function') return val.toArray();
    if (Array.isArray(val)) return val;
    return [];
  }

  function posterSrc(getAsset, posterPath) {
    if (!posterPath || !getAsset) return '';
    try {
      var asset = getAsset(posterPath);
      if (!asset) return '';
      if (typeof asset === 'string') return asset;
      if (asset.url) return asset.url;
      if (typeof asset.toString === 'function') return String(asset);
    } catch (e) {
      return '';
    }
    return '';
  }

  function parseDate(iso) {
    if (!iso) return null;
    var d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }

  /** Match Hugo: treat local midnight as “no time” for display. */
  function isAllDayLocal(d) {
    return (
      d.getHours() === 0 &&
      d.getMinutes() === 0 &&
      d.getSeconds() === 0 &&
      d.getMilliseconds() === 0
    );
  }

  function sameCalendarDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function formatLongDate(d, withTime) {
    var opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (withTime) {
      return d.toLocaleString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    return d.toLocaleDateString(undefined, opts);
  }

  function formatTimeOnly(d) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  function formatEventDateLine(startIso, endIso) {
    var start = parseDate(startIso);
    if (!start) return '';
    var startAllDay = isAllDayLocal(start);
    var startStr = formatLongDate(start, !startAllDay);

    var end = parseDate(endIso);
    if (!end) return startStr;

    var endAllDay = isAllDayLocal(end);

    if (sameCalendarDay(start, end)) {
      if (!endAllDay) {
        return startStr + ' – ' + formatTimeOnly(end);
      }
      return startStr;
    }

    var endStr = formatLongDate(end, !endAllDay);
    return startStr + ' – ' + endStr;
  }

  function venueSlugLabel(raw) {
    return String(raw == null ? '' : raw).trim();
  }

  function normKeyVenue(s) {
    return String(s == null ? '' : s)
      .trim()
      .toLowerCase();
  }

  function venueHref(slug) {
    return '/venues/' + slug.replace(/\s+/g, '-').toLowerCase();
  }

  /** Public site JSON (same slugs as event front matter). */
  var VENUES_JSON_URL = 'https://www.ouroakley.uk/venues/index.json';
  var ORGANISERS_JSON_URL = 'https://www.ouroakley.uk/organisers/index.json';

  /**
   * Keep in sync with main/hugo.yaml: `permalinks.events` and the organiser module mount
   * target `content/events/oca/` (path segment under `events`).
   */
  var SITE_ORIGIN = 'https://www.ouroakley.uk';
  var EVENTS_MOUNT_SLUG = 'oca';

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  /** @returns {{y:number,m:number,d:number}|null} */
  function parseYmdParts(dateVal) {
    if (dateVal == null || dateVal === '') return null;
    var s = String(dateVal);
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      return { y: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) };
    }
    var d = parseDate(dateVal);
    if (!d) return null;
    return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
  }

  function leafSlugFromEntry(entry) {
    if (!entry || typeof entry.get !== 'function') return '';
    var slug = entry.get('slug');
    if (slug == null || slug === '') return '';
    var parts = String(slug).split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : '';
  }

  function buildLiveEventUrl(entry) {
    var ymd = parseYmdParts(entry.getIn(['data', 'date']));
    var leaf = leafSlugFromEntry(entry);
    if (!ymd || !leaf) return '';
    var path =
      '/events/' +
      EVENTS_MOUNT_SLUG +
      '/' +
      ymd.y +
      '/' +
      pad2(ymd.m) +
      '/' +
      pad2(ymd.d) +
      '/' +
      leaf +
      '/';
    return SITE_ORIGIN + path;
  }

  var EventPreview = createClass({
    getInitialState: function () {
      return { venueTitles: {}, organiserTitles: {}, lookupLoaded: false };
    },

    componentDidMount: function () {
      this.loadSiteTitleLookups();
    },

    loadSiteTitleLookups: function () {
      var self = this;
      Promise.all([
        fetch(VENUES_JSON_URL).then(function (r) {
          if (!r.ok) throw new Error('venues JSON ' + r.status);
          return r.json();
        }),
        fetch(ORGANISERS_JSON_URL).then(function (r) {
          if (!r.ok) throw new Error('organisers JSON ' + r.status);
          return r.json();
        }),
      ])
        .then(function (pair) {
          var venueTitles = {};
          (pair[0] || []).forEach(function (row) {
            if (!row || !row.title) return;
            var slug =
              row.slug != null && row.slug !== '' ? normKeyVenue(row.slug) : normKeyVenue(row.title);
            if (slug) venueTitles[slug] = row.title;
          });
          var organiserTitles = {};
          (pair[1] || []).forEach(function (row) {
            if (!row || !row.title) return;
            var key =
              row.slug != null && row.slug !== ''
                ? normKeyVenue(row.slug)
                : normKeyVenue(row.baseName);
            if (key) organiserTitles[key] = row.title;
          });
          self.setState({ venueTitles: venueTitles, organiserTitles: organiserTitles, lookupLoaded: true });
        })
        .catch(function () {
          self.setState({ lookupLoaded: true });
        });
    },

    venueDisplay: function (raw) {
      var slug = normKeyVenue(venueSlugLabel(raw));
      var map = this.state.venueTitles || {};
      return (slug && map[slug]) || venueSlugLabel(raw);
    },

    organiserDisplay: function (raw) {
      var slug = normKeyVenue(venueSlugLabel(raw));
      var map = this.state.organiserTitles || {};
      return (slug && map[slug]) || venueSlugLabel(raw);
    },

    render: function () {
      var props = this.props;
      var entry = props.entry;
      var getAsset = props.getAsset;
      var widgetFor = props.widgetFor;

      var title = entry.getIn(['data', 'title']) || '';
      var posterPath = entry.getIn(['data', 'poster']);
      var poster = posterSrc(getAsset, posterPath);
      var eventDates = entry.getIn(['data', 'eventDates']);
      var venues = normalizeList(entry.getIn(['data', 'venues']));
      var organisers = normalizeList(entry.getIn(['data', 'organisers']));

      var dateLines = [];
      if (eventDates && eventDates.forEach) {
        eventDates.forEach(function (row) {
          if (!row) return;
          var start = row.get ? row.get('start') : row.start;
          var end = row.get ? row.get('end') : row.end;
          var line = formatEventDateLine(start, end);
          if (line) dateLines.push(line);
        });
      }

      var liveUrl = buildLiveEventUrl(entry);

      var permalinkBanner = h(
        'div',
        { className: 'oca-event-preview__permalink' },
        liveUrl
          ? h(
              'div',
              { className: 'oca-event-preview__permalink-inner' },
              h(
                'p',
                { className: 'oca-event-preview__permalink-label' },
                'Live URL mirrors main ',
                h('code', { className: 'oca-event-preview__code' }, 'permalinks.events'),
                ' (',
                h('code', { className: 'oca-event-preview__code' }, '/:sections/:year/:month/:day/:slug/'),
                '); here ',
                h('code', { className: 'oca-event-preview__code' }, 'sections'),
                ' is ',
                h('code', { className: 'oca-event-preview__code' }, 'events/' + EVENTS_MOUNT_SLUG),
                ', using the ',
                h('code', { className: 'oca-event-preview__code' }, 'date'),
                ' field and the entry folder slug.'
              ),
              h('a', {
                href: liveUrl,
                className: 'oca-event-preview__permalink-link',
                target: '_blank',
                rel: 'noopener noreferrer',
              }, liveUrl)
            )
          : h(
              'p',
              { className: 'oca-event-preview__permalink-muted' },
              'Live URL preview needs the ',
              h('code', { className: 'oca-event-preview__code' }, 'date'),
              ' field and a saved entry path (folder slug) so ',
              h('code', { className: 'oca-event-preview__code' }, '/events/' + EVENTS_MOUNT_SLUG + '/…'),
              ' can be built.'
            )
      );

      return h(
        'div',
        { className: 'oca-event-preview' },
        permalinkBanner,
        h('h1', { className: 'oca-event-preview__title' }, title),
        h(
          'div',
          { className: 'oca-event-preview__grid' },
          h(
            'div',
            { className: 'oca-event-preview__main' },
            h(
              'div',
              { className: 'oca-event-preview__card' },
              h(
                'div',
                { className: 'oca-event-preview__section' },
                h('h2', { className: 'oca-event-preview__h2' }, h('span', { className: 'oca-event-preview__icon' }, '📅'), 'When'),
                h(
                  'ul',
                  { className: 'oca-event-preview__list' },
                  dateLines.length
                    ? dateLines.map(function (line, i) {
                        return h('li', { key: i, className: 'oca-event-preview__li' }, line);
                      })
                    : h('li', { className: 'oca-event-preview__muted' }, 'No event dates yet')
                )
              ),
              venues.length
                ? h(
                    'div',
                    { className: 'oca-event-preview__section' },
                    h('h2', { className: 'oca-event-preview__h2' }, h('span', { className: 'oca-event-preview__icon' }, '📍'), 'Where'),
                    h(
                      'ul',
                      { className: 'oca-event-preview__list' },
                      venues.map(function (v, i) {
                        var label = venueSlugLabel(v);
                        return h(
                          'li',
                          { key: i, className: 'oca-event-preview__li' },
                          h(
                            'a',
                            { href: venueHref(label), className: 'oca-event-preview__link' },
                            this.venueDisplay(v)
                          )
                        );
                      }, this)
                    )
                  )
                : null,
              organisers.length
                ? h(
                    'div',
                    { className: 'oca-event-preview__section' },
                    h('h2', { className: 'oca-event-preview__h2' }, h('span', { className: 'oca-event-preview__icon' }, '👥'), 'Organised by'),
                    h(
                      'ul',
                      { className: 'oca-event-preview__list' },
                      organisers.map(function (o, i) {
                        return h('li', { key: i, className: 'oca-event-preview__li' }, this.organiserDisplay(o));
                      }, this)
                    )
                  )
                : null
            ),
            poster
              ? h(
                  'div',
                  { className: 'oca-event-preview__poster oca-event-preview__poster--mobile' },
                  h('img', {
                    src: poster,
                    alt: title ? 'Event poster for ' + title : 'Event poster',
                    className: 'oca-event-preview__poster-img',
                  })
                )
              : null,
            h('div', { className: 'oca-event-preview__body' }, widgetFor('body'))
          ),
          h(
            'aside',
            { className: 'oca-event-preview__aside' },
            poster
              ? h(
                  'div',
                  { className: 'oca-event-preview__poster oca-event-preview__poster--desktop' },
                  h('img', {
                    src: poster,
                    alt: title ? 'Event poster for ' + title : 'Event poster',
                    className: 'oca-event-preview__poster-img',
                  })
                )
              : null
          )
        )
      );
    },
  });

  CMS.registerPreviewTemplate('events', EventPreview);

  var base = '';
  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].src || '';
    if (/preview-events\.js(\?|$)/.test(src)) {
      base = src.replace(/preview-events\.js(\?.*)?$/, '');
      break;
    }
  }
  if (base) {
    CMS.registerPreviewStyle(base + 'preview-events.css');
  }
})();
