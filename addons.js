/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

Cu.import("resource://gre/modules/AddonManager.jsm");

XPCOMUtils.defineLazyServiceGetter(this, "alerts",
                                   "@mozilla.org/alerts-service;1",
                                   "nsIAlertsService");

const DEFAULT_ICON = "chrome://mozapps/skin/extensions/extensionGeneric.png";

const TYPES = {
  "extension": "Extensions",
  "userscript": "User Scripts"
};

function update() {
  exports.all = [];
  AddonManager.getAllAddons(all => {
    for (let a of all) {
      if (a.type !== "extension" && a.type !== "userscript") {
        continue;
      }
      if (a.operationsRequiringRestart !== AddonManager.OP_NEEDS_RESTART_NONE) {
        continue;
      }
      exports.all.push({
        id: a.id,
        type: TYPES[a.type] || a.type,
        active: a.isActive,
        icon: a.iconURL || a.icon64URL || DEFAULT_ICON,
        name: a.name,
        cmp: [a.type, !a.isActive, a.name.toUpperCase(), a.id].join("\n")
      });
    }

    exports.all.sort((a, b) => {
      if (a.cmp < b.cmp) {
        return -1;
      }
      if (a.cmp > b.cmp) {
        return 1;
      }
      return 0;
    });
  });
}

update();
const listener = {
  onEnabled: update,
  onDisabled: update,
  onInstalled: update,
  onUninstalled: update
};
AddonManager.addAddonListener(listener);
unload(() => AddonManager.removeAddonListener(listener));

exports.toggleAddon = function toggleAddon(addon) {
  AddonManager.getAddonByID(addon.id, addon => {
    try {
      addon.userDisabled = !addon.userDisabled;
      alerts.showAlertNotification(
        DEFAULT_ICON,
        "Addon " + (addon.isActive ? "Enabled" : "Disabled"),
        addon.name + " was " + (addon.isActive ? "enabled!" : "disabled!")
        );
    }
    catch (ex) {
      log(LOG_ERROR, "Failed to toggle " + a.id, ex);
    }
  });
};

/* vim: set et ts=2 sw=2 : */
