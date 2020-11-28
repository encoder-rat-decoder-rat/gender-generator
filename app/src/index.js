import "./index.css";

import {
  Application,
  Container,
  Graphics,
  filters,
  Point,
  Ticker,
  settings,
  utils,
} from "pixi.js";
import * as PIXI from "pixi.js";
import { DotFilter } from "@pixi/filter-dot";
import { MultiColorReplaceFilter } from "@pixi/filter-multi-color-replace";

import { UV_COORDS } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/uv_coords.js";
import { MESH_ANNOTATIONS } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/keypoints.js";

import seedrandom from "seedrandom";

import GooeyFilter from "./GooeyFilter.js";
import { contrast } from "./utils.js";

import { downloadAsPNG } from "./downloadFrame.js";

window.PIXI = PIXI;
settings.FILTER_RESOLUTION = 2;

///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
/////////////////////////////// Reference ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
// http://bl.ocks.org/nbremer/0e98c72b043590769facc5e829ebf43f
// http://bl.ocks.org/syntagmatic/6a921aed54be2a2bea5e56cf2157768b
// https://www.visualcinnamon.com/2016/06/fun-data-visualizations-svg-gooey-effect

///////////////////////////////////////////////////////////////////////////
/////////////////////////////// Set-up ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

// Set our random seed based on the "seed" query parameter supplied
const queryParams = new URLSearchParams(window.location.search);
const seed = queryParams.get("seed");
const seededRandom = seedrandom(seed);

const bgColorArray = [seededRandom(), seededRandom(), seededRandom()];
// Ensure the FG color has at least a contrast ratio of 4.5: 1 for legibility
// https://www.w3.org/TR/WCAG20-TECHS/G18.html
let isContrastRatioAcceptable = false;
let fgColorArray;
while (!isContrastRatioAcceptable) {
  fgColorArray = [seededRandom(), seededRandom(), seededRandom()];

  isContrastRatioAcceptable = contrast(bgColorArray, fgColorArray) >= 4.5;
}

const bgColor = utils.rgb2hex(bgColorArray);
const fgColor = utils.rgb2hex(fgColorArray);

// Setup the pixi application
const app = new Application({
  width: window.innerWidth,
  height: window.innerHeight,
  antialias: true,
  resizeTo: window,
  backgroundColor: bgColor,
  sharedTicker: true,
  sharedLoader: true,
});
window.app = app;
app.start();
Ticker.shared.start();
// Add it to the body
document.body.appendChild(app.view);

// Add visual filters
const blurFilter = new filters.BlurFilter();
blurFilter.blur = 20;
blurFilter.quality = 10;

const gooeyFilter = new GooeyFilter();

const dotFilter = new DotFilter(1.05, 0);
const colorReplace = new MultiColorReplaceFilter(
  [
    [0xffffff, bgColor],
    [0x000000, fgColor],
  ],
  0.1
);

app.stage.filters = [blurFilter, gooeyFilter, dotFilter, colorReplace];

// Set a container for where all of the objects will be (so we can center and scale it on resize)
const faceContainer = new Container();
app.stage.addChild(faceContainer);
faceContainer.position.set(app.renderer.width, app.renderer.height);
// Zoom in slightly
faceContainer.scale.set(1.3, 1.3);
// Center it
faceContainer.pivot.set(
  app.renderer.width / 2 / faceContainer.scale.x,
  app.renderer.height / 2 / faceContainer.scale.y
);

// Set an interval loop to check if the ?frame query param is added to the url
let currentParams = null;
const checkFrame = () => {
  const newParams = window.location.search;
  if (currentParams !== newParams && newParams.includes("?frame")) {
    downloadAsPNG(document.getElementById("chartWrapper"));
  }
  currentParams = newParams;
};
window.setInterval(checkFrame, 2000);

/**
 * Add a point on the face mesh
 *
 * @param      {Number}  [size=seededRandom()*14+8]  The size
 */
function addOne(point, size = 4.5, color = 0xffffff) {
  // The UV coords are normalized in terms of 0 -> 1 of the container
  const [xRel, yRel] = point;
  const circle = new Graphics()
    .beginFill(0xffffff * seededRandom())
    .drawCircle(0, 0, size)
    .endFill();
  // TODO: reposition on window resize
  circle.position.set(
    xRel * app.view.width - app.view.width / 2,
    yRel * app.view.height - app.view.height / 2
  );
  circle.scale.set(0, 0);
  faceContainer.addChild(circle);
}

// Add every point
UV_COORDS.forEach((point) => {
  addOne(point);
});

// Add all of the important points
for (const key in MESH_ANNOTATIONS) {
  if (!key.includes("Iris") && !key.includes("silhouette")) {
    MESH_ANNOTATIONS[key].forEach((pointIndex) => {
      addOne(UV_COORDS[pointIndex], seededRandom() * 20);
    });
  }
}

///////////////////////////////////////////////////////////////////////////
/////////////////////////// Update Loop ///////////////////////////////////
///////////////////////////////////////////////////////////////////////////
app.ticker.add((delta) => {
  faceContainer.children.forEach((child) => {
    // Grow-in effect
    child.scale.set(
      child.scale.x + (1 - child.scale.x) * 0.1,
      child.scale.y + (1 - child.scale.y) * 0.1
    );
  });
});
