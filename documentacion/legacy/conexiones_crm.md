> **LEGACY / HISTÓRICO — NO APLICABLE A PLANMED ACTUAL**

# Conexiones Frontend - CRM (Wellezy Hub)

Este documento detalla todas las conexiones configuradas entre el frontend de Cliniplanes (o tenant específico) y el CRM de Wellezy Hub. Todas las peticiones aquí detalladas comparten los siguientes elementos estructurales:

## Elementos Comunes

1. **Headers Requeridos:**
   * `X-Wellezy-Tenant`: El slug del tenant correspondiente (ej. `crediestetica`, `legalmed`). Permite al CRM saber a qué base de datos apuntar.
   * `Accept`: `application/json`

2. **Identificadores de Trazabilidad (incluidos en el body base):**
   * `visitor_uuid`: ID persistente guardado en el `localStorage` del navegador para asociar comportamientos del usuario anónimo con el Lead resultante.
   * `session_id`: ID temporal por sesión de navegador, guardado en el `sessionStorage`.

---

## 1. Captura Comercial (Creación de Lead)

Endpoint destinado a persistir comercialmente al usuario en la base de datos de Leads del CRM.

* **Cuándo se dispara:** Al enviar el formulario de lead (validado correctamente) pulsando el botón final.
* **Mecanismo:** `POST /api/v1/leads` (En Wellezy Hub, esto aterriza en `LeadController`)
* **Payload de Ejemplo:**
  ```json
  {
    "first_name": "Juan",
    "phone": "3000000000",
    "email": "juan@example.com",
    "city": "Medellín",
    "procedure_name": "Mamoplastia",
    "requested_amount": 15000000,
    "installments": 24,
    "utm_source": "web_simulator_modal",
    "visitor_uuid": "...",
    "notes": "Llamar por la mañana",
    "comments": "Llamar por la mañana",
    "metadata": {
      "comments": "Llamar por la mañana",
      "accepted_habeas_data": true,
      "preferred_language": "es"
    }
  }
  ```
* **Nota Legal:** El booleano `accepted_habeas_data: true` es el registro oficial que valida que el usuario aprobó el tratamiento de datos.

---

## 2. Analítica de Eventos Web (Web Events)

Los siguientes eventos se envían todos a un único punto de entrada unificado para analítica, el cual se encarga de guardar comportamientos granulares del usuario.

* **Endpoint Unificado:** `POST /api/v1/web-events`
* **Controlador CRM:** `WebEventController`
* **Tabla de Destino:** `web_events`

### A. Apertura del Formulario (`FORM_START`)
* **Cuándo se dispara:** Al renderizar o montar el modal del formulario en pantalla.
* **Propósito:** Medir cuántas personas intentaron pedir información pero no la terminaron enviando (caídas del embudo).
* **Payload Específico:**
  ```json
  {
    "visitor_uuid": "...",
    "session_id": "...",
    "page_path": "/simulador",
    "event_type": "FORM_START",
    "payload": {
      "intent": {
        "item_name": "Mamoplastia"
      }
    }
  }
  ```

### B. Éxito del Formulario (`FORM_SUBMIT`)
* **Cuándo se dispara:** Inmediatamente después de recibir la respuesta HTTP 201 (creación exitosa) del endpoint de captura comercial (Lead).
* **Propósito:** Registrar un éxito claro en el sistema de analítica web puro, validando el embudo completo.
* **Payload Específico:**
  ```json
  {
    "visitor_uuid": "...",
    "session_id": "...",
    "page_path": "/simulador",
    "event_type": "FORM_SUBMIT",
    "payload": {
      "intent": {
        "item_name": "Mamoplastia",
        "financial_amount": 15000000,
        "financial_installments": 24
      }
    }
  }
  ```

### C. Visualización de Políticas Legales (`POLICY_VIEW`)
* **Cuándo se dispara:** Cuando el usuario hace click exactamente sobre el texto de "política de tratamiento de datos personales" ubicado junto al checkbox de términos.
* **Particularidad Técnica:** Para evitar que la petición asíncrona sea cancelada por el navegador (unload event) al cambiar de página, los enlaces de las traducciones están configurados con el atributo `target="_blank"`. Esto asegura que el `fetch` culmine en la pestaña original.
* **Payload Específico:**
  ```json
  {
    "visitor_uuid": "...",
    "session_id": "...",
    "page_path": "/simulador",
    "event_type": "POLICY_VIEW",
    "payload": {
      "legal": {
        "policy_type": "habeas_data",
        "version": "v1.0"
      }
    }
  }
  ```

### D. Continuación hacia WhatsApp (`WHATSAPP_CLICK`)
* **Cuándo se dispara:** Cuando el Lead ya fue creado y el usuario hace clic en el botón verde "Continuar por WhatsApp" de la pantalla de éxito.
* **Propósito:** Determinar si un lead es "Auto-gestionado" (el usuario abrió la conversación de chat) o si el equipo comercial debe iniciar el contacto (lead pasivo).
* **Payload Específico:**
  ```json
  {
    "visitor_uuid": "...",
    "session_id": "...",
    "page_path": "/simulador",
    "event_type": "WHATSAPP_CLICK",
    "payload": null
  }
  ```

### E. Comportamiento en Simulador (`SIMULATOR_CALC`)
* **Cuándo se dispara:** En la página o componente del simulador, cuando el usuario cambia los parámetros de simulación activamente.
* **Propósito:** Entender el apetito de crédito promedio o el valor comercial de los servicios más cotizados de manera exploratoria, incluso si no envían el formulario.
* **Payload Específico:**
  ```json
  {
    "visitor_uuid": "...",
    "session_id": "...",
    "page_path": "/simulador",
    "event_type": "SIMULATOR_CALC",
    "payload": {
      "intent": {
        "item_name": "Rinoplastia",
        "financial_amount": 12000000,
        "financial_installments": 36,
        "target_location": "Clínica Las Vegas"
      }
    }
  }
  ```

### F. Navegación Básica (`PAGE_VIEW`)
* **Cuándo se dispara:** Cada vez que el framework de frontend (Nuxt/Vue) inicializa una ruta diferente, como infraestructura base para métricas de tráfico.
* **Payload Específico:**
  ```json
  {
    "visitor_uuid": "...",
    "session_id": "...",
    "page_path": "/nosotros",
    "event_type": "PAGE_VIEW",
    "payload": {
      "context": {
        "page_title": "Quiénes Somos - Cliniplanes"
      }
    }
  }
  ```
