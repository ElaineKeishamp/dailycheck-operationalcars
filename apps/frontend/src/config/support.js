export const SUPPORT_CONTACT = {
  name: 'Admin Operasional',
  displayPhone: '+62 812-3456-7890',
  whatsappPhone: '6281234567890',
};

export function getSupportWhatsAppUrl(message = 'Halo Admin, saya membutuhkan bantuan untuk reset password Daily Check Operational Cars.') {
  return `https://wa.me/${SUPPORT_CONTACT.whatsappPhone}?text=${encodeURIComponent(message)}`;
}
