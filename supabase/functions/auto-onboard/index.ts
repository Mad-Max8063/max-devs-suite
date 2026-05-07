import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type OnboardingPayload = {
  name?: string;
  business_name?: string;
  phone?: string;
  email?: string;
  service?: string;
  profession?: string;
  instagram?: string;
  address?: string;
  profile_img_url?: string;
  cover_img_url?: string;
  deposit?: string;
  primary_service?: string;
  origin?: string;
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitizeText(value = "", max = 240) {
  return String(value).trim().replace(/\s+/g, " ").slice(0, max);
}

function isValidEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function slugify(value: string) {
  return sanitizeText(value, 80)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || `suito-${Date.now()}`;
}

function randomToken(bytes = 16) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return Array.from(data).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizeWhatsAppNumber(value = "") {
  let digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("549")) return digits;
  if (digits.startsWith("54")) {
    const national = digits.slice(2).replace(/^0+/, "");
    return national.startsWith("9") ? digits : `549${national}`;
  }
  digits = digits.replace(/^0+/, "");
  if (digits.startsWith("9")) return `54${digits}`;
  if (digits.startsWith("1115")) digits = `11${digits.slice(4)}`;
  return `549${digits}`;
}

function buildWhatsAppUrl(phone: string, text: string) {
  const normalized = normalizeWhatsAppNumber(phone);
  const base = normalized ? `https://wa.me/${normalized}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

async function getUniqueSlug(supabase: ReturnType<typeof createClient>, base: string) {
  for (let i = 0; i < 8; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data, error } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) throw error;
    if (!data) return candidate;
  }
  return `${base}-${randomToken(3)}`;
}

function getBaseUrl(req: Request) {
  const configured = Deno.env.get("SUITO_PUBLIC_URL") || Deno.env.get("PUBLIC_SITE_URL");
  if (configured) return configured.replace(/\/$/, "");
  const origin = req.headers.get("origin");
  return origin ? origin.replace(/\/$/, "") : "https://suito.pro";
}

function buildWelcomeText(params: {
  name: string;
  cardUrl: string;
  editUrl?: string;
  betaRequested: boolean;
}) {
  const betaLine = params.betaRequested
    ? "\n\nTambien recibimos tu interes por la beta privada de turnos. Te vamos a contactar si tu caso encaja con la validacion actual."
    : "";
  const editorLine = params.editUrl
    ? `\n\nPara configurarla, entra a tu editor privado:\n${params.editUrl}`
    : "\n\nTe enviamos el acceso privado al editor por email para cuidar tu cuenta.";

  return `Hola ${params.name}! Bienvenido/a a Suito.\n\nTu tarjeta ya esta activa:\n${params.cardUrl}${editorLine}\n\nRecomendacion rapida:\n1. Completa tu descripcion y datos de contacto.\n2. Sube una foto clara y una portada.\n3. Revisa el mensaje de WhatsApp.\n4. Comparte tu link en Instagram, WhatsApp y bio.${betaLine}`;
}

async function sendWelcomeEmail(to: string, subject: string, text: string, links: { cardUrl: string; editUrl: string }) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey || !to) return { sent: false, reason: "RESEND_API_KEY missing or email empty" };

  const from = Deno.env.get("SUITO_EMAIL_FROM") || "Suito <hola@suito.pro>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;line-height:1.55;color:#171717;max-width:560px;margin:0 auto;padding:24px;">
          <h1 style="font-size:24px;margin:0 0 12px;">Tu tarjeta Suito ya esta activa</h1>
          <p>Bienvenido/a. Ya podes entrar, configurarla y compartirla.</p>
          <p><strong>Tu tarjeta publica:</strong><br><a href="${links.cardUrl}">${links.cardUrl}</a></p>
          <p><strong>Tu editor privado:</strong><br><a href="${links.editUrl}">${links.editUrl}</a></p>
          <p>Para empezar: completa tu descripcion, carga foto y portada, revisa tu WhatsApp y comparti el link en tus redes.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[auto-onboard] Resend error:", errorText);
    return { sent: false, reason: errorText };
  }

  return { sent: true };
}

async function sendWhatsAppTemplate(phone: string, variables: string[]) {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const templateName = Deno.env.get("WHATSAPP_WELCOME_TEMPLATE");
  const to = normalizeWhatsAppNumber(phone);

  if (!token || !phoneNumberId || !templateName || !to) {
    return { sent: false, reason: "WhatsApp Cloud API env missing or phone empty" };
  }

  const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: Deno.env.get("WHATSAPP_TEMPLATE_LANG") || "es_AR" },
        components: [{
          type: "body",
          parameters: variables.map((text) => ({ type: "text", text })),
        }],
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[auto-onboard] WhatsApp error:", errorText);
    return { sent: false, reason: errorText };
  }

  return { sent: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const payload = await req.json() as OnboardingPayload;
    const name = sanitizeText(payload.name, 80);
    const phone = sanitizeText(payload.phone, 40);
    const email = sanitizeText(payload.email, 120);
    const service = sanitizeText(payload.service || "TARJETA", 20).toUpperCase();
    const businessName = sanitizeText(payload.business_name || name, 100);

    if (name.length < 3) return json({ error: "Nombre invalido" }, 400);
    if (phone.replace(/\D/g, "").length < 8) return json({ error: "WhatsApp invalido" }, 400);
    if (!isValidEmail(email)) return json({ error: "Email invalido" }, 400);
    if (!Deno.env.get("RESEND_API_KEY")) {
      return json({ error: "Email de bienvenida no configurado" }, 500);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    );

    const baseUrl = getBaseUrl(req);
    const betaRequested = service === "TURNOS" || service === "COMBO";
    const slug = await getUniqueSlug(supabase, slugify(businessName || name));
    const editToken = randomToken(16);
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 3);

    const { data: business, error: insertError } = await supabase
      .from("businesses")
      .insert({
        contact_name: name,
        nombre_negocio: businessName,
        telefono: phone,
        email,
        slug,
        plan: "tarjeta",
        status: "active",
        is_premium: false,
        edit_token: editToken,
        profession: sanitizeText(payload.profession, 100) || null,
        instagram: sanitizeText(payload.instagram, 120) || null,
        location: sanitizeText(payload.address, 160) || null,
        foto_url: payload.profile_img_url || null,
        cover_url: payload.cover_img_url || null,
        notes: betaRequested ? `Interes beta privada turnos. Servicio solicitado: ${service}.` : null,
        subscription_status: "trial",
        trial_ends_at: trialEnd.toISOString(),
        fecha_vencimiento: trialEnd.toISOString().split("T")[0],
        active_modules: ["card"],
        notificaciones_email: true,
      })
      .select("*")
      .single();

    if (insertError) throw insertError;

    await supabase.from("leads").insert({
      name,
      phone,
      email,
      service_type: service,
      profile_img_url: payload.profile_img_url || null,
      cover_img_url: payload.cover_img_url || null,
      status: "activated",
      details: {
        profession: payload.profession || "",
        instagram: payload.instagram || "",
        address: payload.address || "",
        business_name: businessName,
        deposit: payload.deposit || "",
        primary_service: payload.primary_service || "",
        origin: payload.origin || "Landing",
        auto_onboarded_business_id: business.id,
        beta_turnos_requested: betaRequested,
      },
    });

    const cardUrl = `${baseUrl}/card/${slug}`;
    const editUrl = `${baseUrl}/edit/${slug}?token=${editToken}`;
    const publicWelcomeText = buildWelcomeText({ name, cardUrl, betaRequested });
    const emailWelcomeText = buildWelcomeText({ name, cardUrl, editUrl, betaRequested });
    const whatsappUrl = buildWhatsAppUrl("", publicWelcomeText);
    const emailResult = await sendWelcomeEmail(email, "Tu tarjeta Suito ya esta activa", emailWelcomeText, { cardUrl, editUrl });
    if (!emailResult.sent) {
      await supabase.from("leads")
        .update({ status: "email_failed" })
        .eq("details->>auto_onboarded_business_id", business.id);
      return json({ error: "No pudimos enviar el email de acceso. Reintenta o contactanos." }, 502);
    }
    const whatsappResult = await sendWhatsAppTemplate(phone, [name, cardUrl, "Revisa tu email para abrir el editor privado"]);

    return json({
      ok: true,
      business_id: business.id,
      slug,
      card_url: cardUrl,
      whatsapp_url: whatsappUrl,
      email_sent: emailResult.sent,
      whatsapp_sent: whatsappResult.sent,
      beta_turnos_requested: betaRequested,
    });
  } catch (error) {
    console.error("[auto-onboard] error:", error);
    return json({ error: error instanceof Error ? error.message : "Error inesperado" }, 400);
  }
});
