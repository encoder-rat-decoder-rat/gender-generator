import "./index.css";

import {
  Application,
  Container,
  Loader,
  filters,
  Ticker,
  Spritesheet,
  settings,
  utils,
} from "pixi.js";
import * as PIXI from "pixi.js";
import { DotFilter } from "@pixi/filter-dot";
import { MultiColorReplaceFilter } from "@pixi/filter-multi-color-replace";

import seedrandom from "seedrandom";

import GooeyFilter from "./GooeyFilter.js";
import {
  drawFace,
  startWebcam,
  getFaceFromMedia,
  redrawFace,
} from "./faceDrawing.js";
import { contrast } from "./utils.js";

import { downloadCanvasAsPNG } from "./downloadFrame.js";
import spritesheetJSON from "./spritesheet.json";

require("@tensorflow/tfjs-backend-webgl");

window.PIXI = PIXI;
settings.FILTER_RESOLUTION = 2;

const whiteTextureUrl = `${process.env.PUBLIC_URL}/sprite-sheet-white.png`;

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
const seed = parseInt(queryParams.get("seed"));
const page = parseInt(queryParams.get("page"));
const seededRandom = seedrandom(seed);

const isDownload = queryParams.has("page");

// Use the w and h parameters to set a specfic height and width for the canvas (useful for generating and downloading images)
// magic numbers are provided resolution
const width = page ? 2412 : Number(queryParams.get("w")) || window.innerWidth;
const height = page ? 3074 : Number(queryParams.get("h")) || window.innerHeight;

const bgColorArray = [seededRandom(), seededRandom(), seededRandom()];
// Ensure the FG color has at least a contrast ratio of 4.5: 1 for legibility
// https://www.w3.org/TR/WCAG20-TECHS/G18.html
let isContrastRatioAcceptable = false;
let fgColorArray;
while (!isContrastRatioAcceptable) {
  fgColorArray = [seededRandom(), seededRandom(), seededRandom()];
  isContrastRatioAcceptable = contrast(bgColorArray, fgColorArray) >= 4.8;
}

const bgColor = utils.rgb2hex(bgColorArray);
const fgColor = utils.rgb2hex(fgColorArray);

// Setup the pixi application
const app = new Application({
  width,
  height,
  antialias: true,
  backgroundColor: bgColor,
  sharedTicker: true,
  sharedLoader: true,
  // Only resize if we are not downloading
  resizeTo: !isDownload ? window : undefined,
});
window.app = app;

app.start();

// We don't need the default pixi application render on tick call.
// We will be managing our own render calls elsewhere
Ticker.shared.remove(app.render, app);
Ticker.shared.fps = 30;

Ticker.shared.start();
// Add it to the body
document.body.appendChild(app.view);

async function setup() {
  let faceSource = null;
  if (!isDownload) {
    try {
      faceSource = await startWebcam();
    } catch (e) {
      console.info("Cannot use webcam for source, falling back to default");
    }
  }

  const whiteTexture = Loader.shared.resources[whiteTextureUrl].texture;
  const whiteSpriteSheet = new Spritesheet(whiteTexture, spritesheetJSON);

  await Promise.all([
    new Promise((resolve) => {
      whiteSpriteSheet.parse(resolve);
    }),
  ]);

  // Set a container for where all of the objects will be (so we can center and scale it on resize)
  const faceContainer = new Container();
  app.stage.addChild(faceContainer);
  const featureContainer = new Container();
  const iconContainer = new Container();
  faceContainer.addChild(featureContainer, iconContainer);

  // Add visual filters
  const blurFilter = new filters.BlurFilter();
  blurFilter.blur = 30;
  blurFilter.quality = 7;

  const gooeyFilter = new GooeyFilter();

  const dotFilter = new DotFilter(1.05, 0);
  const colorReplace = new MultiColorReplaceFilter(
    [
      [0xffffff, bgColor],
      [0x000000, fgColor],
    ],
    0.1
  );

  featureContainer.filters = [blurFilter, gooeyFilter, dotFilter, colorReplace];
  iconContainer.filters = [colorReplace];

  // `predictions` is an array of objects describing each detected face
  let predictions = [];
  if (faceSource) {
    predictions = await getFaceFromMedia(faceSource);
  }

  drawFace({
    app,
    seededRandom,
    spritesheet: whiteSpriteSheet,
    faceContainer,
    featureContainer,
    iconContainer,
    prediction: predictions[0],
  });

  app.render();

  // Now that we're loaded we can download if requested
  if (isDownload) {
    downloadCanvasAsPNG(app.view, seed + "_" + page);
  } else if (faceSource) {
    Ticker.shared.add(async () => {
      const predictions = await getFaceFromMedia(faceSource);
      if (predictions.length) {
        redrawFace({
          app,
          faceContainer,
          featureContainer,
          prediction: predictions[0],
        });

        app.render();
      }
    });
  }
}

// load our assets
Loader.shared.add(whiteTextureUrl).load(setup);
