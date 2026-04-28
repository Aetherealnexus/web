// meta-inject.js
// Parse a top-of-file YAML-like HTML comment block and inject OG/Twitter meta tags into <head>.
(function(){
  try {
    // Find the first comment node in body or documentElement
    var walker = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT, null, false);
    var node = walker.nextNode();
    if (!node) return;
    var txt = node.nodeValue || '';
    if (!/\bmeta:\b/.test(txt)) return;

    var lines = txt.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    var meta = {};
    for (var i=0;i<lines.length;i++){
      var m = lines[i].match(/^([a-zA-Z0-9_\-]+)\s*:\s*"?([^"].*?)"?$/);
      if (m) meta[m[1].trim()] = m[2].trim();
    }

    var head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return;

    function addMeta(name, content, attrName){
      if (!content) return;
      var el = document.createElement('meta');
      el.setAttribute(attrName||'name', name);
      el.setAttribute('content', content);
      head.appendChild(el);
    }

    // Title
    if (meta.title) {
      document.title = meta.title;
      addMeta('og:title', meta.title, 'property');
      addMeta('twitter:title', meta.title);
    }
    if (meta.description) {
      addMeta('description', meta.description);
      addMeta('og:description', meta.description, 'property');
      addMeta('twitter:description', meta.description);
    }
    if (meta.image) {
      addMeta('og:image', meta.image, 'property');
      addMeta('twitter:image', meta.image);
    }
    if (meta.og_type) addMeta('og:type', meta.og_type, 'property');
    if (meta.twitter_card) addMeta('twitter:card', meta.twitter_card);

    // Some defaults
    if (!meta.twitter_card) addMeta('twitter:card', 'summary_large_image');
    if (!meta.og_type) addMeta('og:type', 'article', 'property');

  } catch (e) { console.warn('meta-inject error', e); }
})();
