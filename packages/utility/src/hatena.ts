import { jsonp } from "./jsonp";
import { chunk } from "./utility";

// https://b.hatena.ne.jp/entry/jsonlite
interface HatenaEntry {
  title: string;
  count: number;
  url: string;
  entry_url: string;
  screenshot: string;
  eid: string;
  bookmarks: User[];
}
interface User {
  user: string;
  tags: string[];
  timestamp: string;
  comment: string;
}

// https://s.hatena.com/entry.json
interface HatenaStar {
  entries: Entry[];
}
interface Entry {
  uri: string;
  stars: Stars;
  colored_stars?: ColoredStars[];
}
interface Star {
  name: string;
  quote: string;
}
interface ColoredStars {
  color: string;
  stars: Stars;
}

interface commentResponce {
  comment: string;
  star: number;
  url: string;
}
type Stars = Array<Star | number>;

type commentEntry = Map<string, { comment: string; star: number }>;

const HATENA_STAR = "https://s.hatena.com/entries.json";
const HATENA_ENTRY = "https://b.hatena.ne.jp/entry/jsonlite";

function commentUrl(entryId: string, user: User) {
  const timeString = user.timestamp.substring(0, 10).replace(/\//g, "");

  return `https://b.hatena.ne.jp/${user.user}/${timeString}#bookmark-${entryId}`;
}

function starCounter(stars: Stars): number {
  let count = 0;

  for (const star of stars) {
    if (typeof star == "number") {
      return star;
    } else {
      count += 1;
    }
  }

  return count;
}

function sumStarCounter(entry: Entry): number {
  let result = 0;

  result += starCounter(entry.stars);

  if (typeof entry.colored_stars !== "undefined") {
    result += entry.colored_stars.reduce((s, e) => s + starCounter(e.stars), 0);
  }
  return result;
}

export async function fetchBookmark(url: string): Promise<HatenaEntry | null> {
  const res = (await jsonp(
    `${HATENA_ENTRY}/?url=${encodeURIComponent(url)}`
  )) as HatenaEntry;

  return res;
}

export async function fetchStars(urls: string[]): Promise<HatenaStar> {
  const param = urls.map((url) => `uri=${encodeURIComponent(url)}`);
  const url = `${HATENA_STAR}/?${param.join("&")}`;
  const res = await fetch(url);

  return (await res.json()) as HatenaStar;
}

export async function bookmarkComments(
  entry: HatenaEntry
): Promise<commentResponce[]> {
  if (entry.count === 0) return [];

  const MAX_CONCURRENT = 6;
  const MAX_URL_PARAM = 100;
  const onlyComments = entry.bookmarks.filter((x) => x.comment !== "");
  const starAndComment: commentEntry = new Map();
  let urls: string[][];

  for (const user of onlyComments) {
    starAndComment.set(commentUrl(entry.eid, user), {
      comment: user.comment,
      star: 0,
    });
  }

  if (starAndComment.size > MAX_URL_PARAM) {
    urls = chunk(
      [...starAndComment.keys()],
      Math.ceil(starAndComment.size / MAX_CONCURRENT)
    );
  } else {
    urls = [[...starAndComment.keys()]];
  }

  const resList = await Promise.all(urls.map((url) => fetchStars(url)));
  const result: commentResponce[] = [];

  for (const entry of resList.flatMap((x) => x.entries)) {
    const item = starAndComment.get(entry.uri);

    if (typeof item === "object") {
      item.star = sumStarCounter(entry);
      starAndComment.set(entry.uri, item);
    }
  }

  for (const [key, value] of starAndComment.entries()) {
    result.push({
      url: key,
      comment: value.comment,
      star: value.star,
    });
  }

  return result;
}
export function getEntryPage(url: string) {
  const entryUrl = `https://b.hatena.ne.jp/entry/${url.replace(
    /#/g,
    encodeURIComponent("#")
  )}`;

  return entryUrl;
}
