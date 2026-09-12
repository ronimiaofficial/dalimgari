// ==================================================
// ডালিমগাড়ী — Data Layer v4.0
// ==================================================
// Permanent User Data Persistence
//
// মূল নিয়ম:
//
// 1. User data নিজে পরিবর্তন না করলে system পরিবর্তন করবে না।
// 2. System update হলে existing saved data থাকবে।
// 3. নতুন default data existing saved data overwrite করবে না।
// 4. একই field-এ নতুন data দিলে শুধু সেই field-এর data replace হবে।
// 5. অন্য field-এর data অক্ষত থাকবে।
// 6. নতুন field যোগ হলে পুরোনো data থাকবে।
// 7. Partial save হলে শুধু supplied data update হবে।
// 8. User ইচ্ছা করে field খালি করলে সেই field খালি হবে।
//
// Architecture:
//
// Website
//    ↓
// Data Layer
//    ↓
// Storage Adapter
//    ↓
// Browser Storage
//
// Future:
//
// Website
//    ↓
// Data Layer
//    ↓
// API Adapter
//    ↓
// Secure Backend API
//    ↓
// Database
// ==================================================


// ==================================================
// 1. Global Configuration
// ==================================================

const DALIMGARI_APP_VERSION =
    "4.0.0";

const DALIMGARI_DATA_VERSION =
    "4";

const DALIMGARI_STORAGE_KEY =
    "dalimgariDatabase";

const DALIMGARI_SETTINGS_KEY =
    "dalimgariSettings";

const DALIMGARI_SETTINGS_VERSION_KEY =
    "dalimgariSettingsVersion";

const DALIMGARI_ERROR_LOG_KEY =
    "dalimgariErrorLog";

const DALIMGARI_ACTIVITY_LOG_KEY =
    "dalimgariActivityLog";

const DALIMGARI_BACKUP_KEY =
    "dalimgariBackups";

const DALIMGARI_DEBUG_KEY =
    "dalimgariDebugMode";


// ==================================================
// 2. Storage Adapter
// ==================================================

const DalimgariStorage = {

    get: function(key) {

        try {

            return localStorage.getItem(
                key
            );

        } catch (error) {

            logDataError(
                "STORAGE_GET_ERROR",
                error,
                {
                    key: key
                }
            );

            return null;
        }
    },


    set: function(key, value) {

        try {

            localStorage.setItem(
                key,
                value
            );

            return true;

        } catch (error) {

            logDataError(
                "STORAGE_SET_ERROR",
                error,
                {
                    key: key
                }
            );

            return false;
        }
    },


    remove: function(key) {

        try {

            localStorage.removeItem(
                key
            );

            return true;

        } catch (error) {

            logDataError(
                "STORAGE_REMOVE_ERROR",
                error,
                {
                    key: key
                }
            );

            return false;
        }
    },


    getJSON: function(key) {

        const raw =
            this.get(key);

        if (!raw) {
            return null;
        }

        try {

            return JSON.parse(
                raw
            );

        } catch (error) {

            logDataError(
                "JSON_PARSE_ERROR",
                error,
                {
                    key: key
                }
            );

            return null;
        }
    },


    setJSON: function(key, value) {

        try {

            return this.set(
                key,
                JSON.stringify(value)
            );

        } catch (error) {

            logDataError(
                "JSON_STRINGIFY_ERROR",
                error,
                {
                    key: key
                }
            );

            return false;
        }
    }

};


// ==================================================
// 3. Debug Mode
// ==================================================

function isDebugMode() {

    return (
        DalimgariStorage.get(
            DALIMGARI_DEBUG_KEY
        ) === "true"
    );
}


function debugLog() {

    if (!isDebugMode()) {
        return;
    }

    try {

        console.log.apply(
            console,
            arguments
        );

    } catch (error) {

        // Debug logging কখনো
        // application বন্ধ করবে না।

    }
}


// ==================================================
// 4. Unique ID Generator
// ==================================================

function generateDalimgariId(
    prefix
) {

    const safePrefix =
        String(
            prefix || "id"
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9]/g,
            ""
        );


    const timestamp =
        Date.now()
        .toString(36);


    const random =
        Math.random()
        .toString(36)
        .substring(2, 10);


    return (
        safePrefix +
        "_" +
        timestamp +
        "_" +
        random
    );
}


// ==================================================
// 5. Date Helper
// ==================================================

function getCurrentISODate() {

    return new Date()
        .toISOString();

}


// ==================================================
// 6. Error Logging
// ==================================================

function logDataError(
    type,
    error,
    context
) {

    try {

        const existing =
            DalimgariStorage.getJSON(
                DALIMGARI_ERROR_LOG_KEY
            );


        const logs =
            Array.isArray(existing)
                ? existing
                : [];


        logs.push({

            id:
                generateDalimgariId(
                    "error"
                ),

            type:
                String(
                    type ||
                    "UNKNOWN_ERROR"
                ),

            message:
                error &&
                error.message
                    ? error.message
                    : String(
                        error ||
                        "Unknown error"
                    ),

            context:
                context || {},

            timestamp:
                getCurrentISODate()

        });


        DalimgariStorage.setJSON(
            DALIMGARI_ERROR_LOG_KEY,
            logs.slice(-100)
        );


    } catch (loggingError) {

        console.error(
            "Dalimgari Error Logger failed:",
            loggingError
        );
    }


    console.error(
        "Dalimgari Error:",
        type,
        error,
        context || {}
    );
}


// ==================================================
// 7. Activity / Audit Log
// ==================================================

function logActivity(
    action,
    entity,
    details
) {

    try {

        const existing =
            DalimgariStorage.getJSON(
                DALIMGARI_ACTIVITY_LOG_KEY
            );


        const logs =
            Array.isArray(existing)
                ? existing
                : [];


        let currentUser =
            null;


        try {

            const session =
                sessionStorage.getItem(
                    "dalimgariUser"
                );


            if (session) {

                currentUser =
                    JSON.parse(
                        session
                    );

            }

        } catch (error) {

            currentUser =
                null;

        }


        logs.push({

            id:
                generateDalimgariId(
                    "activity"
                ),

            action:
                String(
                    action ||
                    "UNKNOWN"
                ),

            entity:
                String(
                    entity ||
                    "system"
                ),

            details:
                details || {},

            user:
                currentUser
                    ? {

                        role:
                            currentUser.role ||
                            "",

                        username:
                            currentUser.username ||
                            ""

                    }
                    : {

                        role:
                            "guest",

                        username:
                            ""

                    },

            timestamp:
                getCurrentISODate()

        });


        DalimgariStorage.setJSON(
            DALIMGARI_ACTIVITY_LOG_KEY,
            logs.slice(-500)
        );


    } catch (error) {

        logDataError(
            "ACTIVITY_LOG_ERROR",
            error,
            {
                action:
                    action,

                entity:
                    entity
            }
        );
    }
}


