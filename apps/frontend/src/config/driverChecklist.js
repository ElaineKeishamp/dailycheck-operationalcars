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
  { id: 'ban_1', title: 'Ban 1', label: 'Kanan Depan', partIndex: 1 },
  { id: 'ban_2', title: 'Ban 2', label: 'Kiri Depan', partIndex: 2 },
  { id: 'ban_3', title: 'Ban 3', label: 'Kanan Belakang', partIndex: 3 },
  { id: 'ban_4', title: 'Ban 4', label: 'Kiri Belakang', partIndex: 4 },
];

export const REQUIRED_CHECKLIST_TOTAL = STANDARD_PHOTO_ITEMS.length + TIRE_CHECKLIST_ITEMS.length;

export function getChecklistLabel(checklistId) {
  const standardItem = STANDARD_PHOTO_ITEMS.find((item) => item.id === checklistId);
  if (standardItem) return standardItem.label;

  const tireItem = TIRE_CHECKLIST_ITEMS.find((item) => item.id === checklistId);
  if (tireItem) return `${tireItem.title} - ${tireItem.label}`;

  if (checklistId === 'lainnya') return 'Foto Tambahan';
  return checklistId;
}
