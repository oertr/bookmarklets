type Size = {
  width: number;
  height: number;
};

const cssClasses = {
  CONTAINER: "flex-layout",
  ITEM: "flex-layout__item",
  IMAGE: "flex-layout__image",
};
const defaultOptions = {
  GAP: 2,
  IDEALHEIGHT: 220,
};

function aspectRatioOfImages(images: Size[]): number {
  return images.reduce((sum, x) => sum + x.width / x.height, 0);
}

function computeCost(images: Size[], width: number, idealHeight: number) {
  const height = width / aspectRatioOfImages(images);
  return (idealHeight - height) ** 2;
}

function computeOrder<T>(
  boxList: (T & Size)[],
  viewportWidth: number,
  idealHeight: number
): (T & Size)[][] {
  const root = 0;
  const startQueue = [root];
  const minDistance: { [index: number]: number } = {};
  const path: { [index: number]: number } = {};
  let dot = "";

  minDistance[root] = 0;

  while (startQueue.length) {
    const start = startQueue.shift()!;
    let startList: number[] = [boxList.length];

    if (start === boxList.length) continue;

    for (let i = start, currentWidth = 0; i < boxList.length; ++i) {
      currentWidth += Math.round(
        (boxList[i].width / boxList[i].height) * idealHeight
      );

      if (viewportWidth < currentWidth) {
        if (i == start) {
          startList = [i + 1];
        } else {
          startList = [i, i + 1];
        }
        break;
      }
    }

    startQueue.push(...startList.filter((x) => !minDistance[x]));

    for (const x of startList) {
      const cost = computeCost(
        boxList.slice(start, x),
        viewportWidth,
        idealHeight
      );

      dot += `${start}->${x} [label="${Math.round(Math.sqrt(cost))}"]\n`;

      if (minDistance[x] == null) minDistance[x] = Infinity;
      if (minDistance[x] > minDistance[start] + cost) {
        minDistance[x] = minDistance[start] + cost;
        path[x] = start;
      }
    }
  }

  //Lookup shortest path.
  const start = 0;
  const end = Math.max(...Object.keys(path).map((x) => Number(x)));
  const shortestPath = [end];
  for (let i = end; i !== start; i = path[i]) shortestPath.push(path[i]);
  shortestPath.reverse();

  //build dot languarge for graphviz
  for (let i = 0; i < shortestPath.length - 1; ++i) {
    const reg = new RegExp(`(${shortestPath[i]}->${shortestPath[i + 1]}.+)]`);
    dot = dot.replace(reg, '$1 color="red"]');
  }
  console.log("digraph g {\n" + dot + "}");

  //set result
  const result: (T & Size)[][] = [];
  for (let y = 0; y < shortestPath.length - 1; ++y) {
    const start = shortestPath[y];
    const end = shortestPath[y + 1];
    const row = [];
    for (let x = start; x < end; ++x) {
      row.push(boxList[x]);
    }
    result.push(row);
  }
  return result;
}

class FlexLayout {
  root;
  idealHeight;
  gap;

  constructor(root: HTMLElement) {
    this.root = root;
    this.idealHeight =
      Number(root.dataset.idealHeight) || defaultOptions.IDEALHEIGHT;
    this.gap = Number(root.dataset.gap) || defaultOptions.GAP;
    this.layout();
  }

  layout() {
    const items = this.root.getElementsByClassName(
      cssClasses.ITEM
    ) as HTMLCollectionOf<HTMLElement>;
    const itemWithSize = Array.from(items).map((item) => {
      const img = item.getElementsByTagName("img")[0];
      return {
        width: Number(img.getAttribute("width")),
        height: Number(img.getAttribute("height")),
        element: item,
      };
    });

    if (itemWithSize.length == 0) {
      throw Error(`.${cssClasses.ITEM} must have .${cssClasses.IMAGE}`);
    }

    const rowList = computeOrder(
      itemWithSize,
      this.root.clientWidth,
      this.idealHeight
    );
    let currentHeight = 0;
    for (const row of rowList) {
      const rowRatio = row.reduce((sum, x) => sum + x.width / x.height, 0);
      const gapNum = row.length - 1;
      const rowHeight = (this.root.clientWidth - gapNum * this.gap) / rowRatio;
      let currentWidth = 0;

      for (const item of row) {
        const width = (rowHeight * item.width) / item.height;

        item.element.style.transform = `translate(${currentWidth}px,${currentHeight}px`;
        item.element.style.width = `${width}px`;
        item.element.style.height = `${rowHeight}px`;
        currentWidth += width + this.gap;
      }

      currentHeight += rowHeight + this.gap;
    }
    this.root.style.width = `${this.root.clientWidth}px`;
    this.root.style.height = `${currentHeight}px`;
  }
}

export { FlexLayout, cssClasses, defaultOptions };
