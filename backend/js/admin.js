/* ======================================================
   Umzugsfirma Admin – v1.0
   Bismillah – sauber, transparent, erweiterbar
====================================================== */
let ACTIVE_VIEW = "requests"; // requests | orders
let ACTIVE_ORDER_ID = null;

const STORAGE_KEY = "umzugsfirma_quotes";

/* =======================
   STORAGE
======================= */
function loadQuotes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveQuotes(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/* =======================
   HELPERS
======================= */
function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("de-DE");
}

function monthKey(iso) {
  if (!iso) return "unbekannt";
  return iso.slice(0, 7); // YYYY-MM
}

function textIncludes(h, n) {
  return String(h || "").toLowerCase().includes(String(n || "").toLowerCase());
}

function matchesSearch(q, s) {
  if (!q) return true;
  return (
    textIncludes(s.customer?.fullName, q) ||
    textIncludes(s.customer?.email, q) ||
    textIncludes(s.customer?.phone, q) ||
    textIncludes(s.move?.fromAddress, q) ||
    textIncludes(s.move?.toAddress, q) ||
    textIncludes(s.notes, q) ||
    textIncludes(s.id, q)
  );
}
function calcTotal() {
  const total =
    Number(document.getElementById("p_base")?.value || 0) +
    Number(document.getElementById("p_room")?.value || 0) +
    Number(document.getElementById("p_floor")?.value || 0) +
    Number(document.getElementById("p_pack")?.value || 0) +
    Number(document.getElementById("p_distance")?.value || 0) +
    Number(document.getElementById("p_extra")?.value || 0);

  const out = document.getElementById("totalPrice");
  if (out) out.textContent = total.toFixed(2) + " €";

  return total;
}





/* =======================
   DATA GROUPING
======================= */
function groupByMonth(items) {
  return items.reduce((acc, it) => {
    const m = monthKey(it.createdAt);
    acc[m] = acc[m] || [];
    acc[m].push(it);
    return acc;
  }, {});
}

/* =======================
   BADGES / LABELS
======================= */
function badgeText(item) {
  const parts = [];

  if (item.move?.rooms)
    parts.push(`${item.move.rooms} Zi.`);

  if (item.move?.floorFrom !== undefined)
    parts.push(`Etage von: ${item.move.floorFrom}`);

  if (item.move?.floorTo !== undefined)
    parts.push(`Etage nach: ${item.move.floorTo}`);

  if (item.details?.elevatorFrom)
    parts.push("Lift (von)");

  if (item.details?.elevatorTo)
    parts.push("Lift (nach)");

  if (item.details?.packingHelp)
    parts.push("Packservice");

  if (item.move?.moveDate)
    parts.push(`Datum: ${item.move.moveDate}`);

  return parts.join(" • ") || "-";
}


/* =======================
   RENDER
======================= */
let ACTIVE_MONTH = null;

function renderMonthTabs(grouped) {
  const tabs = document.getElementById("monthTabs");
  if (!tabs) return;

  tabs.innerHTML = "";

  Object.keys(grouped)
    .sort((a, b) => b.localeCompare(a))
    .forEach((month) => {
      const btn = document.createElement("button");
      btn.className = `btn btn-ghost ${ACTIVE_MONTH === month ? "active" : ""}`;
      btn.textContent = month;
      btn.onclick = () => {
        ACTIVE_MONTH = month;
        render();
      };
      tabs.appendChild(btn);
    });

  if (!ACTIVE_MONTH) {
    ACTIVE_MONTH = Object.keys(grouped)[0] || null;
  }
}

