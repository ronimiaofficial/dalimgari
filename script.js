// ==================================================
// ডালিমগাড়ী — Frontend Application Layer v3
// ==================================================
// কাজ:
// - Public website rendering
// - Page navigation
// - Village information
// - People
// - Images
// - Videos
// - Audio
// - Events
// - Sidebar
// - Profiles
// - Contact links
// - SEO
// - Loading / Empty / Error state
// - Safe DOM rendering
// ==================================================


// ==================================================
// 1. Application State
// ==================================================

const DalimgariApp = {

    siteData: null,

    settingsData: null,

    currentPage:
        "home",

    initialized:
        false

};


// ==================================================
// 2. Configuration
// ==================================================

const DALIMGARI_PAGES = [

    "home",
    "about",
    "contact"

];


const DALIMGARI_EMPTY_MESSAGE =
    "কোনো তথ্য যোগ করা হয়নি।";


// ==================================================
// 3. Safe Helpers
// ==================================================

function appSafeString(
    value,
    fallback
) {

    if (
        value === undefined ||
        value === null
    ) {

        return (
            fallback !== undefined
                ? fallback
                : ""
        );

    }


    return String(value);

}


function escapeHTML(
    value
) {

    return appSafeString(
        value,
        ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


function getElement(
    id
) {

    return document.getElementById(
        id
    );

}


// ==================================================
// 4. Page Content Helpers
// ==================================================

function createSection(
    title,
    content
) {

    const section =
        document.createElement(
            "section"
        );


    section.className =
        "content-section";


    const heading =
        document.createElement(
            "h2"
        );


    heading.textContent =
        title;


    section.appendChild(
        heading
    );


    const body =
        document.createElement(
            "div"
        );


    body.className =
        "section-body";


    if (
        content instanceof
        Node
    ) {

        body.appendChild(
            content
        );

    } else {

        const text =
            appSafeString(
                content,
                ""
            );


        if (
            text.trim()
        ) {

            body.textContent =
                text;

        } else {

            body.textContent =
                DALIMGARI_EMPTY_MESSAGE;

        }

    }


    section.appendChild(
        body
    );


    return section;

}


function createEmptyMessage() {

    const element =
        document.createElement(
            "p"
        );


    element.className =
        "empty-message";


    element.textContent =
        DALIMGARI_EMPTY_MESSAGE;


    return element;

}


// ==================================================
// 5. URL Safety
// ==================================================

function isSafeMediaPath(
    value
) {

    const path =
        appSafeString(
            value,
            ""
        ).trim();


    if (!path) {
        return false;
    }


    const lower =
        path.toLowerCase();


    if (
        lower.startsWith(
            "javascript:"
        ) ||
        lower.startsWith(
            "data:text/html"
        ) ||
        lower.startsWith(
            "vbscript:"
        )
    ) {

        return false;

    }


    return true;

}


function normalizeContactURL(
    value
) {

    const raw =
        appSafeString(
            value,
            ""
        ).trim();


    if (!raw) {
        return "";
    }


    try {

        const candidate =
            /^https?:\/\//i.test(
                raw
            )
                ? raw
                : "https://" + raw;


        const url =
            new URL(
                candidate
            );


        if (
            url.protocol !==
                "http:" &&
            url.protocol !==
                "https:"
        ) {

            return "";

        }


        return url.href;


    } catch (error) {

        return "";

    }

}


// ==================================================
// 6. Contact Link Renderer
// ==================================================

function createContactLink(
    link
) {

    if (
        !link ||
        typeof link !==
        "object"
    ) {

        return null;

    }


    const url =
        normalizeContactURL(
            link.url
        );


    if (!url) {
        return null;
    }


    const anchor =
        document.createElement(
            "a"
        );


    anchor.href =
        url;


    anchor.target =
        "_blank";


    anchor.rel =
        "noopener noreferrer";


    anchor.className =
        "contact-link";


    const icon =
        document.createElement(
            "img"
        );


    const iconPath =
        appSafeString(
            link.icon ||
            link.iconPath ||
            "",
            ""
        );


    if (
        iconPath &&
        isSafeMediaPath(
            iconPath
        )
    ) {

        icon.src =
            iconPath;

    }


    icon.alt =
        appSafeString(
            link.name,
            "Contact"
        );


    icon.loading =
        "lazy";


    icon.addEventListener(
        "error",
        function() {

            icon.style.display =
                "none";

        }
    );


    anchor.appendChild(
        icon
    );


    const label =
        document.createElement(
            "span"
        );


    label.textContent =
        appSafeString(
            link.name,
            "Link"
        );


    anchor.appendChild(
        label
    );


    return anchor;

}


function renderContactLinks(
    container,
    links
) {

    if (!container) {
        return;
    }


    container.replaceChildren();


    if (
        !Array.isArray(links) ||
        links.length === 0
    ) {

        return;

    }


    links.forEach(
        function(link) {

            const element =
                createContactLink(
                    link
                );


            if (element) {

                container.appendChild(
                    element
                );

            }

        }
    );

}


// ==================================================
// 7. Sidebar
// ==================================================

function openSidebar() {

    const sidebar =
        getElement(
            "sidebar"
        );


    const overlay =
        getElement(
            "sidebarOverlay"
        );


    const openButton =
        getElement(
            "sidebarOpenButton"
        );


    if (sidebar) {

        sidebar.classList.add(
    "open"
);

sidebar.classList.add(
    "active"
);

        sidebar.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    if (overlay) {

        overlay.classList.add(
            "active"
        );

    }


    if (openButton) {

        openButton.setAttribute(
            "aria-expanded",
            "true"
        );

    }

}


function closeSidebar() {

    const sidebar =
        getElement(
            "sidebar"
        );


    const overlay =
        getElement(
            "sidebarOverlay"
        );


    const openButton =
        getElement(
            "sidebarOpenButton"
        );


    if (sidebar) {

        sidebar.classList.remove(
    "open"
);

sidebar.classList.remove(
    "active"
);

        sidebar.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "active"
        );

    }


    if (openButton) {

        openButton.setAttribute(
            "aria-expanded",
            "false"
        );

    }

}


function setupSidebar() {

    const openButton =
        getElement(
            "sidebarOpenButton"
        );


    const closeButton =
        getElement(
            "sidebarCloseButton"
        );


    const overlay =
        getElement(
            "sidebarOverlay"
        );


    if (openButton) {

        openButton.addEventListener(
            "click",
            openSidebar
        );

        openButton.setAttribute(
            "aria-expanded",
            "false"
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeSidebar
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeSidebar
        );

    }


    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key ===
                "Escape"
            ) {

                closeSidebar();

            }

        }
    );

}


