import { hatena, alertMsg, getCanonicalURL } from "utility";

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

main(getCanonicalURL() || location.href).catch(() => {
  /* do nothing */
});
