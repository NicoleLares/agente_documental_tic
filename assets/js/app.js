/* =====================================================
   1. CONFIGURACIÓN DE ENTORNO
   ===================================================== */

// Detectar ejecución local.

const IS_LOCAL = [
  "localhost",
  "127.0.0.1"
].includes(window.location.hostname);


// Backend correspondiente a cada entorno.
//
// Localhost:
// Usa rutas relativas del mismo servidor FastAPI.
//
// GitHub Pages:
// Consume el backend desplegado en Vercel.

const API_ROOT = IS_LOCAL
  ? ""
  : "https://agente-documental-tic-xjgr.vercel.app";


// Acceso a elementos HTML.

const $ = (id) => document.getElementById(id);


// Estado temporal de la aplicación.

const state = {
  documents: [],
  messages: [],
  busy: false,
  syncing: false
};


// Respaldo para versiones anteriores del HTML.

const originalWelcome =
  $("empty-state")?.cloneNode(true) || null;


/* =====================================================
   2. CONEXIÓN CON FASTAPI
   ===================================================== */

async function request(path, options = {}) {

  let response;

  try {

    response = await fetch(
      `${API_ROOT}${path}`,
      {
        cache: "no-store",
        ...options
      }
    );

  } catch (error) {

    console.error(
      "Error de conexión:",
      error
    );

    throw new Error(
      IS_LOCAL
        ? "No se pudo conectar con FastAPI. Verifica que python app.py esté ejecutándose."
        : "No se pudo conectar con Vercel. Comprueba la URL del backend y la configuración CORS."
    );
  }


  // Leer contenido de la respuesta.

  const raw = await response.text();

  let data;

  try {

    data = JSON.parse(raw);

  } catch {

    throw new Error(
      `El endpoint ${path} no devolvió JSON válido. ` +
      `HTTP ${response.status}.`
    );
  }


  // Gestionar errores HTTP.

  if (!response.ok) {

    let detail = `Error HTTP ${response.status}`;

    if (typeof data.detail === "string") {

      detail = data.detail;

    } else if (
      Array.isArray(data.detail)
    ) {

      detail = data.detail
        .map((item) => item.msg || "Error")
        .join("; ");

    } else if (
      typeof data.message === "string"
    ) {

      detail = data.message;
    }

    throw new Error(detail);
  }

  return data;
}


/* =====================================================
   3. ENDPOINTS API
   ===================================================== */

const api = {

  // Estado del backend.
  health: () => request(
    "/api/health"
  ),

  // Documentos indexados.
  documents: () => request(
    "/api/documents"
  ),

  // Consulta a OpenAI.
  ask: (question, useSearch) => request(
    "/api/ask",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        question: question,
        use_search: useSearch
      })
    }
  ),

  // Sincronización local de Drive.
  sync: () => request(
    "/api/sync",
    {
      method: "POST"
    }
  )
};


/* =====================================================
   4. UTILIDADES
   ===================================================== */

function make(
  tag,
  className = "",
  text = ""
) {

  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  element.textContent = text;

  return element;
}


// Notificaciones.

function notify(
  text,
  kind = "info"
) {

  const box = $("message");

  if (!box) return;

  box.textContent = text;

  box.className = `notification ${kind}`;

  box.hidden = false;
}


// Ocultar notificaciones.

function clearNotice() {

  const box = $("message");

  if (!box) return;

  box.hidden = true;

  box.textContent = "";
}


// Validar URL original de Google Drive.

function driveLink(source) {

  if (!source?.url) {
    return null;
  }

  try {

    const url = new URL(source.url);

    const allowedHosts = [
      "drive.google.com",
      "docs.google.com"
    ];

    if (
      url.protocol === "https:" &&
      allowedHosts.includes(url.hostname)
    ) {

      return url.href;
    }

  } catch {

    // URL no válida.
  }

  return null;
}


// Identificar tipo de documento.

function documentType(doc) {

  const mime = doc?.mime_type || "";

  if (mime === "application/pdf") {

    return {
      code: "pdf",
      label: "PDF"
    };
  }

  if (
    mime === "application/vnd.google-apps.document"
  ) {

    return {
      code: "docs",
      label: "DOC"
    };
  }

  return {
    code: "txt",
    label: "TXT"
  };
}


