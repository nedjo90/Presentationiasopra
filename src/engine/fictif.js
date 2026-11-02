// Les placeholders « [FICTIF] » du content.json sont rendus comme un petit badge
// discret (lisible pour le présentateur en répétition, sans casser la mise en page).
const MARK = '[FICTIF]';

function markNode(node) {
  const text = node.nodeValue;
  if (!text || !text.includes(MARK) || !node.parentNode) return;
  const frag = document.createDocumentFragment();
  text.split(MARK).forEach((part, i) => {
    if (i > 0) {
      const b = document.createElement('span');
      b.className = 'fictif';
      b.textContent = 'fictif';
      frag.appendChild(b);
    }
    if (part) frag.appendChild(document.createTextNode(i > 0 ? part.replace(/^\s/, '') : part));
  });
  node.parentNode.replaceChild(frag, node);
}

function walk(root) {
  if (root.nodeType === Node.TEXT_NODE) return markNode(root);
  const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (it.nextNode()) if (it.currentNode.nodeValue.includes(MARK)) nodes.push(it.currentNode);
  nodes.forEach(markNode);
}

export function watchFictif(root) {
  walk(root);
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') markNode(m.target);
      else m.addedNodes.forEach((n) => walk(n));
    }
  }).observe(root, { childList: true, subtree: true, characterData: true });
}
