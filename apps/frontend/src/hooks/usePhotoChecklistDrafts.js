import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { REQUIRED_CHECKLIST_TOTAL, STANDARD_PHOTO_ITEMS, TIRE_CHECKLIST_ITEMS } from '../config/driverChecklist';

const REQUIRED_CHECKLIST_IDS = new Set([
  ...STANDARD_PHOTO_ITEMS.map((item) => item.id),
  ...TIRE_CHECKLIST_ITEMS.map((item) => item.id),
]);

function revokeDraftUrl(draft) {
  if (draft?.previewUrl) {
    URL.revokeObjectURL(draft.previewUrl);
  }
}

export function usePhotoChecklistDrafts() {
  const [photoDrafts, setPhotoDrafts] = useState({});
  const photoDraftsRef = useRef({});

  const savePhotoDraft = useCallback((draft) => {
    setPhotoDrafts((currentDrafts) => {
      const previousDraft = currentDrafts[draft.checklistId];
      revokeDraftUrl(previousDraft);

      const nextDraft = {
        ...draft,
        previewUrl: URL.createObjectURL(draft.blob),
      };
      const nextDrafts = {
        ...currentDrafts,
        [draft.checklistId]: nextDraft,
      };

      photoDraftsRef.current = nextDrafts;
      return nextDrafts;
    });
  }, []);

  const removePhotoDraft = useCallback((checklistId) => {
    setPhotoDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      revokeDraftUrl(nextDrafts[checklistId]);
      delete nextDrafts[checklistId];
      photoDraftsRef.current = nextDrafts;
      return nextDrafts;
    });
  }, []);

  const clearPhotoDrafts = useCallback(() => {
    setPhotoDrafts((currentDrafts) => {
      Object.values(currentDrafts).forEach(revokeDraftUrl);
      photoDraftsRef.current = {};
      return {};
    });
  }, []);

  useEffect(() => {
    return () => {
      Object.values(photoDraftsRef.current).forEach(revokeDraftUrl);
    };
  }, []);

  const requiredCapturedCount = useMemo(() => {
    return Object.keys(photoDrafts).filter((checklistId) => REQUIRED_CHECKLIST_IDS.has(checklistId)).length;
  }, [photoDrafts]);

  return {
    photoDrafts,
    savePhotoDraft,
    removePhotoDraft,
    clearPhotoDrafts,
    requiredCapturedCount,
    requiredTotal: REQUIRED_CHECKLIST_TOTAL,
    allRequiredCaptured: requiredCapturedCount === REQUIRED_CHECKLIST_TOTAL,
  };
}