// ==================================================
// 8. Image Element Helper
// ==================================================

function createSafeImage(
    source,
    altText,
    className
) {

    const image =
        document.createElement(
            "img"
        );


    image.className =
        className || "";


    image.alt =
        appSafeString(
            altText,
            ""
        );


    image.loading =
        "lazy";


    const path =
        appSafeString(
            source,
            ""
        ).trim();


    if (
        path &&
        isSafeMediaPath(
            path
        )
    ) {

        image.src =
            path;

    }


    image.addEventListener(
        "error",
        function() {

            image.classList.add(
                "media-error"
            );

            image.removeAttribute(
                "src"
            );

        }
    );


    return image;

}


// ==================================================
// 9. Collection Card Helper
// ==================================================

function createCollectionCard(
    item,
    type
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "collection-card";


    const title =
        document.createElement(
            "h3"
        );


    let itemTitle =
        "";


    if (
        type ===
        "person"
    ) {

        itemTitle =
            appSafeString(
                item.name,
                ""
            );

    } else {

        itemTitle =
            appSafeString(
                item.title,
                ""
            );

    }


    title.textContent =
        itemTitle ||
        DALIMGARI_EMPTY_MESSAGE;


    card.appendChild(
        title
    );


    // ----------------------------------------------
    // Person / Image / Event Image
    // ----------------------------------------------

    let imagePath =
        "";


    if (
        type ===
        "person"
    ) {

        imagePath =
            appSafeString(
                item.photo,
                ""
            );

    }


    if (
        type ===
        "image"
    ) {

        imagePath =
            appSafeString(
                item.path,
                ""
            );

    }


    if (
        type ===
        "event"
    ) {

        imagePath =
            appSafeString(
                item.image,
                ""
            );

    }


    if (imagePath) {

        const image =
            createSafeImage(
                imagePath,
                itemTitle,
                "collection-image"
            );


        card.appendChild(
            image
        );

    }


    // ----------------------------------------------
    // Video
    // ----------------------------------------------

    if (
        type ===
        "video"
    ) {

        const videoPath =
            appSafeString(
                item.path,
                ""
            ).trim();


        if (
            videoPath &&
            isSafeMediaPath(
                videoPath
            )
        ) {

            const video =
                document.createElement(
                    "video"
                );


            video.className =
                "collection-video";


            video.controls =
                true;


            video.preload =
                "metadata";


            video.playsInline =
                true;


            const source =
                document.createElement(
                    "source"
                );


            source.src =
                videoPath;


            source.type =
                "video/mp4";


            video.appendChild(
                source
            );


            card.appendChild(
                video
            );

        }

    }


    // ----------------------------------------------
    // Audio
    // ----------------------------------------------

    if (
        type ===
        "audio"
    ) {

        const audioPath =
            appSafeString(
                item.path,
                ""
            ).trim();


        if (
            audioPath &&
            isSafeMediaPath(
                audioPath
            )
        ) {

            const audio =
                document.createElement(
                    "audio"
                );


            audio.className =
                "collection-audio";


            audio.controls =
                true;


            audio.preload =
                "metadata";


            audio.src =
                audioPath;


            card.appendChild(
                audio
            );

        }

    }


    // ----------------------------------------------
    // Date
    // ----------------------------------------------

    if (
        type ===
        "event" &&
        item.date
    ) {

        const date =
            document.createElement(
                "p"
            );


        date.className =
            "collection-date";


        date.textContent =
            appSafeString(
                item.date,
                ""
            );


        card.appendChild(
            date
        );

    }


    // ----------------------------------------------
    // Description
    // ----------------------------------------------

    const description =
        document.createElement(
            "p"
        );


    description.className =
        "collection-description";


    const descriptionText =
        appSafeString(
            item.description,
            ""
        ).trim();


    description.textContent =
        descriptionText ||
        DALIMGARI_EMPTY_MESSAGE;


    card.appendChild(
        description
    );


    return card;

}


