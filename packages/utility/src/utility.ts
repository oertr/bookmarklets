export function alertMsg(msg: string) {
  const ALERT_MAX_LENGTH = 2000;

  if (msg.length >= ALERT_MAX_LENGTH) {
    msg = msg.slice(0, ALERT_MAX_LENGTH - 3) + "...";
  }

  window.alert(msg);
}

export function randomSuffix(base: string): string {
  return `${base}${Math.floor(Math.random() * 100000)}`;
}

export function chunk<T>(array: T[], size = 1): T[][] {
  size = Math.max(size, 0);

  let index = 0;
  let resultIndex = 0;
  const length = array.length;
  const result = Array<T[]>(Math.ceil(length / size));

  while (index < length) {
    result[resultIndex++] = array.slice(index, (index += size));
  }

  return result;
}

export function joinParameter(url: string, params: string): string {
  switch (url[url.length - 1]) {
    case "/":
      return `${url}?${params}`;
    case "&":
      return `${url}&${params}`;
    case "?":
    default:
      return `${url}${params}`;
  }
}

export function preconnect(url: string) {
  const hint = document.createElement("link");
  hint.rel = "preconnect";
  hint.href = url;
  document.head.appendChild(hint);
}

export function getCanonicalURL(): string | null {
  const canonicals = document.querySelectorAll<HTMLLinkElement>(
    "link[rel='canonical']"
  );

  return canonicals.length == 1 ? canonicals[0].href : null;
}

export function buildTemplate(id: string): DocumentFragment | null {
  const template = document.getElementById(id) as HTMLTemplateElement | null;

  if (template === null) return null;

  const clone = document.importNode(template.content, true);

  return clone;
}

export function isOutOfRange(array: any[], index: number): boolean {
  return index < 0 || array.length <= index;
}

export function throttle<T extends (...args: any) => any>(
  func: T,
  wait = 0
): (this: ThisParameterType<T>, ...args: Parameters<T>) => void {
  let lastCalledTime = performance.now();
  let called = false;
  let now: number;

  return function (this: ThisParameterType<T>, ...args): any {
    now = performance.now();

    if (now - lastCalledTime >= wait || called !== true) {
      lastCalledTime = now;
      called = true;

      return func.apply(this, args);
    }
  };
}

export function on<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  listener: (this: HTMLElement | Document, ev: HTMLElementEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): void {
  target.addEventListener(type, listener, options);
}

export function clamp(x: number, min: number, max: number): number {
  return Math.min(Math.max(min, x), max);
}

export function $<T extends Element>(
  selector: string,
  startElement: Element | Document = document
) {
  return startElement.querySelector<T>(selector);
}

export function $$<T extends Element>(
  selector: string,
  startElement: Element | Document = document
) {
  return Array.from(startElement.querySelectorAll<T>(selector));
}
