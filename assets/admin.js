(function () {
  const $ = id => document.getElementById(id);
  const client = () => window.alokitSupabase;
  function status(text, bad) {
    $("adminStatus").textContent = text;
    $("adminStatus").className = "admin-note" + (bad ? " danger" : "");
  }
  if (!window.alokitSupabaseReady) {
    status("Supabase is not configured. Complete assets/supabase-config.js first.", true);
    return;
  }
  async function load() {
    status("Checking your founder permissions…");
    const { data: sessionData, error: sessionError } = await client().auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session) {
      location.href = "account.html?next=admin.html";
      return;
    }
    const { data: isAdmin, error: adminError } = await client().rpc("is_alokit_admin");
    if (adminError) throw adminError;
    if (!isAdmin) {
      status("Access denied. This account is not registered as an ALOKIT administrator.", true);
      return;
    }
    const [profilesRes, designsRes, submissionsRes] = await Promise.all([
      client().from("designer_profiles").select("user_id,full_name,designer_name,phone,email,city,country"),
      client().from("designs").select("id,designer_id,design_name,garment_type,material,status"),
      client().from("design_submissions").select("id,designer_id,design_id,requested_quantity,status,submitted_at,signature_name")
    ]);
    if (profilesRes.error) throw profilesRes.error;
    if (designsRes.error) throw designsRes.error;
    if (submissionsRes.error) throw submissionsRes.error;
    const profiles = profilesRes.data || [];
    const designs = designsRes.data || [];
    const submissions = submissionsRes.data || [];
    $("designerCount").textContent = profiles.length;
    $("designCount").textContent = designs.length;
    $("submissionCount").textContent = submissions.length;
    const profileById = Object.fromEntries(profiles.map(p => [p.user_id, p]));
    const designById = Object.fromEntries(designs.map(d => [d.id, d]));
    $("submissionRows").innerHTML = "";
    if (!submissions.length) {
      $("submissionRows").innerHTML = '<tr><td colspan="7">No designer submissions yet.</td></tr>';
    } else {
      submissions.sort((a,b) => new Date(b.submitted_at) - new Date(a.submitted_at));
      for (const sub of submissions) {
        const profile = profileById[sub.designer_id] || {};
        const design = designById[sub.design_id] || {};
        const tr = document.createElement("tr");
        const values = [
          new Date(sub.submitted_at).toLocaleString(),
          design.design_name || "Untitled",
          profile.designer_name || profile.full_name || sub.signature_name,
          [profile.email, profile.phone].filter(Boolean).join(" / ") || "—",
          [design.garment_type, design.material].filter(Boolean).join(" · "),
          String(sub.requested_quantity),
          sub.status
        ];
        values.forEach(v => { const td = document.createElement("td"); td.textContent = v; tr.appendChild(td); });
        $("submissionRows").appendChild(tr);
      }
    }
    status("Signed in and verified as the ALOKIT founder administrator. " + submissions.length + " submission(s) loaded.");
  }
  $("refreshAdmin").addEventListener("click", () => load().catch(e => status(e.message, true)));
  $("adminSignOut").addEventListener("click", async () => { await client().auth.signOut(); location.href = "account.html"; });
  load().catch(e => status(e.message || "Unable to load founder dashboard.", true));
})();