// ==================================================
// 10. Collection Renderer
// ==================================================

function renderCollection(
    title,
    items,
    type
) {

    const section =
        document.createElement(
            "section"
        );


    section.className =
        "content-section collection-section";


    const heading =
        document.createElement(
            "h2"
        );


    heading.textContent =
        title;


    section.appendChild(
        heading
    );


    const list =
        document.createElement(
            "div"
        );


    list.className =
        "collection-grid";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        list.appendChild(
            createEmptyMessage()
        );

        section.appendChild(
            list
        );


        return section;

    }


    items.forEach(
        function(item) {

            if (
                !item ||
                typeof item !==
                "object"
            ) {

                return;

            }


            list.appendChild(
                createCollectionCard(
                    item,
                    type
                )
            );

        }
    );


    if (
        list.children.length === 0
    ) {

        list.appendChild(
            createEmptyMessage()
        );

    }


    section.appendChild(
        list
    );


    return section;

}


// ==================================================
// 11. Home Page
// ==================================================

function renderHomePage() {

    const container =
        document.createDocumentFragment();


    const site =
        DalimgariApp.siteData ||
        {};


    container.appendChild(
        createSection(
            "ডালিমগাড়ী সম্পর্কে",
            site.villageDescription
        )
    );


    container.appendChild(
        createSection(
            "বিস্তারিত বিবরণ",
            site.detailedDescription
        )
    );


    container.appendChild(
        createSection(
            "অবস্থান",
            site.location
        )
    );


    container.appendChild(
        createSection(
            "ইতিহাস",
            site.history
        )
    );


    container.appendChild(
        createSection(
            "প্রকৃতি",
            site.nature
        )
    );


    container.appendChild(
        renderCollection(
            "ডালিমগাড়ীর মানুষ",
            site.people,
            "person"
        )
    );


    container.appendChild(
        renderCollection(
            "ছবি",
            site.images,
            "image"
        )
    );


    container.appendChild(
        renderCollection(
            "ভিডিও",
            site.videos,
            "video"
        )
    );


    container.appendChild(
        renderCollection(
            "অডিও",
            site.audio,
            "audio"
        )
    );


    container.appendChild(
        renderCollection(
            "অনুষ্ঠান ও ঘটনা",
            site.events,
            "event"
        )
    );


    return container;

}


