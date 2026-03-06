import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

        const callerClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: authHeader } },
        });
        const { data: { user: callerUser }, error: callerErr } = await callerClient.auth.getUser();
        if (callerErr || !callerUser) {
            return new Response(JSON.stringify({ error: "Unauthorized: invalid session" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { data: callerProfile, error: profileErr } = await callerClient
            .from("profiles")
            .select("role")
            .eq("id", callerUser.id)
            .single();

        if (profileErr || !callerProfile || callerProfile.role !== "admin") {
            return new Response(JSON.stringify({ error: "Forbidden: only admins can add employees" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { name, email, password } = await req.json();
        if (!name || !email || !password) {
            return new Response(JSON.stringify({ error: "name, email and password are required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
        if (password.length < 6) {
            return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const adminClient = createClient(supabaseUrl, serviceKey);

        // 1. Create the user with email_confirm: false (unverified)
        const { data: newUserData, error: createErr } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: false, // Wait for verification
            user_metadata: { name, role: 'employee' },
        });

        if (createErr) {
            return new Response(JSON.stringify({ error: createErr.message }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const newUser = newUserData.user;

        // 2. Add them to profiles
        const { error: profileInsertErr } = await adminClient
            .from("profiles")
            .upsert({
                id: newUser.id,
                email: newUser.email,
                name,
                role: "employee",
            });

        if (profileInsertErr) {
            await adminClient.auth.admin.deleteUser(newUser.id);
            return new Response(JSON.stringify({ error: "Profile creation failed: " + profileInsertErr.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 3. Trigger Supabase to send the verification email
        const redirectUrl = "https://tgmadmin.vercel.app/verify.html"; // Adjust to your actual production verify page if needed
        const { error: sendErr } = await adminClient.auth.resend({
            type: 'signup',
            email: newUser.email,
            options: {
                emailRedirectTo: redirectUrl
            }
        });

        if (sendErr) {
            console.error("Failed to send verification email:", sendErr);
            // We won't roll back the creation if only the email failed, 
            // but we'll inform the caller
            return new Response(JSON.stringify({
                success: true,
                warning: "User created but failed to send verification email. " + sendErr.message,
                userId: newUser.id
            }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        return new Response(
            JSON.stringify({ success: true, userId: newUser.id, email: newUser.email }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
