import "./index.css";

import {
  Application,
  Container,
  Graphics,
  filters,
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

// Set a container for where all of the objects will be (so we can center and scale it on resize)
const faceContainer = new Container();
app.stage.addChild(faceContainer);
faceContainer.position.set(app.renderer.width / 2, app.renderer.height / 2);

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

faceContainer.filters = [blurFilter, gooeyFilter, dotFilter, colorReplace];

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
function createPoint(point, size = 1, color = 0xffffff) {
  // The UV coords are normalized in terms of 0 -> 1 of the container
  const [xRel, yRel] = point;
  const circle = new Graphics()
    .beginFill(0xffffff * seededRandom())
    .drawCircle(0, 0, size)
    .endFill();
  // TODO: reposition on window resize
  circle.position.set(
    xRel * app.renderer.width - app.renderer.width / 2,
    yRel * app.renderer.height - app.renderer.height / 2
  );
  return circle;
}

// Add all of the important points
for (const key in MESH_ANNOTATIONS) {
  if (!key.includes("Iris") && !key.includes("silhouette")) {
    const feature = new Container();
    feature.name = key;

    MESH_ANNOTATIONS[key].forEach((pointIndex) => {
      feature.addChild(createPoint(UV_COORDS[pointIndex], seededRandom() * 30));
    });

    feature.position.set(25 - seededRandom() * 50, 25 - seededRandom() * 50);

    feature.scale.set(
      1 + (0.2 - seededRandom() * 0.4),
      1 + (0.2 - seededRandom() * 0.4)
    );

    feature.rotation = Math.PI / 8 - (seededRandom() * Math.PI) / 4;

    faceContainer.addChild(feature);
  }
}

// Scale up the face so at least one edge is touching the sides
const containerBounds = faceContainer.getBounds();
faceContainer.scale.set(
  Math.min(
    1 + (app.renderer.width - containerBounds.width) / containerBounds.width,
    1 + (app.renderer.height - containerBounds.height) / containerBounds.height
  )
);