// ==================================================
// 8. Default Site Structure
// ==================================================

function getDefaultSiteData() {

    return {

        siteName:
            "Dalimgari | ডালিমগাড়ী",

        tagline:
            "আমাদের গ্রাম, আমাদের গল্প",

        villageName:
            "ডালিমগাড়ী",

        villageDescription:
            "ডালিমগাড়ী আমাদের প্রিয় গ্রাম। এই ওয়েবসাইটে আমাদের গ্রামের মানুষ, প্রকৃতি, ইতিহাস, ঐতিহ্য, ছবি, ভিডিও এবং বিভিন্ন তথ্য সংরক্ষণ করা হবে।",

        detailedDescription:
            "",

        location:
            "",

        history:
            "",

        nature:
            "",

        contact:
            "",

        contactDetails:
            "",

        headerImage:
            "images/banner.jpg",

        logo:
            "images/logo.jpg",

        contactLinks:
            [],

        footerText:
            "",

        copyrightText:
            "",

        managementText:
            "",

        people:
            [],

        images:
            [],

        videos:
            [],

        audio:
            [],

        events:
            [],

        _meta: {

            dataVersion:
                DALIMGARI_DATA_VERSION,

            updatedAt:
                getCurrentISODate()

        }

    };
}


// ==================================================
// 9. Default Settings Structure
// ==================================================

function getDefaultSettingsData() {

    return {

        admin: {

            name:
                "Admin",

            photo:
                "images/admin.jpg",

            description:
                "ডালিমগাড়ী ওয়েবসাইটের প্রধান প্রশাসক",

            contact:
                "",

            enabled:
                true,

            contactLinks:
                [],

            login: {

                username:
                    "admin",

                password:
                    "0000"

            }

        },


        manager: {

            name:
                "Manager",

            photo:
                "images/manager.jpg",

            description:
                "ওয়েবসাইটের তথ্য ও বিষয়বস্তু ব্যবস্থাপক",

            contact:
                "",

            enabled:
                true,

            contactLinks:
                [],

            login: {

                username:
                    "manager",

                password:
                    "1111"

            }

        },


        permissions: {

            managerCanEditVillageInfo:
                true,

            managerCanManagePeople:
                true,

            managerCanManageImages:
                true,

            managerCanManageVideos:
                true,

            managerCanManageAudio:
                true,

            managerCanManageEvents:
                true,

            managerCanEditManagerProfile:
                false,

            managerCanEditSecurity:
                false

        },


        _meta: {

            settingsVersion:
                DALIMGARI_DATA_VERSION,

            updatedAt:
                getCurrentISODate()

        }

    };
}


// ==================================================
// 10. Safe String Helper
// ==================================================

function safeString(
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


    return String(
        value
    );

}


// ==================================================
// 11. Safe Array Helper
// ==================================================

function safeArray(
    value
) {

    return Array.isArray(
        value
    )
        ? value
        : [];

}


// ==================================================
// 12. Object Helper
// ==================================================

function isPlainObject(
    value
) {

    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );

}


// ==================================================
// 13. Non-Destructive Object Merge
// ==================================================
//
// গুরুত্বপূর্ণ:
//
// Existing object-এর data আগে রাখা হয়।
//
// নতুন object-এ কোনো property থাকলে
// শুধু সেই property update হবে।
//
// ফলে:
//
// old:
// {
//   email: "old@email.com",
//   phone: "123"
// }
//
// new:
// {
//   email: "new@email.com"
// }
//
// result:
// {
//   email: "new@email.com",
//   phone: "123"
// }
//
// ==================================================

function mergeDalimgariData(
    existing,
    incoming
) {

    const base =
        isPlainObject(existing)
            ? existing
            : {};


    const source =
        isPlainObject(incoming)
            ? incoming
            : {};


    const result =
        Object.assign(
            {},
            base
        );


    Object.keys(
        source
    ).forEach(
        function(key) {

            const incomingValue =
                source[key];


            if (
                isPlainObject(
                    incomingValue
                ) &&
                isPlainObject(
                    result[key]
                )
            ) {

                result[key] =
                    mergeDalimgariData(
                        result[key],
                        incomingValue
                    );

                return;

            }


            /*
             * Array, string, number, boolean,
             * null — সব explicit value
             * user-এর নতুন value হিসেবে
             * গ্রহণ করা হবে।
             *
             * অর্থাৎ user ইচ্ছা করে
             * field খালি করলে সেটিও
             * replace হবে।
             */

            result[key] =
                incomingValue;

        }
    );


    return result;

}


// ==================================================
// 14. Contact Link Normalize
// ==================================================

function normalizeBasicContactLinks(
    links
) {

    if (!Array.isArray(links)) {
        return [];
    }


    return links
        .filter(
            function(link) {

                return (
                    link &&
                    typeof link === "object" &&
                    link.url
                );

            }
        )
        .map(
            function(link) {

                const normalized = {

                    name:
                        safeString(
                            link.name,
                            ""
                        ).trim(),

                    url:
                        safeString(
                            link.url,
                            ""
                        ).trim()

                };


                if (
                    window.DalimgariIconManager &&
                    typeof
                    window.DalimgariIconManager
                        .normalizeContactLink ===
                    "function"
                ) {

                    try {

                        return window
                            .DalimgariIconManager
                            .normalizeContactLink(
                                normalized
                            );

                    } catch (error) {

                        logDataError(
                            "CONTACT_LINK_NORMALIZE_ERROR",
                            error,
                            {
                                url:
                                    normalized.url
                            }
                        );

                    }

                }


                return normalized;

            }
        )
        .filter(Boolean);

}


// ==================================================
// 15. People Normalize
// ==================================================

function normalizePeople(
    people
) {

    if (!Array.isArray(people)) {
        return [];
    }


    return people
        .filter(
            function(person) {

                return (
                    person &&
                    typeof person === "object"
                );

            }
        )
        .map(
            function(person) {

                return {

                    id:
                        safeString(
                            person.id,
                            generateDalimgariId(
                                "person"
                            )
                        ),

                    name:
                        safeString(
                            person.name,
                            ""
                        ).trim(),

                    description:
                        safeString(
                            person.description,
                            ""
                        ).trim(),

                    photo:
                        safeString(
                            person.photo,
                            ""
                        ).trim(),

                    createdAt:
                        safeString(
                            person.createdAt,
                            getCurrentISODate()
                        ),

                    updatedAt:
                        safeString(
                            person.updatedAt,
                            getCurrentISODate()
                        )

                };

            }
        );

}


// ==================================================
// 16. Images Normalize
// ==================================================

