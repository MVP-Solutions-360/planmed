// Datos de contacto públicos de Planmed: única fuente para WhatsApp, correo y Messenger.
// Módulo PURO (sin imports): lo usan componentes, páginas y pruebas.

/** Número oficial de WhatsApp en formato internacional (57 = Colombia), sin espacios, «+» ni guiones. */
export const WHATSAPP_NUMBER = '573188043382'
/** Formato visible para los usuarios. */
export const WHATSAPP_DISPLAY = '318 804 3382'
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`
/** Enlace de WhatsApp con mensaje predefinido. */
export const whatsappUrlWithText = (text: string): string => `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`

export const CONTACT_EMAIL = 'planmedequipodetrabajo@gmail.com'
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`

export const MESSENGER_URL = 'https://www.facebook.com/Financicioncirugiaplastica/'