// ==================================================
// 12. About Page
// ==================================================

function renderAboutPage() {

    const container =
        document.createDocumentFragment();


    const site =
        DalimgariApp.siteData ||
        {};


    container.appendChild(
        createSection(
            "ডালিমগাড়ী",
            site.villageDescription
        )
    );


    container.appendChild(
        createSection(
            "বিস্তারিত পরিচিতি",
            site.detailedDescription
        )
    );


    container.appendChild(
        createSection(
            "অবস্থান",
            site.location
        )
    );


    container.appendChild(
        createSection(
            "ইতিহাস",
            site.history
        )
    );


    container.appendChild(
        createSection(
            "প্রকৃতি",
            site.nature
        )
    );


    return container;

}


// ==================================================
// 13. Contact Page
// ==================================================

function renderContactPage() {

    const container =
        document.createDocumentFragment();


    const site =
        DalimgariApp.siteData ||
        {};


    container.appendChild(
        createSection(
            "যোগাযোগ",
            site.contact
        )
    );


    container.appendChild(
        createSection(
            "বিস্তারিত যোগাযোগ",
            site.contactDetails
        )
    );


    const linksSection =
        document.createElement(
            "section"
        );


    linksSection.className =
        "content-section";


    const heading =
        document.createElement(
            "h2"
        );


    heading.textContent =
        "যোগাযোগের লিংক";


    linksSection.appendChild(
        heading
    );


    const links =
        document.createElement(
            "div"
        );


    links.className =
        "page-contact-links";


    renderContactLinks(
        links,
        site.contactLinks
    );


    if (
        links.children.length === 0
    ) {

        links.appendChild(
            createEmptyMessage()
        );

    }


    linksSection.appendChild(
        links
    );


    container.appendChild(
        linksSection
    );


    return container;

}


// ==================================================
// 14. Page Renderer
// ==================================================

function renderCurrentPage() {

    const pageContent =
        getElement(
            "pageContent"
        );


    if (!pageContent) {
        return;
    }


    pageContent.classList.add(
        "page-loading"
    );


    pageContent.replaceChildren();


    let content;


    switch (
        DalimgariApp.currentPage
    ) {

        case "about":

            content =
                renderAboutPage();

            break;


        case "contact":

            content =
                renderContactPage();

            break;


        case "home":

        default:

            content =
                renderHomePage();

            break;

    }


    pageContent.appendChild(
        content
    );


    pageContent.classList.remove(
        "page-loading"
    );


    updateActiveNavigation();

}


// ==================================================
// 15. Navigation
// ==================================================

function normalizePageName(
    page
) {

    const value =
        appSafeString(
            page,
            "home"
        )
        .replace(
            /^#/,
            ""
        )
        .trim()
        .toLowerCase();


    return DALIMGARI_PAGES.includes(
        value
    )
        ? value
        : "home";

}


