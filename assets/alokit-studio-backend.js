(function () {
  const $ = (id) => document.getElementById(id);
  const client = () => window.alokitSupabase;
  const form = $("submissionForm");
  if (!form) return;

  const notice = document.createElement("p");
  notice.id = "backendStatus";
  notice.className = "studio-hint";
  notice.setAttribute("role", "status");
  form.appendChild(notice);

  function message(text, error) {
    notice.textContent = text;
    notice.style.color = error ? "#a33b32" : "#315b43";
  }

  if (!window.alokitSupabaseReady) {
    message("Website setup is not finished yet. Add the Supabase URL and publishable key before accepting submissions.", true);
  }

  const originalFinish = $("finishDesign").onclick;
  $("finishDesign").onclick = async () => {
    if (!window.alokitSupabaseReady) {
      message("Supabase is not configured yet. Please complete the website connection first.", true);
      return;
    }
    const { data } = await client().auth.getSession();
    if (!data.session) {
      location.href = "account.html?next=studio.html";
      return;
    }
    if (typeof originalFinish === "function") originalFinish();
  };

  form.onsubmit = async (event) => {
    event.preventDefault();
    if (!window.alokitSupabaseReady) {
      message("Supabase is not configured. No information has been sent.", true);
      return;
    }
    const submit = form.querySelector('button[type="submit"]');
    const quantity = Number($("quantity").value);
    if (!Number.isInteger(quantity) || quantity < 10) {
      $("quantity").setCustomValidity("Minimum requested quantity is 10 pieces.");
      $("quantity").reportValidity();
      return;
    }
    $("quantity").setCustomValidity("");
    submit.disabled = true;
    submit.textContent = "Saving securely…";
    message("Checking your account and saving your design…");

    try {
      const { data: sessionData, error: sessionError } = await client().auth.getSession();
      if (sessionError) throw sessionError;
      const user = sessionData.session && sessionData.session.user;
      if (!user) {
        location.href = "account.html?next=studio.html";
        return;
      }

      const fd = new FormData(form);
      const fullName = String(fd.get("fullName") || "").trim();
      const email = String(fd.get("email") || user.email || "").trim();
      if (email.toLowerCase() !== String(user.email || "").toLowerCase()) {
        throw new Error("Please use the same email address as your signed-in designer account.");
      }

      const profile = {
        user_id: user.id,
        full_name: fullName,
        designer_name: String(fd.get("publicName") || "").trim() || null,
        phone: String(fd.get("phone") || "").trim(),
        city: String(fd.get("city") || "").trim() || null,
        country: String(fd.get("country") || "India").trim(),
        email
      };
      const { error: profileError } = await client().from("designer_profiles").upsert(profile, { onConflict: "user_id" });
      if (profileError) throw profileError;

      const designPayload = {
        designer_id: user.id,
        design_name: $("designTitle").value.trim(),
        garment_type: $("garmentType").value,
        material: $("materialSelect").value,
        fabric_weight: $("fabricWeight").value,
        fabric_finish: $("fabricFinish").value,
        garment_color: window.getComputedStyle($("customColor")).display === "none"
          ? (document.querySelector(".swatch.selected")?.dataset.color || "#e7e3d8")
          : $("customColor").value,
        surface_pattern: document.querySelector("[data-pattern].active")?.dataset.pattern || "solid",
        design_data: {
          description: String(fd.get("description") || "").trim(),
          requested_quantity: quantity,
          artwork_included: Boolean($("uploadedPreview") && !$("uploadedPreview").hidden),
          studio_version: "ALOKIT Studio v4 connected"
        },
        status: "submitted"
      };
      const { data: design, error: designError } = await client()
        .from("designs").insert(designPayload).select("id").single();
      if (designError) throw designError;

      const previewDataUrl = await makeComposite();
      const previewBlob = await (await fetch(previewDataUrl)).blob();
      const previewPath = `${user.id}/${design.id}/preview.png`;
      const { error: uploadError } = await client().storage
        .from("designer-artwork")
        .upload(previewPath, previewBlob, { contentType: "image/png", upsert: false });
      if (uploadError) throw uploadError;

      const { error: updateDesignError } = await client().from("designs")
        .update({ preview_path: previewPath })
        .eq("id", design.id);
      if (updateDesignError) throw updateDesignError;

      const signature = String(fd.get("signature") || "").trim();
      const { data: submission, error: submissionError } = await client()
        .from("design_submissions")
        .insert({
          designer_id: user.id,
          design_id: design.id,
          requested_quantity: quantity,
          description: String(fd.get("description") || "").trim(),
          signature_name: signature,
          originality_confirmed: fd.get("originality") === "on",
          manufacturing_review_consent: fd.get("reviewConsent") === "on" && fd.get("termsRead") === "on",
          terms_version: "alokit-submission-2026-11-v1"
        })
        .select("id").single();
      if (submissionError) throw submissionError;

      const consentRows = [
        { consent_type: "originality_confirmation", accepted: fd.get("originality") === "on" },
        { consent_type: "manufacturing_review", accepted: fd.get("reviewConsent") === "on" },
        { consent_type: "submission_terms", accepted: fd.get("termsRead") === "on" }
      ].map(item => ({
        submission_id: submission.id,
        designer_id: user.id,
        consent_type: item.consent_type,
        accepted: item.accepted,
        signature_name: signature,
        terms_version: "alokit-submission-2026-11-v1"
      }));
      const { error: consentError } = await client().from("designer_consents").insert(consentRows);
      if (consentError) throw consentError;

      $("successPanel").classList.add("show");
      $("successPanel").querySelector("h3").textContent = "Your design has been submitted.";
      $("successPanel").querySelector("p").textContent =
        `ALOKIT received your submission. Reference: ${submission.id}. Your design is saved privately for review. A submission is not a manufacturing approval.`;
      $("downloadRecord").hidden = true;
      message("Submission saved securely to ALOKIT. You can close this window.");
      $("successPanel").scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("ALOKIT submission error:", error);
      message(error.message || "We couldn't save your submission. Please try again or contact ALOKIT.", true);
    } finally {
      submit.disabled = false;
      submit.textContent = "Submit design to ALOKIT ↗";
    }
  };
})();