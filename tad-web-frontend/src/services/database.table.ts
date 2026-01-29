import { useCallback } from "react";

export const useTableControls = <T>(
  setData: React.Dispatch<React.SetStateAction<T[]>>,
  defaultRow: T,
  reorderFunction: (rows: T[]) => T[]
) => {
  const handleAddRow = useCallback(() => {
    setData((prev) => {
      const newRow = { ...defaultRow };
      const updated = [...prev, newRow];
      return reorderFunction(updated);
    });
  }, [setData, defaultRow, reorderFunction]);

  const handleRemoveRow = useCallback(
    (index: number) => {
      setData((prev) => {
        if (prev.length <= 1) return prev;
        const clone = [...prev];
        clone.splice(index, 1);
        return reorderFunction(clone);
      });
    },
    [setData, reorderFunction]
  );

  return { handleAddRow, handleRemoveRow };
};