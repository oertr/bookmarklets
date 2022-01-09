export class Zoomable {
  readonly element;
  private _x;
  private _y;
  private _scale;

  get x(): number {
    return this._x;
  }
  set x(value: number) {
    this._x = value;
    this.element.style.setProperty("--x", `${this._x}px`);
  }

  get y(): number {
    return this._y;
  }
  set y(value: number) {
    this._y = value;
    this.element.style.setProperty("--y", `${this._y}px`);
  }

  get scale(): number {
    return this._scale;
  }
  set scale(value: number) {
    this._scale = value;
    this.element.style.setProperty("--scale", String(this._scale));
  }

  constructor(element: HTMLElement) {
    this.element = element;
    this._scale = 1;
    this._x = 0;
    this._y = 0;
    this.element.classList.add("zoomable");
  }

  zoom(scale: number, x: number, y: number) {
    if (scale === this.scale) return;

    this.element.classList.add("zooming");
    this.element.addEventListener("transitionend", () =>
      this.element.classList.remove("zooming")
    );

    if (scale === 1) {
      this.x = 0;
      this.y = 0;
    } else {
      const diffrentScale = scale / this.scale;
      const scaledOrigin = {
        x: diffrentScale * x,
        y: diffrentScale * y,
      };
      const diffOrigin = {
        x: scaledOrigin.x - x,
        y: scaledOrigin.y - y,
      };

      this.x -= diffOrigin.x;
      this.y -= diffOrigin.y;
    }
    this.scale = scale;
  }

  move(x: number, y: number) {
    this.element.classList.remove("zooming");
    this.x = x;
    this.y = y;
  }

  destroy() {
    this.element.classList.remove("zoomable");
    this.element.style.removeProperty("--scale");
    this.element.style.removeProperty("--x");
    this.element.style.removeProperty("--y");
  }
}
