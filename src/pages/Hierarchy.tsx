import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Crown, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";

type Node = {
  id: string;
  name: string;
  role: string;
  parent_id: string | null;
};

function TreeNode({
  node,
  childrenMap,
  depth,
}: {
  node: Node;
  childrenMap: Record<string, Node[]>;
  depth: number;
}) {
  const [open, setOpen] = useState(depth < 2);
  const kids = childrenMap[node.id] || [];
  const hasKids = kids.length > 0;
  const Icon =
    node.role === "admin" ? Crown : node.role === "facilitator" ? Users : User;

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-2 py-1.5 rounded-md hover:bg-muted/50 px-2 cursor-pointer"
        style={{ paddingLeft: depth * 14 + 8 }}
        onClick={() => hasKids && setOpen(!open)}
      >
        {hasKids ? (
          open ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
               : <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : <span className="w-4" />}
        <Icon className={`h-4 w-4 ${node.role === "admin" ? "text-primary" : node.role === "facilitator" ? "text-amber-600" : "text-muted-foreground"}`} />
        <span className="text-sm font-medium">{node.name}</span>
        <Badge variant={node.role === "admin" ? "default" : "secondary"} className="ml-auto text-[10px] capitalize">
          {node.role}
        </Badge>
      </div>
      {open && hasKids && (
        <div>
          {kids.map((c) => (
            <TreeNode key={c.id} node={c} childrenMap={childrenMap} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Hierarchy() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("hierarchy_nodes")
      .select("id,name,role,parent_id")
      .order("name");
    setNodes((data as Node[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const { roots, childrenMap } = useMemo(() => {
    const map: Record<string, Node[]> = {};
    const r: Node[] = [];
    nodes.forEach((n) => {
      if (n.parent_id) {
        (map[n.parent_id] ||= []).push(n);
      } else {
        r.push(n);
      }
    });
    return { roots: r, childrenMap: map };
  }, [nodes]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-serif font-bold">Hierarchy Tree</h1>
        <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saksham Sadhu Sang Chain</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : roots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hierarchy data yet.</p>
          ) : (
            <div className="space-y-1">
              {roots.map((r) => (
                <TreeNode key={r.id} node={r} childrenMap={childrenMap} depth={0} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-4">
        Tap a name to expand or collapse the chain below it.
      </p>
    </div>
  );
}