function normalizeImages(
    images
) {

    if (!Array.isArray(images)) {
        return [];
    }


    return images
        .filter(
            function(image) {

                return (
                    image &&
                    typeof image === "object"
                );

            }
        )
        .map(
            function(image) {

                return {

                    id:
                        safeString(
                            image.id,
                            generateDalimgariId(
                                "image"
                            )
                        ),

                    title:
                        safeString(
                            image.title,
                            ""
                        ).trim(),

                    description:
                        safeString(
                            image.description,
                            ""
                        ).trim(),

                    path:
                        safeString(
                            image.path,
                            ""
                        ).trim(),

                    createdAt:
                        safeString(
                            image.createdAt,
                            getCurrentISODate()
                        ),

                    updatedAt:
                        safeString(
                            image.updatedAt,
                            getCurrentISODate()
                        )

                };

            }
        );

}


// ==================================================
// 17. Videos Normalize
// ==================================================

function normalizeVideos(
    videos
) {

    if (!Array.isArray(videos)) {
        return [];
    }


    return videos
        .filter(
            function(video) {

                return (
                    video &&
                    typeof video === "object"
                );

            }
        )
        .map(
            function(video) {

                return {

                    id:
                        safeString(
                            video.id,
                            generateDalimgariId(
                                "video"
                            )
                        ),

                    title:
                        safeString(
                            video.title,
                            ""
                        ).trim(),

                    description:
                        safeString(
                            video.description,
                            ""
                        ).trim(),

                    path:
                        safeString(
                            video.path,
                            ""
                        ).trim(),

                    createdAt:
                        safeString(
                            video.createdAt,
                            getCurrentISODate()
                        ),

                    updatedAt:
                        safeString(
                            video.updatedAt,
                            getCurrentISODate()
                        )

                };

            }
        );

}


// ==================================================
// 18. Audio Normalize
// ==================================================

function normalizeAudio(
    audio
) {

    if (!Array.isArray(audio)) {
        return [];
    }


    return audio
        .filter(
            function(item) {

                return (
                    item &&
                    typeof item === "object"
                );

            }
        )
        .map(
            function(item) {

                return {

                    id:
                        safeString(
                            item.id,
                            generateDalimgariId(
                                "audio"
                            )
                        ),

                    title:
                        safeString(
                            item.title,
                            ""
                        ).trim(),

                    description:
                        safeString(
                            item.description,
                            ""
                        ).trim(),

                    path:
                        safeString(
                            item.path,
                            ""
                        ).trim(),

                    createdAt:
                        safeString(
                            item.createdAt,
                            getCurrentISODate()
                        ),

                    updatedAt:
                        safeString(
                            item.updatedAt,
                            getCurrentISODate()
                        )

                };

            }
        );

}


// ==================================================
// 19. Events Normalize
// ==================================================

function normalizeEvents(
    events
) {

    if (!Array.isArray(events)) {
        return [];
    }


    return events
        .filter(
            function(eventItem) {

                return (
                    eventItem &&
                    typeof eventItem === "object"
                );

            }
        )
        .map(
            function(eventItem) {

                return {

                    id:
                        safeString(
                            eventItem.id,
                            generateDalimgariId(
                                "event"
                            )
                        ),

                    title:
                        safeString(
                            eventItem.title,
                            ""
                        ).trim(),

                    date:
                        safeString(
                            eventItem.date,
                            ""
                        ).trim(),

                    description:
                        safeString(
                            eventItem.description,
                            ""
                        ).trim(),

                    image:
                        safeString(
                            eventItem.image,
                            ""
                        ).trim(),

                    createdAt:
                        safeString(
                            eventItem.createdAt,
                            getCurrentISODate()
                        ),

                    updatedAt:
                        safeString(
                            eventItem.updatedAt,
                            getCurrentISODate()
                        )

                };

            }
        );

}


// ==================================================
// 20. Site Data Normalize
// ==================================================

function normalizeSiteData(
    data
) {

    const source =
        isPlainObject(data)
            ? data
            : {};


    const defaults =
        getDefaultSiteData();


    /*
     * Defaults শুধু missing property পূরণ করবে।
     * Existing property overwrite করবে না।
     */

    const siteData =
        mergeDalimgariData(
            defaults,
            source
        );


    siteData.siteName =
        safeString(
            siteData.siteName,
            defaults.siteName
        );

    siteData.tagline =
        safeString(
            siteData.tagline,
            defaults.tagline
        );

    siteData.villageName =
        safeString(
            siteData.villageName,
            defaults.villageName
        );

    siteData.villageDescription =
        safeString(
            siteData.villageDescription,
            ""
        );

    siteData.detailedDescription =
        safeString(
            siteData.detailedDescription,
            ""
        );

    siteData.location =
        safeString(
            siteData.location,
            ""
        );

    siteData.history =
        safeString(
            siteData.history,
            ""
        );

    siteData.nature =
        safeString(
            siteData.nature,
            ""
        );

    siteData.contact =
        safeString(
            siteData.contact,
            ""
        );

    siteData.contactDetails =
        safeString(
            siteData.contactDetails,
            ""
        );

    siteData.headerImage =
        safeString(
            siteData.headerImage,
            defaults.headerImage
        );

    siteData.logo =
        safeString(
            siteData.logo,
            defaults.logo
        );

    siteData.footerText =
        safeString(
            siteData.footerText,
            ""
        );

    siteData.copyrightText =
        safeString(
            siteData.copyrightText,
            ""
        );

    siteData.managementText =
        safeString(
            siteData.managementText,
            ""
        );


    siteData.contactLinks =
        normalizeBasicContactLinks(
            siteData.contactLinks
        );


    siteData.people =
        normalizePeople(
            siteData.people
        );


    siteData.images =
        normalizeImages(
            siteData.images
        );


    siteData.videos =
        normalizeVideos(
            siteData.videos
        );


    siteData.audio =
        normalizeAudio(
            siteData.audio
        );


    siteData.events =
        normalizeEvents(
            siteData.events
        );


    if (
        !isPlainObject(
            siteData._meta
        )
    ) {

        siteData._meta = {};

    }


    /*
     * Version metadata system নিজে update করতে পারবে।
     * User content এখানে নেই।
     */

    siteData._meta.dataVersion =
        DALIMGARI_DATA_VERSION;


    if (
        !siteData._meta.updatedAt
    ) {

        siteData._meta.updatedAt =
            getCurrentISODate();

    }


    return siteData;

}


// ==================================================
// 21. Settings Normalize
// ==================================================

