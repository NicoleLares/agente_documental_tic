
# 2.3 Agente documental con Google Drive — Archivo TIC IA

**Tecnologico Nacional de Mexico - ITP**  
**Desarrollado por:** Nicole Dayana Esparza Lares  
**No. Control:** 22200208

Proyecto académico de **Inteligencia artificial aplicada a las TIC**, Tecnológico Nacional de México, campus Pachuca.

Continuación de **2.2 Agente investigador**: se reemplaza la búsqueda pública Web Search por recuperación documental de **Google Drive**, **OpenAI Vector Stores** y **File Search (RAG)**.

## Propósito pedagógico

El alumno comprenderá que una organización necesita consultar documentos propios y autorizados, no solamente Internet.

Identificará el papel de OAuth, Google Drive API, sincronización, indexación semántica, recuperación de contexto, respuestas sustentadas y trazabilidad mediante fuentes.

Comparará respuestas **sin** y **con** acceso documental, observará qué sucede al modificar una fuente y realizará las pruebas iniciales en **localhost**.

El despliegue académico se realizó con **GitHub Pages** para el frontend y **Vercel** para FastAPI.

Esto no implica que el sistema esté listo para uso público sin restricciones: antes de su uso abierto se requiere controlar el acceso y los costos.

## Arquitectura

- `app/main.py`: FastAPI, endpoints REST, frontend estático y protección local de sincronización.
- `app/core/config.py`: configuración y secretos cargados desde `.env`.
- `app/models/documento.py`: modelos de solicitud y respuesta.
- `app/services/drive_service.py`: OAuth Desktop, listado limitado a una carpeta y descarga/exportación de archivos.
- `app/services/sync_service.py`: Vector Store, manifiesto de archivos, altas, cambios y bajas.
- `app/services/agent_service.py`: Responses API + File Search y fuentes verificadas por anotaciones de archivo.
- `index.html` y `assets/`: interfaz HTML, CSS y JavaScript (estilo vino, ciruela y lavanda).
- `iniciar_local.py`: arranque local de Uvicorn sin conflictos de nombres.
- `index.py`: punto de entrada del backend en Vercel.
- `scripts/export_vercel_vars.py`: prepara variables para utilizar en Vercel el índice creado localmente.
- `data/manifest.json`: estado local del índice (no se publica).

## 1. Requisitos

- Python 3.11 o superior.
- Visual Studio Code.
- Git y GitHub.
- Cuenta de Google Cloud.
- Google Drive API habilitada.
- Credenciales OAuth 2.0.
- Cuenta de OpenAI Platform con acceso a la API.
- Navegador web.
- Documentos académicos autorizados.

**Importante:** las claves privadas y los archivos de Google Drive no deben publicarse en GitHub.

## 2. Configuración Google Drive

