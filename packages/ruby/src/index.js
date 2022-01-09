// @ts-nocheck
function insertStyle(css) {
  const style = document.createElement("style");

  style.textContent = css;

  document.head.appendChild(style);
}

function withRubyHTML(text) {
  return text.replace(/\w+['’-]*\w*/g, (word) => {
    if (word.length == 1 || IGNORED_WORD.includes(word.toLowerCase())) {
      return word;
    } else {
      return `<span data-original="${word}" class="translate">${word}<span></span></span>`;
    }
  });
}

function replaceInnerHTML(outerHTML, newInnerHTML) {
  return outerHTML.replace(/(<.+?>).+(<\/.+>)/, "$1" + newInnerHTML + "$2");
}

function rubyInnerHTML(element) {
  if ("" === element.textContent.trim()) return element.innerHTML;

  let innerHTML = "";

  for (let node of element.childNodes) {
    if ("#text" === node.nodeName) {
      innerHTML += withRubyHTML(node.textContent);
    } else if ("#comment" !== node.nodeName) {
      // node is Element
      innerHTML += replaceInnerHTML(node.outerHTML, rubyInnerHTML(node));
    }
  }
  return innerHTML;
}

function removeChildren(parent) {
  while (parent.firstChild) parent.removeChild(parent.firstChild);
}

function observeText(target, callback) {
  let observer = new MutationObserver((mutations, observe) => {
    mutations.forEach((m) => callback(m, observe));
  });

  observer.observe(target, {
    characterData: true,
    characterDataOldValue: true,
    subtree: true,
  });

  return observer;
}

function onTranslate(originalText, translatedText) {
  document
    .querySelectorAll(`[data-original="${originalText}"]`)
    .forEach((elem) => {
      if (originalText !== translatedText) {
        elem.dataset.ruby = translatedText;
        elem.textContent = originalText;
      }

      elem.classList.remove("translate");
    });
}

const IGNORED_WORD = [
  "i",
  "we",
  "you",
  "they",
  "be",
  "been",
  "it",
  "do",
  "am",
  "is",
  "are",
  "a",
  "an",
  "the",
  "can",
  "this",
];
const attachRubyTag = ["p", "a", "h1", "h2", "h3", "h4", "h5", "li", "td"];
const css = `
  span[data-ruby] {
    position: relative;
    white-space: nowrap;
  }
  span[data-ruby]::before {
    content: attr(data-ruby);
    position: absolute;
    line-height: 100%;
    text-align: center;
    left: -3em;
    right: -3em;
    transform-origin: bottom center;
    font-weight:300;
    bottom: 1.2em;
    /* ルビの文字サイズを親文字に対する比率で指定 */
    transform: scale(0.6);
  }`;

insertStyle(css);

document.querySelectorAll(attachRubyTag.join(",")).forEach((e) => {
  let html = rubyInnerHTML(e);

  e.classList.add("notranslate");
  e.style.lineHeight = "2em";

  removeChildren(e);
  e.insertAdjacentHTML("afterbegin", html);

  observeText(e, (mutation) => {
    const original = mutation.oldValue;
    const translated = mutation.target.data;

    onTranslate(original, translated);
  });
});
