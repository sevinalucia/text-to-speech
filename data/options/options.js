var background = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path === 'background-to-options') {
          if (request.method === id) _tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {_tmp[id] = callback},
    "send": function (id, data) {chrome.runtime.sendMessage({"path": 'options-to-background', "method": id, "data": data})}
  }
})();

var connect = function (elem, pref) {
  var att = "value";
  if (elem) {
    if (elem.type === "checkbox") att = "checked";
    if (elem.localName === "select") att = "value";
    if (elem.localName === "span") att = "textContent";
    var pref = elem.getAttribute("data-pref");
    background.send("get", pref);
    elem.addEventListener("change", function () {background.send("changed", {"pref": pref, "value": this[att]})});
  }
  /*  */
  return {
    get value () {return elem[att]},
    set value (val) {
      if (val === "true") val = true;
      if (elem.type === "file") return;
      else if (val === "false") val = false;
      elem[att] = val;
    }
  }
};

background.receive("set", function (o) {
  if (window[o.pref]) {
    window[o.pref].value = o.value;
    if (o.pref === 'settings.isBubbleIcon') {
      document.querySelector("input[data-pref='settings.placeholderIconShow']").disabled = !o.value;
      document.querySelector("input[data-pref='settings.placeholderIconTime']").disabled = !o.value;
    }
  }
});

var load = function () {
  var selection = document.querySelector("input[data-pref='settings.selection']");
  var isBubbleIcon = document.querySelector("input[data-pref='settings.isBubbleIcon']");
  var placeholderIconShow = document.querySelector("input[data-pref='settings.placeholderIconShow']");
  var placeholderIconTime = document.querySelector("input[data-pref='settings.placeholderIconTime']");
  /*  */
  var prefs = document.querySelectorAll("*[data-pref]");
  [].forEach.call(prefs, function (elem) {
    var pref = elem.getAttribute("data-pref");
    window[pref] = connect(elem, pref);
  });
  /*  */
  var set = function (elm, pref, value) {
    if (!elm) return;
    elm.checked = value;
    background.send("changed", {"pref": pref, "value": value});
  };
  /*  */
  selection.addEventListener('change', function (e) {
    placeholderIconShow.disabled = true;
    placeholderIconTime.disabled = true;
    set(isBubbleIcon, 'settings.isBubbleIcon', false);
    set(selection, 'settings.selection', e.target.checked);
  }, false);
  /*  */
  isBubbleIcon.addEventListener('change', function (e) {
    set(selection, 'settings.selection', false);
    placeholderIconShow.disabled = !e.target.checked;
    placeholderIconTime.disabled = !e.target.checked;
    set(isBubbleIcon, 'settings.isBubbleIcon', e.target.checked);
  }, false);
  /*  */
  window.removeEventListener("load", load, false);
};

window.addEventListener("load", load, false);
