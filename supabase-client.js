// ==================================================
// ডালিমগাড়ী — Supabase Client
// ==================================================
// এই file টি data-manager.js এর আগে load হতে হবে।
// Requires the Supabase UMD script tag to be loaded first:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
// ==================================================

(function () {

    const SUPABASE_URL =
        "https://ktwouzppzkhrggwpizxq.supabase.co";

    const SUPABASE_ANON_KEY =
        "sb_publishable_3zu58tGc4zS4mdlrFxK1QA_TqtO0HOT";

    try {

        if (
            typeof window.supabase === "undefined" ||
            typeof window.supabase.createClient !== "function"
        ) {

            console.error(
                "Supabase library লোড হয়নি। supabase-js CDN script যোগ করা হয়েছে কিনা দেখুন।"
            );

            return;

        }

        window.DalimgariSupabase =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );

    } catch (error) {

        console.error(
            "Supabase client তৈরি করতে ব্যর্থ:",
            error
        );

    }

})();