function render() {
  const rows = document.getElementById("rows");
  const empty = document.getElementById("empty");
  const count = document.getElementById("count");
  const search = document.getElementById("search")?.value.trim() || "";

  if (!rows) return;

  // ---- Daten normalisieren
  const all = loadQuotes().map((it) => ({
    ...it,
    meta: {
      status: it.meta?.status || "new",
      type: it.meta?.type || "request", // request | order
      month: it.meta?.month || monthKey(it.createdAt)
    }
  }));

  // ---- View filtern
  const visible = all.filter((it) =>
    ACTIVE_VIEW === "requests"
      ? it.meta.type === "request"
      : it.meta.type === "order"
  );

  // ---- Gruppieren nach Monat
  const grouped = groupByMonth(visible);
  renderMonthTabs(grouped);

  const firstMonth = Object.keys(grouped)[0] || null;
if (!ACTIVE_MONTH || !grouped[ACTIVE_MONTH]) {
  ACTIVE_MONTH = firstMonth;
}

const list = (grouped[ACTIVE_MONTH] || [])

    .filter((it) => matchesSearch(search, it))
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  // ---- UI Reset
  rows.innerHTML = "";
  empty.style.display = list.length ? "none" : "block";
  count.textContent =
    ACTIVE_VIEW === "requests"
      ? `Anfragen: ${list.length}`
      : `Aufträge: ${list.length}`;

  // ---- Rows rendern
  list.forEach((item) => {
    const tr = document.createElement("tr");

    if (ACTIVE_VIEW === "requests") {
      /* ======================
         ANFRAGEN
      ====================== */
      tr.innerHTML = `
        <td>${formatDate(item.createdAt)}</td>

        <td>
          <strong>${item.customer?.fullName || "-"}</strong><br>
          <small>${item.customer?.email || "-"}</small><br>
          <small>${item.customer?.phone || ""}</small><br>
          <small>ID: ${item.id}</small>
        </td>

        <td>
          <strong>Von:</strong> ${item.move?.fromAddress || "-"}<br>
          <strong>Nach:</strong> ${item.move?.toAddress || "-"}
        </td>

        <td>${badgeText(item)}</td>

        <td>
          <button class="btn btn-primary makeOrderBtn" data-id="${item.id}">
            → Auftrag
          </button>
        </td>

        <td>
          <button class="btn btn-ghost deleteBtn" data-id="${item.id}">
            Löschen
          </button>
        </td>
      `;
    } else {
      /* ======================
         AUFTRÄGE
      ====================== */
      tr.innerHTML = `
        <td>${formatDate(item.createdAt)}</td>

        <td>
          <strong>${item.customer?.fullName || "-"}</strong><br>
          <small>${item.customer?.email || "-"}</small>
        </td>

        <td>
          ${item.move?.fromAddress || "-"} → ${item.move?.toAddress || "-"}
        </td>

        <td>
  <strong>Auftrag</strong><br>
  ${
    item.order?.pricing?.total
      ? `<small style="color:#16a34a; font-weight:700;">
           ${item.order.pricing.total.toFixed(2)} €
         </small>`
      : `<small style="color:#ca8a04; font-weight:600;">
           Berechnung offen
         </small>`
  }
</td>


        <td>
          <button class="btn btn-primary editOrderBtn" data-id="${item.id}">
            Auftrag bearbeiten
          </button>
        </td>

        <td>
          <button class="btn btn-ghost backToRequestBtn" data-id="${item.id}">
            ← Zurück
          </button>
        </td>
      `;
    }

    rows.appendChild(tr);
  });

  /* ======================
     EVENTS
  ====================== */

  // Anfrage → Auftrag
  document.querySelectorAll(".makeOrderBtn").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const items = loadQuotes();
      const idx = items.findIndex((x) => x.id === id);

      if (idx >= 0) {
        items[idx].meta = items[idx].meta || {};
        items[idx].meta.type = "order";
        items[idx].meta.status = "open";

        items[idx].order = items[idx].order || {
          pricing: {},
          finalized: false,
          lastEditedAt: new Date().toISOString()
        };

        saveQuotes(items);
        render();
      }
    };
  });

  // Auftrag → Anfrage (RÜCKGÄNGIG)
  document.querySelectorAll(".backToRequestBtn").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const items = loadQuotes();
      const idx = items.findIndex((x) => x.id === id);

      if (idx >= 0) {
        items[idx].meta.type = "request";
        items[idx].meta.status = "new";

        // Auftrag-Daten bewusst NICHT löschen
        // (falls später wieder gebraucht)

        saveQuotes(items);
        render();
      }
    };
  });

  // Löschen (beide Views)
  document.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      saveQuotes(loadQuotes().filter((x) => x.id !== id));
      render();
    };
  });

  // Auftrag bearbeiten (Platzhalter)
  document.querySelectorAll(".editOrderBtn").forEach((btn) => {
  btn.onclick = () => {
    const id = btn.dataset.id;
    const items = loadQuotes();
    const item = items.find(x => x.id === id);
    if (!item) return;

    ACTIVE_ORDER_ID = id;

    // Kundendaten anzeigen
    document.getElementById("c_name").textContent =
      item.customer?.fullName || "-";
    document.getElementById("c_email").textContent =
      item.customer?.email || "-";
    document.getElementById("c_route").textContent =
      `${item.move?.fromAddress || "-"} → ${item.move?.toAddress || "-"}`;
    document.getElementById("c_meta").textContent = `
${item.move?.rooms || "?"} Zimmer,
Etage von: ${item.move?.floorFrom ?? "-"},
Etage nach: ${item.move?.floorTo ?? "-"},
Lift von: ${item.details?.elevatorFrom ? "Ja" : "Nein"},
Lift nach: ${item.details?.elevatorTo ? "Ja" : "Nein"}
`;


    // Preise laden
    const p = item.order?.pricing || {};
    document.getElementById("p_base").value = p.base || "";
    document.getElementById("p_room").value = p.room || "";
    document.getElementById("p_floor").value = p.floor || "";
    document.getElementById("p_pack").value = p.pack || "";
    document.getElementById("p_distance").value = p.distance || "";
    document.getElementById("p_extra").value = p.extra || "";

    // Live-Berechnung aktivieren
    ["p_base","p_room","p_floor","p_pack","p_distance","p_extra"]
      .forEach(fid => {
        const el = document.getElementById(fid);
        el.oninput = calcTotal;
      });

    calcTotal();

    document.getElementById("orderCalc").style.display = "block";
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };
});



}


