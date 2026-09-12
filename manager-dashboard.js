/*
 * Dalimgari Manager Dashboard
 * Manager Control Layer v2
 *
 * Responsibilities:
 * - Manager authentication
 * - Permission-based access
 * - Village information management
 * - People management foundation
 * - Image management foundation
 * - Video management foundation
 * - Audio management foundation
 * - Event management foundation
 * - Unsaved-change protection
 * - Error/activity logging
 *
 * Security note:
 * Offline permissions are client-side only.
 * Online deployment must enforce permissions on the backend.
 */

"use strict";

const DalimgariManagerDashboard = (() => {

  /* =========================================================
     CONFIG
  ========================================================= */

  const ALLOWED_TABS = [
    "village",
    "people",
    "images",
    "videos",
    "audio",
    "events",
  ];

  const DEFAULT_TAB = "village";

  const MAX_ITEMS = 500;

  const state = {
    siteData: null,
    settingsData: null,
    currentUser: null,

    ready: false,
    saving: false,
    logoutInProgress: false,

    dirty: {
      village: false,
      people: false,
      images: false,
      videos: false,
      audio: false,
      events: false,
    },

    snapshots: {
      village: "",
      people: "",
      images: "",
      videos: "",
      audio: "",
      events: "",
    },

    activeTab: DEFAULT_TAB,
  };


  /* =========================================================
     HELPERS
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

  function getDataLayer() {
    return window.DalimgariDataLayer || null;
  }


  /* =========================================================
     LOGGING
  ========================================================= */

  async function logError(error, context) {

    try {

      const dataLayer =
        getDataLayer();

      if (
        dataLayer &&
        typeof dataLayer.logError ===
          "function"
      ) {

        await dataLayer.logError(
          error,
          context
        );
      }

    } catch (loggingError) {

      console.error(
        "Manager error logging failed:",
        loggingError
      );
    }

    console.error(
      `[${context}]`,
      error
    );
  }


  async function logActivity(
    action,
    details = {}
  ) {

    try {

      const dataLayer =
        getDataLayer();

      if (
        dataLayer &&
        typeof dataLayer.logActivity ===
          "function"
      ) {

        await dataLayer.logActivity(
          action,
          details
        );
      }

    } catch (error) {

      console.error(
        "Manager activity logging failed:",
        error
      );
    }
  }


  /* =========================================================
     AUTHENTICATION
  ========================================================= */

  function getCurrentUser() {

    try {

      const raw =
        sessionStorage.getItem(
          "dalimgariUser"
        );

      if (!raw) {
        return null;
      }

      const user =
        JSON.parse(raw);

      if (
        !user ||
        typeof user !== "object"
      ) {
        return null;
      }

      return user;

    } catch (error) {

      console.error(
        "manager.getCurrentUser failed:",
        error
      );

      return null;
    }
  }


  function clearLocalSession() {

    try {

      sessionStorage.removeItem(
        "dalimgariUser"
      );

    } catch (error) {

      console.error(
        "Manager session remove failed:",
        error
      );

    } finally {

      state.currentUser = null;
    }
  }


  function checkManagerLogin() {

    const user =
      getCurrentUser();


    if (
      !user ||
      user.role !== "manager"
    ) {

      clearLocalSession();

      window.location.replace(
        "login.html"
      );

      return false;
    }


    state.currentUser =
      user;


    return true;
  }


  /* =========================================================
     PERMISSIONS
  ========================================================= */

  function getPermissions() {
    return state.settingsData?.permissions || {};
  }


  function hasPermission(
    permission
  ) {

    if (
      !checkManagerLogin()
    ) {
      return false;
    }

    const permissions =
      getPermissions();

    return permissions[permission] === true;
  }


  function requirePermission(
    permission
  ) {

    if (
      hasPermission(permission)
    ) {
      return true;
    }

    showErrorMessage(
      "এই কাজটি করার জন্য আপনার অনুমতি নেই।"
    );

    return false;
  }


  /* =========================================================
     UI
  ========================================================= */

  function setDashboardLoading(
    loading
  ) {

    state.saving =
      Boolean(loading);


    document.body.classList.toggle(
      "dashboard-loading",
      state.saving
    );


    document
      .querySelectorAll("button")
      .forEach((button) => {

        /*
         * Logout button can remain enabled
         * during loading/saving.
         */

        if (
          button.dataset
            .lockDuringLoading ===
          "false"
        ) {
          return;
        }

        button.disabled =
          state.saving;
      });
  }


  function showErrorMessage(
    message
  ) {

    alert(
      `সমস্যা হয়েছে:\n\n${message}`
    );
  }


  function showSuccessMessage(
    message
  ) {

    alert(message);
  }


  /* =========================================================
     DIRTY STATE
  ========================================================= */

  function setDirty(
    section,
    value = true
  ) {

    if (
      !(section in state.dirty)
    ) {
      return;
    }

    state.dirty[section] =
      Boolean(value);


    const tab =
      document.querySelector(
        `.admin-nav-link[data-tab="${section}"]`
      );


    if (tab) {

      tab.classList.toggle(
        "has-unsaved-changes",
        state.dirty[section]
      );
    }
  }


  function isDirty(
    section = null
  ) {

    if (section) {

      return Boolean(
        state.dirty[section]
      );
    }


    return Object.values(
      state.dirty
    ).some(Boolean);
  }


  function clearAllDirtyState() {

    Object.keys(
      state.dirty
    ).forEach((section) => {

      state.dirty[section] =
        false;


      const tab =
        document.querySelector(
          `.admin-nav-link[data-tab="${section}"]`
        );


      if (tab) {

        tab.classList.remove(
          "has-unsaved-changes"
        );

        tab.removeAttribute(
          "data-unsaved"
        );
      }
    });
  }


  window.addEventListener(
    "beforeunload",
    (event) => {

      if (!isDirty()) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }
  );


  /* =========================================================
     INPUT HELPERS
  ========================================================= */

  function getInputValue(
    id
  ) {

    const element =
      $(id);

    return element
      ? trim(element.value)
      : "";
  }


  function setInputValue(
    id,
    value
  ) {

    const element =
      $(id);

    if (element) {

      element.value =
        safeString(value);
    }
  }


  function getCheckbox(
    id
  ) {

    const element =
      $(id);

    return element
      ? Boolean(element.checked)
      : false;
  }


  function setCheckbox(
    id,
    value
  ) {

    const element =
      $(id);

    if (element) {

      element.checked =
        Boolean(value);
    }
  }


  /* =========================================================
     TAB SYSTEM
  ========================================================= */

  function getTabFromHash() {

    const hash =
      window.location.hash
        .replace("#", "")
        .trim();


    return ALLOWED_TABS.includes(
      hash
    )
      ? hash
      : DEFAULT_TAB;
  }


  function showTab(
    tabName,
    updateHash = true
  ) {

    const tab =
      ALLOWED_TABS.includes(
        tabName
      )
        ? tabName
        : DEFAULT_TAB;


    state.activeTab =
      tab;


    document
      .querySelectorAll(
        ".admin-nav-link"
      )
      .forEach((link) => {

        const active =
          link.dataset.tab ===
          tab;


        link.classList.toggle(
          "active",
          active
        );


        if (active) {

          link.setAttribute(
            "aria-current",
            "page"
          );

        } else {

          link.removeAttribute(
            "aria-current"
          );
        }
      });


    document
      .querySelectorAll(
        ".dashboard-tab-content"
      )
      .forEach(
        (section) => {

          section.classList.remove(
            "active"
          );
        }
      );


    const target =
      $(`${tab}Tab`);


    if (target) {

      target.classList.add(
        "active"
      );
    }


    if (
      updateHash &&
      window.location.hash !==
        `#${tab}`
    ) {

      history.replaceState(
        null,
        "",
        `#${tab}`
      );
    }
  }


  function setupTabs() {

    document
      .querySelectorAll(
        ".admin-nav-link"
      )
      .forEach((link) => {

        link.addEventListener(
          "click",
          (event) => {

            event.preventDefault();


            const tab =
              link.dataset.tab;


            if (
              !ALLOWED_TABS.includes(
                tab
              )
            ) {
              return;
            }


            showTab(tab);
          }
        );
      });


    window.addEventListener(
      "hashchange",
      () => {

        showTab(
          getTabFromHash(),
          false
        );
      }
    );


    showTab(
      getTabFromHash(),
      false
    );
  }


  /* =========================================================
     VILLAGE INFORMATION
  ========================================================= */

  function loadVillageInformation() {

    const data =
      state.siteData || {};


    setInputValue(
      "villageName",
      data.villageName
    );


    setInputValue(
      "villageDescription",
      data.villageDescription
    );


    setInputValue(
      "detailedDescription",
      data.detailedDescription
    );


    setInputValue(
      "location",
      data.location
    );


    setInputValue(
      "history",
      data.history
    );


    setInputValue(
      "nature",
      data.nature
    );
  }


  function villageSnapshot() {

    return JSON.stringify({

      villageName:
        getInputValue(
          "villageName"
        ),

      villageDescription:
        getInputValue(
          "villageDescription"
        ),

      detailedDescription:
        getInputValue(
          "detailedDescription"
        ),

      location:
        getInputValue(
          "location"
        ),

      history:
        getInputValue(
          "history"
        ),

      nature:
        getInputValue(
          "nature"
        ),
    });
  }


  function setupVillageDirtyTracking() {

    [
      "villageName",
      "villageDescription",
      "detailedDescription",
      "location",
      "history",
      "nature",
    ].forEach((id) => {

      const element =
        $(id);


      if (!element) {
        return;
      }


      element.addEventListener(
        "input",
        () => {

          setDirty(
            "village",
            villageSnapshot() !==
              state.snapshots.village
          );
        }
      );


      element.addEventListener(
        "change",
        () => {

          setDirty(
            "village",
            villageSnapshot() !==
              state.snapshots.village
          );
        }
      );
    });
  }


  async function saveVillageInformation() {

    if (
      !requirePermission(
        "managerCanEditVillageInfo"
      )
    ) {
      return;
    }


    if (state.saving) {
      return;
    }


    const updatedData = {

      ...state.siteData,

      villageName:
        getInputValue(
          "villageName"
        ),

      villageDescription:
        getInputValue(
          "villageDescription"
        ),

      detailedDescription:
        getInputValue(
          "detailedDescription"
        ),

      location:
        getInputValue(
          "location"
        ),

      history:
        getInputValue(
          "history"
        ),

      nature:
        getInputValue(
          "nature"
        ),
    };


    if (
      !updatedData.villageName
    ) {

      showErrorMessage(
        "Village Name খালি রাখা যাবে না।"
      );

      return;
    }


    setDashboardLoading(
      true
    );


    try {

      if (
        typeof window.saveSiteData !==
        "function"
      ) {

        throw new Error(
          "saveSiteData function পাওয়া যায়নি।"
        );
      }


      const result =
        await window.saveSiteData(
          updatedData
        );


      if (
        result === false
      ) {

        throw new Error(
          "Village Information সংরক্ষণ করা যায়নি।"
        );
      }


      state.siteData =
        updatedData;


      state.snapshots.village =
        villageSnapshot();


      setDirty(
        "village",
        false
      );


      await logActivity(
        "manager_village_information_saved",
        {
          user:
            state.currentUser?.username ||
            "manager",
        }
      );


      showSuccessMessage(
        "Village Information সফলভাবে সংরক্ষণ হয়েছে।"
      );

    } catch (error) {

      await logError(
        error,
        "saveVillageInformation"
      );


      showErrorMessage(
        "Village Information সংরক্ষণ করা যায়নি।"
      );

    } finally {

      setDashboardLoading(
        false
      );
    }
  }


  /* =========================================================
     GENERIC LOCAL DATA COLLECTION
  ========================================================= */

  function getCollection(
    name
  ) {

    const collection =
      state.siteData?.[name];


    return Array.isArray(
      collection
    )
      ? collection
      : [];
  }


  function createID(
    prefix
  ) {

    if (
      window.DalimgariDataLayer &&
      typeof window.DalimgariDataLayer.generateId ===
        "function"
    ) {

      return window.DalimgariDataLayer.generateId(
        prefix
      );
    }


    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }


  function saveCollectionToState(
    name,
    items
  ) {

    state.siteData[name] =
      Array.isArray(items)
        ? items.slice(
            0,
            MAX_ITEMS
          )
        : [];
  }


  /* =========================================================
     PEOPLE
  ========================================================= */

  function renderPeople() {

    const container =
      $("peopleList");


    if (!container) {
      return;
    }


    container.innerHTML =
      "";


    const people =
      getCollection(
        "people"
      );


    if (!people.length) {

      const empty =
        document.createElement(
          "p"
        );


      empty.className =
        "empty-state";


      empty.textContent =
        "কোনো তথ্য যোগ করা হয়নি।";


      container.appendChild(
        empty
      );


      return;
    }


    people.forEach(
      (person, index) => {

        const item =
          createManagementItem(

            person.name ||
              "নাম নেই",

            person.description ||
              "",

            person.photo ||
              "",

            () =>
              removeCollectionItem(
                "people",
                index,
                "people"
              ),
          );


        container.appendChild(
          item
        );
      }
    );
  }


  async function addPerson() {

    if (
      !requirePermission(
        "managerCanManagePeople"
      )
    ) {
      return;
    }


    const name =
      getInputValue(
        "personName"
      );


    const description =
      getInputValue(
        "personDescription"
      );


    const photo =
      getInputValue(
        "personPhoto"
      );


    if (!name) {

      showErrorMessage(
        "ব্যক্তির নাম দিন।"
      );

      return;
    }


    const people =
      getCollection(
        "people"
      );


    people.push({

      id:
        createID(
          "person"
        ),

      name,

      description,

      photo,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),
    });


    saveCollectionToState(
      "people",
      people
    );


    clearFields([
      "personName",
      "personDescription",
      "personPhoto",
    ]);


    renderPeople();


    setDirty(
      "people",
      true
    );
  }


  /* =========================================================
     IMAGES
  ========================================================= */

  function renderImages() {

    renderGenericCollection(
      "imageList",
      "images",
      "title",
      "description",
      "path"
    );
  }


  async function addImage() {

    if (
      !requirePermission(
        "managerCanManageImages"
      )
    ) {
      return;
    }


    const title =
      getInputValue(
        "imageTitle"
      );


    const description =
      getInputValue(
        "imageDescription"
      );


    const path =
      getInputValue(
        "imagePath"
      );


    if (!title) {

      showErrorMessage(
        "ছবির নাম দিন।"
      );

      return;
    }


    if (!path) {

      showErrorMessage(
        "Image Path দিন।"
      );

      return;
    }


    const images =
      getCollection(
        "images"
      );


    images.push({

      id:
        createID(
          "image"
        ),

      title,

      description,

      path,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),
    });


    saveCollectionToState(
      "images",
      images
    );


    clearFields([
      "imageTitle",
      "imageDescription",
      "imagePath",
    ]);


    renderImages();


    setDirty(
      "images",
      true
    );
  }


  /* =========================================================
     VIDEOS
  ========================================================= */

  function renderVideos() {

    renderGenericCollection(
      "videoList",
      "videos",
      "title",
      "description",
      "path"
    );
  }


  async function addVideo() {

    if (
      !requirePermission(
        "managerCanManageVideos"
      )
    ) {
      return;
    }


    const title =
      getInputValue(
        "videoTitle"
      );


    const description =
      getInputValue(
        "videoDescription"
      );


    const path =
      getInputValue(
        "videoPath"
      );


    if (!title) {

      showErrorMessage(
        "ভিডিওর নাম দিন।"
      );

      return;
    }


    if (!path) {

      showErrorMessage(
        "Video Path দিন।"
      );

      return;
    }


    const videos =
      getCollection(
        "videos"
      );


    videos.push({

      id:
        createID(
          "video"
        ),

      title,

      description,

      path,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),
    });


    saveCollectionToState(
      "videos",
      videos
    );


    clearFields([
      "videoTitle",
      "videoDescription",
      "videoPath",
    ]);


    renderVideos();


    setDirty(
      "videos",
      true
    );
  }


  /* =========================================================
     AUDIO
  ========================================================= */

  function renderAudio() {

    renderGenericCollection(
      "audioList",
      "audio",
      "title",
      "description",
      "path"
    );
  }


  async function addAudio() {

    if (
      !requirePermission(
        "managerCanManageAudio"
      )
    ) {
      return;
    }


    const title =
      getInputValue(
        "audioTitle"
      );


    const description =
      getInputValue(
        "audioDescription"
      );


    const path =
      getInputValue(
        "audioPath"
      );


    if (!title) {

      showErrorMessage(
        "অডিওর নাম দিন।"
      );

      return;
    }


    if (!path) {

      showErrorMessage(
        "Audio Path দিন।"
      );

      return;
    }


    const audio =
      getCollection(
        "audio"
      );


    audio.push({

      id:
        createID(
          "audio"
        ),

      title,

      description,

      path,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),
    });


    saveCollectionToState(
      "audio",
      audio
    );


    clearFields([
      "audioTitle",
      "audioDescription",
      "audioPath",
    ]);


    renderAudio();


    setDirty(
      "audio",
      true
    );
  }


  /* =========================================================
     EVENTS
  ========================================================= */

  function renderEvents() {

    renderGenericCollection(
      "eventList",
      "events",
      "title",
      "description",
      "image"
    );
  }


  async function addEvent() {

    if (
      !requirePermission(
        "managerCanManageEvents"
      )
    ) {
      return;
    }


    const title =
      getInputValue(
        "eventTitle"
      );


    const date =
      getInputValue(
        "eventDate"
      );


    const description =
      getInputValue(
        "eventDescription"
      );


    const image =
      getInputValue(
        "eventImage"
      );


    if (!title) {

      showErrorMessage(
        "Event Title দিন।"
      );

      return;
    }


    if (!date) {

      showErrorMessage(
        "Event Date নির্বাচন করুন।"
      );

      return;
    }


    const events =
      getCollection(
        "events"
      );


    events.push({

      id:
        createID(
          "event"
        ),

      title,

      date,

      description,

      image,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),
    });


    saveCollectionToState(
      "events",
      events
    );


    clearFields([
      "eventTitle",
      "eventDate",
      "eventDescription",
      "eventImage",
    ]);


    renderEvents();


    setDirty(
      "events",
      true
    );
  }


  /* =========================================================
     GENERIC RENDERER
  ========================================================= */

  function renderGenericCollection(
    containerId,
    collectionName,
    titleKey,
    descriptionKey,
    mediaKey
  ) {

    const container =
      $(containerId);


    if (!container) {
      return;
    }


    container.innerHTML =
      "";


    const items =
      getCollection(
        collectionName
      );


    if (!items.length) {

      const empty =
        document.createElement(
          "p"
        );


      empty.className =
        "empty-state";


      empty.textContent =
        "কোনো তথ্য যোগ করা হয়নি।";


      container.appendChild(
        empty
      );


      return;
    }


    items.forEach(
      (item, index) => {

        const element =
          createManagementItem(

            item[titleKey] ||
              "তথ্য",

            item[descriptionKey] ||
              "",

            item[mediaKey] ||
              "",

            () =>
              removeCollectionItem(
                collectionName,
                index,
                collectionName
              )
          );


        container.appendChild(
          element
        );
      }
    );
  }


  function createManagementItem(
    title,
    description,
    media,
    removeCallback
  ) {

    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.className =
      "management-item";


    const content =
      document.createElement(
        "div"
      );


    content.className =
      "management-item-content";


    const heading =
      document.createElement(
        "strong"
      );


    heading.textContent =
      safeString(
        title
      );


    content.appendChild(
      heading
    );


    if (description) {

      const text =
        document.createElement(
          "p"
        );


      text.textContent =
        safeString(
          description
        );


      content.appendChild(
        text
      );
    }


    if (media) {

      const path =
        document.createElement(
          "small"
        );


      path.textContent =
        safeString(
          media
        );


      content.appendChild(
        path
      );
    }


    const actions =
      document.createElement(
        "div"
      );


    actions.className =
      "management-item-actions";


    const removeButton =
      document.createElement(
        "button"
      );


    removeButton.type =
      "button";


    removeButton.textContent =
      "Remove";


    removeButton.addEventListener(
      "click",
      removeCallback
    );


    actions.appendChild(
      removeButton
    );


    wrapper.appendChild(
      content
    );


    wrapper.appendChild(
      actions
    );


    return wrapper;
  }


  function removeCollectionItem(
    collectionName,
    index,
    dirtySection
  ) {

    const items =
      getCollection(
        collectionName
      );


    const item =
      items[index];


    if (!item) {
      return;
    }


    const confirmed =
      confirm(
        `"${item.name || item.title || "এই তথ্য"}" মুছে ফেলবেন?`
      );


    if (!confirmed) {
      return;
    }


    items.splice(
      index,
      1
    );


    saveCollectionToState(
      collectionName,
      items
    );


    if (
      collectionName ===
      "people"
    ) {

      renderPeople();

    } else if (
      collectionName ===
      "images"
    ) {

      renderImages();

    } else if (
      collectionName ===
      "videos"
    ) {

      renderVideos();

    } else if (
      collectionName ===
      "audio"
    ) {

      renderAudio();

    } else if (
      collectionName ===
      "events"
    ) {

      renderEvents();
    }


    setDirty(
      dirtySection,
      true
    );


    logActivity(
      "manager_collection_item_removed",
      {
        collection:
          collectionName,

        id:
          item.id ||
          "",
      }
    );
  }


  /* =========================================================
     SAVE MEDIA / COLLECTION DATA
  ========================================================= */

  async function saveCollection(
    section,
    collectionName
  ) {

    if (state.saving) {
      return;
    }


    setDashboardLoading(
      true
    );


    try {

      if (
        typeof window.saveSiteData !==
        "function"
      ) {

        throw new Error(
          "saveSiteData function পাওয়া যায়নি।"
        );
      }


      const result =
        await window.saveSiteData(
          state.siteData
        );


      if (
        result === false
      ) {

        throw new Error(
          `${collectionName} সংরক্ষণ করা যায়নি।`
        );
      }


      state.siteData =
        await window.getSiteData();


      setDirty(
        section,
        false
      );


      state.snapshots[section] =
        createCollectionSnapshot(
          collectionName
        );


      await logActivity(
        `manager_${collectionName}_saved`,
        {
          user:
            state.currentUser?.username ||
            "manager",
        }
      );


      showSuccessMessage(
        "পরিবর্তন সফলভাবে সংরক্ষণ হয়েছে।"
      );

    } catch (error) {

      await logError(
        error,
        `saveCollection.${collectionName}`
      );


      showErrorMessage(
        "পরিবর্তন সংরক্ষণ করা যায়নি।"
      );

    } finally {

      setDashboardLoading(
        false
      );
    }
  }


  /* =========================================================
     CLEAR FIELDS
  ========================================================= */

  function clearFields(
    ids
  ) {

    ids.forEach(
      (id) => {

        const element =
          $(id);


        if (element) {

          element.value =
            "";
        }
      }
    );
  }


  /* =========================================================
     SNAPSHOTS
  ========================================================= */

  function createCollectionSnapshot(
    name
  ) {

    return JSON.stringify(
      getCollection(
        name
      )
    );
  }


  function updateCollectionSnapshot(
    section,
    collectionName
  ) {

    state.snapshots[section] =
      createCollectionSnapshot(
        collectionName
      );


    setDirty(
      section,
      false
    );
  }


  /* =========================================================
     EVENT SETUP
  ========================================================= */

  function setupEvents() {

    /*
     * Logout button must remain enabled while
     * dashboard loading/saving is active.
     */

    const logoutButton =
      $("logoutButton");


    if (logoutButton) {

      logoutButton.dataset.lockDuringLoading =
        "false";


      logoutButton.addEventListener(
        "click",
        logout
      );
    }


    const saveVillageButton =
      $("saveVillageButton");


    if (saveVillageButton) {

      saveVillageButton.addEventListener(
        "click",
        saveVillageInformation
      );
    }


    const addPersonButton =
      $("addPersonButton");


    if (addPersonButton) {

      addPersonButton.addEventListener(
        "click",
        addPerson
      );
    }


    const addImageButton =
      $("addImageButton");


    if (addImageButton) {

      addImageButton.addEventListener(
        "click",
        addImage
      );
    }


    const addVideoButton =
      $("addVideoButton");


    if (addVideoButton) {

      addVideoButton.addEventListener(
        "click",
        addVideo
      );
    }


    const addAudioButton =
      $("addAudioButton");


    if (addAudioButton) {

      addAudioButton.addEventListener(
        "click",
        addAudio
      );
    }


    const addEventButton =
      $("addEventButton");


    if (addEventButton) {

      addEventButton.addEventListener(
        "click",
        addEvent
      );
    }
  }


  /* =========================================================
     COLLECTION DIRTY TRACKING
  ========================================================= */

  function setupCollectionDirtyTracking() {

    const definitions = [
      ["people", "people"],
      ["images", "images"],
      ["videos", "videos"],
      ["audio", "audio"],
      ["events", "events"],
    ];


    definitions.forEach(
      ([section, collectionName]) => {

        state.snapshots[section] =
          createCollectionSnapshot(
            collectionName
          );
      }
    );
  }


  /* =========================================================
     SAVE CURRENT COLLECTIONS
  ========================================================= */

  async function saveDirtyCollections() {

    const collections = [
      ["people", "people"],
      ["images", "images"],
      ["videos", "videos"],
      ["audio", "audio"],
      ["events", "events"],
    ];


    for (
      const [
        section,
        collectionName
      ]
      of collections
    ) {

      if (
        !isDirty(section)
      ) {
        continue;
      }


      await saveCollection(
        section,
        collectionName
      );
    }
  }


  /* =========================================================
     LOGOUT
  ========================================================= */

  async function logout() {

    /*
     * Prevent duplicate logout clicks.
     */

    if (
      state.logoutInProgress
    ) {
      return;
    }


    state.logoutInProgress =
      true;


    /*
     * Do not interrupt an active save.
     */

    if (state.saving) {

      state.logoutInProgress =
        false;

      return;
    }


    /*
     * Warn about unsaved changes.
     */

    if (isDirty()) {

      const confirmed =
        confirm(
          "কিছু পরিবর্তন এখনো Save করা হয়নি। Logout করলে সেগুলো হারিয়ে যেতে পারে।\n\nLogout করবেন?"
        );


      if (!confirmed) {

        state.logoutInProgress =
          false;

        return;
      }
    }


    /*
     * Save current user BEFORE clearing session.
     */

    const currentUser =
      state.currentUser ||
      getCurrentUser();


    /* =====================================================
       STEP 1
       Immediately invalidate temporary session.
    ===================================================== */

    clearLocalSession();


    /*
     * Prevent further dashboard actions.
     */

    state.ready =
      false;


    /*
     * Clear dirty state so beforeunload cannot
     * interfere with the redirect.
     */

    clearAllDirtyState();


    /* =====================================================
       STEP 2
       Best-effort Supabase Auth signOut.
       
       The current temporary RPC login does not create
       a Supabase Auth session. Therefore signOut failure
       must NEVER prevent logout.
    ===================================================== */

    try {

      const supabaseClient =
        window.DalimgariSupabase;


      if (
        supabaseClient &&
        supabaseClient.auth &&
        typeof supabaseClient.auth.signOut ===
          "function"
      ) {

        await supabaseClient.auth.signOut();
      }

    } catch (error) {

      console.warn(
        "Supabase signOut failed, but logout will continue:",
        error
      );
    }


    /* =====================================================
       STEP 3
       Activity logging is optional.
       
       Logging failure must NEVER prevent logout.
    ===================================================== */

    try {

      const dataLayer =
        getDataLayer();


      if (
        dataLayer &&
        typeof dataLayer.logActivity ===
          "function"
      ) {

        await dataLayer.logActivity(
          "manager_logout",
          {
            user:
              currentUser?.username ||
              "manager",
          }
        );
      }

    } catch (error) {

      console.warn(
        "Logout activity logging failed:",
        error
      );
    }


    /* =====================================================
       STEP 4
       Final safety removal.
    ===================================================== */

    clearLocalSession();


    /* =====================================================
       STEP 5
       Redirect to login.
    ===================================================== */

    window.location.replace(
      "login.html"
    );
  }


  /* =========================================================
     INITIALIZATION
  ========================================================= */

  async function initialize() {

    if (
      !checkManagerLogin()
    ) {
      return;
    }


    setDashboardLoading(
      true
    );


    try {

      if (
        typeof window.getSiteData !==
        "function"
      ) {

        throw new Error(
          "getSiteData function পাওয়া যায়নি।"
        );
      }


      if (
        typeof window.getSettingsData !==
        "function"
      ) {

        throw new Error(
          "getSettingsData function পাওয়া যায়নি।"
        );
      }


      state.siteData =
        await window.getSiteData();


      state.settingsData =
        await window.getSettingsData();


      loadVillageInformation();


      renderPeople();

      renderImages();

      renderVideos();

      renderAudio();

      renderEvents();


      setupTabs();

      setupEvents();

      setupVillageDirtyTracking();

      setupCollectionDirtyTracking();


      state.snapshots.village =
        villageSnapshot();


      state.snapshots.people =
        createCollectionSnapshot(
          "people"
        );


      state.snapshots.images =
        createCollectionSnapshot(
          "images"
        );


      state.snapshots.videos =
        createCollectionSnapshot(
          "videos"
        );


      state.snapshots.audio =
        createCollectionSnapshot(
          "audio"
        );


      state.snapshots.events =
        createCollectionSnapshot(
          "events"
        );


      Object.keys(
        state.dirty
      ).forEach(
        (section) => {

          setDirty(
            section,
            false
          );
        }
      );


      state.ready =
        true;


      await logActivity(
        "manager_dashboard_opened",
        {
          user:
            state.currentUser?.username ||
            "manager",
        }
      );

    } catch (error) {

      await logError(
        error,
        "manager.initialize"
      );


      showErrorMessage(
        "Manager Dashboard চালু করা যায়নি। পেজটি আবার খুলে চেষ্টা করুন।"
      );

    } finally {

      setDashboardLoading(
        false
      );
    }
  }


  /* =========================================================
     LIFECYCLE
  ========================================================= */

  window.addEventListener(
    "pageshow",
    (event) => {

      /*
       * Re-check authentication when the dashboard
       * returns from browser Back/Forward cache.
       */

      if (
        event.persisted ||
        !state.ready
      ) {

        checkManagerLogin();
      }
    }
  );


  /*
   * Extra protection when a cached dashboard
   * becomes visible again.
   */

  document.addEventListener(
    "visibilitychange",
    () => {

      if (
        document.visibilityState ===
          "visible" &&
        state.ready
      ) {

        const user =
          getCurrentUser();


        if (
          !user ||
          user.role !== "manager"
        ) {

          clearLocalSession();

          clearAllDirtyState();

          window.location.replace(
            "login.html"
          );
        }
      }
    }
  );


  window.addEventListener(
    "error",
    (event) => {

      logError(
        event.error ||
          new Error(
            event.message ||
              "Unknown error"
          ),
        "manager.window.error"
      );
    }
  );


  window.addEventListener(
    "unhandledrejection",
    (event) => {

      logError(
        event.reason instanceof Error
          ? event.reason
          : new Error(
              String(
                event.reason
              )
            ),
        "manager.unhandledrejection"
      );
    }
  );


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

    hasPermission,

    showTab,

    addPerson,

    addImage,

    addVideo,

    addAudio,

    addEvent,

    saveVillageInformation,

    saveCollection,

    logout,
  };

})();


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    DalimgariManagerDashboard.initialize();

  }
);


/* =========================================================
   GLOBAL ACCESS
========================================================= */

window.DalimgariManagerDashboard =
  DalimgariManagerDashboard;