function normalizeSettingsData(
    data
) {

    const source =
        isPlainObject(data)
            ? data
            : {};


    const defaults =
        getDefaultSettingsData();


    /*
     * Recursive merge:
     *
     * Existing user settings থাকবে।
     * নতুন settings property শুধু যোগ হবে।
     */

    const settings =
        mergeDalimgariData(
            defaults,
            source
        );


    if (
        !isPlainObject(
            settings.admin
        )
    ) {

        settings.admin = {};

    }


    if (
        !isPlainObject(
            settings.manager
        )
    ) {

        settings.manager = {};

    }


    settings.admin =
        mergeDalimgariData(
            defaults.admin,
            settings.admin
        );


    settings.manager =
        mergeDalimgariData(
            defaults.manager,
            settings.manager
        );


    settings.admin.name =
        safeString(
            settings.admin.name,
            defaults.admin.name
        );

    settings.admin.photo =
        safeString(
            settings.admin.photo,
            defaults.admin.photo
        );

    settings.admin.description =
        safeString(
            settings.admin.description,
            ""
        );

    settings.admin.contact =
        safeString(
            settings.admin.contact,
            ""
        );


    settings.manager.name =
        safeString(
            settings.manager.name,
            defaults.manager.name
        );

    settings.manager.photo =
        safeString(
            settings.manager.photo,
            defaults.manager.photo
        );

    settings.manager.description =
        safeString(
            settings.manager.description,
            ""
        );

    settings.manager.contact =
        safeString(
            settings.manager.contact,
            ""
        );


    if (
        !isPlainObject(
            settings.admin.login
        )
    ) {

        settings.admin.login = {};

    }


    if (
        !isPlainObject(
            settings.manager.login
        )
    ) {

        settings.manager.login = {};

    }


    settings.admin.login =
        mergeDalimgariData(
            defaults.admin.login,
            settings.admin.login
        );


    settings.manager.login =
        mergeDalimgariData(
            defaults.manager.login,
            settings.manager.login
        );


    settings.admin.login.username =
        safeString(
            settings.admin.login.username,
            defaults.admin.login.username
        );


    settings.admin.login.password =
        safeString(
            settings.admin.login.password,
            defaults.admin.login.password
        );


    settings.manager.login.username =
        safeString(
            settings.manager.login.username,
            defaults.manager.login.username
        );


    settings.manager.login.password =
        safeString(
            settings.manager.login.password,
            defaults.manager.login.password
        );


    settings.admin.contactLinks =
        normalizeBasicContactLinks(
            settings.admin.contactLinks
        );


    settings.manager.contactLinks =
        normalizeBasicContactLinks(
            settings.manager.contactLinks
        );


    if (
        !isPlainObject(
            settings.permissions
        )
    ) {

        settings.permissions = {};

    }


    settings.permissions =
        mergeDalimgariData(
            defaults.permissions,
            settings.permissions
        );


    if (
        !isPlainObject(
            settings._meta
        )
    ) {

        settings._meta = {};

    }


    settings._meta.settingsVersion =
        DALIMGARI_DATA_VERSION;


    if (
        !settings._meta.updatedAt
    ) {

        settings._meta.updatedAt =
            getCurrentISODate();

    }


    return settings;

}


// ==================================================
// 22. Data Validation
// ==================================================

function validateSiteData(
    data
) {

    const errors = [];


    if (
        !data ||
        typeof data !== "object"
    ) {

        errors.push(
            "Site data object পাওয়া যায়নি।"
        );

        return {

            valid: false,
            errors: errors

        };

    }


    const requiredFields = [

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
        "headerImage",
        "logo",
        "footerText",
        "copyrightText",
        "managementText"

    ];


    requiredFields.forEach(
        function(field) {

            if (
                typeof data[field] !==
                "string"
            ) {

                errors.push(
                    field +
                    " field-এর type সঠিক নয়।"
                );

            }

        }
    );


    if (
        !Array.isArray(
            data.contactLinks
        )
    ) {

        errors.push(
            "contactLinks অবশ্যই array হতে হবে।"
        );

    }


    const collectionFields = [

        "people",
        "images",
        "videos",
        "audio",
        "events"

    ];


    collectionFields.forEach(
        function(field) {

            if (
                !Array.isArray(
                    data[field]
                )
            ) {

                errors.push(
                    field +
                    " অবশ্যই array হতে হবে।"
                );

            }

        }
    );


    const objectCollections = [

        "people",
        "images",
        "videos",
        "audio",
        "events"

    ];


    objectCollections.forEach(
        function(field) {

            if (
                !Array.isArray(
                    data[field]
                )
            ) {
                return;
            }


            data[field].forEach(
                function(item, index) {

                    if (
                        !item ||
                        typeof item !== "object"
                    ) {

                        errors.push(
                            field +
                            "[" +
                            index +
                            "] সঠিক object নয়।"
                        );

                    }

                }
            );

        }
    );


    return {

        valid:
            errors.length === 0,

        errors:
            errors

    };

}


// ==================================================
// 23. Settings Validation
// ==================================================

function validateSettingsData(
    settings
) {

    const errors = [];


    if (
        !settings ||
        typeof settings !== "object"
    ) {

        errors.push(
            "Settings object পাওয়া যায়নি।"
        );

        return {

            valid: false,
            errors: errors

        };

    }


    if (
        !settings.admin ||
        typeof settings.admin !== "object"
    ) {

        errors.push(
            "Admin settings missing."
        );

    }


    if (
        !settings.manager ||
        typeof settings.manager !== "object"
    ) {

        errors.push(
            "Manager settings missing."
        );

    }


    if (
        !settings.permissions ||
        typeof settings.permissions !== "object"
    ) {

        errors.push(
            "Permissions missing."
        );

    }


    return {

        valid:
            errors.length === 0,

        errors:
            errors

    };

}


// ==================================================
// 24. Data Integrity Check
// ==================================================

function checkDataIntegrity() {

    const result = {

        valid:
            true,

        siteData: {

            exists:
                false,

            valid:
                false,

            errors:
                []

        },

        settingsData: {

            exists:
                false,

            valid:
                false,

            errors:
                []

        },

        checkedAt:
            getCurrentISODate()

    };


    const siteData =
        DalimgariStorage.getJSON(
            DALIMGARI_STORAGE_KEY
        );


    if (siteData) {

        result.siteData.exists =
            true;


        const validation =
            validateSiteData(
                siteData
            );


        result.siteData.valid =
            validation.valid;


        result.siteData.errors =
            validation.errors;

    }


    const settings =
        DalimgariStorage.getJSON(
            DALIMGARI_SETTINGS_KEY
        );


    if (settings) {

        result.settingsData.exists =
            true;


        const validation =
            validateSettingsData(
                settings
            );


        result.settingsData.valid =
            validation.valid;


        result.settingsData.errors =
            validation.errors;

    }


    result.valid =
        (
            result.siteData.exists &&
            result.siteData.valid &&
            result.settingsData.exists &&
            result.settingsData.valid
        );


    return result;

}


// ==================================================
// 25. Site Migration
// ==================================================

