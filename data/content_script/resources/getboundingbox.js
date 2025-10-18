/* 
  Inspired by: https://stackoverflow.com/posts/7948715/revisions
*/

const getBoundingBox = function (input, selectionStart, selectionEnd, debug = false) {
  if (!input || !("value" in input)) return null;
  /*  */
  selectionStart = Math.max(0, Math.min(input.value.length, +selectionStart || 0));
  selectionEnd = Math.max(selectionStart, Math.min(input.value.length, +selectionEnd || selectionStart));
  /* Old IE path */
  if (typeof input.createTextRange === "function") {
    const range = input.createTextRange();
    range.collapse(true);
    range.moveStart("character", selectionStart);
    range.moveEnd("character", selectionEnd - selectionStart);
    return range.getBoundingClientRect();
  }
  /*  */
  const getCSS = (prop, asNumber = false) => {
    const val = getComputedStyle(input).getPropertyValue(prop);
    return asNumber ? parseFloat(val) || 0 : val;
  };
  /*  */
  const getOffset = () => {
    const rect = input.getBoundingClientRect();
    return {
      "top": rect.top + window.scrollY, 
      "left": rect.left + window.scrollX
    };
  };
  /*  */
  const offset = getOffset();
  const width = getCSS("width", true);
  const height = getCSS("height", true);
  /*  */
  const modifiers = [
    "direction",
    "font-size",
    "word-wrap",
    "text-align",
    "font-style",
    "font-family",
    "font-weight",
    "line-height",
    "text-indent",
    "white-space",
    "word-spacing",
    "font-variant",
    "text-transform",
    "letter-spacing"
  ];
  /*  */
  const cssText = modifiers.map(p => `${p}:${getCSS(p)};`).join(' ') + "padding:0;margin:0;white-space:pre;";
  /*  */
  const fake = document.createElement("div");
  Object.assign(fake.style, {
    "width": `${width}px`,
    "position": "absolute",
    "height": `${height}px`,
    ...debug ? {} : {"visibility": "hidden"},
    "top": `${offset.top + getCSS("padding-top", true) + getCSS("border-top-width", true)}px`,
    "left": `${offset.left + getCSS("padding-left", true) + getCSS("border-left-width", true)}px`
  });
  /*  */
  fake.style.cssText += cssText;
  /*  */
  const text = input.value;
  const selected = document.createElement("span");
  const before = document.createTextNode(text.slice(0, selectionStart));
  /*  */
  selected.textContent = text.slice(selectionStart, selectionEnd) || "\u200b";
  fake.append(before, selected);
  document.body.appendChild(fake);
  /*  */
  const rect = selected.getBoundingClientRect();
  if (!debug) fake.remove();
  /*  */
  return rect;
};
