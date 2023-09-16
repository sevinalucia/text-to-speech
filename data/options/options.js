var background = (function () {
  var tmp = {};
  chrome.runtime.onMessage.addListener(function (request) {
    for (var id in tmp) {
      if (tmp[id] && (typeof tmp[id] === "function")) {
        if (request.path === "background-to-options") {
          if (request.method === id) tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {tmp[id] = callback},
    "send": function (id, data) {chrome.runtime.sendMessage({"path": "options-to-background", "method": id, "data": data})}
  }
})();

var config = {
  "render": function (e) {
    if (window[e.pref]) {
      window[e.pref].value = e.value;
      if (e.pref === "settings.isBubbleIcon") {
        document.querySelector("input[data-pref='settings.placeholderIconShow']").disabled = !e.value;
        document.querySelector("input[data-pref='settings.placeholderIconTime']").disabled = !e.value;
      }
    }
  },
  "connect": function (elem, pref) {
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
  },
  "load": function () {
    var prefs = [...document.querySelectorAll("*[data-pref]")];
    var selection = document.querySelector("input[data-pref='settings.selection']");
    var isBubbleIcon = document.querySelector("input[data-pref='settings.isBubbleIcon']");
    var placeholderIconShow = document.querySelector("input[data-pref='settings.placeholderIconShow']");
    var placeholderIconTime = document.querySelector("input[data-pref='settings.placeholderIconTime']");
    /*  */
    prefs.forEach(function (elem) {
      var pref = elem.getAttribute("data-pref");
      window[pref] = config.connect(elem, pref);
    });
    /*  */
    var set = function (elm, pref, value) {
      if (!elm) return;
      elm.checked = value;
      background.send("changed", {"pref": pref, "value": value});
    };
    /*  */
    selection.addEventListener("change", function (e) {
      placeholderIconShow.disabled = true;
      placeholderIconTime.disabled = true;
      set(isBubbleIcon, "settings.isBubbleIcon", false);
      set(selection, "settings.selection", e.target.checked);
    }, false);
    /*  */
    isBubbleIcon.addEventListener("change", function (e) {
      set(selection, "settings.selection", false);
      placeholderIconShow.disabled = !e.target.checked;
      placeholderIconTime.disabled = !e.target.checked;
      set(isBubbleIcon, "settings.isBubbleIcon", e.target.checked);
    }, false);
    /*  */
    window.removeEventListener("load", config.load, false);
  }
};

background.receive("set", config.render);
window.addEventListener("load", config.load, false);
