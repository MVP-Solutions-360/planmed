# Reglas de Negocio - Planmed

Este documento define las reglas operativas, comerciales y de comunicación vigentes para Planmed. Toda la documentación legacy ha sido descartada y no debe aplicarse sobre este proyecto.

## SIMULADOR

1. El simulador es una herramienta **referencial** para que el usuario pueda explorar cuánto podría representar una financiación para su procedimiento.
2. El simulador **NO debe aplicar una restricción interna del 80%**.
3. El usuario puede simular hasta el **100% del valor del procedimiento**.
4. La lógica interna de operación de Planmed que permita estructurar determinados porcentajes de financiación NO debe exponerse en la interfaz ni en el copy comercial.
5. NO mencionar en contenido público:
   - "80% con recursos propios"
   - "20% con tarjeta de crédito"
   - Distribución interna de fuentes de financiación
   - Mecanismos internos utilizados para estructurar la financiación
6. La tasa utilizada actualmente por el simulador debe ser: **2% mensual**.
7. Esta tasa es **REFERENCIAL**.
8. La interfaz debe informar que la tasa puede variar de acuerdo con la tasa de usura vigente, fijada mensualmente.
9. No presentar el resultado del simulador como una aprobación, oferta definitiva o condición contractual.

*(Nota técnica: Si el código actual en MockQuotationProvider tiene un límite numérico distinto a 2% u otra restricción, debe considerarse como un 'límite técnico actual detectado' pendiente de refactorización y no como regla de negocio).*

## FINANCIACIÓN PÚBLICA

**PORCENTAJE DE FINANCIACIÓN PUBLICABLE**
- Planmed puede financiar desde el **50%** del valor del procedimiento.
- La financiación puede llegar hasta el **100%** del valor del procedimiento.

**MECÁNICA INTERNA DE FINANCIACIÓN — NO PUBLICAR**
- NO documentar como contenido público la mecánica interna mediante la cual se alcanza ese porcentaje. Los recursos propios y combinaciones de crédito son estrictamente operativos.

## PROCESO

Actualmente puede comunicarse públicamente que el proceso de Planmed es **100% virtual**. No convertir esto en una afirmación diferente ni agregar condiciones que no hayan sido definidas.

## PERFILES

- Planmed puede estudiar solicitudes de diferentes perfiles.
- También pueden iniciar proceso personas que tengan reportes en centrales de riesgo.
- La comunicación pública NO debe prometer aprobación automática.
- Evitar frases equivalentes a: "Te aprobamos aunque estés reportado." Preferir una comunicación que indique que el caso puede ser estudiado individualmente.

## COBERTURA

- Planmed puede recibir pacientes de cualquier parte del mundo.
- Las clínicas se encuentran en:
  - Medellín
  - Cali
  - Barranquilla

## CONTACTO

Teléfonos autorizados:
- 315 785 7783
- 318 803 4967
- 324 315 8764

*Los correos actualmente autorizados en el proyecto pueden conservarse. No inventar nuevos correos.*

---

## INFORMACIÓN INTERNA — NO PUBLICAR

La siguiente información pertenece al "Core" de la empresa y está estrictamente reservada para uso interno. Bajo ninguna circunstancia debe publicarse, exponerse en copy o detallarse al usuario final:

- Estructura interna de financiación.
- Distribución de porcentajes entre diferentes fuentes.
- Recursos propios como mecanismo operativo.
- Detalles internos de aprobación.
- Arquitectura interna.
- Wellezy Hub.
- APIs internas.
- Endpoints.
- Tenants (ej. 	enantSlug).
- Credenciales.
- Fórmulas internas de implementación.
- Infraestructura.
- Proveedores internos.
- Cualquier mecanismo técnico u operativo no destinado al usuario final.

*(Que una información sea verdadera NO significa que deba publicarse).*
