(function () {
  const $ = (id) => document.getElementById(id);
  const status = $("accountStatus");
  const client = () => window.alokitSupabase;

  function say(message, error) {
    status.textContent = message;
    status.className = "notice" + (error ? " error" : "");
  }

  if (!window.alokitSupabaseReady) {
    say("Add your Supabase project URL and publishable key in assets/supabase-config.js before using accounts.", true);
    $("accountForm").querySelectorAll("input,button").forEach(el => el.disabled = true);
    return;
  }

  const params = new URLSearchParams(location.search);
  const next = params.get("next") || "studio.html";

  $("modeSignup").addEventListener("click", () => {
    $("accountMode").value = "signup";
    $("modeSignup").classList.add("selected");
    $("modeLogin").classList.remove("selected");
    $("nameField").hidden = false;
    $("phoneField").hidden = false;
    $("accountSubmit").textContent = "Create designer account";
  });
  $("modeLogin").addEventListener("click", () => {
    $("accountMode").value = "login";
    $("modeLogin").classList.add("selected");
    $("modeSignup").classList.remove("selected");
    $("nameField").hidden = true;
    $("phoneField").hidden = true;
    $("accountSubmit").textContent = "Log in";
  });

  async function saveProfile(user) {
    const meta = user.user_metadata || {};
    const payload = {
      user_id: user.id,
      full_name: meta.full_name || user.email || "ALOKIT designer",
      designer_name: meta.designer_name || null,
      phone: meta.phone || null,
      city: meta.city || null,
      country: meta.country || "India",
      email: user.email || null
    };
    const { error } = await client().from("designer_profiles").upsert(payload, { onConflict: "user_id" });
    if (error) throw error;
  }

  $("accountForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = $("accountSubmit");
    button.disabled = true;
    const mode = $("accountMode").value;
    const email = $("accountEmail").value.trim();
    const password = $("accountPassword").value;
    try {
      if (mode === "signup") {
        const fullName = $("fullName").value.trim();
        if (!fullName) throw new Error("Please enter your full name.");
        const { data, error } = await client().auth.signUp({
          email, password,
          options: { data: {
            full_name: fullName,
            designer_name: $("designerName").value.trim(),
            phone: $("phone").value.trim(),
            city: $("city").value.trim(),
            country: "India"
          } }
        });
        if (error) throw error;
        if (data.user && data.session) {
          await saveProfile(data.user);
          say("Your account is ready. Opening the design studio…");
          location.href = next;
        } else {
          say("Account created. Check your email for the verification link, then return here and log in.");
        }
      } else {
        const { data, error } = await client().auth.signInWithPassword({ email, password });
        if (error) throw error;
        await saveProfile(data.user);
        say("Logged in. Opening ALOKIT…");
        location.href = next;
      }
    } catch (error) {
      say(error.message || "Something went wrong. Please try again.", true);
    } finally {
      button.disabled = false;
    }
  });

  client().auth.getSession().then(({ data }) => {
    if (data.session) {
      $("signedInPanel").hidden = false;
      $("accountForm").hidden = true;
      $("signedInEmail").textContent = data.session.user.email;
    }
  });
  $("continueStudio").addEventListener("click", () => location.href = next);
  $("signOut").addEventListener("click", async () => {
    await client().auth.signOut();
    location.reload();
  });
})();