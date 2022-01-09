import { imageCollector } from "./imageCollector";
import { throttle, on, $, $$ } from "utility";
import * as lb from "./lightbox/lightbox";
import * as fl from "./flexLayout";
import "./index.css";

type Image = { src: string; width: number; height: number };

// flex layout HTML
const flexLayoutHTML = (images: Image[]) => {
  let inner = "";
  for (let i = 0; i < images.length; ++i) {
    inner += `<li tabindex="${i}" class="${fl.cssClasses.ITEM}"><img src="${images[i].src}" class="${fl.cssClasses.IMAGE}" width="${images[i].width}" height="${images[i].height}"></li>`;
  }

  return `<ol class="${fl.cssClasses.CONTAINER}">${inner}</ol>`;
};

// lightbox HTML
const lightboxHTML = (srcList: string[]) => {
  let listInner = "";
  for (const src of srcList) {
    listInner += `<li class="lightbox__item"><figure class="lightbox__content"><img src="${src}" class="lightbox__image"/></figure></li>`;
  }

  return `<div class="lightbox">
<ul class="lightbox__list">${listInner}</ul>
<header class="lightbox__header"><button class="lightbox__button--close"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg></button></header>
<div class="lightbox__prev"><button class="lightbox__button--prev"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0V0z" fill="none" /><path  d="M14.71 6.71c-.39-.39-1.02-.39-1.41 0L8.71 11.3c-.39.39-.39 1.02 0 1.41l4.59 4.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L10.83 12l3.88-3.88c.39-.39.38-1.03 0-1.41z"/></svg></button></div>
<div class="lightbox__next"><button class="lightbox__button--next"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0V0z" fill="none" /><path d="M9.29 6.71c-.39.39-.39 1.02 0 1.41L13.17 12l-3.88 3.88c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l4.59-4.59c.39-.39.39-1.02 0-1.41L10.7 6.7c-.38-.38-1.02-.38-1.41.01z"/></svg></button></div>
</div>`;
};

function insertDOM(images: Image[]): HTMLElement {
  // Overlay
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.left = "0";
  overlay.style.right = "0";
  overlay.style.top = "0";
  overlay.style.bottom = "0";
  overlay.style.overflowY = "scroll";
  overlay.style.zIndex = "2147483647";
  overlay.style.background = "black";

  overlay.insertAdjacentHTML("afterbegin", flexLayoutHTML(images));
  overlay.insertAdjacentHTML(
    "afterbegin",
    lightboxHTML(images.map((img) => img.src))
  );

  document.body.appendChild(overlay);

  return overlay;
}

function onMoveMouse(
  callback: (event: MouseEvent) => any,
  option?: boolean | AddEventListenerOptions
) {
  document.addEventListener(
    "mousemove",
    throttle((event: MouseEvent): any => callback(event), 200),
    option
  );
}

function transferEvent(event: Event, element: Element) {
  const cloneEvent = new (event.constructor as typeof Event)(event.type, event);

  element.dispatchEvent(cloneEvent);
}

(async () => {
  const images = await imageCollector(document.body);

  // hide scrollbar
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";

  // set dom
  const insertedDOM = insertDOM(images);

  // initialize flex layout and lightbox
  new fl.FlexLayout(
    $<HTMLElement>(`.${fl.cssClasses.CONTAINER}`, insertedDOM)!
  );
  const lightbox = new lb.Lightbox(
    $<HTMLElement>(`.${lb.cssClasses.CONTAINER}`, insertedDOM)!
  );

  // attach event listener for lightbox
  let timer: number;
  const lightboxNavs = $$<HTMLElement>(
    `.${lb.cssClasses.PREV},.${lb.cssClasses.NEXT}`,
    insertedDOM
  );
  const header = $(`.${lb.cssClasses.HEADER}`, insertedDOM)!;
  const list = $<HTMLElement>(`.${lb.cssClasses.LIST}`, insertedDOM)!;
  onMoveMouse(
    () => {
      header.classList.remove("hide-header");
      clearTimeout(timer);
      timer = setTimeout(() => {
        header.classList.add("hide-header");
      }, 3000);
    },
    { passive: true }
  );
  lightboxNavs.forEach((nav) =>
    on(nav, "wheel", (event) => transferEvent(event, list))
  );

  // attach event listener for flex layout
  const openLightbox = (event: MouseEvent): any => {
    if (!(event.currentTarget instanceof HTMLElement)) return;
    lightbox.show(event.currentTarget.tabIndex);
  };
  $$<HTMLElement>(`.${fl.cssClasses.ITEM}`, insertedDOM).forEach((item) =>
    on(item, "click", openLightbox, { passive: true })
  );
})().catch(() => {
  /* do noting*/
});
