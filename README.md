
# 🦖 Archivo TIC IA — Agente Documental del Ankylosaurus

### Práctica 2.3 — Inteligencia Artificial Aplicada a las TIC

**Tecnológico Nacional de México - ITP**  
**Desarrollado por:** Nicole Dayana Esparza Lares  
**No. de Control:** 22200208

---

## 📖 Descripción del proyecto

**Archivo TIC IA** es una aplicación web que funciona como un agente documental inteligente especializado en la investigación del dinosaurio **Ankylosaurus magniventris**.

El sistema permite consultar documentos almacenados en Google Drive y generar respuestas utilizando inteligencia artificial mediante OpenAI y la técnica de Recuperación Aumentada por Generación (RAG).

A través de una interfaz moderna, el usuario puede realizar preguntas sobre la anatomía, alimentación, hábitat, mecanismos de defensa, comportamiento, descubrimientos fósiles y extinción del Ankylosaurus.

Las respuestas obtenidas mediante RAG pueden incluir referencias a los documentos consultados, facilitando la verificación de la información.

---

## 🎯 Objetivo general

Desarrollar un agente documental inteligente que integre Google Drive API, OAuth 2.0, FastAPI y OpenAI para facilitar la consulta, recuperación y análisis de información paleontológica relacionada con el Ankylosaurus mediante la tecnología RAG.

## 🛠️ Tecnologías utilizadas

| Tecnología | Función |
|---|---|
| Python | Desarrollo del backend |
| FastAPI | Creación de la API REST |
| HTML5 | Estructura de la interfaz |
| CSS3 | Diseño visual y estilos |
| JavaScript | Interactividad y conexión con la API |
| Google Drive API | Acceso a los documentos |
| Google OAuth 2.0 | Autenticación y autorización |
| OpenAI API | Generación de respuestas |
| Vector Stores | Almacenamiento e indexación documental |
| File Search (RAG) | Recuperación de información |
| GitHub | Control de versiones |
| GitHub Pages | Publicación del frontend |
| Vercel | Despliegue del backend |

---

## ⚙️ Funcionalidades principales

La aplicación permite:

- Conectar Google Drive mediante OAuth 2.0.
- Sincronizar documentos autorizados.
- Indexar archivos PDF, TXT y Google Docs.
- Consultar información mediante inteligencia artificial.
- Activar y desactivar el modo RAG.
- Comparar respuestas con y sin File Search.
- Mostrar las fuentes utilizadas en las respuestas.
- Buscar documentos por nombre.
- Filtrar documentos por formato.
- Actualizar la biblioteca documental.
- Crear nuevas conversaciones.
- Copiar respuestas.
- Exportar conversaciones a archivos TXT.
- Consultar el estado del servidor.
- Visualizar la cantidad de documentos indexados.

La sincronización de Google Drive se realiza únicamente desde localhost.

---

## 🦕 Biblioteca documental del Ankylosaurus

El proyecto utiliza cinco documentos almacenados en una carpeta autorizada de Google Drive.

| Documento | Formato | Contenido |
|---|---|---|
| Introduccion_Ankylosaurus.pdf | PDF | Historia, descubrimiento y características |
| Anatomia_y_Defensas.pdf | PDF | Armadura, osteodermos y maza caudal |
| Alimentacion_y_Habitat.txt | TXT | Alimentación herbívora y ecosistemas |
| Comportamiento_y_Depredadores | Google Docs | Comportamiento y posibles depredadores |
| Fosiles_y_Extincion | Google Docs | Registro fósil y extinción |

Los cinco documentos fueron sincronizados correctamente mediante Google Drive API e indexados utilizando OpenAI Vector Stores.

La biblioteca permite recuperar información relevante y generar respuestas respaldadas por fuentes documentales.

---

## 💡 ¿Qué se puede preguntar?

El agente permite investigar diferentes aspectos del Ankylosaurus.

**Ejemplos de preguntas:**

