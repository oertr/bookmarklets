import { randomSuffix } from "./utility";

type Noop = () => void;
type Callback = (res: unknown) => void;

interface Options {
  callbackName?: string;
  callbackFuncName?: string;
  timeout?: number;
}

interface Jsonp {
  [index: string]: Callback | Noop;
}

declare let window: Window & Jsonp;

export function jsonp(url: string, options: Options = {}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const {
      callbackName = "callback",
      callbackFuncName = randomSuffix("_jsonp"),
      timeout = 8000,
    } = options;

    const urlWithCallback = `${url}&${callbackName}=${callbackFuncName}`;
    const script = document.createElement("script");

    window[callbackFuncName] = (res: unknown) => {
      clearTimeout(timeId);
      resolve(res);
    };

    script.src = urlWithCallback;
    script.addEventListener("error", () => {
      clearTimeout(timeId);
      reject(new Error(`JSONP Request to ${urlWithCallback} fail`));
    });

    const timeId = setTimeout(() => {
      window[callbackFuncName] = () => {
        /* do nothing */
      };
      reject(new Error(`JSONP Request to ${urlWithCallback} timed out`));
    }, timeout);

    document.body.appendChild(script);
  });
}