/* =====================================================
   5. DOCUMENTOS INDEXADOS
   ===================================================== */

function renderDocuments() {

  const list = $("documents");

  if (!list) return;

  list.replaceChildren();


  // Filtro por nombre.

  const filter = (
    $("doc-search")?.value || ""
  )
    .trim()
    .toLocaleLowerCase("es");


  // Filtro por formato.

  const format =
    $("doc-type")?.value || "all";


  const shown = state.documents.filter(
    (doc) => {

      const name = String(
        doc.name || ""
      ).toLocaleLowerCase("es");

      const matchesName = name.includes(filter);

      const matchesFormat =
        format === "all" ||
        documentType(doc).code === format;

      return matchesName && matchesFormat;
    }
  );


  // Biblioteca vacía.

  if (shown.length === 0) {

    const message = state.documents.length
      ? "No hay documentos que coincidan con los filtros."
      : "Todavía no hay documentos indexados.";

    list.append(
      make(
        "div",
        "docs-placeholder",
        message
      )
    );

    return;
  }


  // Mostrar archivos.

  for (const doc of shown) {

    const type = documentType(doc);

    const item = make(
      "div",
      "doc-item"
    );

    const badge = make(
      "span",
      `doc-icon ${type.code}`,
      type.label
    );

    const content = make(
      "div",
      "doc-main"
    );

    const href = driveLink(doc);

    const name = make(
      href ? "a" : "span",
      "doc-link",
      doc.name || "Documento sin nombre"
    );

    if (href) {

      name.href = href;

      name.target = "_blank";

      name.rel =
        "noopener noreferrer";
    }

    const meta = make(
      "div",
      "doc-meta",
      `${type.label} · indexado`
    );

    content.append(
      name,
      meta
    );

    item.append(
      badge,
      content
    );

    list.append(item);
  }
}


/* =====================================================
   6. CARGAR INVENTARIO DOCUMENTAL
   ===================================================== */

async function loadDocuments(
  showMessage = false
) {

  const button = $("refresh-docs");

  if (button) {
    button.disabled = true;
  }

  try {

    const result = await api.documents();

    state.documents = Array.isArray(
      result.documents
    )
      ? result.documents
      : [];


    const count = state.documents.length;

    $("doc-count").textContent =
      String(count);

    $("stat-documents").textContent =
      String(count);


    // Estado del índice documental.

    const configured = Boolean(
      result.vector_store_configured
    );

    $("index-status").textContent =
      configured
        ? `${count} archivos en el índice`
        : "Índice aún no creado";

    $("index-dot").className =
      configured
        ? "status-indicator ready"
        : "status-indicator";


    renderDocuments();


    if (showMessage) {

      notify(
        "Listado documental actualizado correctamente.",
        "success"
      );
    }

  } catch (error) {

    console.error(
      "Error cargando documentos:",
      error
    );

    $("index-status").textContent =
      "No se pudo cargar el inventario";

    $("index-dot").className =
      "status-indicator failed";

    $("documents").replaceChildren(
      make(
        "div",
        "docs-placeholder",
        error.message
      )
    );

    notify(
      error.message,
      "error"
    );

  } finally {

    if (button) {
      button.disabled = false;
    }
  }
}


/* =====================================================
   7. ESTADO DEL SERVIDOR
   ===================================================== */

async function checkHealth() {

  try {

    const result = await api.health();

    const configured = Boolean(
      result.configured
    );

    $("health").className =
      configured
        ? "health-pill ready"
        : "health-pill failed";

    $("health-label").textContent =
      configured
        ? "Servidor configurado"
        : "Configuración pendiente";

  } catch (error) {

    console.error(
      "Error comprobando servidor:",
      error
    );

    $("health").className =
      "health-pill failed";

    $("health-label").textContent =
      "Sin conexión al servidor";

    notify(
      error.message,
      "error"
    );
  }
}


/* =====================================================
   8. MODO FILE SEARCH (RAG)
   ===================================================== */

function updateMode() {

  const enabled =
    $("use-search").checked;


  $("stat-mode").textContent =
    enabled
      ? "RAG activado"
      : "Sin RAG";


  $("mode-tag").textContent =
    enabled
      ? "● File Search activo"
      : "○ Sin File Search";


  $("mode-tag").classList.toggle(
    "off",
    !enabled
  );


  $("mode-note").textContent =
    enabled
      ? "Búsqueda documental habilitada"
      : "Sin acceso al índice documental";
}


