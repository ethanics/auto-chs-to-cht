// ==UserScript==
// @name         Auto CHS→CHT (Taiwan)
// @name:zh-TW   自動繁體化（台灣）
// @version      1.0.0
// @description  Automatically detects Simplified Chinese pages and converts to Traditional Chinese (Taiwan) using opencc-js s2twp.
// @description:zh-TW  自動偵測簡體中文網頁，使用 opencc-js s2twp 轉換為台灣繁體中文。
// @author       ethanics
// @match        *://*/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/opencc-js@1.4.1/dist/umd/full.js
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  if (typeof OpenCC === 'undefined' || !OpenCC.Converter) {
    return;
  }

  const converter = OpenCC.Converter({ from: 'cn', to: 'twp' });

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

    if (!lang.startsWith('zh')) {
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

  function isSimplifiedChinese() {
    const step1Result = checkStep1Lang();
    if (step1Result !== null) {
      return step1Result;
    }

    const bodyText = document.body ? document.body.innerText || '' : '';
    const sample = bodyText.slice(0, 2000);

    let cjkCount = 0;
    for (let i = 0; i < sample.length; i++) {
      const code = sample.charCodeAt(i);
      if (code >= 0x4e00 && code <= 0x9fff) {
        cjkCount++;
      }
    }

    if (cjkCount < 50) {
      return false;
    }

    const converted = converter(sample);
    let cjkTotal = 0;
    let cjkDiff = 0;

    for (let i = 0; i < sample.length; i++) {
      const code = sample.charCodeAt(i);
      if (code >= 0x4e00 && code <= 0x9fff) {
        cjkTotal++;
        if (sample[i] !== converted[i]) {
          cjkDiff++;
        }
      }
    }

    const diffRatio = cjkTotal > 0 ? cjkDiff / cjkTotal : 0;
    if (diffRatio > 0.02) {
      return true;
    }

    return false;
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

  function convertAttributes(root) {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) {
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
        const attr = CONVERT_ATTRS[j];
        const val = el.getAttribute(attr);
        if (val) {
          const converted = converter(val);
          if (val !== converted) {
            el.setAttribute(attr, converted);
          }
        }
      }
    }
  }

  function convertSingleTextNode(node) {
    const parent = node.parentElement;
    if (!parent) {
      return;
    }
    if (parent.hasAttribute('data-chs-converted')) {
      return;
    }
    if (shouldSkipElement(parent)) {
      return;
    }
    if (node.nodeValue.trim() === '') {
      return;
    }

    const original = node.nodeValue;
    const converted = converter(original);
    if (original !== converted) {
      node.nodeValue = converted;
    }
    parent.setAttribute('data-chs-converted', '1');
  }

  function convertSubtree(root) {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    if (shouldSkipElement(root)) {
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
          if (parent.hasAttribute('data-chs-converted')) {
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
      const parent = textNode.parentElement;
      const original = textNode.nodeValue;
      const converted = converter(original);
      if (original !== converted) {
        textNode.nodeValue = converted;
      }
      if (parent) {
        parent.setAttribute('data-chs-converted', '1');
      }
    }

    convertAttributes(root);
  }

  function observeDynamicChanges() {
    if (!document.body) {
      return;
    }

    const observer = new MutationObserver(function (mutations) {
      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];
        if (mutation.type === 'childList') {
          const addedNodes = mutation.addedNodes;
          for (let j = 0; j < addedNodes.length; j++) {
            const node = addedNodes[j];
            if (node.nodeType === Node.ELEMENT_NODE) {
              convertSubtree(node);
            } else if (node.nodeType === Node.TEXT_NODE) {
              convertSingleTextNode(node);
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false,
    });
  }

  function main() {
    if (!isSimplifiedChinese()) {
      return;
    }

    if (document.title) {
      document.title = converter(document.title);
    }

    if (document.body) {
      convertSubtree(document.body);
      observeDynamicChanges();
    }
  }

  main();
})();
