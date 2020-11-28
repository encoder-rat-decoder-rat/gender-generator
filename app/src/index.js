import "./index.css";

import {
  Application,
  Container,
  Graphics,
  filters,
  Point,
  Ticker,
  settings,
} from "pixi.js";
import * as PIXI from "pixi.js";
import { DotFilter } from "@pixi/filter-dot";
import { MultiColorReplaceFilter } from "@pixi/filter-multi-color-replace";
import seedrandom from "seedrandom";

import GooeyFilter from "./GooeyFilter.js";

import { downloadAsPNG } from "./downloadFrame.js";

window.PIXI = PIXI;
settings.FILTER_RESOLUTION = 2;

const BG_COLOR = 0xadefd1;
const FG_COLOR = 0x00203f;

const FACE_LOCATIONS = [
  // Hair
  new Point(0, -350),
  // Nose
  new Point(0, 100),
  // Lips
  new Point(0, 250),
  // Left Eye
  new Point(-75, -100),
  // Left Eyebrow
  new Point(-75, -150),
  // Left Ear
  new Point(-300, 0),
  // Right Eye
  new Point(75, -100),
  // Right Eyebrow
  new Point(75, -150),
  // Right Ear
  new Point(300, 0),
];

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

// Setup the pixi application
const app = new Application({
  width: window.innerWidth,
  height: window.innerHeight,
  antialias: true,
  resizeTo: window,
  backgroundColor: BG_COLOR,
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
    [0xffffff, BG_COLOR],
    [0x000000, FG_COLOR],
  ],
  0.1
);

app.stage.filters = [blurFilter, gooeyFilter, dotFilter, colorReplace];

// Set a container for where all of the objects will be (so we can center and scale it on resize)
const faceContainer = new Container();
app.stage.addChild(faceContainer);
faceContainer.position.set(app.renderer.width, app.renderer.height);
faceContainer.pivot.set(app.renderer.width / 2, app.renderer.height / 2);

// Draw the oval behind the face
const circle = new Graphics()
  .lineStyle(3, 0xcccccc)
  .drawEllipse(0, 0, 300, 400);
circle.position.set(0, 0);
circle.scale.set(0, 0);
circle.destination = circle.position;
faceContainer.addChild(circle);

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
 * Add a random circle
 *
 * @param      {Number}  [size=seededRandom()*14+8]  The size
 */
function addOne(index) {
  const size = seededRandom() * 75 + 10;
  const circle = new Graphics()
    .beginFill(0xffffff * seededRandom())
    .drawCircle(0, 0, size)
    .endFill();
  circle.position.set(0, 0);
  circle.scale.set(0, 0);
  circle.destination = FACE_LOCATIONS[index];
  faceContainer.addChild(circle);
}

// Add a new blob every 2.5 seconds up to 9
for (let i = 0; i < 9; i += 1) {
  window.setTimeout(addOne.bind(null, i), 5000 * i);
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

    // Movement towards destination
    child.position.set(
      child.position.x + (child.destination.x - child.position.x) * 0.1,
      child.position.y + (child.destination.y - child.position.y) * 0.1
    );
  });
});