/* =====================================================
   9. CONTADOR Y VALIDACIÓN DE PREGUNTAS
   ===================================================== */

function updateCounter() {

  const question = $("question");

  $("char-count").textContent =
    `${question.value.length} / 3000`;
}


function getQuestion() {

  const text =
    $("question").value.trim();

  if (
    text.length < 3 ||
    text.length > 3000
  ) {

    notify(
      "La pregunta debe tener entre 3 y 3000 caracteres.",
      "error"
    );

    $("question").focus();

    return null;
  }

  return text;
}


/* =====================================================
   10. FUENTES DOCUMENTALES
   ===================================================== */

function sourcesBlock(
  sources,
  usedRag
) {

  const box = make(
    "div",
    "sources-block"
  );

  const title = make(
    "div",
    "sources-title",
    usedRag
      ? `Fuentes verificables: ${sources.length}`
      : "Fuentes documentales"
  );

  box.append(title);


  const list = make(
    "div",
    "sources-list"
  );


  if (
    !usedRag ||
    sources.length === 0
  ) {

    const text = usedRag
      ? "No se devolvieron citas verificables."
      : "File Search desactivado: no se consultó el índice.";

    list.append(
      make(
        "span",
        "source-text",
        text
      )
    );

  } else {

    for (const source of sources) {

      const href = driveLink(source);

      const chip = make(
        href ? "a" : "span",
        href ? "source-link" : "source-text",
        `↗ ${source.name || "Documento"}`
      );


      if (href) {

        chip.href = href;

        chip.target = "_blank";

        chip.rel =
          "noopener noreferrer";
      }

      list.append(chip);
    }
  }

  box.append(list);

  return box;
}


/* =====================================================
   11. COPIAR RESPUESTAS
   ===================================================== */

function copyButton(value) {

  const button = make(
    "button",
    "message-action",
    "⧉ Copiar respuesta"
  );

  button.type = "button";


  button.addEventListener(
    "click",
    async () => {

      try {

        await navigator.clipboard.writeText(
          value
        );

        button.textContent =
          "✓ Copiado";

      } catch {

        notify(
          "No se pudo copiar automáticamente.",
          "error"
        );
      }
    }
  );

  return button;
}


/* =====================================================
   12. MENSAJES DEL CHAT
   ===================================================== */

function renderMessage(entry) {

  const isUser =
    entry.role === "user";

  const row = make(
    "article",
    `chat-message ${
      isUser ? "user" : "assistant"
    }`
  );


  const avatar = make(
    "div",
    "message-avatar",
    isUser ? "TÚ" : "AI"
  );

  avatar.setAttribute(
    "aria-hidden",
    "true"
  );

  row.append(avatar);


  const body = make(
    "div",
    "message-body"
  );


  const name = isUser
    ? "TU PREGUNTA"
    : entry.withSearch
      ? "ARCHIVO TIC IA · RAG"
      : "ARCHIVO TIC IA · SIN RAG";


  body.append(
    make(
      "div",
      "message-name",
      name
    )
  );


  const bubble = make(
    "div",
    `message-bubble ${
      entry.error ? "error" : ""
    }`,
    entry.text
  );

  body.append(bubble);


  // Fuentes y botón copiar.

  if (
    !isUser &&
    !entry.error &&
    !entry.pending
  ) {

    body.append(
      sourcesBlock(
        entry.sources || [],
        Boolean(entry.withSearch)
      )
    );

    const tools = make(
      "div",
      "message-tools"
    );

    tools.append(
      copyButton(entry.text)
    );

    body.append(tools);
  }


  row.append(body);

  return row;
}


/* =====================================================
   13. COMPARADOR RAG VS SIN RAG
   ===================================================== */

