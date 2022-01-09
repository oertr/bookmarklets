interface ImageSize {
  width: number;
  height: number;
}
interface Image extends ImageSize {
  src: string;
}
type ImageInfo = Image;

function getImgImages(img: HTMLImageElement): string[] {
  const result: string[] = [];
  const otherSrcAttr = ["data-src"];

  if (img.src !== "") result.push(img.src);

  for (const attr of otherSrcAttr) {
    const value = img.getAttribute(attr);
    if (value) result.push(value);
  }

  return result;
}

function getBackgroundImages(elem: Element): string[] {
  const matchValue = /url\(["']?(.+?)["']?\)/g;
  const bg = window.getComputedStyle(elem, "").backgroundImage;
  const result: string[] = [];

  for (const [, url] of bg.matchAll(matchValue)) {
    result.push(url);
  }

  return result;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed loading "${src}"`));
    img.src = src;
  });
}

async function getImageSize(src: string): Promise<ImageSize> {
  const { naturalWidth, naturalHeight } = await loadImage(src);

  return { width: naturalWidth, height: naturalHeight };
}

async function makeImageInfo(url: string): Promise<ImageInfo> {
  return {
    src: url,
    ...(await getImageSize(url)),
  };
}

async function imageCollector(parent: Element): Promise<ImageInfo[]> {
  const srcList = new Set<string>();
  const elements = Array.from(parent.getElementsByTagName("*"));

  for (const elem of elements) {
    if (elem instanceof HTMLImageElement) {
      getImgImages(elem).forEach((src) => srcList.add(src));
    } else {
      getBackgroundImages(elem).forEach((src) => srcList.add(src));
    }
  }

  const imageInfo = [...srcList].map((src) => makeImageInfo(src));

  return Promise.allSettled(imageInfo).then((values) => {
    const results = [];
    for (const value of values) {
      if (value.status == "rejected") {
        console.error(value.reason);
      } else {
        results.push(value.value);
      }
    }
    return results;
  });
}

export { imageCollector };
export { ImageInfo };
