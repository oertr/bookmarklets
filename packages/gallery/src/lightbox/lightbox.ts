import Popup from "./popup";
import { clamp, on } from "utility";
import { DragTracker } from "./dragTracker";
import { Zoomable } from "./zoomable";

type Coords = { x: number; y: number };
interface LightboxTypes {
  CONTAINER: HTMLElement;
  LIST: HTMLUListElement;
  ITEM: HTMLLIElement;
  IMAGE: HTMLImageElement;
  CONTENT: HTMLElement;
  CLOSE: HTMLButtonElement;
  PREV: HTMLDivElement;
  NEXT: HTMLDivElement;
  SELECTEDITEM: HTMLLIElement;
  HEADER: HTMLElement;
}

const cssClasses: Record<keyof LightboxTypes, string> = {
  CONTAINER: "lightbox",
  LIST: "lightbox__list",
  ITEM: "lightbox__item",
  IMAGE: "lightbox__image",
  CONTENT: "lightbox__content",
  CLOSE: "lightbox__button--close",
  PREV: "lightbox__prev",
  NEXT: "lightbox__next",
  SELECTEDITEM: "selected",
  HEADER: "lightbox__header",
};

function $<T extends keyof typeof cssClasses>(
  root: Element,
  type: T
): LightboxTypes[T] {
  return root.getElementsByClassName(cssClasses[type])[0] as LightboxTypes[T];
}

function $$<T extends keyof typeof cssClasses>(
  root: Element,
  type: T
): LightboxTypes[T][] {
  return Array.from(
    root.getElementsByClassName(cssClasses[type])
  ) as LightboxTypes[T][];
}

function getItemImage(item: LightboxTypes["ITEM"]): LightboxTypes["IMAGE"] {
  return $(item, "IMAGE");
}

function hide(elem: Element) {
  elem.classList.add("hide");
}

function visible(elem: Element) {
  elem.classList.remove("hide");
}

function isSelectItemFirst(
  list: LightboxTypes["LIST"],
  selected: LightboxTypes["SELECTEDITEM"]
): boolean {
  return list.firstElementChild == selected ? true : false;
}

function isSelectItemLast(
  list: LightboxTypes["LIST"],
  selected: LightboxTypes["SELECTEDITEM"]
): boolean {
  return list.lastElementChild == selected ? true : false;
}

function changeOrigin(origin: Coords, points: Coords) {
  return { x: points.x - origin.x, y: points.y - origin.y };
}

function onAnimationEnd(
  element: HTMLElement,
  callback: (event: AnimationEvent) => any
) {
  element.addEventListener("animationend", callback, { once: true });
}

function onTransitionEnd(
  element: HTMLElement,
  callback: (event: TransitionEvent) => any
) {
  element.addEventListener("transitionend", callback, { once: true });
}

function toward(list: LightboxTypes["LIST"], direction: "prev" | "next") {
  const selected = $(list, "SELECTEDITEM");
  let nextItem: null | HTMLLIElement;
  let slideinClass: string;
  let slideoutClass: string;

  if (direction == "prev") {
    nextItem = selected.previousElementSibling as HTMLLIElement;
    slideinClass = "slidein-left";
    slideoutClass = "slideout-right";
  } else {
    nextItem = selected.nextElementSibling as HTMLLIElement;
    slideinClass = "slidein-right";
    slideoutClass = "slideout-left";
  }
  if (nextItem == null) return;

  selected.classList.remove("selected");
  nextItem.classList.add("selected");

  // Set Animation
  const nextItemImage = getItemImage(nextItem);
  selected.classList.add(slideoutClass);
  nextItem.classList.add(slideinClass);
  onAnimationEnd(selected, () =>
    selected.classList.remove("slideout-left", "slideout-right")
  );
  onAnimationEnd(nextItem, () =>
    nextItem?.classList.remove("slidein-left", "slidein-right")
  );
  setPhotoframeSize(
    list,
    nextItemImage.clientWidth,
    nextItemImage.clientHeight
  );
}

function setPhotoframeSize(
  list: LightboxTypes["LIST"],
  width: number,
  height: number
) {
  list.style.setProperty("--width", `${width}px`);
  list.style.setProperty("--height", `${height}px`);
}