function renderComparison(entry) {

  const wrapper = make(
    "section",
    "comparison-result"
  );

  wrapper.setAttribute(
    "aria-label",
    "Comparación con y sin RAG"
  );


  // Encabezado.

  const head = make(
    "div",
    "comparison-heading"
  );

  head.append(
    make(
      "span",
      "message-avatar",
      "AI"
    )
  );


  const label = make("div");

  label.append(
    make(
      "strong",
      "",
      "Comparación con y sin RAG"
    )
  );

  label.append(
    make(
      "p",
      "",
      "Misma pregunta · Dos consultas independientes"
    )
  );

  head.append(label);

  wrapper.append(head);


  // Tarjetas comparativas.

  const grid = make(
    "div",
    "comparison-grid"
  );


  const options = [
    {
      label: "Sin File Search",
      description: "Sin consultar el índice",
      value: entry.plain,
      rag: false
    },
    {
      label: "Con File Search (RAG)",
      description: "Con documentos de Drive",
      value: entry.rag,
      rag: true
    }
  ];


  for (const option of options) {

    const card = make(
      "article",
      `comparison-card ${
        option.rag ? "rag" : "plain"
      }`
    );


    const top = make(
      "div",
      "comparison-card-header"
    );

    top.append(
      make(
        "strong",
        "",
        option.label
      )
    );

    top.append(
      make(
        "span",
        "",
        option.description
      )
    );


    const body = make(
      "div",
      "comparison-card-body"
    );

    body.append(
      make(
        "div",
        `comparison-answer ${
          option.value.error ? "error" : ""
        }`,
        option.value.text
      )
    );


    if (!option.value.error) {

      body.append(
        sourcesBlock(
          option.value.sources || [],
          option.rag
        )
      );

      body.append(
        copyButton(
          option.value.text
        )
      );
    }

    card.append(
      top,
      body
    );

    grid.append(card);
  }

  wrapper.append(grid);


  // Tabla comparativa.

  const metrics = make(
    "div",
    "comparison-metrics"
  );

  const table =
    document.createElement("table");


  table.append(
    make(
      "caption",
      "",
      "Cuadro comparativo de la práctica"
    )
  );


  const thead =
    document.createElement("thead");

  const headerRow =
    document.createElement("tr");


  for (const title of [
    "Criterio",
    "Sin RAG",
    "Con RAG"
  ]) {

    const th = make(
      "th",
      "",
      title
    );

    th.scope = "col";

    headerRow.append(th);
  }

  thead.append(headerRow);

  table.append(thead);


  const tbody =
    document.createElement("tbody");


  const rows = [
    [
      "Uso del índice",
      "No",
      entry.rag.error
        ? "Error en consulta"
        : "Habilitado"
    ],
    [
      "Fuentes documentales",
      "Sin búsqueda",
      entry.rag.error
        ? "No disponibles"
        : `${
            (entry.rag.sources || []).length
          } citas`
    ],
    [
      "Precisión",
      "Revisión manual",
      "Revisión manual"
    ]
  ];


  for (const cells of rows) {

    const row =
      document.createElement("tr");


    cells.forEach(
      (value, index) => {

        const cell = make(
          index === 0 ? "th" : "td",
          "",
          value
        );

        if (index === 0) {
          cell.scope = "row";
        }

        row.append(cell);
      }
    );

    tbody.append(row);
  }


  table.append(tbody);

  metrics.append(table);

  wrapper.append(metrics);


  wrapper.append(
    make(
      "p",
      "comparison-note",
      "RAG puede mejorar la evidencia documental, pero no garantiza precisión. Verifica las fuentes originales."
    )
  );

  return wrapper;
}


/* =====================================================
   14. PANTALLA DE BIENVENIDA
   ===================================================== */

function renderWelcome(conversation) {

  const template =
    $("empty-state-template");


  if (
    template?.content?.childElementCount
  ) {

    conversation.append(
      template.content.cloneNode(true)
    );

  } else if (originalWelcome) {

    conversation.append(
      originalWelcome.cloneNode(true)
    );

  } else {

    const fallback = make(
      "div",
      "empty-state"
    );

    fallback.append(
      make(
        "div",
        "empty-orb",
        "✦"
      )
    );

    fallback.append(
      make(
        "h3",
        "",
        "¿Qué quieres investigar hoy?"
      )
    );

    fallback.append(
      make(
        "p",
        "",
        "Pregunta sobre tus documentos de Google Drive."
      )
    );

    conversation.append(fallback);
  }


  // Activar preguntas sugeridas.

  conversation
    .querySelectorAll("[data-prompt]")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          $("question").value =
            button.dataset.prompt || "";

          updateCounter();

          $("question").focus();
        }
      );
    });
}


/* =====================================================
   15. RENDERIZAR CONVERSACIÓN
   ===================================================== */