function migrateSiteData(
    data,
    oldVersion
) {

    let migrated =
        isPlainObject(data)
            ? data
            : {};


    const version =
        String(
            oldVersion || "1"
        );


    debugLog(
        "Migrating Site Data:",
        version,
        "→",
        DALIMGARI_DATA_VERSION
    );


    /*
     * Version 1 → 2
     */

    if (
        version === "1"
    ) {

        if (
            migrated.contactDetails ===
            undefined
        ) {

            migrated.contactDetails =
                "";

        }

    }


    /*
     * Version 2 → 3
     */

    if (
        version === "1" ||
        version === "2"
    ) {

        if (
            migrated.contactLinks ===
            undefined
        ) {

            migrated.contactLinks =
                [];

        }


        if (
            migrated.people ===
            undefined
        ) {

            migrated.people =
                [];

        }


        if (
            migrated.images ===
            undefined
        ) {

            migrated.images =
                [];

        }


        if (
            migrated.videos ===
            undefined
        ) {

            migrated.videos =
                [];

        }


        if (
            migrated.audio ===
            undefined
        ) {

            migrated.audio =
                [];

        }


        if (
            migrated.events ===
            undefined
        ) {

            migrated.events =
                [];

        }

    }


    /*
     * Version 3 → 4
     *
     * No destructive migration.
     *
     * Existing data 그대로 থাকবে।
     * নতুন fields normalization-এর মাধ্যমে
     * যোগ হবে।
     */

    if (
        version === "3"
    ) {

        debugLog(
            "Non-destructive migration 3 → 4"
        );

    }


    return normalizeSiteData(
        migrated
    );

}


// ==================================================
// 26. Settings Migration
// ==================================================

function migrateSettingsData(
    data,
    oldVersion
) {

    let migrated =
        isPlainObject(data)
            ? data
            : {};


    const version =
        String(
            oldVersion || "1"
        );


    debugLog(
        "Migrating Settings:",
        version,
        "→",
        DALIMGARI_DATA_VERSION
    );


    if (
        !isPlainObject(
            migrated.admin
        )
    ) {

        migrated.admin = {};

    }


    if (
        !isPlainObject(
            migrated.manager
        )
    ) {

        migrated.manager = {};

    }


    if (
        migrated.admin.contactLinks ===
        undefined
    ) {

        migrated.admin.contactLinks =
            [];

    }


    if (
        migrated.manager.contactLinks ===
        undefined
    ) {

        migrated.manager.contactLinks =
            [];

    }


    /*
     * Version 3 → 4
     *
     * কোনো existing user setting delete
     * বা overwrite করা হবে না।
     */

    if (
        version === "3"
    ) {

        debugLog(
            "Non-destructive settings migration 3 → 4"
        );

    }


    return normalizeSettingsData(
        migrated
    );

}


// ==================================================
// 27. Initial Site Data
// ==================================================

async function loadInitialSiteData() {

    try {

        const response =
            await fetch(
                "data/site.json",
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "site.json পাওয়া যায়নি।"
            );

        }


        return await response.json();


    } catch (error) {

        logDataError(
            "INITIAL_SITE_DATA_LOAD_ERROR",
            error
        );


        return null;

    }

}


// ==================================================
// 28. Initial Settings Data
// ==================================================

async function loadInitialSettingsData() {

    try {

        const response =
            await fetch(
                "data/settings.json",
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "settings.json পাওয়া যায়নি।"
            );

        }


        return await response.json();


    } catch (error) {

        logDataError(
            "INITIAL_SETTINGS_DATA_LOAD_ERROR",
            error
        );


        return null;

    }

}


// ==================================================
// 29. Current Site Data
// ==================================================

async function getSiteData() {

    const savedRaw =
        DalimgariStorage.get(
            DALIMGARI_STORAGE_KEY
        );


    /*
     * IMPORTANT:
     *
     * Saved data পাওয়া গেলে
     * কখনো initial site.json দিয়ে
     * replace করা হবে না।
     */

    if (savedRaw) {

        try {

            const data =
                JSON.parse(
                    savedRaw
                );


            const currentVersion =
                data &&
                data._meta &&
                data._meta.dataVersion
                    ? String(
                        data._meta.dataVersion
                    )
                    : "1";


            let normalized;


            if (
                currentVersion !==
                DALIMGARI_DATA_VERSION
            ) {

                normalized =
                    migrateSiteData(
                        data,
                        currentVersion
                    );


                /*
                 * Migration non-destructive।
                 */

                DalimgariStorage.setJSON(
                    DALIMGARI_STORAGE_KEY,
                    normalized
                );


                logActivity(
                    "MIGRATE",
                    "siteData",
                    {
                        from:
                            currentVersion,

                        to:
                            DALIMGARI_DATA_VERSION
                    }
                );


            } else {

                normalized =
                    normalizeSiteData(
                        data
                    );


                /*
                 * Normalized data আবার save করা হচ্ছে
                 * শুধু নতুন structural fields যোগ করার জন্য।
                 *
                 * Existing user content overwrite হবে না।
                 */

                DalimgariStorage.setJSON(
                    DALIMGARI_STORAGE_KEY,
                    normalized
                );

            }


            const validation =
                validateSiteData(
                    normalized
                );


            if (
                !validation.valid
            ) {

                logDataError(
                    "SITE_DATA_VALIDATION_WARNING",
                    new Error(
                        validation.errors.join(
                            " | "
                        )
                    ),
                    {
                        errors:
                            validation.errors
                    }
                );

            }


            return normalized;


        } catch (error) {

            /*
             * Corrupt data হলে সরাসরি delete করা হচ্ছে না।
             * Existing raw data রেখে initial data ব্যবহার
             * না করে safe fallback নেওয়া হবে।
             */

            logDataError(
                "SAVED_SITE_DATA_READ_ERROR",
                error
            );


            const safeFallback =
                getDefaultSiteData();


            return safeFallback;

        }

    }


    /*
     * প্রথমবার কোনো saved data নেই।
     * শুধু তখনই site.json initialize হবে।
     */

    const initialData =
        await loadInitialSiteData();


    if (initialData) {

        const normalized =
            normalizeSiteData(
                initialData
            );


        const validation =
            validateSiteData(
                normalized
            );


        if (
            !validation.valid
        ) {

            logDataError(
                "INITIAL_SITE_DATA_VALIDATION_WARNING",
                new Error(
                    validation.errors.join(
                        " | "
                    )
                ),
                {
                    errors:
                        validation.errors
                }
            );

        }


        DalimgariStorage.setJSON(
            DALIMGARI_STORAGE_KEY,
            normalized
        );


        logActivity(
            "INITIALIZE",
            "siteData",
            {}
        );


        return normalized;

    }


    const fallback =
        getDefaultSiteData();


    DalimgariStorage.setJSON(
        DALIMGARI_STORAGE_KEY,
        fallback
    );


    logActivity(
        "FALLBACK_INITIALIZE",
        "siteData",
        {}
    );


    return fallback;

}


// ==================================================
// 30. Save Site Data
// ==================================================

