// ==UserScript==
// @name         Auto CHS→CHT (Taiwan)
// @name:zh-TW   自動繁體化（台灣）
// @version      1.0.5
// @description  Automatically detects Simplified Chinese pages and converts to Traditional Chinese (Taiwan) using opencc-js s2twp.
// @description:zh-TW  自動偵測簡體中文網頁，使用 opencc-js s2twp 轉換為台灣繁體中文。
// @author       ethanics
// @match        *://*/*
// @grant        unsafeWindow
// @require      https://cdn.jsdelivr.net/npm/opencc-js@1.4.1/dist/umd/full.js
// @downloadURL  https://raw.githubusercontent.com/ethanics/auto-chs-to-cht/refs/heads/main/auto-chs-to-cht.user.js
// @updateURL    https://raw.githubusercontent.com/ethanics/auto-chs-to-cht/refs/heads/main/auto-chs-to-cht.user.js
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  function getOpenCC() {
    if (
      typeof OpenCC !== 'undefined' &&
      OpenCC &&
      typeof OpenCC.Converter === 'function'
    ) {
      return OpenCC;
    }

    const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    const pageOpenCC = pageWindow ? pageWindow.OpenCC : null;
    if (pageOpenCC && typeof pageOpenCC.Converter === 'function') {
      return pageOpenCC;
    }

    return null;
  }

  let converter = null;

  function detectLang(langStr) {
    if (!langStr || typeof langStr !== 'string') {
      return null;
    }
    const lang = langStr.trim().toLowerCase();
    if (lang === '') {
      return null;
    }

    if (
      lang === 'zh-cn' ||
      lang === 'zh-hans' ||
      lang === 'zh-sg' ||
      lang.startsWith('zh-hans-') ||
      lang.startsWith('zh-cn-') ||
      lang.startsWith('zh-sg-')
    ) {
      return true;
    }

    if (
      lang === 'zh-tw' ||
      lang === 'zh-hant' ||
      lang === 'zh-hk' ||
      lang === 'zh-mo' ||
      lang.startsWith('zh-hant-') ||
      lang.startsWith('zh-tw-') ||
      lang.startsWith('zh-hk-') ||
      lang.startsWith('zh-mo-')
    ) {
      return false;
    }

    return null;
  }

  function checkStep1Lang() {
    const htmlLang = document.documentElement ? document.documentElement.lang : '';
    const htmlResult = detectLang(htmlLang);
    if (htmlResult !== null) {
      return htmlResult;
    }

    const metaTag = document.querySelector('meta[http-equiv="Content-Language"], meta[http-equiv="content-language"]');
    if (metaTag && metaTag.content) {
      const metaResult = detectLang(metaTag.content);
      if (metaResult !== null) {
        return metaResult;
      }
    }

    return null;
  }

  const cjkRegex = /[\u4e00-\u9fff]/;

  function isSimplifiedChinese(text) {
    if (typeof text !== 'string') {
      return false;
    }
    return cjkRegex.test(text);
  }

  const SKIP_TAGS = new Set([
    'script',
    'style',
    'noscript',
    'code',
    'pre',
    'kbd',
    'samp',
    'var',
    'math',
    'svg',
    'input',
    'textarea',
  ]);

  function shouldSkipElement(element) {
    if (!element) {
      return true;
    }
    if (element.isContentEditable) {
      return true;
    }
    const tag = element.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) {
      return true;
    }
    if (element.closest('script, style, noscript, code, pre, kbd, samp, var, math, svg, input, textarea')) {
      return true;
    }
    return false;
  }

  const CONVERT_ATTRS = ['placeholder', 'alt', 'title', 'aria-label'];

  function convertAttribute(element, attr) {
    if (!element || shouldSkipElement(element) || CONVERT_ATTRS.indexOf(attr) === -1) {
      return;
    }
    const val = element.getAttribute(attr);
    if (!val || !isSimplifiedChinese(val)) {
      return;
    }
    const converted = converter(val);
    if (val !== converted) {
      element.setAttribute(attr, converted);
    }
  }

  function convertAttributes(root) {
    if (
      !root ||
      (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE)
    ) {
      return;
    }

    const selector = '[placeholder], [alt], [title], [aria-label]';
    const elements = [];

    if (root.matches && root.matches(selector)) {
      elements.push(root);
    }

    if (root.querySelectorAll) {
      const children = root.querySelectorAll(selector);
      for (let i = 0; i < children.length; i++) {
        elements.push(children[i]);
      }
    }

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (shouldSkipElement(el)) {
        continue;
      }
      for (let j = 0; j < CONVERT_ATTRS.length; j++) {
        convertAttribute(el, CONVERT_ATTRS[j]);
      }
    }
  }

  // OpenCC is idempotent, so changed nodes are reprocessed instead of tracking stale markers.
  function convertSingleTextNode(node) {
    const parent = node.parentElement;
    if (!parent) {
      return;
    }
    if (shouldSkipElement(parent)) {
      return;
    }
    if (node.nodeValue.trim() === '') {
      return;
    }

    const original = node.nodeValue;
    if (!isSimplifiedChinese(original)) {
      return;
    }
    const converted = converter(original);
    if (original !== converted) {
      node.nodeValue = converted;
    }
  }

  function convertSubtree(root) {
    if (
      !root ||
      (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE)
    ) {
      return;
    }

    if (root.nodeType === Node.ELEMENT_NODE && shouldSkipElement(root)) {
      return;
    }

    const textNodes = [];
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) {
            return NodeFilter.FILTER_REJECT;
          }
          if (shouldSkipElement(parent)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.nodeValue.trim() === '') {
            return NodeFilter.FILTER_SKIP;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
      textNodes.push(currentNode);
      currentNode = walker.nextNode();
    }

    for (let i = 0; i < textNodes.length; i++) {
      const textNode = textNodes[i];
      const original = textNode.nodeValue;
      if (!isSimplifiedChinese(original)) {
        continue;
      }
      const converted = converter(original);
      if (original !== converted) {
        textNode.nodeValue = converted;
      }
    }

    convertAttributes(root);
  }

  const observedRoots = new WeakSet();
  let dynamicObserver = null;
  let initialized = false;
  const startupObserver = new MutationObserver(main);

  function observeShadowRoots(root) {
    if (!root || !root.querySelectorAll) {
      return;
    }

    const elements = [];
    if (root.nodeType === Node.ELEMENT_NODE) {
      elements.push(root);
    }
    const descendants = root.querySelectorAll('*');
    for (let i = 0; i < descendants.length; i++) {
      elements.push(descendants[i]);
    }

    for (let i = 0; i < elements.length; i++) {
      const shadowRoot = elements[i].shadowRoot;
      if (shadowRoot && !observedRoots.has(shadowRoot)) {
        observeDynamicChanges(shadowRoot);
        convertSubtree(shadowRoot);
      }
    }
  }

  function observeDynamicChanges(root) {
    if (!root) {
      return;
    }

    if (!dynamicObserver) {
      dynamicObserver = new MutationObserver(function (mutations) {
        for (let i = 0; i < mutations.length; i++) {
          const mutation = mutations[i];
          if (mutation.type === 'attributes') {
            convertAttribute(mutation.target, mutation.attributeName);
            continue;
          }
          if (mutation.type === 'characterData') {
            convertSingleTextNode(mutation.target);
            continue;
          }
          const addedNodes = mutation.addedNodes;
          for (let j = 0; j < addedNodes.length; j++) {
            const node = addedNodes[j];
            if (node.nodeType === Node.ELEMENT_NODE) {
              convertSubtree(node);
              observeShadowRoots(node);
            } else if (node.nodeType === Node.TEXT_NODE) {
              convertSingleTextNode(node);
            }
          }
        }
      });
    }

    if (!observedRoots.has(root)) {
      dynamicObserver.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: CONVERT_ATTRS,
      });
      observedRoots.add(root);
    }

    observeShadowRoots(root);
  }

  function main() {
    if (initialized) {
      return;
    }

    const openCC = getOpenCC();
    if (!openCC || !openCC.Converter) {
      return;
    }

    const langResult = checkStep1Lang();
    if (langResult === false) {
      initialized = true;
      startupObserver.disconnect();
      return;
    }

    const bodyText = document.body ? document.body.innerText || '' : '';
    if (langResult !== true && !isSimplifiedChinese(bodyText)) {
      if (!bodyText) {
        return;
      }

      initialized = true;
      startupObserver.disconnect();
      return;
    }

    converter = openCC.Converter({ from: 'cn', to: 'twp' });
    initialized = true;
    startupObserver.disconnect();

    if (document.title) {
      const originalTitle = document.title;
      const convertedTitle = converter(originalTitle);
      if (originalTitle !== convertedTitle) {
        document.title = convertedTitle;
      }
    }

    if (document.body) {
      convertSubtree(document.body);
      observeDynamicChanges(document);
    }
  }

  startupObserver.observe(document, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  main();
})();