function renderConversation(
  pending = null
) {

  const area = $("conversation");

  area.replaceChildren();


  if (
    state.messages.length === 0 &&
    !pending
  ) {

    renderWelcome(area);
  }


  // Historial temporal.

  for (const entry of state.messages) {

    if (entry.role === "comparison") {

      area.append(
        renderComparison(entry)
      );

    } else {

      area.append(
        renderMessage(entry)
      );
    }
  }


  // Mensaje de carga.

  if (pending) {

    area.append(
      renderMessage({
        role: "assistant",
        pending: true,
        withSearch: pending.withSearch,
        text: pending.comparison
          ? "Consultando con y sin File Search..."
          : "Preparando la respuesta..."
      })
    );
  }


  // Número de preguntas.

  const questions = state.messages.filter(
    (item) => item.role === "user"
  ).length;

  $("stat-queries").textContent =
    String(questions);


  // Exportación disponible si hay historial.

  $("export-chat").disabled =
    state.messages.length === 0;


  // Desplazar hacia el último mensaje.

  area.scrollTop = area.scrollHeight;
}


/* =====================================================
   16. BLOQUEAR CONTROLES DURANTE CONSULTA
   ===================================================== */

function setBusy(value) {

  state.busy = value;

  const controls = [
    "ask",
    "compare",
    "question",
    "new-chat",
    "use-search"
  ];


  controls.forEach((id) => {

    const element = $(id);

    if (element) {

      element.disabled = value;
    }
  });
}


/* =====================================================
   17. LIMPIAR CAMPO DE CONSULTA
   ===================================================== */

function clearInput() {

  $("question").value = "";

  updateCounter();

  clearNotice();
}


/* =====================================================
   18. CONSULTA NORMAL A OPENAI
   ===================================================== */

async function ask() {

  if (state.busy) return;


  const question = getQuestion();

  if (!question) return;


  const withSearch =
    $("use-search").checked;


  state.messages.push({
    role: "user",
    text: question
  });


  clearInput();

  setBusy(true);


  renderConversation({
    withSearch
  });


  try {

    // Solicitud al backend.
    //
    // Localhost -> FastAPI local.
    // GitHub Pages -> Vercel.

    const data = await api.ask(
      question,
      withSearch
    );


    state.messages.push({
      role: "assistant",
      withSearch,
      text: data.answer ||
        "La API devolvió una respuesta vacía.",
      sources: Array.isArray(
        data.sources
      )
        ? data.sources
        : []
    });


    renderConversation();

  } catch (error) {

    console.error(
      "Error al consultar OpenAI:",
      error
    );


    state.messages.push({
      role: "assistant",
      withSearch,
      error: true,
      text: error.message
    });


    renderConversation();


    notify(
      error.message,
      "error"
    );

  } finally {

    setBusy(false);

    $("question").focus();
  }
}


/* =====================================================
   19. COMPARACIÓN AUTOMÁTICA RAG
   ===================================================== */

async function compareRag() {

  if (state.busy) return;


  const question = getQuestion();

  if (!question) return;


  state.messages.push({
    role: "user",
    text: question
  });


  clearInput();

  setBusy(true);


  renderConversation({
    withSearch: true,
    comparison: true
  });


  try {

    // Ejecutar dos solicitudes independientes.
    //
    // false = sin RAG
    // true  = con RAG

    const results = await Promise.allSettled([
      api.ask(question, false),
      api.ask(question, true)
    ]);


    const normalize = (result) => {

      if (
        result.status === "fulfilled"
      ) {

        return {
          error: false,
          text: result.value.answer ||
            "Respuesta vacía.",
          sources: Array.isArray(
            result.value.sources
          )
            ? result.value.sources
            : []
        };
      }


      return {
        error: true,
        text: result.reason?.message ||
          "No se pudo completar la consulta.",
        sources: []
      };
    };


    const [plain, rag] =
      results.map(normalize);


    state.messages.push({
      role: "comparison",
      plain,
      rag
    });


    renderConversation();


    const hasErrors =
      plain.error || rag.error;


    notify(
      hasErrors
        ? "La comparación terminó con errores. Revisa ambas respuestas."
        : "Comparación terminada correctamente.",
      hasErrors
        ? "error"
        : "success"
    );

  } catch (error) {

    console.error(
      "Error en comparador RAG:",
      error
    );


    state.messages.push({
      role: "assistant",
      withSearch: true,
      text: error.message,
      error: true
    });


    renderConversation();


    notify(
      error.message,
      "error"
    );

  } finally {

    setBusy(false);

    $("question").focus();
  }
}


