import { hatena, alertMsg } from "utility";

const openEntryPage = (url: string) => window.open(hatena.getEntryPage(url));
const handleError = (url: string, error: Error) => {
  openEntryPage(url);
  throw error;
};
const main = async (url: string) => {
  const entry = await hatena
    .fetchBookmark(url)
    .catch((e: Error) => handleError(url, e));

  if (entry == null || entry.count === 0) {
    alertMsg("ブックマークはありません");
    return;
  }

  const comments = await hatena
    .bookmarkComments(entry)
    .catch((e: Error) => handleError(url, e));

  let msg = `はてブ数:${entry.count}\n`;

  for (const { comment, star } of comments.sort((a, b) => b.star - a.star)) {
    msg += star ? `★${star} ` : "- ";
    msg += comment + "\n";
  }
  alertMsg(msg);
};

function createHatenaWidget(url: string, className = "") {
  const countImg = `https://b.hatena.ne.jp/entry/image/${url.replace(
    /#/g,
    encodeURIComponent("#")
  )}`;
  const style = "text-decoration: none;filter: contrast(120%) grayscale(100%);";

  return `<a href="${hatena.getEntryPage(url)}"
    class="${className}" target="_blank"
    data-url="${url}"
    style="${style}">
      <img src="${countImg}">
  </a>`;
}

function embedHatenaWidget(
  [...linkList]: HTMLCollectionOf<HTMLAnchorElement>,
  widgetClass = "_hatenaCounter"
) {
  const datasetName = "embededAnchor";

  linkList = linkList
    .filter((e) => false === datasetName in e.dataset)
    .filter((e) => false === e.classList.contains(widgetClass));

  for (const a of linkList) {
    a.insertAdjacentHTML(
      "beforebegin",
      createHatenaWidget(a.href, widgetClass)
    );
    a.dataset[datasetName] = "";
  }
}

function attachClickListener(
  className: string,
  callback: (target: HTMLAnchorElement) => void
) {
  const enum mouseButton {
    left,
  }
  const target = document.getElementsByClassName(
    className
  ) as HTMLCollectionOf<HTMLAnchorElement>;
  const callbackWrap = (event: MouseEvent) => {
    if (
      event.button !== mouseButton.left &&
      event.ctrlKey &&
      event.shiftKey &&
      event.metaKey
    )
      return;

    event.preventDefault();
    event.stopPropagation();

    callback(event.currentTarget as HTMLAnchorElement);
  };

  for (let i = 0; i < target.length; ++i) {
    const e = target[i];

    if (e.onclick) continue;

    e.onclick = callbackWrap;
  }
}

const anchors = document.getElementsByTagName("a");
const className = "_hatenaCounter";

embedHatenaWidget(anchors, className);
attachClickListener(className, (target) => {
  if (typeof target.dataset.url === "string") {
    main(target.dataset.url).catch(() => {
      /* do nothing */
    });
  }
});