1. ¿Qué es el Ankylosaurus y cuáles eran sus principales características?
2. ¿En qué periodo geológico vivió?
3. ¿Cómo se defendía de sus depredadores?
4. ¿Cómo funcionaba la maza de su cola?
5. ¿De qué se alimentaba?
6. ¿Dónde habitaba?
7. ¿Qué fósiles se han descubierto?
8. ¿Qué relación pudo tener con el Tyrannosaurus rex?
9. ¿Qué se conoce sobre su comportamiento?
10. ¿Qué ocurrió con el Ankylosaurus al final del Cretácico?

**Nota:** Las preguntas se relacionan con los documentos indexados. Se recomienda activar RAG para recuperar información documental y consultar las referencias proporcionadas.

Las interpretaciones sobre comportamiento y defensa pueden incluir hipótesis científicas, ya que no todos los aspectos de su vida pueden comprobarse mediante fósiles.

---

## 🎨 Diseño de la interfaz

La aplicación utiliza una interfaz moderna inspirada en un **museo paleontológico**, con una combinación de colores naturales:

- Verde profundo.
- Verde salvia.
- Bronce.
- Arena.
- Marfil.

El diseño está organizado en tres secciones principales:

**1. Espacio de investigación:** permite escribir preguntas, activar RAG y comparar respuestas.

**2. Bitácora de investigación:** muestra las respuestas generadas, sus fuentes y las opciones para copiar o exportar información.

**3. Biblioteca documental:** permite visualizar, buscar y filtrar los documentos indexados.

La interfaz es adaptable a diferentes tamaños de pantalla.

---

## 📂 Estructura del proyecto

```text
agente_documental_tic/
│
├── app/
│   ├── core/
│   │   └── config.py
│   ├── models/
│   │   └── documento.py
│   ├── services/
│   │   ├── agent_service.py
│   │   ├── document_index.py
│   │   ├── drive_service.py
│   │   └── sync_service.py
│   └── main.py
│
├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
│
├── data/
│   └── manifest.json
│
├── scripts/
│   └── export_vercel_vars.py
│
├── tests/
│
├── index.html
├── index.py
├── iniciar_local.py
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

Los archivos que contienen credenciales y datos privados se mantienen fuera del repositorio.

---

## 💻 Ejecución local

### 1. Clonar el repositorio

```powershell
git clone https://github.com/NicoleLares/agente_documental_tic.git
cd agente_documental_tic
```

### 2. Crear el entorno virtual

```powershell
python -m venv .venv
```

### 3. Activar el entorno virtual

```powershell
.\.venv\Scripts\Activate.ps1
```

### 4. Instalar las dependencias

```powershell
pip install -r requirements.txt
```

### 5. Configurar las variables de entorno

Crear el archivo `.env` utilizando `.env.example` como referencia.

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
GOOGLE_DRIVE_FOLDER_ID=
VECTOR_STORE_ID=
LOCAL_ADMIN_KEY=
PORT=5000
```

Agregar los valores correspondientes.

También se necesita el archivo `credentials.json` generado desde Google Cloud para realizar la autorización OAuth en localhost.

Las credenciales privadas no deben publicarse en GitHub.

### 6. Iniciar la aplicación

```powershell
python iniciar_local.py
```

Abrir en el navegador:

http://127.0.0.1:5000

### 7. Sincronizar Google Drive

Desde la interfaz local, seleccionar **Sincronizar Drive**.

El sistema:

1. Autoriza el acceso a Google Drive.
2. Obtiene los documentos de la carpeta configurada.
3. Descarga o exporta los archivos admitidos.
4. Sincroniza el índice de OpenAI.
5. Actualiza el manifiesto documental.
6. Muestra los documentos en la biblioteca.

Si se configura `LOCAL_ADMIN_KEY`, la petición de sincronización debe incluir la cabecera administrativa correspondiente. El botón normal de la interfaz no envía esa clave.

---

## 🌐 Despliegue web

El proyecto utiliza GitHub Pages y Vercel.

### GitHub Pages

Se encarga de publicar la interfaz HTML, CSS y JavaScript.

**Sitio web:**

https://nicolelares.github.io/agente_documental_tic/

### Vercel

Ejecuta el backend FastAPI, que permite realizar consultas a OpenAI y recuperar información del índice documental.

**Backend:**

https://agente-documental-tic-xjgr.vercel.app/