/* =====================================================
   20. SINCRONIZAR GOOGLE DRIVE
   ===================================================== */

async function sync() {

  // La sincronización es exclusiva de localhost.
  // Nunca realizarla desde GitHub Pages.

  if (!IS_LOCAL) {

    notify(
      "La sincronización de Google Drive está disponible únicamente desde localhost.",
      "error"
    );

    return;
  }


  if (state.syncing) return;


  const confirmed = window.confirm(
    "¿Deseas sincronizar tus documentos autorizados de Google Drive?"
  );


  if (!confirmed) return;


  state.syncing = true;


  $("sync").disabled = true;

  $("sync-label").textContent =
    "Sincronizando...";


  notify(
    "Conectando con Google Drive e indexando archivos. Esto puede tardar unos minutos."
  );


  try {

    const result = await api.sync();


    // Refrescar inventario.

    await loadDocuments();


    const stats =
      result.stats || result || {};


    const errors = Array.isArray(
      stats.errors
    )
      ? stats.errors.length
      : Number(stats.errors || 0);


    const summary = [
      `${stats.added || 0} nuevos`,
      `${stats.updated || 0} actualizados`,
      `${stats.removed || 0} eliminados`,
      `${stats.unchanged || 0} sin cambios`,
      `${errors} errores`
    ].join(", ");


    notify(
      `Sincronización finalizada: ${summary}.`,
      errors
        ? "error"
        : "success"
    );


    if (errors) {

      console.warn(
        "Errores durante la sincronización:",
        stats.errors
      );
    }

  } catch (error) {

    console.error(
      "Error de sincronización:",
      error
    );


    notify(
      error.message,
      "error"
    );

  } finally {

    state.syncing = false;


    $("sync").disabled = false;

    $("sync-label").textContent =
      "Sincronizar Drive";
  }
}


/* =====================================================
   21. EXPORTAR CONVERSACIÓN A TXT
   ===================================================== */

function exportChat() {

  if (!state.messages.length) return;


  const lines = [
    "ARCHIVO TIC IA - CONVERSACIÓN",
    `Fecha: ${new Date().toLocaleString("es-MX")}`,
    ""
  ];


  function addAnswer(
    label,
    result,
    withSearch
  ) {

    lines.push(
      label,
      result.text,
      ""
    );


    if (withSearch) {

      lines.push("Fuentes documentales:");


      const sources =
        result.sources || [];


      if (!sources.length) {

        lines.push(
          "Sin citas verificables."
        );

      } else {

        sources.forEach((source) => {

          const link = driveLink(source);

          lines.push(
            `- ${source.name || "Documento"}${
              link ? `: ${link}` : ""
            }`
          );
        });
      }


      lines.push("");
    }
  }


  for (const entry of state.messages) {

    if (entry.role === "user") {

      lines.push(
        "PREGUNTA:",
        entry.text,
        ""
      );

    } else if (
      entry.role === "comparison"
    ) {

      addAnswer(
        "COMPARACIÓN - SIN RAG:",
        entry.plain,
        false
      );


      addAnswer(
        "COMPARACIÓN - CON RAG:",
        entry.rag,
        true
      );


      lines.push(
        "Precisión: verificar manualmente con los documentos originales.",
        ""
      );

    } else {

      addAnswer(
        entry.withSearch
          ? "RESPUESTA CON RAG:"
          : "RESPUESTA SIN RAG:",
        entry,
        Boolean(entry.withSearch)
      );
    }


    lines.push(
      "---------------------------",
      ""
    );
  }


  // Crear archivo TXT.

  const blob = new Blob(
    [
      "\uFEFF",
      lines.join("\n")
    ],
    {
      type: "text/plain;charset=utf-8"
    }
  );


  const href =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href = href;

  link.download =
    `archivo-tic-ia-${
      new Date().toISOString().slice(0, 10)
    }.txt`;


  document.body.append(link);

  link.click();

  link.remove();


  setTimeout(() => {

    URL.revokeObjectURL(href);

  }, 1000);
}


