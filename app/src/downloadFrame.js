/**
 * Downloads the passed SVG node as a png.
 *
 * @param      {Node}   svg     The svg
 * @return     {Promise}  { description_of_the_return_value }
 */
export async function downloadAsPNG(svg) {
  // First generate a canvas the size of the svg
  const canvas = document.createElement("canvas");
  canvas.width = Number(svg.getAttribute("width"));
  canvas.height = Number(svg.getAttribute("height"));
  const ctx = canvas.getContext("2d");

  var image = new Image();
  const svgAsXML = new XMLSerializer().serializeToString(svg);

  await new Promise((resolve) => {
    image.onload = resolve;
    image.src = "data:image/svg+xml," + encodeURIComponent(svgAsXML);
  });

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const url = await new Promise((resolve) => {
    // toBlob(callback, mimeType, qualityArgument);
    canvas.toBlob(function (blob) {
      resolve(URL.createObjectURL(blob));
    }, "image/png");
  });

  var a = document.createElement("a");
  document.body.appendChild(a); // This line makes it work in Firefox.
  a.setAttribute("download", "image.jpg");
  a.setAttribute("href", url);
  a.setAttribute("target", "_blank");
  a.click();
  // We don't need it anymore, remove it
  a.remove();
}