1. En [Google Cloud Console](https://console.cloud.google.com/), crea un proyecto y habilita **Google Drive API**.
2. Configura **Google Auth Platform**, la pantalla de consentimiento y los usuarios de prueba si corresponde.
3. Crea credenciales OAuth 2.0 de tipo **Desktop app** y descarga el archivo en la raíz del proyecto como `credentials.json`.
4. Crea una carpeta de Google Drive con al menos cinco documentos autorizados.
5. Los formatos admitidos son PDF, TXT y Google Docs nativos.
6. Extrae el identificador de la carpeta desde la URL `/folders/ID`.
7. Registra el identificador en la variable `GOOGLE_DRIVE_FOLDER_ID`.

Este ejercicio utiliza el alcance `drive.readonly` para lectura.

Se recomienda utilizar documentos académicos de prueba sin datos personales.

## 3. Preparar proyecto en Windows (PowerShell)

Crear entorno virtual:

```powershell
py -m venv .venv
```

Activar entorno:

```powershell
.\.venv\Scripts\Activate.ps1
```

Instalar dependencias:

```powershell
pip install -r requirements.txt
```

Crear archivo de variables:

```powershell
Copy-Item .env.example .env
```

Configurar el archivo `.env`:

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
GOOGLE_DRIVE_FOLDER_ID=
VECTOR_STORE_ID=
LOCAL_ADMIN_KEY=
PORT=5000
```

Se deben colocar los valores reales de OpenAI y Google Drive.

La variable `VECTOR_STORE_ID` puede permanecer vacía antes de la primera sincronización, ya que el identificador se genera al crear el índice.

No insertar claves privadas en el código JavaScript ni en el navegador.

## 4. Ejecutar localmente

Con el entorno virtual activado, ejecutar:

```powershell
python iniciar_local.py
```

Abrir en el navegador:

http://127.0.0.1:5000

Seleccionar **Sincronizar Drive** para autorizar Google, descargar o exportar los documentos e indexarlos.

La primera ejecución abre el navegador de autorización OAuth en la computadora donde está ejecutándose Python.

Posteriormente se pueden realizar consultas utilizando los documentos.

Para comprobar el funcionamiento de RAG, desactivar File Search y repetir exactamente la misma pregunta con File Search activado.

**Importante:** la sincronización está restringida a localhost.

Si se configura `LOCAL_ADMIN_KEY`, se debe proporcionar la cabecera `X-Admin-Key` mediante Thunder Client para `/api/sync`.

## 5. Endpoints

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/health` | Comprueba configuración y servidor. |
| GET | `/api/documents` | Muestra los documentos indexados. |
| POST | `/api/sync` | Sincroniza los cambios desde localhost. |
| POST | `/api/ask` | Realiza consultas con OpenAI. |

Ejemplo JSON para Thunder Client:

```json
{
  "question": "¿Qué es la inteligencia artificial según mis documentos?",
  "use_search": true
}
```

## Documentos y sugerencias para investigar

En las pruebas académicas se sincronizaron **5 documentos** sin errores:

- `Conceptos_IA.txt`
- `Herramientas_IA.txt`
- `IA_Educacion.pdf`
- `Introduccion_IA.pdf`
- `Ventajas_y_Desafios_IA` (Google Docs)

### ¿Qué se puede investigar?

El agente permite realizar consultas sobre los documentos indexados.

Algunas preguntas sugeridas son:

1. ¿Qué es la inteligencia artificial y cuáles son sus conceptos básicos?
2. ¿Qué herramientas de IA se describen y para qué sirven?
3. ¿Cómo puede utilizarse la inteligencia artificial en la educación?
4. ¿Cuáles son las ventajas y los desafíos de la IA?
5. ¿Cómo se relacionan los conceptos de dos documentos diferentes?
6. ¿Puedes resumir uno de los documentos y citar sus fuentes?
7. ¿Qué diferencias existen entre las aplicaciones y herramientas de IA?
8. ¿Cuáles son las ideas principales del documento Introduccion_IA.pdf?

**Nota de orientación:** estas preguntas se inspiran en los títulos de los documentos disponibles. Se recomienda verificar cada respuesta con las fuentes originales.

Para recuperar información documental, activar **Usar mis documentos (RAG)**.

## 6. Experimentos

1. Ejecutar una pregunta específica presente en los archivos sin File Search.
2. Repetir la misma pregunta con File Search y revisar las fuentes.
3. Probar temas ausentes y verificar si el agente reconoce la falta de evidencia.
4. Agregar un documento con información nueva y sincronizar nuevamente.
5. Modificar un documento y verificar que el índice se actualice correctamente.
6. Eliminar un documento de prueba y comprobar que desaparezca del manifiesto.

**Limitaciones:** las respuestas RAG pueden contener errores. Es necesario verificar la información contra los documentos originales.

Las eliminaciones pueden tardar en reflejarse debido a la consistencia eventual del índice.

## 7. Pruebas automáticas

Ejecutar desde la raíz del proyecto:

```powershell
pytest -q
```

Las pruebas locales automatizadas no necesitan consumir la API de OpenAI.

## 8. Publicación con GitHub Pages y Vercel

El proyecto fue probado localmente con OAuth 2.0, Google Drive, indexación de cinco documentos y consultas RAG con fuentes.

El despliegue académico utiliza dos servicios.

### GitHub Pages

Publica la interfaz desarrollada con:

- HTML5.
- CSS3.
- JavaScript.

La interfaz permite consultar documentos y visualizar las respuestas del agente.

### Vercel

Aloja la aplicación FastAPI y atiende las solicitudes:

- `/api/health`
- `/api/documents`
- `/api/ask`

La sincronización de Google Drive mediante OAuth de escritorio se mantiene únicamente en localhost.

### Variables de Vercel

Las siguientes variables se configuran en **Project → Environment Variables**, dentro del entorno Production:

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
VECTOR_STORE_ID=
DOCUMENT_MANIFEST_B64=
```

`VECTOR_STORE_ID` y `DOCUMENT_MANIFEST_B64` proceden del índice documental creado localmente.

Para preparar los datos puede utilizarse:

```powershell
python scripts/export_vercel_vars.py
```

Los valores privados deben configurarse directamente en Vercel y no publicarse en GitHub.

Después de modificar variables de entorno es necesario realizar un nuevo despliegue.

### Actualización del índice documental

1. Agregar o modificar documentos autorizados en Google Drive.
2. Ejecutar la sincronización desde localhost.
3. Actualizar las variables documentales de Vercel cuando corresponda.
4. Realizar un nuevo despliegue.
5. Comprobar el inventario y realizar una consulta utilizando RAG.

### Enlaces del proyecto

**Repositorio GitHub:**  
https://github.com/NicoleLares/agente_documental_tic

**Interfaz GitHub Pages:**  
https://nicolelares.github.io/agente_documental_tic/

**Backend Vercel:**  
https://agente-documental-tic-xjgr.vercel.app/

### Seguridad

El despliegue académico no debe considerarse listo para uso público ilimitado.

Antes de ofrecer consultas al público se recomienda:

- Proteger el endpoint `/api/ask`.
- Implementar autenticación y límites de consumo.
- Revisar los permisos de acceso a los documentos.
- Evitar revelar información privada.
- Mantener las credenciales fuera del repositorio.

Los archivos:

- `.env`
- `credentials.json`
- `token.json`
- `data/manifest.json`

deben permanecer fuera de GitHub.

La configuración CORS permite controlar los orígenes autorizados en navegadores, pero no sustituye la autenticación.

## 9. Costos y privacidad

OpenAI puede generar cargos por el uso de modelos, File Search y almacenamiento.

Se recomienda utilizar documentos académicos autorizados, evitar información confidencial y establecer límites de presupuesto.

Si alguna credencial se publica accidentalmente, debe revocarse y reemplazarse.

## Entrega

Para la entrega académica se presentan:

- Repositorio del proyecto en GitHub.
- URL de la interfaz publicada mediante GitHub Pages.
- URL del backend desplegado en Vercel.
- Evidencias de conexión con Google Drive y OAuth 2.0.
- Evidencias de los documentos indexados.
- Pruebas de consultas con RAG.
- Conclusión general del proyecto.

## Conclusión general

El desarrollo de **Archivo TIC IA** permitió integrar Google Drive API, OAuth 2.0, FastAPI y OpenAI para construir una herramienta de consulta documental inteligente.

Mediante la sincronización y el uso de Vector Stores y File Search (RAG), fue posible realizar preguntas sobre los documentos autorizados y recuperar respuestas acompañadas de referencias que permiten comprobar la información utilizada.

Uno de los aprendizajes más importantes fue comprender cómo se conectan distintos servicios para lograr que una aplicación funcione tanto localmente como desde Internet. Durante el proceso surgieron dificultades relacionadas con las rutas de Python, las variables de entorno, la configuración CORS y el despliegue en Vercel, las cuales permitieron fortalecer los conocimientos de programación, integración de APIs y resolución de errores.

Asimismo, la comparación de respuestas con y sin RAG ayudó a comprender la importancia de consultar fuentes documentales para obtener información más relevante y sustentada.

En conclusión, este proyecto demuestra cómo la inteligencia artificial puede facilitar la búsqueda y el análisis de información académica mediante una herramienta accesible e interactiva. También permitió reforzar la importancia de la seguridad, la organización de los documentos y la verificación de las fuentes originales.

---

**Tecnologico Nacional de Mexico - ITP**  
**Desarrollado por:** Nicole Dayana Esparza Lares  
**No. Control:** 22200208

**Proyecto académico — Archivo TIC IA**
