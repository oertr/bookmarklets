function addHideScrollbarClass(target: Element | null) {
  if (target == null) return;
  target.classList.add("hide-scroll-bar");
  addHideScrollbarClass(target.parentElement);
}

function removeHideScrollbarClass(target: Element | null) {
  if (target == null) return;
  target.classList.remove("hide-scroll-bar");
  removeHideScrollbarClass(target.parentElement);
}

export default class Popup {
  root;
  isOpen;

  constructor(root: HTMLElement) {
    this.root = root;
    this.isOpen = false;
    this.root.classList.add("popup--close");
  }

  open() {
    this.root.classList.replace("popup--close", "popup--open");
    addHideScrollbarClass(this.root.parentElement);
    this.isOpen = true;
  }

  close() {
    this.root.classList.replace("popup--open", "popup--close");
    removeHideScrollbarClass(this.root.parentElement);
    this.isOpen = false;
  }
}
