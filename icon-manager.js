// ==================================================
// ডালিমগাড়ী — Local Icon Manager v2
// ==================================================
//
// Supported Platforms:
// - Facebook
// - YouTube
// - WhatsApp
// - TikTok
//
// Architecture:
//
// URL
// ↓
// URL Normalize
// ↓
// Domain Detect
// ↓
// Icon Key
// ↓
// Local SVG
//
// Future:
//
// URL
// ↓
// Backend/API
// ↓
// Stored Icon Metadata
// ↓
// Local / Cloud Icon
// ==================================================


// ==================================================
// CONFIGURATION
// ==================================================

const DALIMGARI_ICON_FOLDER =
    "images/icons/";


const DALIMGARI_ICON_MAP = {

    facebook:
        "facebook.svg",

    youtube:
        "youtube.svg",

    whatsapp:
        "whatsapp.svg",

    tiktok:
        "tiktok.svg"

};


const DALIMGARI_ICON_NAMES = {

    facebook:
        "Facebook",

    youtube:
        "YouTube",

    whatsapp:
        "WhatsApp",

    tiktok:
        "TikTok"

};


const DALIMGARI_ALLOWED_DOMAINS = {

    facebook: [
        "facebook.com"
    ],

    youtube: [
        "youtube.com",
        "youtu.be"
    ],

    whatsapp: [
        "whatsapp.com",
        "wa.me"
    ],

    tiktok: [
        "tiktok.com"
    ]

};


// ==================================================
// NORMALIZE URL
// ==================================================

function normalizeIconUrl(
    url
) {

    if (
        url === undefined ||
        url === null
    ) {

        return "";

    }


    let prepared =
        String(url).trim();


    if (!prepared) {

        return "";

    }


    /*
     * Protocol না থাকলে HTTPS যোগ করা হয়।
     */

    if (
        !/^https?:\/\//i.test(
            prepared
        )
    ) {

        prepared =
            "https://" +
            prepared;

    }


    try {

        const parsed =
            new URL(
                prepared
            );


        /*
         * শুধু HTTP/HTTPS গ্রহণ করা হবে।
         */

        if (
            parsed.protocol !== "http:" &&
            parsed.protocol !== "https:"
        ) {

            return "";

        }


        return parsed.href;

    } catch (error) {

        return "";

    }

}


// ==================================================
// MAIN DOMAIN
// ==================================================

function getMainDomain(
    url
) {

    const normalizedUrl =
        normalizeIconUrl(
            url
        );


    if (!normalizedUrl) {

        return "";

    }


    try {

        const parsed =
            new URL(
                normalizedUrl
            );


        return parsed.hostname
            .toLowerCase()
            .replace(
                /^www\./,
                ""
            );

    } catch (error) {

        return "";

    }

}


// ==================================================
// DOMAIN MATCH
// ==================================================

function domainMatches(
    domain,
    allowedDomain
) {

    const currentDomain =
        String(
            domain || ""
        )
            .toLowerCase()
            .replace(
                /^www\./,
                ""
            );


    const allowed =
        String(
            allowedDomain || ""
        )
            .toLowerCase()
            .replace(
                /^www\./,
                ""
            );


    if (
        !currentDomain ||
        !allowed
    ) {

        return false;

    }


    return (
        currentDomain === allowed ||
        currentDomain.endsWith(
            "." + allowed
        )
    );

}


// ==================================================
// ICON KEY FROM DOMAIN
// ==================================================

function getIconKeyFromDomain(
    domain
) {

    const currentDomain =
        String(
            domain || ""
        )
            .toLowerCase()
            .replace(
                /^www\./,
                ""
            );


    if (!currentDomain) {

        return "";

    }


    const platformKeys =
        Object.keys(
            DALIMGARI_ALLOWED_DOMAINS
        );


    for (
        let i = 0;
        i < platformKeys.length;
        i++
    ) {

        const key =
            platformKeys[i];


        const domains =
            DALIMGARI_ALLOWED_DOMAINS[
                key
            ];


        for (
            let j = 0;
            j < domains.length;
            j++
        ) {

            if (
                domainMatches(
                    currentDomain,
                    domains[j]
                )
            ) {

                return key;

            }

        }

    }


    return "";

}


// ==================================================
// ICON KEY FROM URL
// ==================================================

