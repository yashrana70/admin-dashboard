import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Trash2, Megaphone, ImageIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type AnnouncementPost = {
  id: string;
  content: string;
  image_url?: string | null;
  created_at: string;
  profiles?: { full_name?: string | null };
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Unknown error");
  }
  return String(error ?? "Unknown error");
};

export default function AnnouncementsPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["admin_announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select(`*, profiles:user_id (id, full_name, avatar_url)`)
        .eq("post_type", "announcement")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AnnouncementPost[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("community_posts").insert({
        user_id: user!.id,
        content: content,
        image_url: imageUrl || null,
        post_type: "announcement",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_announcements"] });
      setContent("");
      setImageUrl("");
      setShowImageInput(false);
      toast.success("Announcement broadcasted successfully to all devotees!");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || "Failed to create announcement");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("community_posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_announcements"] });
      toast.success("Announcement deleted");
    },
  });

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-primary text-primary-foreground grid place-items-center shadow-soft">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-serif text-3xl">Community Announcements</h1>
            <p className="text-muted-foreground text-sm">Broadcast important messages to all devotees in App 1</p>
          </div>
        </div>
      </div>

      <Card className="shadow-md border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="font-serif">Create New Announcement</CardTitle>
          <CardDescription>This will appear at the top of the Devotee Community feed in App 1.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePost} className="space-y-4">
            <Textarea
              placeholder="Type your important announcement here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none border focus-visible:ring-primary text-base p-3 bg-background"
              rows={4}
            />
            {showImageInput && (
              <Input
                placeholder="Paste an Image URL here (optional)..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="bg-background"
              />
            )}
            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowImageInput(!showImageInput)}>
                <ImageIcon className="h-4 w-4 mr-2" /> Attach Image
              </Button>
              <Button type="submit" disabled={!content.trim() || createMutation.isPending}>
                <Megaphone className="h-4 w-4 mr-2" /> Broadcast Now
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-serif text-xl">Past Announcements</h3>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading announcements...</div>
        ) : announcements?.length === 0 ? (
          <Card className="border-dashed bg-transparent shadow-none">
            <CardContent className="py-12 text-center text-muted-foreground">
              No announcements made yet.
            </CardContent>
          </Card>
        ) : (
          announcements?.map((post: AnnouncementPost) => (
            <Card key={post.id} className="shadow-sm overflow-hidden border-primary/20">
              <div className="bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 flex items-center gap-2 uppercase tracking-wider">
                <Megaphone className="h-3 w-3" /> Broadcasted Announcement
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <p className="whitespace-pre-wrap text-[15px] flex-1">{post.content}</p>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(post.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {post.image_url && (
                  <div className="rounded-md overflow-hidden bg-muted">
                    <img src={post.image_url} alt="Announcement media" className="w-full max-h-[300px] object-contain" />
                  </div>
                )}
                <div className="text-xs text-muted-foreground pt-2 border-t flex justify-between">
                  <span>Posted by: {post.profiles?.full_name || "Admin"}</span>
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