function updateActiveNavigation() {

    const links =
        document.querySelectorAll(
            "[data-page]"
        );


    links.forEach(
        function(link) {

            const page =
                normalizePageName(
                    link.dataset.page
                );


            const active =
                page ===
                DalimgariApp.currentPage;


            link.classList.toggle(
                "active",
                active
            );


            link.setAttribute(
                "aria-current",
                active
                    ? "page"
                    : "false"
            );

        }
    );

}


function changePage(
    page,
    updateHash
) {

    const nextPage =
        normalizePageName(
            page
        );


    DalimgariApp.currentPage =
        nextPage;


    renderCurrentPage();


    closeSidebar();


    if (
        updateHash !== false
    ) {

        const hash =
            "#" +
            nextPage;


        if (
            window.location.hash !==
            hash
        ) {

            history.pushState(
                {
                    page:
                        nextPage
                },
                "",
                hash
            );

        }

    }


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );

}


function setupNavigation() {

    const links =
        document.querySelectorAll(
            "[data-page]"
        );


    links.forEach(
        function(link) {

            link.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();


                    changePage(
                        link.dataset.page,
                        true
                    );

                }
            );

        }
    );


    window.addEventListener(
        "popstate",
        function() {

            const page =
                normalizePageName(
                    window.location.hash
                );


            changePage(
                page,
                false
            );

        }
    );


    window.addEventListener(
        "hashchange",
        function() {

            const page =
                normalizePageName(
                    window.location.hash
                );


            if (
                page !==
                DalimgariApp.currentPage
            ) {

                changePage(
                    page,
                    false
                );

            }

        }
    );

}


// ==================================================
// 16. Header Rendering
// ==================================================

function renderHeader() {

    const site =
        DalimgariApp.siteData ||
        {};


    const siteName =
        getElement(
            "siteName"
        );


    const tagline =
        getElement(
            "siteTagline"
        );


    const headerImage =
        getElement(
            "headerImage"
        );


    const siteLogo =
        getElement(
            "siteLogo"
        );


    if (siteName) {

        siteName.textContent =
            appSafeString(
                site.siteName,
                "Dalimgari | ডালিমগাড়ী"
            );

    }


    if (tagline) {

        tagline.textContent =
            appSafeString(
                site.tagline,
                ""
            );

    }


    if (headerImage) {

        const path =
            appSafeString(
                site.headerImage,
                ""
            );


        if (
            isSafeMediaPath(
                path
            )
        ) {

            headerImage.src =
                path;

        }


        headerImage.alt =
            appSafeString(
                site.villageName,
                "ডালিমগাড়ী"
            );

    }


    if (siteLogo) {

        const path =
            appSafeString(
                site.logo,
                ""
            );


        if (
            isSafeMediaPath(
                path
            )
        ) {

            siteLogo.src =
                path;

        }


        siteLogo.alt =
            appSafeString(
                site.siteName,
                "Dalimgari"
            );

    }

}


// ==================================================
// 17. Profile Rendering
// ==================================================

function renderProfile(
    prefix,
    profile
) {

    if (!profile) {
        return;
    }


    const photo =
        getElement(
            prefix +
            "Photo"
        );


    const name =
        getElement(
            prefix +
            "Name"
        );


    const description =
        getElement(
            prefix +
            "Description"
        );


    const contact =
        getElement(
            prefix +
            "Contact"
        );


    const links =
        getElement(
            prefix +
            "ContactLinks"
        );


    if (photo) {

        const path =
            appSafeString(
                profile.photo,
                ""
            );


        if (
            isSafeMediaPath(
                path
            )
        ) {

            photo.src =
                path;

        }


        photo.alt =
            appSafeString(
                profile.name,
                prefix
            );

    }


    if (name) {

        name.textContent =
            appSafeString(
                profile.name,
                ""
            );

    }


    if (description) {

        description.textContent =
            appSafeString(
                profile.description,
                ""
            );

    }


    if (contact) {

        contact.textContent =
            appSafeString(
                profile.contact,
                ""
            );

    }


    if (links) {

        renderContactLinks(
            links,
            profile.contactLinks
        );

    }

}


