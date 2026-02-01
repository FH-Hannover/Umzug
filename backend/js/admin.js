const STORAGE_KEY = "umzugsfirma_quotes";

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

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("de-DE");
}

function textIncludes(haystack, needle) {
  return String(haystack || "").toLowerCase().includes(String(needle || "").toLowerCase());
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

function matchesStatusFilter(item, filter) {
  if (filter === "all") return true;
  return (item.meta?.status || "new") === filter;
}

function badgeText(item) {
  const rooms = item.move?.rooms ? `${item.move.rooms} Zi.` : "";
  const date = item.move?.moveDate ? `Datum: ${item.move.moveDate}` : "";
  const pack = item.details?.packingHelp ? "Packservice" : "";
  const liftFrom = item.details?.elevatorFrom ? "Lift(von)" : "";
  const liftTo = item.details?.elevatorTo ? "Lift(nach)" : "";
  const parts = [rooms, date, pack, liftFrom, liftTo].filter(Boolean);
  return parts.join(" • ") || "-";
}

function render() {
  const rows = document.getElementById("rows");
  const empty = document.getElementById("empty");
  const count = document.getElementById("count");
  const search = document.getElementById("search").value.trim();
  const statusFilter = document.getElementById("statusFilter").value;

  const all = loadQuotes();

  const filtered = all
    .filter((it) => matchesSearch(search, it))
    .filter((it) => matchesStatusFilter(it, statusFilter))
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  rows.innerHTML = "";

  if (filtered.length === 0) {
    empty.style.display = "block";
  } else {
    empty.style.display = "none";
  }

  count.textContent = `Anfragen: ${filtered.length}`;

  for (const item of filtered) {
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid var(--border)";

    const status = item.meta?.status || "new";

    tr.innerHTML = `
      <td style="padding:12px 10px; white-space:nowrap;">${formatDate(item.createdAt)}</td>
      <td style="padding:12px 10px;">
        <div style="font-weight:700;">${item.customer?.fullName || "-"}</div>
        <div style="color:var(--muted); font-size:12px;">${item.customer?.email || "-"}</div>
        <div style="color:var(--muted); font-size:12px;">${item.customer?.phone || ""}</div>
        <div style="color:var(--muted); font-size:12px;">ID: ${item.id || "-"}</div>
      </td>
      <td style="padding:12px 10px;">
        <div><strong>Von:</strong> ${item.move?.fromAddress || "-"}</div>
        <div><strong>Nach:</strong> ${item.move?.toAddress || "-"}</div>
      </td>
      <td style="padding:12px 10px; color:var(--muted);">
        ${badgeText(item)}
        ${item.notes ? `<div style="margin-top:6px; font-size:12px;">Notiz: ${item.notes}</div>` : ""}
      </td>
      <td style="padding:12px 10px;">
        <select data-id="${item.id}" class="statusSelect input" style="max-width:140px;">
          <option value="new" ${status === "new" ? "selected" : ""}>Neu</option>
          <option value="done" ${status === "done" ? "selected" : ""}>Erledigt</option>
        </select>
      </td>
      <td style="padding:12px 10px; white-space:nowrap;">
        <button class="btn btn-ghost deleteBtn" data-id="${item.id}" type="button">Löschen</button>
      </td>
    `;

    rows.appendChild(tr);
  }

  // Events: Status ändern
  document.querySelectorAll(".statusSelect").forEach((sel) => {
    sel.addEventListener("change", (e) => {
      const id = e.target.getAttribute("data-id");
      const val = e.target.value;

      const items = loadQuotes();
      const idx = items.findIndex((x) => x.id === id);
      if (idx >= 0) {
        items[idx].meta = items[idx].meta || {};
        items[idx].meta.status = val;
        saveQuotes(items);
        render();
      }
    });
  });

  // Events: Löschen
  document.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.getAttribute("data-id");
      const items = loadQuotes().filter((x) => x.id !== id);
      saveQuotes(items);
      render();
    });
  });
}

document.getElementById("search").addEventListener("input", render);
document.getElementById("statusFilter").addEventListener("change", render);

document.getElementById("exportBtn").addEventListener("click", () => {
  const data = loadQuotes();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `umzugpro-anfragen-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

document.getElementById("clearBtn").addEventListener("click", () => {
  const ok = confirm("Wirklich alle gespeicherten Anfragen löschen?");
  if (!ok) return;
  saveQuotes([]);
  render();
});

render();