/* =====================================================
   22. ADAPTAR INTERFAZ SEGÚN ENTORNO
   ===================================================== */

function configureEnvironment() {

  if (IS_LOCAL) {

    // En localhost dejamos habilitada
    // la sincronización de Google Drive.

    console.info(
      "Archivo TIC IA: entorno local"
    );

    return;
  }


  // En GitHub Pages se desactiva
  // la sincronización de Drive.

  const syncButton = $("sync");

  if (syncButton) {

    syncButton.hidden = true;
    syncButton.disabled = true;
  }


  // Ocultar la ayuda original y mostrar
  // una descripción del entorno remoto.

  const hint = document.querySelector(
    ".sidebar-hint"
  );

  if (hint) {

    hint.textContent =
      "Los documentos se sincronizan desde la aplicación local. Aquí puedes consultar el índice publicado.";
  }


  // El botón de actualizar documentos
  // seguirá funcionando desde Vercel.

  const refresh = $("refresh-docs");

  if (refresh) {

    refresh.title =
      "Actualizar documentos desde Vercel";

    refresh.setAttribute(
      "aria-label",
      "Actualizar documentos desde Vercel"
    );
  }


  console.info(
    "Archivo TIC IA: GitHub Pages conectado a Vercel."
  );
}


/* =====================================================
   23. INICIALIZACIÓN DE LA APLICACIÓN
   ===================================================== */

function initialize() {

  // Verificar compatibilidad HTML / JS.

  const requiredIds = [
    "health",
    "health-label",
    "documents",
    "index-status",
    "index-dot",
    "doc-count",
    "stat-documents",
    "question",
    "ask-form",
    "ask",
    "compare",
    "use-search",
    "stat-mode",
    "mode-tag",
    "mode-note",
    "stat-queries",
    "conversation",
    "export-chat",
    "char-count",
    "sync",
    "sync-label",
    "new-chat",
    "refresh-docs",
    "doc-search",
    "doc-type"
  ];


  const missing = requiredIds.filter(
    (id) => !$(id)
  );


  if (missing.length > 0) {

    console.error(
      "Faltan elementos del HTML:",
      missing
    );


    const healthLabel =
      $("health-label");


    if (healthLabel) {

      healthLabel.textContent =
        "Error: HTML y JavaScript incompatibles";
    }

    return;
  }


  // Configuración local / remota.

  configureEnvironment();


  // Enviar pregunta.

  $("ask-form").addEventListener(
    "submit",
    (event) => {

      event.preventDefault();

      void ask();
    }
  );


  // Comparador RAG.

  $("compare").addEventListener(
    "click",
    () => void compareRag()
  );


  // Campo de texto.

  $("question").addEventListener(
    "input",
    updateCounter
  );


  // Ctrl + Enter para enviar.

  $("question").addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter" &&
        (
          event.ctrlKey ||
          event.metaKey
        )
      ) {

        event.preventDefault();

        void ask();
      }
    }
  );


  // Cambiar modo RAG.

  $("use-search").addEventListener(
    "change",
    updateMode
  );


  // Buscar documentos.

  $("doc-search").addEventListener(
    "input",
    renderDocuments
  );


  // Filtrar formato.

  $("doc-type").addEventListener(
    "change",
    renderDocuments
  );


  // Actualizar inventario.

  $("refresh-docs").addEventListener(
    "click",
    () => void loadDocuments(true)
  );


  // Sincronización.

  if (IS_LOCAL) {

    $("sync").addEventListener(
      "click",
      () => void sync()
    );
  }


  // Exportar conversación.

  $("export-chat").addEventListener(
    "click",
    exportChat
  );


  // Nueva conversación.

  $("new-chat").addEventListener(
    "click",
    () => {

      if (state.busy) return;


      state.messages = [];

      clearInput();

      renderConversation();

      $("question").focus();
    }
  );


  // Preparar interfaz inicial.

  renderConversation();

  updateMode();

  updateCounter();


  // Consultar backend.
  // Ambas solicitudes son independientes.

  void checkHealth();

  void loadDocuments();
}


/* =====================================================
   24. INICIAR AL CARGAR EL DOCUMENTO
   ===================================================== */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initialize,
    {
      once: true
    }
  );

} else {

  initialize();
}
