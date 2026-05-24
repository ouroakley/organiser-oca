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

  function venueHref(slug) {
    return '/venues/' + slug.replace(/\s+/g, '-').toLowerCase();
  }

  var EventPreview = createClass({
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

      return h(
        'div',
        { className: 'oca-event-preview' },
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
                          h('a', { href: venueHref(label), className: 'oca-event-preview__link' }, label)
                        );
                      })
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
                        return h('li', { key: i, className: 'oca-event-preview__li' }, venueSlugLabel(o));
                      })
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
