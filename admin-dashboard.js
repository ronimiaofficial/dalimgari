/*
 * Dalimgari Admin Dashboard
 * Admin Control Layer v4
 *
 * Responsibilities:
 * - Admin authentication guard
 * - Dashboard tab management
 * - Website information management
 * - Admin profile management
 * - Manager profile management
 * - Contact link management
 * - Validation
 * - Permission structure
 * - Unsaved-change protection
 * - Loading/recovery handling
 * - Activity/error logging
 *
 * Security note:
 * Offline authentication is suitable only for the current local architecture.
 * Real online authentication must be enforced by the backend/server.
 */

"use strict";

const DalimgariAdminDashboard = (() => {
  /* =========================================================
     CONFIG
  ========================================================= */

  const ALLOWED_TABS = ["website", "admin", "manager"];
  const MAX_LINKS = 50;

  const DEFAULT_TAB = "website";

  const WEBSITE_FIELDS = [
    "siteName",
    "tagline",
    "villageName",
    "villageDescription",
    "detailedDescription",
    "location",
    "history",
    "nature",
    "contact",
    "contactDetails",
    "footerText",
    "copyrightText",
    "managementText",
  ];

  const ADMIN_FIELDS = [
    "adminName",
    "adminPhoto",
    "adminDescription",
    "adminContact",
    "adminUsername",
    "adminPassword",
  ];

  const MANAGER_FIELDS = [
    "managerName",
    "managerPhoto",
    "managerDescription",
    "managerContact",
    "managerUsername",
    "managerPassword",
    "managerCanEditVillageInfo",
    "managerCanManagePeople",
    "managerCanManageImages",
    "managerCanManageVideos",
    "managerCanManageAudio",
    "managerCanManageEvents",
    "managerCanEditManagerProfile",
    "managerCanEditSecurity",
  ];

  const state = {
    siteData: null,
    settingsData: null,

    ready: false,
    saving: false,

    dirty: {
      website: false,
      admin: false,
      manager: false,
    },

    snapshots: {
      website: "",
      admin: "",
      manager: "",
    },

    activeTab: DEFAULT_TAB,
  };


  /* =========================================================
     BASIC HELPERS
  ========================================================= */

  function $(id) {
    return document.getElementById(id);
  }

  function safeString(value) {
    return value === null || value === undefined
      ? ""
      : String(value);
  }

  function trim(value) {
    return safeString(value).trim();
  }

  function setText(id, value) {
    const element = $(id);

    if (element) {
      element.textContent = safeString(value);
    }
  }

  function getDataLayer() {
    return window.DalimgariDataLayer || null;
  }

  function getIconManager() {
    return window.DalimgariIconManager || null;
  }


  /* =========================================================
     ERROR / ACTIVITY LOGGING
  ========================================================= */

  async function logError(error, context = "admin-dashboard") {
    try {
      const dataLayer = getDataLayer();

      if (dataLayer && typeof dataLayer.logError === "function") {
        await dataLayer.logError(error, context);
      }
    } catch (loggingError) {
      console.error("Dalimgari error logging failed:", loggingError);
    }

    console.error(`[${context}]`, error);
  }

  async function logActivity(action, details = {}) {
    try {
      const dataLayer = getDataLayer();

      if (dataLayer && typeof dataLayer.logActivity === "function") {
        await dataLayer.logActivity(action, details);
      }
    } catch (error) {
      console.error("Dalimgari activity logging failed:", error);
    }
  }


  /* =========================================================
     AUTHENTICATION
  ========================================================= */

  function getCurrentUser() {
    try {
      const raw = sessionStorage.getItem("dalimgariUser");

      if (!raw) {
        return null;
      }

      const user = JSON.parse(raw);

      if (!user || typeof user !== "object") {
        return null;
      }

      return user;
    } catch (error) {
      logError(error, "getCurrentUser");
      return null;
    }
  }

  function checkAdminLogin() {
    const user = getCurrentUser();

    if (!user || user.role !== "admin") {
      try {
        sessionStorage.removeItem("dalimgariUser");
      } catch (error) {
        console.error(error);
      }

      window.location.replace("login.html");
      return false;
    }

    return true;
  }

  function checkAdminPermission(permission = "") {
    if (!checkAdminLogin()) {
      return false;
    }

    /*
     * Admin has full dashboard access in the current architecture.
     *
     * In the future online version:
     * permission checks must also happen on the backend.
     */

    if (!permission) {
      return true;
    }

    return true;
  }


  /* =========================================================
     DATA LAYER
  ========================================================= */

  async function getSiteDataSafe() {
    if (typeof window.getSiteData !== "function") {
      throw new Error("getSiteData function পাওয়া যায়নি।");
    }

    const data = await window.getSiteData();

    if (!data || typeof data !== "object") {
      throw new Error("Website data সঠিক format-এ পাওয়া যায়নি।");
    }

    return data;
  }

  async function saveSiteDataSafe(data) {
    if (typeof window.saveSiteData !== "function") {
      throw new Error("saveSiteData function পাওয়া যায়নি।");
    }

    return await window.saveSiteData(data);
  }

  async function getSettingsDataSafe() {
    if (typeof window.getSettingsData !== "function") {
      throw new Error("getSettingsData function পাওয়া যায়নি।");
    }

    const data = await window.getSettingsData();

    if (!data || typeof data !== "object") {
      throw new Error("Settings data সঠিক format-এ পাওয়া যায়নি।");
    }

    return data;
  }

  async function saveSettingsDataSafe(data) {
    if (typeof window.saveSettingsData !== "function") {
      throw new Error("saveSettingsData function পাওয়া যায়নি।");
    }

    return await window.saveSettingsData(data);
  }


  /* =========================================================
     UI STATE
  ========================================================= */

  function setDashboardLoading(loading) {
    state.saving = Boolean(loading);

    document.body.classList.toggle("dashboard-loading", state.saving);

    const buttons = document.querySelectorAll("button");

    buttons.forEach((button) => {
      if (button.dataset.lockDuringLoading === "false") {
        return;
      }

      button.disabled = state.saving;
    });
  }

  function showLoadingMessage(message = "তথ্য লোড হচ্ছে...") {
    let element = $("dashboardLoadingMessage");

    if (!element) {
      element = document.createElement("div");
      element.id = "dashboardLoadingMessage";
      element.className = "dashboard-loading-message";

      document.body.appendChild(element);
    }

    element.textContent = message;
    element.hidden = false;
  }

  function hideLoadingMessage() {
    const element = $("dashboardLoadingMessage");

    if (element) {
      element.hidden = true;
    }
  }

  function showErrorMessage(message) {
    alert(`সমস্যা হয়েছে:\n\n${message}`);
  }

  function showSuccessMessage(message) {
    alert(message);
  }


  /* =========================================================
     DIRTY STATE
  ========================================================= */

  function setDirty(section, value = true) {
    if (!Object.prototype.hasOwnProperty.call(state.dirty, section)) {
      return;
    }

    state.dirty[section] = Boolean(value);

    updateDirtyIndicator(section);
  }

  function isDirty(section = null) {
    if (section) {
      return Boolean(state.dirty[section]);
    }

    return Object.values(state.dirty).some(Boolean);
  }

  function updateDirtyIndicator(section) {
    const tab = document.querySelector(
      `.admin-nav-link[data-tab="${section}"]`,
    );

    if (!tab) {
      return;
    }

    tab.classList.toggle("has-unsaved-changes", state.dirty[section]);

    if (state.dirty[section]) {
      tab.setAttribute("data-unsaved", "true");
    } else {
      tab.removeAttribute("data-unsaved");
    }
  }

  function updateAllDirtyIndicators() {
    Object.keys(state.dirty).forEach(updateDirtyIndicator);
  }


  /* =========================================================
     SNAPSHOTS
  ========================================================= */

  function normalizeSnapshotValue(value) {
    return safeString(value).trim();
  }

  function createWebsiteSnapshot() {
    const data = {};

    WEBSITE_FIELDS.forEach((field) => {
      const element = $(field);

      if (element) {
        data[field] = normalizeSnapshotValue(element.value);
      }
    });

    return JSON.stringify(data);
  }

  function createAdminSnapshot() {
    const data = {};

    ADMIN_FIELDS.forEach((field) => {
      const element = $(field);

      if (element) {
        data[field] = normalizeSnapshotValue(element.value);
      }
    });

    return JSON.stringify(data);
  }

  function createManagerSnapshot() {
    const data = {};

    MANAGER_FIELDS.forEach((field) => {
      const element = $(field);

      if (!element) {
        return;
      }

      if (element.type === "checkbox") {
        data[field] = Boolean(element.checked);
      } else {
        data[field] = normalizeSnapshotValue(element.value);
      }
    });

    return JSON.stringify(data);
  }

  function updateSnapshots() {
    state.snapshots.website = createWebsiteSnapshot();
    state.snapshots.admin = createAdminSnapshot();
    state.snapshots.manager = createManagerSnapshot();

    setDirty("website", false);
    setDirty("admin", false);
    setDirty("manager", false);
  }

  function refreshDirtyStateFromSnapshots() {
    if (state.snapshots.website) {
      setDirty(
        "website",
        state.snapshots.website !== createWebsiteSnapshot(),
      );
    }

    if (state.snapshots.admin) {
      setDirty(
        "admin",
        state.snapshots.admin !== createAdminSnapshot(),
      );
    }

    if (state.snapshots.manager) {
      setDirty(
        "manager",
        state.snapshots.manager !== createManagerSnapshot(),
      );
    }
  }


  /* =========================================================
     TAB SYSTEM
  ========================================================= */

  function getTabFromHash() {
    const hash = window.location.hash.replace("#", "").trim();

    if (ALLOWED_TABS.includes(hash)) {
      return hash;
    }

    return DEFAULT_TAB;
  }

  function showTab(tabName, updateHash = true) {
    const tab = ALLOWED_TABS.includes(tabName)
      ? tabName
      : DEFAULT_TAB;

    state.activeTab = tab;

    document.querySelectorAll(".admin-nav-link").forEach((link) => {
      const active = link.dataset.tab === tab;

      link.classList.toggle("active", active);

      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    document.querySelectorAll(".dashboard-tab-content").forEach((section) => {
      section.classList.remove("active");
    });

    const target = $(`${tab}Tab`);

    if (target) {
      target.classList.add("active");
    }

    if (updateHash && window.location.hash !== `#${tab}`) {
      history.replaceState(null, "", `#${tab}`);
    }
  }

  function setupTabs() {
    document.querySelectorAll(".admin-nav-link").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();

        const targetTab = link.dataset.tab;

        if (!ALLOWED_TABS.includes(targetTab)) {
          return;
        }

        showTab(targetTab);
      });
    });

    window.addEventListener("hashchange", () => {
      showTab(getTabFromHash(), false);
    });

    showTab(getTabFromHash(), false);
  }


  /* =========================================================
     INPUT TRACKING
  ========================================================= */

  function setupDirtyTracking() {
    const websiteElements = WEBSITE_FIELDS
      .map((id) => $(id))
      .filter(Boolean);

    const adminElements = ADMIN_FIELDS
      .map((id) => $(id))
      .filter(Boolean);

    const managerElements = MANAGER_FIELDS
      .map((id) => $(id))
      .filter(Boolean);

    websiteElements.forEach((element) => {
      element.addEventListener("input", () => {
        refreshDirtyStateFromSnapshots();
      });

      element.addEventListener("change", () => {
        refreshDirtyStateFromSnapshots();
      });
    });

    adminElements.forEach((element) => {
      element.addEventListener("input", () => {
        refreshDirtyStateFromSnapshots();
      });

      element.addEventListener("change", () => {
        refreshDirtyStateFromSnapshots();
      });
    });

    managerElements.forEach((element) => {
      element.addEventListener("input", () => {
        refreshDirtyStateFromSnapshots();
      });

      element.addEventListener("change", () => {
        refreshDirtyStateFromSnapshots();
      });
    });
  }

  window.addEventListener("beforeunload", (event) => {
    if (!isDirty()) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  });


  /* =========================================================
     WEBSITE INFORMATION
  ========================================================= */

  function loadWebsiteInformation() {
    const data = state.siteData || {};

    setInputValue("siteName", data.siteName);
    setInputValue("tagline", data.tagline);
    setInputValue("villageName", data.villageName);
    setInputValue("villageDescription", data.villageDescription);
    setInputValue("detailedDescription", data.detailedDescription);
    setInputValue("location", data.location);
    setInputValue("history", data.history);
    setInputValue("nature", data.nature);
    setInputValue("contact", data.contact);
    setInputValue("contactDetails", data.contactDetails);
    setInputValue("footerText", data.footerText);
    setInputValue("copyrightText", data.copyrightText);
    setInputValue("managementText", data.managementText);

    renderLinks(
      "websiteContactLinks",
      data.contactLinks || [],
      "website",
    );
  }

  function collectWebsiteInformation() {
    return {
      ...state.siteData,

      siteName: getInputValue("siteName"),
      tagline: getInputValue("tagline"),
      villageName: getInputValue("villageName"),
      villageDescription: getInputValue("villageDescription"),
      detailedDescription: getInputValue("detailedDescription"),
      location: getInputValue("location"),
      history: getInputValue("history"),
      nature: getInputValue("nature"),
      contact: getInputValue("contact"),
      contactDetails: getInputValue("contactDetails"),
      footerText: getInputValue("footerText"),
      copyrightText: getInputValue("copyrightText"),
      managementText: getInputValue("managementText"),
    };
  }

  function validateWebsiteData(data) {
    if (!trim(data.siteName)) {
      return "Website Name খালি রাখা যাবে না।";
    }

    if (!trim(data.villageName)) {
      return "Village Name খালি রাখা যাবে না।";
    }

    if (trim(data.contact) && !isValidEmail(data.contact)) {
      return "Website Email সঠিক নয়।";
    }

    if (
      Array.isArray(data.contactLinks) &&
      data.contactLinks.length > MAX_LINKS
    ) {
      return `সর্বোচ্চ ${MAX_LINKS}টি Contact Link রাখা যাবে।`;
    }

    return "";
  }

  async function saveWebsiteInformation() {
    if (!checkAdminPermission("websiteInformation")) {
      return;
    }

    if (state.saving) {
      return;
    }

    const updatedData = collectWebsiteInformation();

    const validationError = validateWebsiteData(updatedData);

    if (validationError) {
      showErrorMessage(validationError);
      return;
    }

    setDashboardLoading(true);

    try {
      const saveResult = await saveSiteDataSafe(updatedData);

      if (saveResult === false) {
        throw new Error("Website Information সংরক্ষণ করা যায়নি।");
      }

      state.siteData = updatedData;

      state.snapshots.website = createWebsiteSnapshot();

      setDirty("website", false);

      await logActivity("website_information_saved", {
        user: getCurrentUser()?.username || "admin",
      });

      showSuccessMessage("Website Information সফলভাবে সংরক্ষণ হয়েছে।");
    } catch (error) {
      await logError(error, "saveWebsiteInformation");
      showErrorMessage(
        "Website Information সংরক্ষণ করা যায়নি। আপনার আগের তথ্য নিরাপদ রাখা হয়েছে।",
      );
    } finally {
      setDashboardLoading(false);
    }
  }


  /* =========================================================
     ADMIN PROFILE
  ========================================================= */

  function loadAdminProfile() {
    const admin = state.settingsData?.admin || {};

    setInputValue("adminName", admin.name);
    setInputValue("adminPhoto", admin.photo);
    setInputValue("adminDescription", admin.description);
    setInputValue("adminContact", admin.contact);

    setInputValue(
      "adminUsername",
      admin.login?.username,
    );

    setInputValue(
      "adminPassword",
      admin.login?.password,
    );

    renderLinks(
      "adminContactLinks",
      admin.contactLinks || [],
      "admin",
    );
  }

  function collectAdminProfile() {
    const oldAdmin = state.settingsData?.admin || {};

    return {
      ...oldAdmin,

      name: getInputValue("adminName"),
      photo: getInputValue("adminPhoto"),
      description: getInputValue("adminDescription"),
      contact: getInputValue("adminContact"),

      login: {
        ...(oldAdmin.login || {}),
        username: getInputValue("adminUsername"),
        password: getInputValue("adminPassword"),
      },
    };
  }

  function validateAdminProfile(profile) {
    if (!trim(profile.name)) {
      return "Admin Name খালি রাখা যাবে না।";
    }

    if (!trim(profile.login?.username)) {
      return "Admin Username খালি রাখা যাবে না।";
    }

    if (!trim(profile.login?.password)) {
      return "Admin Password খালি রাখা যাবে না।";
    }

    if (profile.login.password.length < 4) {
      return "Admin Password কমপক্ষে 4 অক্ষরের হতে হবে।";
    }

    if (
      Array.isArray(profile.contactLinks) &&
      profile.contactLinks.length > MAX_LINKS
    ) {
      return `সর্বোচ্চ ${MAX_LINKS}টি Admin Contact Link রাখা যাবে।`;
    }

    return "";
  }

  async function saveAdminProfile() {
    if (!checkAdminPermission("adminProfile")) {
      return;
    }

    if (state.saving) {
      return;
    }

    const newAdmin = collectAdminProfile();

    const validationError = validateAdminProfile(newAdmin);

    if (validationError) {
      showErrorMessage(validationError);
      return;
    }

    const previousSettings = state.settingsData;

    const updatedSettings = {
      ...state.settingsData,
      admin: newAdmin,
    };

    setDashboardLoading(true);

    try {
      const saveResult = await saveSettingsDataSafe(updatedSettings);

      if (saveResult === false) {
        throw new Error("Admin Profile সংরক্ষণ করা যায়নি।");
      }

      state.settingsData = updatedSettings;

      state.snapshots.admin = createAdminSnapshot();

      setDirty("admin", false);

      await logActivity("admin_profile_saved", {
        user: getCurrentUser()?.username || "admin",
        username: newAdmin.login.username,
      });

      showSuccessMessage("Admin Profile সফলভাবে সংরক্ষণ হয়েছে।");
    } catch (error) {
      state.settingsData = previousSettings;

      await logError(error, "saveAdminProfile");

      showErrorMessage(
        "Admin Profile সংরক্ষণ করা যায়নি। আগের তথ্য রাখা হয়েছে।",
      );
    } finally {
      setDashboardLoading(false);
    }
  }


  /* =========================================================
     MANAGER PROFILE
  ========================================================= */

  function loadManagerProfile() {
    const manager = state.settingsData?.manager || {};
    const permissions = state.settingsData?.permissions || {};

    setInputValue("managerName", manager.name);
    setInputValue("managerPhoto", manager.photo);
    setInputValue("managerDescription", manager.description);
    setInputValue("managerContact", manager.contact);

    setInputValue(
      "managerUsername",
      manager.login?.username,
    );

    setInputValue(
      "managerPassword",
      manager.login?.password,
    );

    setCheckbox(
      "managerCanEditVillageInfo",
      permissions.managerCanEditVillageInfo,
    );

    setCheckbox(
      "managerCanManagePeople",
      permissions.managerCanManagePeople,
    );

    setCheckbox(
      "managerCanManageImages",
      permissions.managerCanManageImages,
    );

    setCheckbox(
      "managerCanManageVideos",
      permissions.managerCanManageVideos,
    );

    setCheckbox(
      "managerCanManageAudio",
      permissions.managerCanManageAudio,
    );

    setCheckbox(
      "managerCanManageEvents",
      permissions.managerCanManageEvents,
    );

    /*
     * These two permissions are always controlled by Admin.
     * Manager cannot enable them.
     */

    setCheckbox(
      "managerCanEditManagerProfile",
      false,
    );

    setCheckbox(
      "managerCanEditSecurity",
      false,
    );

    renderLinks(
      "managerContactLinks",
      manager.contactLinks || [],
      "manager",
    );
  }

  function collectManagerProfile() {
    const oldManager = state.settingsData?.manager || {};
    const oldPermissions = state.settingsData?.permissions || {};

    return {
      manager: {
        ...oldManager,

        name: getInputValue("managerName"),
        photo: getInputValue("managerPhoto"),
        description: getInputValue("managerDescription"),
        contact: getInputValue("managerContact"),

        login: {
          ...(oldManager.login || {}),
          username: getInputValue("managerUsername"),
          password: getInputValue("managerPassword"),
        },
      },

      permissions: {
        ...oldPermissions,

        managerCanEditVillageInfo:
          getCheckbox("managerCanEditVillageInfo"),

        managerCanManagePeople:
          getCheckbox("managerCanManagePeople"),

        managerCanManageImages:
          getCheckbox("managerCanManageImages"),

        managerCanManageVideos:
          getCheckbox("managerCanManageVideos"),

        managerCanManageAudio:
          getCheckbox("managerCanManageAudio"),

        managerCanManageEvents:
          getCheckbox("managerCanManageEvents"),

        /*
         * Security boundary:
         * Manager cannot receive these permissions.
         */

        managerCanEditManagerProfile: false,
        managerCanEditSecurity: false,
      },
    };
  }

  function validateManagerProfile(profile) {
    const manager = profile.manager;

    if (!trim(manager.name)) {
      return "Manager Name খালি রাখা যাবে না।";
    }

    if (!trim(manager.login?.username)) {
      return "Manager Username খালি রাখা যাবে না।";
    }

    if (!trim(manager.login?.password)) {
      return "Manager Password খালি রাখা যাবে না।";
    }

    if (manager.login.password.length < 4) {
      return "Manager Password কমপক্ষে 4 অক্ষরের হতে হবে।";
    }

    if (
      Array.isArray(manager.contactLinks) &&
      manager.contactLinks.length > MAX_LINKS
    ) {
      return `সর্বোচ্চ ${MAX_LINKS}টি Manager Contact Link রাখা যাবে।`;
    }

    return "";
  }

  async function saveManagerProfile() {
    if (!checkAdminPermission("managerProfile")) {
      return;
    }

    if (state.saving) {
      return;
    }

    const collected = collectManagerProfile();

    const validationError = validateManagerProfile(collected);

    if (validationError) {
      showErrorMessage(validationError);
      return;
    }

    const previousSettings = state.settingsData;

    const updatedSettings = {
      ...state.settingsData,

      manager: collected.manager,

      permissions: {
        ...collected.permissions,

        managerCanEditManagerProfile: false,
        managerCanEditSecurity: false,
      },
    };

    setDashboardLoading(true);

    try {
      const saveResult = await saveSettingsDataSafe(updatedSettings);

      if (saveResult === false) {
        throw new Error("Manager Profile সংরক্ষণ করা যায়নি।");
      }

      state.settingsData = updatedSettings;

      state.snapshots.manager = createManagerSnapshot();

      setDirty("manager", false);

      await logActivity("manager_profile_saved", {
        user: getCurrentUser()?.username || "admin",
        username: collected.manager.login.username,
      });

      showSuccessMessage("Manager Profile সফলভাবে সংরক্ষণ হয়েছে।");
    } catch (error) {
      state.settingsData = previousSettings;

      await logError(error, "saveManagerProfile");

      showErrorMessage(
        "Manager Profile সংরক্ষণ করা যায়নি। আগের তথ্য রাখা হয়েছে।",
      );
    } finally {
      setDashboardLoading(false);
    }
  }


  /* =========================================================
     CONTACT LINKS
  ========================================================= */

  function normalizeLink(rawLink) {
    const iconManager = getIconManager();

    if (
      iconManager &&
      typeof iconManager.normalizeContactLink === "function"
    ) {
      return iconManager.normalizeContactLink(rawLink);
    }

    const name = trim(rawLink?.name);
    const url = normalizeURL(rawLink?.url);

    if (!url) {
      return null;
    }

    return {
      name: name || "Link",
      url,
      domain: getDomain(url),
      iconKey: "",
      icon: "",
      platform: "",
    };
  }

  function normalizeLinks(links) {
    if (!Array.isArray(links)) {
      return [];
    }

    const normalized = [];
    const seen = new Set();

    links.forEach((item) => {
      const link = normalizeLink(item);

      if (!link || !link.url) {
        return;
      }

      const key = link.url.toLowerCase();

      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      normalized.push(link);
    });

    return normalized.slice(0, MAX_LINKS);
  }

  function getLinksBySection(section) {
    if (section === "website") {
      return Array.isArray(state.siteData?.contactLinks)
        ? state.siteData.contactLinks
        : [];
    }

    if (section === "admin") {
      return Array.isArray(state.settingsData?.admin?.contactLinks)
        ? state.settingsData.admin.contactLinks
        : [];
    }

    if (section === "manager") {
      return Array.isArray(state.settingsData?.manager?.contactLinks)
        ? state.settingsData.manager.contactLinks
        : [];
    }

    return [];
  }

  function setLinksBySection(section, links) {
    const normalized = normalizeLinks(links);

    if (section === "website") {
      state.siteData.contactLinks = normalized;
      return;
    }

    if (section === "admin") {
      state.settingsData.admin.contactLinks = normalized;
      return;
    }

    if (section === "manager") {
      state.settingsData.manager.contactLinks = normalized;
    }
  }

  function renderLinks(containerId, links, section) {
    const container = $(containerId);

    if (!container) {
      return;
    }

    container.innerHTML = "";

    const normalizedLinks = normalizeLinks(links);

    if (!normalizedLinks.length) {
      const empty = document.createElement("p");

      empty.className = "links-empty";
      empty.textContent = "কোনো Contact Link যোগ করা হয়নি।";

      container.appendChild(empty);
      return;
    }

    normalizedLinks.forEach((link, index) => {
      const wrapper = document.createElement("div");

      wrapper.className = "managed-link-item";

      const icon = document.createElement("img");

      icon.className = "managed-link-icon";
      icon.alt = "";

      if (link.icon) {
        icon.src = link.icon;
      } else {
        icon.hidden = true;
      }

      const info = document.createElement("div");

      info.className = "managed-link-info";

      const name = document.createElement("strong");

      name.textContent = link.name || "Link";

      const url = document.createElement("span");

      url.textContent = link.url;

      info.appendChild(name);
      info.appendChild(url);

      const actions = document.createElement("div");

      actions.className = "managed-link-actions";

      const editButton = document.createElement("button");

      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => {
        editLink(section, index);
      });

      const removeButton = document.createElement("button");

      removeButton.type = "button";
      removeButton.textContent = "Remove";
      removeButton.addEventListener("click", () => {
        removeLink(section, index);
      });

      actions.appendChild(editButton);
      actions.appendChild(removeButton);

      wrapper.appendChild(icon);
      wrapper.appendChild(info);
      wrapper.appendChild(actions);

      container.appendChild(wrapper);
    });
  }

  function getNewLinkFields(section) {
    if (section === "website") {
      return {
        name: $("newWebsiteLinkName"),
        url: $("newWebsiteLinkUrl"),
      };
    }

    if (section === "admin") {
      return {
        name: $("newAdminLinkName"),
        url: $("newAdminLinkUrl"),
      };
    }

    if (section === "manager") {
      return {
        name: $("newManagerLinkName"),
        url: $("newManagerLinkUrl"),
      };
    }

    return {
      name: null,
      url: null,
    };
  }

  function clearNewLinkFields(section) {
    const fields = getNewLinkFields(section);

    if (fields.name) {
      fields.name.value = "";
    }

    if (fields.url) {
      fields.url.value = "";
    }
  }

  function addLink(section) {
    if (!checkAdminPermission("contactLinks")) {
      return;
    }

    const fields = getNewLinkFields(section);

    if (!fields.name || !fields.url) {
      return;
    }

    const name = trim(fields.name.value);
    const rawURL = trim(fields.url.value);

    if (!name) {
      showErrorMessage("Link Name দিন।");
      return;
    }

    if (!rawURL) {
      showErrorMessage("Link URL দিন।");
      return;
    }

    const url = normalizeURL(rawURL);

    if (!url) {
      showErrorMessage("Link URL সঠিক নয়।");
      return;
    }

    if (!isAllowedContactURL(url)) {
      showErrorMessage(
        "শুধু Facebook, YouTube, WhatsApp এবং TikTok link ব্যবহার করা যাবে।",
      );
      return;
    }

    const links = getLinksBySection(section);

    if (links.length >= MAX_LINKS) {
      showErrorMessage(`সর্বোচ্চ ${MAX_LINKS}টি link রাখা যাবে।`);
      return;
    }

    const exists = links.some(
      (item) =>
        normalizeURL(item.url).toLowerCase() === url.toLowerCase(),
    );

    if (exists) {
      showErrorMessage("এই URL আগে থেকেই যোগ করা আছে।");
      return;
    }

    const newLink = normalizeLink({
      name,
      url,
    });

    if (!newLink) {
      showErrorMessage("Link তৈরি করা যায়নি।");
      return;
    }

    links.push(newLink);

    setLinksBySection(section, links);

    renderLinks(
      section === "website"
        ? "websiteContactLinks"
        : section === "admin"
          ? "adminContactLinks"
          : "managerContactLinks",
      links,
      section,
    );

    clearNewLinkFields(section);

    setDirty(section, true);

    logActivity("contact_link_added", {
      section,
      url: newLink.url,
    });
  }

  function editLink(section, index) {
    const links = getLinksBySection(section);

    const link = links[index];

    if (!link) {
      return;
    }

    const newName = prompt(
      "Link Name পরিবর্তন করুন:",
      link.name || "",
    );

    if (newName === null) {
      return;
    }

    const cleanName = trim(newName);

    if (!cleanName) {
      showErrorMessage("Link Name খালি রাখা যাবে না।");
      return;
    }

    const newURL = prompt(
      "Link URL পরিবর্তন করুন:",
      link.url || "",
    );

    if (newURL === null) {
      return;
    }

    const normalizedURL = normalizeURL(newURL);

    if (!normalizedURL || !isAllowedContactURL(normalizedURL)) {
      showErrorMessage("এই URL গ্রহণযোগ্য নয়।");
      return;
    }

    const duplicate = links.some(
      (item, itemIndex) =>
        itemIndex !== index &&
        normalizeURL(item.url).toLowerCase() ===
          normalizedURL.toLowerCase(),
    );

    if (duplicate) {
      showErrorMessage("এই URL আগে থেকেই ব্যবহার করা হয়েছে।");
      return;
    }

    const updatedLink = normalizeLink({
      name: cleanName,
      url: normalizedURL,
    });

    if (!updatedLink) {
      showErrorMessage("Link update করা যায়নি।");
      return;
    }

    links[index] = updatedLink;

    setLinksBySection(section, links);

    renderLinks(
      section === "website"
        ? "websiteContactLinks"
        : section === "admin"
          ? "adminContactLinks"
          : "managerContactLinks",
      links,
      section,
    );

    setDirty(section, true);

    logActivity("contact_link_updated", {
      section,
      url: updatedLink.url,
    });
  }

  function removeLink(section, index) {
    const links = getLinksBySection(section);

    const link = links[index];

    if (!link) {
      return;
    }

    const confirmed = confirm(
      `"${link.name || "এই link"}" মুছে ফেলবেন?`,
    );

    if (!confirmed) {
      return;
    }

    links.splice(index, 1);

    setLinksBySection(section, links);

    renderLinks(
      section === "website"
        ? "websiteContactLinks"
        : section === "admin"
          ? "adminContactLinks"
          : "managerContactLinks",
      links,
      section,
    );

    setDirty(section, true);

    logActivity("contact_link_removed", {
      section,
      url: link.url,
    });
  }


  /* =========================================================
     URL / CONTACT VALIDATION
  ========================================================= */

  function normalizeURL(value) {
    let raw = trim(value);

    if (!raw) {
      return "";
    }

    if (!/^https?:\/\//i.test(raw)) {
      raw = `https://${raw}`;
    }

    try {
      const parsed = new URL(raw);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        return "";
      }

      return parsed.href;
    } catch (error) {
      return "";
    }
  }

  function getDomain(url) {
    try {
      return new URL(url).hostname
        .toLowerCase()
        .replace(/^www\./, "");
    } catch (error) {
      return "";
    }
  }

  function isAllowedContactURL(url) {
    const iconManager = getIconManager();

    if (
      iconManager &&
      typeof iconManager.isSupportedContactURL === "function"
    ) {
      return iconManager.isSupportedContactURL(url);
    }

    const domain = getDomain(url);

    return (
      domain === "facebook.com" ||
      domain.endsWith(".facebook.com") ||
      domain === "youtube.com" ||
      domain.endsWith(".youtube.com") ||
      domain === "youtu.be" ||
      domain === "whatsapp.com" ||
      domain.endsWith(".whatsapp.com") ||
      domain === "wa.me" ||
      domain === "tiktok.com" ||
      domain.endsWith(".tiktok.com")
    );
  }

  function isValidEmail(value) {
    const email = trim(value);

    if (!email) {
      return true;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }


  /* =========================================================
     INPUT HELPERS
  ========================================================= */

  function getInputValue(id) {
    const element = $(id);

    return element ? element.value.trim() : "";
  }

  function setInputValue(id, value) {
    const element = $(id);

    if (element) {
      element.value = safeString(value);
    }
  }

  function getCheckbox(id) {
    const element = $(id);

    return element ? Boolean(element.checked) : false;
  }

  function setCheckbox(id, value) {
    const element = $(id);

    if (element) {
      element.checked = Boolean(value);
    }
  }


  /* =========================================================
     EVENTS
  ========================================================= */

  function setupEvents() {
    const websiteAdd = $("addWebsiteLinkButton");

    if (websiteAdd) {
      websiteAdd.addEventListener("click", () => {
        addLink("website");
      });
    }

    const adminAdd = $("addAdminLinkButton");

    if (adminAdd) {
      adminAdd.addEventListener("click", () => {
        addLink("admin");
      });
    }

    const managerAdd = $("addManagerLinkButton");

    if (managerAdd) {
      managerAdd.addEventListener("click", () => {
        addLink("manager");
      });
    }

    const websiteSave = $("saveWebsiteButton");

    if (websiteSave) {
      websiteSave.addEventListener("click", saveWebsiteInformation);
    }

    const adminSave = $("saveAdminButton");

    if (adminSave) {
      adminSave.addEventListener("click", saveAdminProfile);
    }

    const managerSave = $("saveManagerButton");

    if (managerSave) {
      managerSave.addEventListener("click", saveManagerProfile);
    }

    const logoutButton = $("logoutButton");

    if (logoutButton) {
      logoutButton.dataset.lockDuringLoading = "false";

      logoutButton.addEventListener("click", logout);
    }
  }


  /* =========================================================
     LOGOUT
  ========================================================= */

  async function logout() {
    if (state.saving) {
      return;
    }

    if (isDirty()) {
      const confirmed = confirm(
        "কিছু পরিবর্তন এখনো Save করা হয়নি। Logout করলে সেগুলো হারিয়ে যাবে।\n\nLogout করবেন?",
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      await logActivity("admin_logout", {
        user: getCurrentUser()?.username || "admin",
      });

      if (
        getDataLayer() &&
        typeof getDataLayer().logout === "function"
      ) {
        await getDataLayer().logout();
      } else {
        sessionStorage.removeItem("dalimgariUser");
      }
    } catch (error) {
      await logError(error, "logout");

      try {
        sessionStorage.removeItem("dalimgariUser");
      } catch (removeError) {
        console.error(removeError);
      }
    }

    window.location.replace("login.html");
  }


  /* =========================================================
     INITIALIZATION
  ========================================================= */

  async function initialize() {
    if (!checkAdminLogin()) {
      return;
    }

    if (!checkAdminPermission()) {
      return;
    }

    showLoadingMessage();
    setDashboardLoading(true);

    try {
      state.siteData = await getSiteDataSafe();
      state.settingsData = await getSettingsDataSafe();

      loadWebsiteInformation();
      loadAdminProfile();
      loadManagerProfile();

      setupTabs();
      setupEvents();
      setupDirtyTracking();

      updateSnapshots();

      state.ready = true;

      hideLoadingMessage();

      await logActivity("admin_dashboard_opened", {
        user: getCurrentUser()?.username || "admin",
      });
    } catch (error) {
      await logError(error, "initialize");

      hideLoadingMessage();

      showErrorMessage(
        "Admin Dashboard চালু করা যায়নি।\n\nপেজটি আবার খুলে চেষ্টা করুন।",
      );
    } finally {
      setDashboardLoading(false);
    }
  }


  /* =========================================================
     PAGE LIFECYCLE
  ========================================================= */

  window.addEventListener("pageshow", () => {
    if (!state.ready) {
      checkAdminLogin();
    }
  });

  window.addEventListener("error", (event) => {
    logError(
      event.error || new Error(event.message || "Unknown error"),
      "window.error",
    );
  });

  window.addEventListener("unhandledrejection", (event) => {
    logError(
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason)),
      "unhandledrejection",
    );
  });


  /* =========================================================
     PUBLIC API
  ========================================================= */

  return {
    initialize,

    getState: () => ({
      ...state,
      dirty: {
        ...state.dirty,
      },
    }),

    saveWebsiteInformation,
    saveAdminProfile,
    saveManagerProfile,

    addLink,
    editLink,
    removeLink,

    logout,

    showTab,
  };
})();


/* =========================================================
   START APPLICATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  DalimgariAdminDashboard.initialize();
});


/* =========================================================
   LEGACY / DEBUG ACCESS
========================================================= */

window.DalimgariAdminDashboard = DalimgariAdminDashboard;