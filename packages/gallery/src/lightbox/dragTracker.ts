interface TrackerCallback {
  start: (x: number, y: number, event: PointerEvent) => boolean;
  move: (x: number, y: number, event: PointerEvent) => void;
  stop: (x: number, y: number, event: PointerEvent) => void;
}

function getClient(event: MouseEvent) {
  return { x: event.clientX, y: event.clientY };
}

export class DragTracker {
  readonly target;
  private startHandler: (event: PointerEvent) => any;
  private moveHandler: (event: PointerEvent) => any;
  private stopHandler: (event: PointerEvent) => any;

  constructor(target: HTMLElement, { start, move, stop }: TrackerCallback) {
    let rafPending = false;
    let lastMousePos = { x: 0, y: 0 };

    this.target = target;
    this.stopHandler = (event: PointerEvent) => {
      event.preventDefault();

      const mousePos = getClient(event);
      stop(mousePos.x - lastMousePos.x, mousePos.y - lastMousePos.y, event);

      rafPending = false;
      lastMousePos = { x: 0, y: 0 };
      this.target.removeEventListener("pointermove", this.moveHandler);
      this.target.removeEventListener("pointerup", this.stopHandler);
      this.target.releasePointerCapture(event.pointerId);
    };
    this.moveHandler = (event: PointerEvent) => {
      event.preventDefault();

      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        if (!rafPending) return;

        const mousePos = getClient(event);
        move(mousePos.x - lastMousePos.x, mousePos.y - lastMousePos.y, event);
        rafPending = false;
      });
    };
    this.startHandler = (event: PointerEvent) => {
      event.preventDefault();
      if (event.button !== 0) return;

      if (start(lastMousePos.x, lastMousePos.y, event) == false) return;

      lastMousePos = getClient(event);
      this.target.addEventListener("pointermove", this.moveHandler);
      this.target.addEventListener("pointerup", this.stopHandler);
      this.target.setPointerCapture(event.pointerId);
    };

    this.target.addEventListener("pointerdown", this.startHandler, {
      passive: false,
    });
  }

  destroy() {
    this.target.removeEventListener("pointerdown", this.startHandler);
  }
}
