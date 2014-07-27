/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {unloadWindow} = require("sdk/windows");
const addons = require("addons");

Cu.import("resource:///modules/CustomizableUI.jsm");

CustomizableUI.createWidget({
  id: "fastaddons-widget",
  type: "view",
  viewId: "fastaddons-view",
  label: "FastAddons",
  tooltiptext: "FastAddons",
  defaultArea: CustomizableUI.AREA_NAVBAR,
  onBeforeCreated: function(document) {
    try {
      let window = document.defaultView;
      let $ = i => document.getElementById(i);
      if (!(window instanceof Ci.nsIInterfaceRequestor)) {
        throw new Error("window is something fishy: " + window);
      }
      let winUtils = window.getInterface(Ci.nsIDOMWindowUtils);
      if (!winUtils) {
        throw new Error("No window utils");
      }
      let panels = $("PanelUI-multiView");
      if (!panels) {
        throw new Error("No panels");
      }

      let uri = Services.io.newURI("chrome://fastaddons/skin/", null, null);
      try {
        winUtils.loadSheet(uri, Ci.nsIDOMWindowUtils.AUTHOR_SHEET);
      }
      catch (ex) {
        throw new Error("Failed in inject style sheet");
      }

      let panel = document.createElement("panelview");
      panel.setAttribute("id", this.viewId);
      panel.setAttribute("flex", "1");
      panels.appendChild(panel);

      unloadWindow(window, () => {
        panels.removeChild(panel);
        try {
          winUtils.removeSheet(uri, Ci.nsIDOMWindowUtils.AUTHOR_SHEET);
        }
        catch (ex) {
          log(LOG_ERROR, "failed to unload sheet: " + uri.spec, ex);
        }
      });

      let items = document.createElement("vbox");
      items.setAttribute("class", "panel-subview-body");
      items.setAttribute("id", this.viewId + "-items");
      panel.appendChild(items);

      let footer = document.createElement("toolbarbutton");
      footer.setAttribute("label", "Show Add-ons");
      footer.setAttribute("class", "panel-subview-footer subviewbutton");
      footer.addEventListener("command", e => window.BrowserOpenAddonsMgr());
      panel.appendChild(footer);
    }
    catch (ex) {
      log(LOG_ERROR, "Failed to build view", ex);
    }
  },
  onViewShowing: function(evt) {
    try {
      let document = evt.detail.ownerDocument;
      let window = document.defaultView;
      let $ = i => document.getElementById(i);
      let items = $(this.viewId + "-items");
      if (!items) {
        throw new Error("No items");
      }
      while (items.lastChild) {
        items.removeChild(items.lastChild);
      }
      let lastType = "", label, numItems = 0;
      for (let a of addons.all) {
        let type = (a.active ? "" : "Disabled ") + a.type;
        if (type != lastType) {
          if (label) {
            label.setAttribute("value", lastType + " (" + numItems + ")");
          }
          lastType = type;
          numItems = 0;
          label = document.createElement("label");
          label.setAttribute("class", "panel-subview-header");
          label.setAttribute("value", type);
          items.appendChild(label);
        }
        let item = document.createElement("toolbarbutton");
        item.setAttribute("label", a.name || a.id || "unknown");
        item.setAttribute("tooltiptext", a.name + "\n" + a.id);
        item.setAttribute("class",
                          "subviewbutton" + (a.active ? " active" : ""));
        item.setAttribute("image", a.icon);
        items.appendChild(item);
        item.addEventListener("command", addons.toggleAddon.bind(null, a));
        ++numItems;
      }
      if (label) {
        label.setAttribute("value", lastType + " (" + numItems + ")");
      }
    }
    catch (ex) {
      log(LOG_ERROR, "Failed to update view", ex);
    }
  }
});
unload(() => CustomizableUI.destroyWidget("fastaddons-widget"));

/* vim: set et ts=2 sw=2 : */
