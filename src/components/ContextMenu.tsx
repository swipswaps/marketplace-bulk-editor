import { useEffect, useRef } from 'react';
import { Copy, Trash2, Plus, FileDown } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onInsertAbove?: () => void;
  onInsertBelow?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  showRowActions?: boolean;
  showCellActions?: boolean;
}

export function ContextMenu({
  x,
  y,
  onClose,
  onDelete,
  onDuplicate,
  onInsertAbove,
  onInsertBelow,
  onCopy,
  onPaste,
  showRowActions = true,
  showCellActions = true,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {showCellActions && (
        <>
          {onCopy && (
            <button
              onClick={() => handleAction(onCopy)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          )}
          {onPaste && (
            <button
              onClick={() => handleAction(onPaste)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              Paste
            </button>
          )}
          {(onCopy || onPaste) && showRowActions && (
            <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
          )}
        </>
      )}

      {showRowActions && (
        <>
          {onInsertAbove && (
            <button
              onClick={() => handleAction(onInsertAbove)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Insert Row Above
            </button>
          )}
          {onInsertBelow && (
            <button
              onClick={() => handleAction(onInsertBelow)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Insert Row Below
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={() => handleAction(onDuplicate)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Duplicate Row
            </button>
          )}
          {onDelete && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
              <button
                onClick={() => handleAction(onDelete)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Row
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