function getIconKeyFromUrl(
    url
) {

    const domain =
        getMainDomain(
            url
        );


    return getIconKeyFromDomain(
        domain
    );

}


// ==================================================
// LOCAL ICON PATH
// ==================================================

function getLocalIconPath(
    url
) {

    const iconKey =
        getIconKeyFromUrl(
            url
        );


    if (!iconKey) {

        return "";

    }


    const fileName =
        DALIMGARI_ICON_MAP[
            iconKey
        ];


    if (!fileName) {

        return "";

    }


    return (
        DALIMGARI_ICON_FOLDER +
        fileName
    );

}


// ==================================================
// ICON NAME
// ==================================================

function getIconName(
    url
) {

    const iconKey =
        getIconKeyFromUrl(
            url
        );


    if (!iconKey) {

        return "";

    }


    return (
        DALIMGARI_ICON_NAMES[
            iconKey
        ] ||
        ""
    );

}


// ==================================================
// SUPPORTED PLATFORM CHECK
// ==================================================

function isSupportedIconUrl(
    url
) {

    return Boolean(
        getIconKeyFromUrl(
            url
        )
    );

}


// ==================================================
// CONTACT LINK NORMALIZE
// ==================================================

function normalizeContactLink(
    link
) {

    if (
        !link ||
        !link.url
    ) {

        return null;

    }


    const normalizedUrl =
        normalizeIconUrl(
            link.url
        );


    if (!normalizedUrl) {

        return null;

    }


    const domain =
        getMainDomain(
            normalizedUrl
        );


    const iconKey =
        getIconKeyFromDomain(
            domain
        );


    /*
     * Unsupported domain হলে
     * Contact Link public system-এ
     * রাখা হবে না।
     */

    if (!iconKey) {

        return null;

    }


    const icon =
        getLocalIconPath(
            normalizedUrl
        );


    const name =
        String(
            link.name ||
            getIconName(
                normalizedUrl
            ) ||
            ""
        ).trim();


    return {

        name:
            name,

        url:
            normalizedUrl,

        domain:
            domain,

        iconKey:
            iconKey,

        icon:
            icon,

        platform:
            iconKey

    };

}


// ==================================================
// MULTIPLE CONTACT LINKS NORMALIZE
// ==================================================

function normalizeContactLinks(
    links
) {

    if (
        !Array.isArray(
            links
        )
    ) {

        return [];

    }


    const normalized = [];

    const seen =
        new Set();


    links.forEach(
        function(link) {

            const normalizedLink =
                normalizeContactLink(
                    link
                );


            if (!normalizedLink) {

                return;

            }


            const duplicateKey =
                normalizedLink.url
                    .toLowerCase();


            if (
                seen.has(
                    duplicateKey
                )
            ) {

                return;

            }


            seen.add(
                duplicateKey
            );


            normalized.push(
                normalizedLink
            );

        }
    );


    return normalized;

}


// ==================================================
// GET ICON INFORMATION
// ==================================================

function getIconInfo(
    url
) {

    const normalizedUrl =
        normalizeIconUrl(
            url
        );


    if (!normalizedUrl) {

        return null;

    }


    const domain =
        getMainDomain(
            normalizedUrl
        );


    const iconKey =
        getIconKeyFromDomain(
            domain
        );


    if (!iconKey) {

        return null;

    }


    return {

        url:
            normalizedUrl,

        domain:
            domain,

        iconKey:
            iconKey,

        name:
            getIconName(
                normalizedUrl
            ),

        icon:
            getLocalIconPath(
                normalizedUrl
            )

    };

}


// ==================================================
// FUTURE API COMPATIBILITY
// ==================================================

function createIconMetadata(
    url
) {

    const information =
        getIconInfo(
            url
        );


    if (!information) {

        return null;

    }


    return {

        platform:
            information.iconKey,

        domain:
            information.domain,

        icon:
            information.icon,

        source:
            "local",

        version:
            "1.0"

    };

}


// ==================================================
// PUBLIC API
// ==================================================

window.DalimgariIconManager = {

    normalizeIconUrl,

    getMainDomain,

    getIconKeyFromDomain,

    getIconKeyFromUrl,

    getLocalIconPath,

    getIconName,

    isSupportedIconUrl,

    getIconInfo,

    createIconMetadata,

    normalizeContactLink,

    normalizeContactLinks

};