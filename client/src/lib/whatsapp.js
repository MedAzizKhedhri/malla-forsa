// WhatsApp number of the shop (international format, digits only), set in the client env.
// Empty when not configured, in which case the WhatsApp buttons are hidden.
export const whatsappNumber = String(import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '');

export const whatsappLink = (text) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