async function saveSiteData(
    siteData
) {

    try {

        /*
         * IMPORTANT:
         *
         * আগে existing saved data পড়া হচ্ছে।
         */

        const existing =
            DalimgariStorage.getJSON(
                DALIMGARI_STORAGE_KEY
            );


        /*
         * incoming data-এর property-গুলো
         * existing data-এর সঙ্গে merge হবে।
         *
         * ফলে partial save হলেও
         * অন্য data হারাবে না।
         */

        const merged =
            mergeDalimgariData(
                existing ||
                getDefaultSiteData(),
                siteData
            );


        const normalized =
            normalizeSiteData(
                merged
            );


        const validation =
            validateSiteData(
                normalized
            );


        if (
            !validation.valid
        ) {

            logDataError(
                "SITE_DATA_SAVE_VALIDATION_ERROR",
                new Error(
                    validation.errors.join(
                        " | "
                    )
                ),
                {
                    errors:
                        validation.errors
                }
            );


            return false;

        }


        normalized._meta.updatedAt =
            getCurrentISODate();


        normalized._meta.dataVersion =
            DALIMGARI_DATA_VERSION;


        const success =
            DalimgariStorage.setJSON(
                DALIMGARI_STORAGE_KEY,
                normalized
            );


        if (!success) {

            return false;

        }


        logActivity(
            "SAVE",
            "siteData",
            {
                version:
                    DALIMGARI_DATA_VERSION
            }
        );


        return true;


    } catch (error) {

        logDataError(
            "SITE_DATA_SAVE_ERROR",
            error
        );


        return false;

    }

}


// ==================================================
// 31. Current Settings Data
// ==================================================

async function getSettingsData() {

    const savedRaw =
        DalimgariStorage.get(
            DALIMGARI_SETTINGS_KEY
        );


    const savedVersion =
        DalimgariStorage.get(
            DALIMGARI_SETTINGS_VERSION_KEY
        );


    /*
     * Saved settings থাকলে
     * version যাই হোক,
     * existing settings preserve করা হবে।
     */

    if (
        savedRaw
    ) {

        try {

            const oldData =
                JSON.parse(
                    savedRaw
                );


            const normalized =
                (
                    savedVersion ===
                    DALIMGARI_DATA_VERSION
                )
                    ? normalizeSettingsData(
                        oldData
                    )
                    : migrateSettingsData(
                        oldData,
                        savedVersion || "1"
                    );


            /*
             * নতুন fields যোগ হবে,
             * পুরোনো settings থাকবে।
             */

            DalimgariStorage.setJSON(
                DALIMGARI_SETTINGS_KEY,
                normalized
            );


            DalimgariStorage.set(
                DALIMGARI_SETTINGS_VERSION_KEY,
                DALIMGARI_DATA_VERSION
            );


            if (
                savedVersion !==
                DALIMGARI_DATA_VERSION
            ) {

                logActivity(
                    "MIGRATE",
                    "settings",
                    {
                        from:
                            savedVersion ||
                            "1",

                        to:
                            DALIMGARI_DATA_VERSION
                    }
                );

            }


            return normalized;


        } catch (error) {

            logDataError(
                "SAVED_SETTINGS_READ_ERROR",
                error
            );


            return getDefaultSettingsData();

        }

    }


    /*
     * প্রথমবার settings initialize হবে।
     */

    const initialData =
        await loadInitialSettingsData();


    if (initialData) {

        const normalized =
            normalizeSettingsData(
                initialData
            );


        const validation =
            validateSettingsData(
                normalized
            );


        if (
            !validation.valid
        ) {

            logDataError(
                "INITIAL_SETTINGS_VALIDATION_WARNING",
                new Error(
                    validation.errors.join(
                        " | "
                    )
                ),
                {
                    errors:
                        validation.errors
                }
            );

        }


        DalimgariStorage.setJSON(
            DALIMGARI_SETTINGS_KEY,
            normalized
        );


        DalimgariStorage.set(
            DALIMGARI_SETTINGS_VERSION_KEY,
            DALIMGARI_DATA_VERSION
        );


        logActivity(
            "INITIALIZE",
            "settings",
            {}
        );


        return normalized;

    }


    const fallback =
        getDefaultSettingsData();


    DalimgariStorage.setJSON(
        DALIMGARI_SETTINGS_KEY,
        fallback
    );


    DalimgariStorage.set(
        DALIMGARI_SETTINGS_VERSION_KEY,
        DALIMGARI_DATA_VERSION
    );


    logActivity(
        "FALLBACK_INITIALIZE",
        "settings",
        {}
    );


    return fallback;

}


// ==================================================
// 32. Save Settings
// ==================================================

async function saveSettingsData(
    settingsData
) {

    try {

        /*
         * Existing settings আগে পড়া হবে।
         */

        const existing =
            DalimgariStorage.getJSON(
                DALIMGARI_SETTINGS_KEY
            );


        /*
         * Recursive merge।
         *
         * যেমন:
         *
         * existing:
         * admin.contact = "old"
         * manager.name = "Rahim"
         *
         * incoming:
         * admin.contact = "new"
         *
         * result:
         * admin.contact = "new"
         * manager.name = "Rahim"
         */

        const merged =
            mergeDalimgariData(
                existing ||
                getDefaultSettingsData(),
                settingsData
            );


        const normalized =
            normalizeSettingsData(
                merged
            );


        const validation =
            validateSettingsData(
                normalized
            );


        if (
            !validation.valid
        ) {

            logDataError(
                "SETTINGS_SAVE_VALIDATION_ERROR",
                new Error(
                    validation.errors.join(
                        " | "
                    )
                ),
                {
                    errors:
                        validation.errors
                }
            );


            return false;

        }


        normalized._meta.updatedAt =
            getCurrentISODate();


        normalized._meta.settingsVersion =
            DALIMGARI_DATA_VERSION;


        const success =
            DalimgariStorage.setJSON(
                DALIMGARI_SETTINGS_KEY,
                normalized
            );


        if (!success) {

            return false;

        }


        DalimgariStorage.set(
            DALIMGARI_SETTINGS_VERSION_KEY,
            DALIMGARI_DATA_VERSION
        );


        logActivity(
            "SAVE",
            "settings",
            {
                version:
                    DALIMGARI_DATA_VERSION
            }
        );


        return true;


    } catch (error) {

        logDataError(
            "SETTINGS_SAVE_ERROR",
            error
        );


        return false;

    }

}


// ==================================================
// 33. Backup System — Manual Compatibility
// ==================================================
//
// Automatic backup নয়।
//
// এই functions compatibility-এর জন্য রাখা হয়েছে।
// ==================================================