function renderProfiles() {

    const settings =
        DalimgariApp.settingsData ||
        {};


    renderProfile(
        "admin",
        settings.admin
    );


    renderProfile(
        "manager",
        settings.manager
    );

}


// ==================================================
// 18. Footer Rendering
// ==================================================

function renderFooter() {

    const site =
        DalimgariApp.siteData ||
        {};


    const footerLinks =
        getElement(
            "footerContactLinks"
        );


    const copyright =
        getElement(
            "copyrightText"
        );


    const management =
        getElement(
            "managementText"
        );


    if (footerLinks) {

        renderContactLinks(
            footerLinks,
            site.contactLinks
        );

    }


    if (copyright) {

        copyright.textContent =
            appSafeString(
                site.copyrightText,
                ""
            );

    }


    if (management) {

        management.textContent =
            appSafeString(
                site.managementText,
                ""
            );

    }

}


// ==================================================
// 19. SEO
// ==================================================

function updateSEOMetadata() {

    const site =
        DalimgariApp.siteData ||
        {};


    const title =
        appSafeString(
            site.siteName,
            "Dalimgari | ডালিমগাড়ী"
        );


    document.title =
        title;


    let description =
        appSafeString(
            site.villageDescription,
            ""
        )
        .trim();


    if (!description) {

        description =
            appSafeString(
                site.detailedDescription,
                ""
            )
            .trim();

    }


    let meta =
        document.querySelector(
            'meta[name="description"]'
        );


    if (!meta) {

        meta =
            document.createElement(
                "meta"
            );


        meta.name =
            "description";


        document.head.appendChild(
            meta
        );

    }


    meta.content =
        description;


    updateMetaProperty(
        "og:title",
        title
    );


    updateMetaProperty(
        "og:description",
        description
    );


    updateMetaProperty(
        "og:type",
        "website"
    );


    const image =
        appSafeString(
            site.headerImage,
            ""
        );


    updateMetaProperty(
        "og:image",
        image
    );

}


function updateMetaProperty(
    property,
    content
) {

    let meta =
        document.querySelector(
            'meta[property="' +
            property +
            '"]'
        );


    if (!meta) {

        meta =
            document.createElement(
                "meta"
            );


        meta.setAttribute(
            "property",
            property
        );


        document.head.appendChild(
            meta
        );

    }


    meta.setAttribute(
        "content",
        appSafeString(
            content,
            ""
        )
    );

}


// ==================================================
// 20. Loading State
// ==================================================

function showLoadingState() {

    const pageContent =
        getElement(
            "pageContent"
        );


    if (!pageContent) {
        return;
    }


    pageContent.replaceChildren();


    const loading =
        document.createElement(
            "div"
        );


    loading.className =
        "loading-state";


    loading.textContent =
        "তথ্য লোড হচ্ছে...";


    pageContent.appendChild(
        loading
    );

}


// ==================================================
// 21. Error State
// ==================================================

function showErrorState(
    error
) {

    const pageContent =
        getElement(
            "pageContent"
        );


    if (!pageContent) {
        return;
    }


    pageContent.replaceChildren();


    const box =
        document.createElement(
            "div"
        );


    box.className =
        "error-state";


    const title =
        document.createElement(
            "h2"
        );


    title.textContent =
        "তথ্য লোড করা যায়নি।";


    box.appendChild(
        title
    );


    const message =
        document.createElement(
            "p"
        );


    message.textContent =
        "অনুগ্রহ করে আবার চেষ্টা করুন।";


    box.appendChild(
        message
    );


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.textContent =
        "আবার চেষ্টা করুন";


    button.addEventListener(
        "click",
        initializeWebsite
    );


    box.appendChild(
        button
    );


    pageContent.appendChild(
        box
    );


    if (
        window.logDataError
    ) {

        window.logDataError(
            "PUBLIC_PAGE_RENDER_ERROR",
            error
        );

    }

}


