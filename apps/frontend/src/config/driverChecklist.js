export const STANDARD_PHOTO_ITEMS = [
  { id: 'odo', label: 'ODO', icon: 'gauge' },
  { id: 'body_kiri', label: 'Body Kiri', icon: 'panelLeft' },
  { id: 'body_kanan', label: 'Body Kanan', icon: 'panelRight' },
  { id: 'kap', label: 'Kap', icon: 'carFront' },
  { id: 'depan', label: 'Depan', icon: 'moveUp' },
  { id: 'belakang', label: 'Belakang', icon: 'moveDown' },
  { id: 'interior', label: 'Interior', icon: 'armchair' },
];

export const TIRE_CHECKLIST_ITEMS = [
  { id: 'ban_kanan_depan', title: 'Ban 1', label: 'Kanan Depan' },
  { id: 'ban_kiri_depan', title: 'Ban 2', label: 'Kiri Depan' },
  { id: 'ban_kanan_belakang', title: 'Ban 3', label: 'Kanan Belakang' },
  { id: 'ban_kiri_belakang', title: 'Ban 4', label: 'Kiri Belakang' },
];

export const REQUIRED_CHECKLIST_TOTAL = STANDARD_PHOTO_ITEMS.length + TIRE_CHECKLIST_ITEMS.length;
