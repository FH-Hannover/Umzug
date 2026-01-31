function getBool(formData, key) {
  return formData.get(key) === "on";
}

function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function saveQuote(entry) {
  const key = "umzugsfirma_quotes";
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.push(entry);
  localStorage.setItem(key, JSON.stringify(existing));
}

const form = document.getElementById("quoteForm");
const result = document.getElementById("result");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const fd = new FormData(form);

  const quote = {
    id: "qr_" + Date.now(),
    createdAt: new Date().toISOString(),

    customer: {
      fullName: String(fd.get("fullName") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      phone: String(fd.get("phone") || "").trim() || null,
    },

    move: {
      fromAddress: String(fd.get("fromAddress") || "").trim(),
      toAddress: String(fd.get("toAddress") || "").trim(),
      moveDate: String(fd.get("moveDate") || "").trim() || null,
      rooms: toNumberOrNull(fd.get("rooms")) ?? 1,
      livingAreaM2: toNumberOrNull(fd.get("livingAreaM2")),
    },

    details: {
      floorFrom: toNumberOrNull(fd.get("floorFrom")),
      floorTo: toNumberOrNull(fd.get("floorTo")),
      elevatorFrom: getBool(fd, "elevatorFrom"),
      elevatorTo: getBool(fd, "elevatorTo"),
      packingHelp: getBool(fd, "packingHelp"),
    },

    notes: String(fd.get("notes") || "").trim() || null,

    meta: {
      source: "website",
      status: "new",
    },
  };

  // Minimal-Check (Browser-required deckt schon viel ab)
  if (!quote.customer.fullName || !quote.customer.email || !quote.move.fromAddress || !quote.move.toAddress) {
    result.textContent = "Bitte fülle alle Pflichtfelder (*) aus.";
    return;
  }

  saveQuote(quote);

  result.innerHTML =
    `<strong style="color:var(--success)">Danke!</strong> Deine Anfrage wurde gespeichert. ` +
    `Wir melden uns zeitnah bei dir. <span style="color:var(--muted)">(${quote.id})</span>`;

  form.reset();
});
