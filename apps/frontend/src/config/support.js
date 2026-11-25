export const SUPPORT_CONTACT = {
  name: 'Admin Operasional',
  displayPhone: '',
  whatsappPhone: '',
};

export function getSupportWhatsAppUrl(message = 'Halo Admin, saya membutuhkan bantuan untuk reset password Daily Check Operational Cars.') {
  if (!SUPPORT_CONTACT.whatsappPhone) return null;
  return `https://wa.me/${SUPPORT_CONTACT.whatsappPhone}?text=${encodeURIComponent(message)}`;
}