### Variables utilizadas en Vercel

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
VECTOR_STORE_ID=
DOCUMENT_MANIFEST_B64=
```

Estas variables se configuran directamente en el panel de Vercel.

Para preparar las variables documentales a partir de la sincronización local:

```powershell
python scripts/export_vercel_vars.py
```

Cuando se modifican los documentos en Google Drive, es necesario sincronizar nuevamente desde localhost y actualizar los datos del índice en Vercel.

El archivo `DOCUMENT_MANIFEST_B64` contiene el manifiesto codificado, no una conexión directa de Vercel con Google Drive.

Después de actualizar las variables se debe realizar un nuevo despliegue.

---

## 🔗 Endpoints de la API

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/health` | Comprueba el estado del servidor |
| GET | `/api/documents` | Muestra los documentos indexados |
| POST | `/api/ask` | Realiza preguntas al agente |
| POST | `/api/sync` | Sincroniza documentos desde localhost |

Ejemplo de consulta:

```json
{
  "question": "¿Cómo se defendía el Ankylosaurus?",
  "use_search": true
}
```

---

## 🧪 Pruebas realizadas

Durante el desarrollo se verificaron:

- Conexión con Google Drive API.
- Autorización mediante OAuth 2.0.
- Sincronización de los cinco documentos paleontológicos.
- Actualización del índice documental.
- Eliminación de registros antiguos del índice.
- Consultas a OpenAI con File Search.
- Recuperación de respuestas con fuentes verificables.
- Comparación de respuestas con y sin RAG.
- Funcionamiento de la aplicación en localhost.
- Conexión entre GitHub Pages y Vercel.
- Configuración de variables de entorno y CORS.
- Conservación de la funcionalidad durante el rediseño visual.

Para ejecutar las pruebas automáticas:

```powershell
pytest -q
```

---

## 🔐 Seguridad y consideraciones

El proyecto utiliza variables de entorno para proteger las credenciales de los servicios.

No deben publicarse:

- `.env`
- `credentials.json`
- `token.json`
- Claves privadas de OpenAI.
- Manifiestos con información documental privada.

La sincronización de Google Drive está restringida a localhost.

**Importante:** antes de permitir el uso público sin restricciones, se debe implementar autenticación y limitación de solicitudes en `/api/ask`, así como controles de acceso a los documentos y límites de consumo de OpenAI.

CORS no sustituye la autenticación.

Las respuestas generadas con inteligencia artificial deben contrastarse con las fuentes originales.

---

## 📝 Conclusión general

El desarrollo de Archivo TIC IA permitió comprender cómo se integran diferentes tecnologías para crear un agente documental inteligente capaz de recuperar y analizar información almacenada en Google Drive.

A través de Google Drive API y OAuth 2.0 se logró acceder a documentos autorizados, mientras que OpenAI Vector Stores y File Search permitieron indexar la información y realizar consultas utilizando RAG.

Durante el desarrollo se resolvieron problemas relacionados con la autenticación, sincronización de documentos, variables de entorno, configuración CORS y despliegue de aplicaciones web. Esto permitió fortalecer los conocimientos sobre programación, integración de servicios y resolución de errores.

La adaptación del proyecto a la temática del Ankylosaurus permitió demostrar que un agente documental puede especializarse en diferentes áreas del conocimiento, utilizando documentos específicos como base para sus respuestas.

Finalmente, se consiguió una aplicación funcional, con una interfaz inspirada en un museo paleontológico, capaz de consultar cinco documentos sobre el Ankylosaurus y mostrar referencias a las fuentes utilizadas.

En conclusión, este proyecto demuestra la utilidad de la inteligencia artificial como herramienta de apoyo para la investigación, el aprendizaje y la recuperación de información académica.

---

## 👩‍💻 Créditos académicos

**Tecnológico Nacional de México - ITP**

**Proyecto:** Archivo TIC IA — Agente Documental del Ankylosaurus

**Actividad:** 2.3 Agente documental con Google Drive

**Desarrollado por:** Nicole Dayana Esparza Lares

**No. de Control:** 22200208

**Asignatura:** Inteligencia Artificial Aplicada a las TIC

---

🦖 **Archivo TIC IA — Investigación paleontológica asistida con inteligencia artificial.**