class Lightbox {
  readonly root;
  readonly list;
  readonly item;
  private selectedItem: LightboxTypes["SELECTEDITEM"] | null;
  private zoomable: Zoomable | null;
  private isZooming;
  private popup;

  constructor(root: HTMLElement) {
    this.root = root;
    this.item = $$<"ITEM">(root, "ITEM");
    this.list = $<"LIST">(root, "LIST");
    this.selectedItem = null;
    this.popup = new Popup(root);
    this.isZooming = false;
    this.zoomable = null;

    const prev = $(this.root, "PREV");
    const next = $(this.root, "NEXT");
    const slideTo = (direction: "prev" | "next") => {
      if (this.isZooming) return;

      toward(this.list, direction);
      this.selectedItem = $(this.root, "SELECTEDITEM");
      this.zoomable?.destroy();
      this.zoomable = new Zoomable(this.selectedItem);

      visible(prev);
      visible(next);
      if (isSelectItemFirst(this.list, this.selectedItem)) hide(prev);
      if (isSelectItemLast(this.list, this.selectedItem)) hide(next);
    };
    const wheelHandler = (event: WheelEvent) => {
      event.preventDefault();
      if (!this.zoomable) return;
      this.isZooming = true;

      const scale = clamp(this.zoomable.scale + event.deltaY * -0.001, 1, 4);
      if (scale === 1) {
        this.zoomable.zoom(1, 0, 0);
        this.isZooming = false;
        visible(prev);
        visible(next);
        onTransitionEnd(this.zoomable.element, () => {
          if (this.zoomable?.scale == 1)
            this.list.classList.remove("disable-clip");
        });
      } else {
        const { x, y } = changeOrigin(
          {
            x: this.zoomable.element.offsetLeft + this.zoomable.x,
            y: this.zoomable.element.offsetTop + this.zoomable.y,
          },
          {
            x: event.clientX,
            y: event.clientY,
          }
        );

        this.zoomable.zoom(scale, x, y);
        this.isZooming = true;
        hide(prev);
        hide(next);
        this.list.classList.add("disable-clip");
      }
    };

    on(prev, "click", () => slideTo("prev"));
    on(next, "click", () => slideTo("next"));
    on($(root, "CLOSE"), "click", () => this.hide());
    on(this.list, "wheel", wheelHandler);
    document.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowLeft":
          slideTo("prev");
          break;
        case "ArrowRight":
          slideTo("next");
          break;
        case "Escape":
          this.hide();
          break;
      }
    });

    let startZoomablePos: Coords;
    new DragTracker(this.list, {
      start: (x: number, y: number, event: PointerEvent) => {
        if (this.isZooming && this.zoomable) {
          startZoomablePos = { x: this.zoomable.x, y: this.zoomable.y };
          return true;
        } else {
          return false;
        }
      },
      move: (x: number, y: number, event: PointerEvent) => {
        if (!this.isZooming || !this.zoomable) return;

        this.zoomable.move(x + startZoomablePos.x, y + startZoomablePos.y);
      },
      stop: (x: number, y: number, event: PointerEvent) => {
        /* do nothing */
      },
    });
  }

  show(index: number) {
    this.selectedItem = this.item[index];
    this.selectedItem.classList.add("selected");
    this.zoomable = new Zoomable(this.selectedItem);

    const selectedImage = getItemImage(this.selectedItem);
    setPhotoframeSize(
      this.list,
      selectedImage.clientWidth,
      selectedImage.clientHeight
    );

    if (isSelectItemFirst(this.list, this.selectedItem))
      hide($(this.root, "PREV"));
    if (isSelectItemLast(this.list, this.selectedItem))
      hide($(this.root, "NEXT"));

    this.popup.open();
  }

  hide() {
    this.popup.close();
    this.isZooming = false;
    this.zoomable?.destroy();
    this.zoomable = null;
    this.selectedItem?.classList.remove("selected");
    this.selectedItem = null;

    // reset hide class and clip-path style
    this.list.style.removeProperty("--width");
    this.list.style.removeProperty("--height");
    visible($(this.root, "PREV"));
    visible($(this.root, "NEXT"));
  }
}

export { Lightbox, cssClasses };