document.querySelectorAll("#adminTabs button").forEach(btn => {
  btn.addEventListener("click", () => {
    ACTIVE_VIEW = btn.dataset.view;
    ACTIVE_MONTH = null;

    document.querySelectorAll("#adminTabs button").forEach(b => {
      b.classList.remove("btn-primary");
      b.classList.add("btn-ghost");
    });

    btn.classList.remove("btn-ghost");
    btn.classList.add("btn-primary");

    render();
  });
});



/* =======================
   EXPORT / CLEAR
======================= */
document.getElementById("exportBtn")?.addEventListener("click", () => {
  const blob = new Blob(
    [JSON.stringify(loadQuotes(), null, 2)],
    { type: "application/json" }
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `umzugsfirma-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
});

document.getElementById("clearBtn")?.addEventListener("click", () => {
  if (confirm("Alle Anfragen wirklich löschen?")) {
    saveQuotes([]);
    render();
  }
});
document.getElementById("saveOrderCalc")?.addEventListener("click", (e) => {
  e.preventDefault();
  const items = loadQuotes();
  const idx = items.findIndex(x => x.id === ACTIVE_ORDER_ID);
  if (idx < 0) return;

  items[idx].order = {
    pricing: {
      base: Number(document.getElementById("p_base").value || 0),
      room: Number(document.getElementById("p_room").value || 0),
      floor: Number(document.getElementById("p_floor").value || 0),
      pack: Number(document.getElementById("p_pack").value || 0),
      distance: Number(document.getElementById("p_distance").value || 0),
      extra: Number(document.getElementById("p_extra").value || 0),
      total: calcTotal()
    },
    finalized: true,
    lastEditedAt: new Date().toISOString()
  };

  saveQuotes(items);
  alert("Berechnung gespeichert ✔️");
});
document.getElementById("closeCalc")?.addEventListener("click", (e) => {
  e.preventDefault();
  const box = document.getElementById("orderCalc");
  if (!box) return;

  box.style.display = "none";
  ACTIVE_ORDER_ID = null;
});

document.addEventListener("DOMContentLoaded", () => {

  /* =======================
     BUTTON EVENTS
  ======================= */

  document.getElementById("saveOrderCalc")?.addEventListener("click", (e) => {
    e.preventDefault();

    if (!ACTIVE_ORDER_ID) {
      alert("Kein Auftrag ausgewählt");
      return;
    }

    const items = loadQuotes();
    const idx = items.findIndex(x => x.id === ACTIVE_ORDER_ID);
    if (idx < 0) return;

    items[idx].order = {
      pricing: {
        base: Number(p_base.value || 0),
        room: Number(p_room.value || 0),
        floor: Number(p_floor.value || 0),
        pack: Number(p_pack.value || 0),
        distance: Number(p_distance.value || 0),
        extra: Number(p_extra.value || 0),
        total: calcTotal()
      },
      finalized: true,
      lastEditedAt: new Date().toISOString()
    };

    saveQuotes(items);

    alert("Berechnung gespeichert ✔️");

    document.getElementById("orderCalc").style.display = "none";
    ACTIVE_ORDER_ID = null;

    render();
  });


  document.getElementById("closeCalc")?.addEventListener("click", (e) => {
    e.preventDefault();

    document.getElementById("orderCalc").style.display = "none";
    ACTIVE_ORDER_ID = null;
  });

  render();
});
