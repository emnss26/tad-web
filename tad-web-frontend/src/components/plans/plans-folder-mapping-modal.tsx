import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, File, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DmService } from "@/services/dm.service";
import type { DmFolderNode } from "@/services/dm.service";

interface TreeNodeProps {
  node: DmFolderNode;
  depth?: number;
  selectedId?: string;
  onSelect: (node: DmFolderNode) => void;
}

function TreeNode({ node, depth = 0, selectedId, onSelect }: TreeNodeProps) {
  const [open, setOpen] = useState(false);
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isFolder = node.type === "folder";

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <button
        type="button"
        className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-sm hover:bg-muted"
        onClick={() => {
          if (hasChildren) setOpen((previous) => !previous);
          if (isFolder) onSelect(node);
        }}
      >
        {hasChildren ? (
          open ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )
        ) : (
          <span className="w-[14px]" />
        )}
        {isFolder ? <Folder size={14} /> : <File size={14} />}
        <span className={node.id === selectedId ? "font-semibold text-blue-600" : undefined}>
          {node.name}
        </span>
      </button>

      {open &&
        hasChildren &&
        node.children!.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

interface PlansFolderMappingModalProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  projectId: string;
  onFolderChosen: (folderId: string, tree: DmFolderNode[]) => void;
}

export function PlansFolderMappingModal({
  open,
  onClose,
  accountId,
  projectId,
  onFolderChosen,
}: PlansFolderMappingModalProps) {
  const [tree, setTree] = useState<DmFolderNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<DmFolderNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !accountId || !projectId) return;

    const fetchTree = async () => {
      try {
        setLoading(true);
        setError(null);
        setSelectedNode(null);
        const result = await DmService.getFolderStructure(projectId, accountId);
        setTree(Array.isArray(result) ? result : []);
      } catch (err: unknown) {
        if (typeof err === "object" && err !== null && "message" in err) {
          const message = (err as { message?: unknown }).message;
          setError(typeof message === "string" ? message : "Error loading folders.");
        } else {
          setError("Error loading folders.");
        }
        setTree([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTree();
  }, [open, accountId, projectId]);

  const handleSelect = useCallback((node: DmFolderNode) => setSelectedNode(node), []);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex h-[540px] max-w-xl flex-col">
        <DialogHeader>
          <DialogTitle>Select folder for file mapping</DialogTitle>
        </DialogHeader>

        {loading && <p className="mt-4 text-center text-sm text-muted-foreground">Loading folders...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && tree.length === 0 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">No folders found for this project.</p>
        )}

        {tree.length > 0 && (
          <div className="flex-1 overflow-y-auto rounded border p-2">
            {tree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                selectedId={selectedNode?.id}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}

        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selectedNode}
            onClick={() => {
              if (!selectedNode) return;
              onFolderChosen(selectedNode.id, tree);
              onClose();
            }}
          >
            Use this folder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