// ==================================================
// 22. Data Loading
// ==================================================

async function loadApplicationData() {

    if (
        !window.DalimgariDataLayer
    ) {

        throw new Error(
            "Dalimgari Data Layer পাওয়া যায়নি।"
        );

    }


    const dataLayer =
        window.DalimgariDataLayer;


    const results =
        await Promise.all(
            [
                dataLayer.getSiteData(),
                dataLayer.getSettingsData()
            ]
        );


    DalimgariApp.siteData =
        results[0];


    DalimgariApp.settingsData =
        results[1];


    if (
        !DalimgariApp.siteData
    ) {

        throw new Error(
            "Site data পাওয়া যায়নি।"
        );

    }


    if (
        !DalimgariApp.settingsData
    ) {

        throw new Error(
            "Settings data পাওয়া যায়নি।"
        );

    }

}


// ==================================================
// 23. Initial Page Detection
// ==================================================

function getInitialPage() {

    const hash =
        appSafeString(
            window.location.hash,
            ""
        );


    return normalizePageName(
        hash
    );

}


// ==================================================
// 24. Accessibility Setup
// ==================================================

function setupAccessibility() {

    const sidebar =
        getElement(
            "sidebar"
        );


    if (sidebar) {

        sidebar.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    const pageContent =
        getElement(
            "pageContent"
        );


    if (pageContent) {

        pageContent.setAttribute(
            "aria-live",
            "polite"
        );

    }

}


// ==================================================
// 25. Image Recovery
// ==================================================

function setupImageRecovery() {

    document.addEventListener(
        "error",
        function(event) {

            const target =
                event.target;


            if (
                target &&
                target.tagName ===
                "IMG"
            ) {

                target.classList.add(
                    "media-error"
                );

            }

        },
        true
    );

}


// ==================================================
// 26. Website Initialization
// ==================================================

async function initializeWebsite() {

    showLoadingState();


    try {

        await loadApplicationData();


        renderHeader();

        renderProfiles();

        renderFooter();

        updateSEOMetadata();


        DalimgariApp.currentPage =
            getInitialPage();


        renderCurrentPage();


        DalimgariApp.initialized =
            true;


    } catch (error) {

        DalimgariApp.initialized =
            false;


        showErrorState(
            error
        );

    }

}


// ==================================================
// 27. Global Error Protection
// ==================================================

window.addEventListener(
    "error",
    function(event) {

        if (
            window.logDataError
        ) {

            window.logDataError(
                "PUBLIC_GLOBAL_ERROR",
                event.error ||
                    new Error(
                        event.message ||
                        "Unknown frontend error"
                    ),
                {
                    filename:
                        event.filename ||
                        "",

                    line:
                        event.lineno ||
                        0,

                    column:
                        event.colno ||
                        0
                }
            );

        }

    }
);


window.addEventListener(
    "unhandledrejection",
    function(event) {

        if (
            window.logDataError
        ) {

            const reason =
                event.reason instanceof
                Error
                    ? event.reason
                    : new Error(
                        String(
                            event.reason ||
                            "Unhandled Promise rejection"
                        )
                    );


            window.logDataError(
                "PUBLIC_UNHANDLED_REJECTION",
                reason
            );

        }

    }
);


// ==================================================
// 28. DOM Ready
// ==================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        setupSidebar();

        setupNavigation();

        setupAccessibility();

        setupImageRecovery();

        initializeWebsite();

    }
);


// ==================================================
// 29. Public Frontend API
// ==================================================

window.DalimgariFrontend = {

    state:
        DalimgariApp,

    initialize:
        initializeWebsite,

    changePage:
        changePage,

    render:
        renderCurrentPage,

    openSidebar:
        openSidebar,

    closeSidebar:
        closeSidebar

};