function createDalimgariBackup(
    label
) {

    try {

        const siteData =
            DalimgariStorage.getJSON(
                DALIMGARI_STORAGE_KEY
            );


        const settingsData =
            DalimgariStorage.getJSON(
                DALIMGARI_SETTINGS_KEY
            );


        const backup = {

            id:
                generateDalimgariId(
                    "backup"
                ),

            label:
                safeString(
                    label,
                    "Manual Backup"
                ),

            appVersion:
                DALIMGARI_APP_VERSION,

            dataVersion:
                DALIMGARI_DATA_VERSION,

            createdAt:
                getCurrentISODate(),

            siteData:
                siteData,

            settingsData:
                settingsData

        };


        const existing =
            DalimgariStorage.getJSON(
                DALIMGARI_BACKUP_KEY
            );


        const backups =
            Array.isArray(existing)
                ? existing
                : [];


        backups.push(
            backup
        );


        const success =
            DalimgariStorage.setJSON(
                DALIMGARI_BACKUP_KEY,
                backups.slice(-20)
            );


        if (success) {

            logActivity(
                "BACKUP_CREATE",
                "system",
                {
                    backupId:
                        backup.id
                }
            );

        }


        return success
            ? backup
            : null;


    } catch (error) {

        logDataError(
            "BACKUP_CREATE_ERROR",
            error
        );


        return null;

    }

}


// ==================================================
// 34. Get Backups
// ==================================================

function getDalimgariBackups() {

    const backups =
        DalimgariStorage.getJSON(
            DALIMGARI_BACKUP_KEY
        );


    return Array.isArray(
        backups
    )
        ? backups
        : [];

}


// ==================================================
// 35. Restore Backup
// ==================================================

async function restoreDalimgariBackup(
    backupId
) {

    try {

        const backups =
            getDalimgariBackups();


        const backup =
            backups.find(
                function(item) {

                    return (
                        item &&
                        item.id ===
                        backupId
                    );

                }
            );


        if (!backup) {
            return false;
        }


        if (
            !backup.siteData ||
            !backup.settingsData
        ) {

            return false;

        }


        const siteData =
            normalizeSiteData(
                backup.siteData
            );


        const settingsData =
            normalizeSettingsData(
                backup.settingsData
            );


        const siteValidation =
            validateSiteData(
                siteData
            );


        const settingsValidation =
            validateSettingsData(
                settingsData
            );


        if (
            !siteValidation.valid ||
            !settingsValidation.valid
        ) {

            logDataError(
                "BACKUP_VALIDATION_ERROR",
                new Error(
                    "Backup validation failed."
                )
            );


            return false;

        }


        const siteSaved =
            DalimgariStorage.setJSON(
                DALIMGARI_STORAGE_KEY,
                siteData
            );


        const settingsSaved =
            DalimgariStorage.setJSON(
                DALIMGARI_SETTINGS_KEY,
                settingsData
            );


        DalimgariStorage.set(
            DALIMGARI_SETTINGS_VERSION_KEY,
            DALIMGARI_DATA_VERSION
        );


        if (
            !siteSaved ||
            !settingsSaved
        ) {

            return false;

        }


        logActivity(
            "BACKUP_RESTORE",
            "system",
            {
                backupId:
                    backupId
            }
        );


        return true;


    } catch (error) {

        logDataError(
            "BACKUP_RESTORE_ERROR",
            error,
            {
                backupId:
                    backupId
            }
        );


        return false;

    }

}


// ==================================================
// 36. Export Data
// ==================================================

function exportDalimgariData() {

    try {

        const data = {

            appVersion:
                DALIMGARI_APP_VERSION,

            dataVersion:
                DALIMGARI_DATA_VERSION,

            exportedAt:
                getCurrentISODate(),

            siteData:
                DalimgariStorage.getJSON(
                    DALIMGARI_STORAGE_KEY
                ),

            settingsData:
                DalimgariStorage.getJSON(
                    DALIMGARI_SETTINGS_KEY
                )

        };


        logActivity(
            "EXPORT",
            "system",
            {}
        );


        return JSON.stringify(
            data,
            null,
            4
        );


    } catch (error) {

        logDataError(
            "DATA_EXPORT_ERROR",
            error
        );


        return null;

    }

}


// ==================================================
// 37. Import Data
// ==================================================

async function importDalimgariData(
    rawData
) {

    try {

        let imported;


        if (
            typeof rawData ===
            "string"
        ) {

            imported =
                JSON.parse(
                    rawData
                );

        } else {

            imported =
                rawData;

        }


        if (
            !imported ||
            typeof imported !==
            "object"
        ) {

            return false;

        }


        const siteData =
            normalizeSiteData(
                imported.siteData
            );


        const settingsData =
            normalizeSettingsData(
                imported.settingsData
            );


        const siteValidation =
            validateSiteData(
                siteData
            );


        const settingsValidation =
            validateSettingsData(
                settingsData
            );


        if (
            !siteValidation.valid ||
            !settingsValidation.valid
        ) {

            logDataError(
                "IMPORT_VALIDATION_ERROR",
                new Error(
                    "Imported data validation failed."
                )
            );


            return false;

        }


        const siteSaved =
            DalimgariStorage.setJSON(
                DALIMGARI_STORAGE_KEY,
                siteData
            );


        const settingsSaved =
            DalimgariStorage.setJSON(
                DALIMGARI_SETTINGS_KEY,
                settingsData
            );


        DalimgariStorage.set(
            DALIMGARI_SETTINGS_VERSION_KEY,
            DALIMGARI_DATA_VERSION
        );


        if (
            !siteSaved ||
            !settingsSaved
        ) {

            return false;

        }


        logActivity(
            "IMPORT",
            "system",
            {}
        );


        return true;


    } catch (error) {

        logDataError(
            "DATA_IMPORT_ERROR",
            error
        );


        return false;

    }

}


// ==================================================
// 38. Error Logs
// ==================================================

function getDalimgariErrorLogs() {

    const logs =
        DalimgariStorage.getJSON(
            DALIMGARI_ERROR_LOG_KEY
        );


    return Array.isArray(logs)
        ? logs
        : [];

}


// ==================================================
// 39. Activity Logs
// ==================================================

function getDalimgariActivityLogs() {

    const logs =
        DalimgariStorage.getJSON(
            DALIMGARI_ACTIVITY_LOG_KEY
        );


    return Array.isArray(logs)
        ? logs
        : [];

}


// ==================================================
// 40. Clear Logs
// ==================================================

function clearDalimgariLogs() {

    DalimgariStorage.remove(
        DALIMGARI_ERROR_LOG_KEY
    );

    DalimgariStorage.remove(
        DALIMGARI_ACTIVITY_LOG_KEY
    );

}


// ==================================================
// 41. Storage Information
// ==================================================

function getDalimgariStorageInfo() {

    let usedBytes =
        0;


    try {

        for (
            let i = 0;
            i < localStorage.length;
            i++
        ) {

            const key =
                localStorage.key(i);


            if (!key) {
                continue;
            }


            const value =
                localStorage.getItem(
                    key
                );


            if (value) {

                usedBytes +=
                    (
                        key.length +
                        value.length
                    ) * 2;

            }

        }

    } catch (error) {

        logDataError(
            "STORAGE_INFO_ERROR",
            error
        );

    }


    return {

        usedBytes:
            usedBytes,

        usedKB:
            Math.round(
                usedBytes /
                1024
            ),

        usedMB:
            (
                usedBytes /
                (1024 * 1024)
            ).toFixed(2)

    };

}


