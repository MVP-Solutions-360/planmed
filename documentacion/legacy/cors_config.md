> **LEGACY / HISTÓRICO — NO APLICABLE A PLANMED ACTUAL**

# Validación y Configuración de CORS

## Objetivo

Garantizar que el CRM permita solicitudes HTTP provenientes de los distintos entornos de Cliniplanes Web.

---

## ¿Por qué es necesario?

Aunque la URL del CRM ahora es configurable mediante variables de entorno, los navegadores aplican políticas de seguridad denominadas CORS (Cross-Origin Resource Sharing).

Si el CRM no autoriza explícitamente el origen desde donde se carga la Web, las peticiones serán bloqueadas por el navegador antes de llegar al backend.

---

## Escenarios soportados

| Frontend                        | Backend CRM                    | Requiere CORS |
| ------------------------------- | ------------------------------ | ------------- |
| http://localhost:3000           | http://localhost:8000          | Sí            |
| http://localhost:3000           | https://staging.wellezyhub.com | Sí            |
| https://staging.cliniplanes.com | https://staging.wellezyhub.com | Sí            |
| https://cliniplanes.com         | https://hub.wellezy.com        | Sí            |

---

## Orígenes autorizados recomendados

Desarrollo local:

```text
http://localhost:3000
http://127.0.0.1:3000
```

Staging:

```text
https://staging.cliniplanes.com
```

Producción:

```text
https://cliniplanes.com
https://www.cliniplanes.com
```

---

## Checklist de validación

Antes de iniciar pruebas en cualquier entorno verificar:

* El CRM responde correctamente al endpoint solicitado.
* El origen actual está incluido en la configuración CORS del CRM.
* Las respuestas incluyen el encabezado:

```http
Access-Control-Allow-Origin
```

* No existen errores CORS en la consola del navegador.
* Los endpoints `/leads` y `/web-events` responden correctamente desde el entorno configurado.

---

## Procedimiento de diagnóstico

Si una petición falla:

1. Abrir DevTools → Network.
2. Revisar la solicitud fallida.
3. Confirmar que la URL corresponde al entorno esperado.
4. Revisar la pestaña Console.
5. Si aparece alguno de estos mensajes:

```text
Blocked by CORS policy
No 'Access-Control-Allow-Origin' header
Preflight request failed
```

la configuración del CRM debe ser actualizada para permitir el origen utilizado.

---

## Mantenimiento futuro

Cada vez que se agregue un nuevo dominio o subdominio para Cliniplanes, deberá añadirse también a la lista de orígenes permitidos en la configuración CORS del CRM para evitar bloqueos de comunicación entre frontend y backend.