// ==================================================
// 42. System Health
// ==================================================

async function getDalimgariSystemHealth() {

    const integrity =
        checkDataIntegrity();


    const storage =
        getDalimgariStorageInfo();


    const errorLogs =
        getDalimgariErrorLogs();


    const activityLogs =
        getDalimgariActivityLogs();


    return {

        application: {

            version:
                DALIMGARI_APP_VERSION,

            dataVersion:
                DALIMGARI_DATA_VERSION,

            status:
                "active"

        },


        integrity:
            integrity,


        storage:
            storage,


        logs: {

            errorCount:
                errorLogs.length,

            activityCount:
                activityLogs.length

        },


        checkedAt:
            getCurrentISODate()

    };

}


// ==================================================
// 43. Global Permission Helper
// ==================================================

async function hasDalimgariPermission(
    permissionName
) {

    try {

        const settings =
            await getSettingsData();


        if (!settings) {
            return false;
        }


        let currentUser =
            null;


        try {

            const session =
                sessionStorage.getItem(
                    "dalimgariUser"
                );


            if (session) {

                currentUser =
                    JSON.parse(
                        session
                    );

            }

        } catch (error) {

            currentUser =
                null;

        }


        if (
            currentUser &&
            currentUser.role ===
            "admin"
        ) {

            return true;

        }


        if (
            !currentUser ||
            currentUser.role !==
            "manager"
        ) {

            return false;

        }


        return (
            settings.permissions &&
            settings.permissions[
                permissionName
            ] === true
        );


    } catch (error) {

        logDataError(
            "PERMISSION_CHECK_ERROR",
            error,
            {
                permission:
                    permissionName
            }
        );


        return false;

    }

}


// ==================================================
// 44. Login State Helper
// ==================================================

function getDalimgariCurrentUser() {

    try {

        const session =
            sessionStorage.getItem(
                "dalimgariUser"
            );


        if (!session) {
            return null;
        }


        return JSON.parse(
            session
        );


    } catch (error) {

        logDataError(
            "SESSION_READ_ERROR",
            error
        );


        return null;

    }

}


// ==================================================
// 45. Logout Helper
// ==================================================

function dalimgariLogout() {

    try {

        const user =
            getDalimgariCurrentUser();


        sessionStorage.removeItem(
            "dalimgariUser"
        );


        logActivity(
            "LOGOUT",
            "authentication",
            {

                role:
                    user &&
                    user.role
                        ? user.role
                        : "unknown",

                username:
                    user &&
                    user.username
                        ? user.username
                        : ""

            }
        );


        return true;


    } catch (error) {

        logDataError(
            "LOGOUT_ERROR",
            error
        );


        return false;

    }

}


// ==================================================
// 46. API Adapter Foundation
// ==================================================

const DalimgariAPI = {

    enabled:
        false,


    async getSite() {

        if (
            !this.enabled
        ) {

            return getSiteData();

        }


        throw new Error(
            "API adapter এখনো enable করা হয়নি।"
        );

    },


    async saveSite(
        siteData
    ) {

        if (
            !this.enabled
        ) {

            return saveSiteData(
                siteData
            );

        }


        throw new Error(
            "API adapter এখনো enable করা হয়নি।"
        );

    },


    async getSettings() {

        if (
            !this.enabled
        ) {

            return getSettingsData();

        }


        throw new Error(
            "API adapter এখনো enable করা হয়নি।"
        );

    },


    async saveSettings(
        settingsData
    ) {

        if (
            !this.enabled
        ) {

            return saveSettingsData(
                settingsData
            );

        }


        throw new Error(
            "API adapter এখনো enable করা হয়নি।"
        );

    }

};


// ==================================================
// 47. Global Error Handler
// ==================================================

window.addEventListener(
    "error",
    function(event) {

        logDataError(
            "GLOBAL_JAVASCRIPT_ERROR",
            event.error ||
                new Error(
                    event.message ||
                    "Unknown JavaScript error"
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
);


// ==================================================
// 48. Promise Error Handler
// ==================================================

window.addEventListener(
    "unhandledrejection",
    function(event) {

        const reason =
            event.reason instanceof Error
                ? event.reason
                : new Error(
                    String(
                        event.reason ||
                        "Unhandled Promise rejection"
                    )
                );


        logDataError(
            "UNHANDLED_PROMISE_REJECTION",
            reason
        );

    }
);


// ==================================================
// 49. Public Data Layer API
// ==================================================

window.DalimgariDataLayer = {

    appVersion:
        DALIMGARI_APP_VERSION,

    dataVersion:
        DALIMGARI_DATA_VERSION,


    storage:
        DalimgariStorage,


    api:
        DalimgariAPI,


    generateId:
        generateDalimgariId,


    getSiteData:
        getSiteData,

    saveSiteData:
        saveSiteData,


    getSettingsData:
        getSettingsData,

    saveSettingsData:
        saveSettingsData,


    normalizeSiteData:
        normalizeSiteData,

    normalizeSettingsData:
        normalizeSettingsData,


    normalizePeople:
        normalizePeople,

    normalizeImages:
        normalizeImages,

    normalizeVideos:
        normalizeVideos,

    normalizeAudio:
        normalizeAudio,

    normalizeEvents:
        normalizeEvents,


    validateSiteData:
        validateSiteData,

    validateSettingsData:
        validateSettingsData,


    checkIntegrity:
        checkDataIntegrity,


    createBackup:
        createDalimgariBackup,

    getBackups:
        getDalimgariBackups,

    restoreBackup:
        restoreDalimgariBackup,


    exportData:
        exportDalimgariData,

    importData:
        importDalimgariData,


    getErrorLogs:
        getDalimgariErrorLogs,

    getActivityLogs:
        getDalimgariActivityLogs,

    clearLogs:
        clearDalimgariLogs,


    getStorageInfo:
        getDalimgariStorageInfo,

    getSystemHealth:
        getDalimgariSystemHealth,


    hasPermission:
        hasDalimgariPermission,


    getCurrentUser:
        getDalimgariCurrentUser,

    logout:
        dalimgariLogout

};


// ==================================================
// 50. Legacy Global Compatibility
// ==================================================

window.getSiteData =
    getSiteData;

window.saveSiteData =
    saveSiteData;

window.getSettingsData =
    getSettingsData;

window.saveSettingsData =
    saveSettingsData;


// ==================================================
// 51. Initialization
// ==================================================

debugLog(
    "Dalimgari Data Layer loaded:",
    DALIMGARI_APP_VERSION,
    "Data Version:",
    DALIMGARI_DATA_VERSION
);