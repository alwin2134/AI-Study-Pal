import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FolderPlus, Folder, FileText, Upload, Trash2,
  MessageSquare, Plus, Loader2, X, File, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteBucket {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  file_path: string | null;
  created_at: string;
}

const NotesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [buckets, setBuckets] = useState<NoteBucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<NoteBucket | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newBucketName, setNewBucketName] = useState("");
  const [newBucketDesc, setNewBucketDesc] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  useEffect(() => {
    if (user) {
      fetchBuckets();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBucket) {
      fetchNotes(selectedBucket.id);
    }
  }, [selectedBucket]);

  const fetchBuckets = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('note_buckets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to load buckets");
      console.error(error);
    } else {
      setBuckets(data || []);
    }
    setIsLoading(false);
  };

  const fetchNotes = async (bucketId: string) => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('bucket_id', bucketId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to load notes");
      console.error(error);
    } else {
      setNotes(data || []);
    }
  };

  const createBucket = async () => {
    if (!newBucketName.trim() || !user) return;

    const { data, error } = await supabase
      .from('note_buckets')
      .insert([{
        name: newBucketName.trim(),
        description: newBucketDesc.trim() || null,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      toast.error("Failed to create bucket");
      console.error(error);
    } else {
      setBuckets([data, ...buckets]);
      setNewBucketName("");
      setNewBucketDesc("");
      setIsCreatingBucket(false);
      toast.success("Bucket created!");
    }
  };

  const deleteBucket = async (bucket: NoteBucket) => {
    if (!confirm(`Delete "${bucket.name}" and all its notes?`)) return;

    const { error } = await supabase
      .from('note_buckets')
      .delete()
      .eq('id', bucket.id);

    if (error) {
      toast.error("Failed to delete bucket");
      console.error(error);
    } else {
      setBuckets(buckets.filter(b => b.id !== bucket.id));
      if (selectedBucket?.id === bucket.id) {
        setSelectedBucket(null);
        setNotes([]);
      }
      toast.success("Bucket deleted");
    }
  };

  const addNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim() || !selectedBucket || !user) return;

    const { data, error } = await supabase
      .from('notes')
      .insert([{
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        bucket_id: selectedBucket.id,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      toast.error("Failed to add note");
      console.error(error);
    } else {
      // Index in RAG Backend
      try {
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newNoteTitle.trim(),
            content: newNoteContent.trim(),
            bucket: selectedBucket.name
          })
        });
      } catch (err) {
        console.error("Failed to index note:", err);
      }

      setNotes([data, ...notes]);
      setNewNoteTitle("");
      setNewNoteContent("");
      setIsAddingNote(false);
      toast.success("Note added!");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedBucket || !user) return;

    const allowedTypes = ['text/plain', 'application/pdf', 'text/markdown', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      toast.error("Please upload a text, markdown, or PDF file");
      return;
    }

    setIsUploading(true);

    try {
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const content = await file.text();

        const { data, error } = await supabase
          .from('notes')
          .insert([{
            title: file.name.replace(/\.[^/.]+$/, ""),
            content: content,
            bucket_id: selectedBucket.id,
            user_id: user.id
          }])
          .select()
          .single();

        if (error) throw error;

        setNotes([data, ...notes]);
        toast.success("File uploaded!");
      } else {
        const filePath = `${user.id}/${selectedBucket.id}/${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // --- NEW: Send to Python Backend for RAG Indexing ---
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucketName', selectedBucket.name);

        try {
          const indexRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          const indexData = await indexRes.json();
          if (indexRes.ok) {
            toast.success("Indexed for AI Chat!");
          } else {
            console.error("Indexing failed", indexData);
          }
        } catch (idxErr) {
          console.error("Indexing error", idxErr);
          // Don't block the main flow if indexing fails
        }
        // ----------------------------------------------------

        const { data, error } = await supabase
          .from('notes')
          .insert([{
            title: file.name.replace(/\.[^/.]+$/, ""),
            content: `[Indexed for AI] ${file.name}`,
            file_path: filePath,
            bucket_id: selectedBucket.id,
            user_id: user.id
          }])
          .select()
          .single();

        if (error) throw error;

        setNotes([data, ...notes]);
        toast.success("File uploaded!");

        // We can skip the supabase function 'parse-document' if we rely on local python now.
        // But keeping it logic-free for now to avoid breaking existing flow if any.

      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const deleteNote = async (note: Note) => {
    if (!confirm(`Delete "${note.title}"?`)) return;

    if (note.file_path && user) {
      await supabase.storage.from('uploads').remove([note.file_path]);
    }

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', note.id);

    if (error) {
      toast.error("Failed to delete note");
      console.error(error);
    } else {
      setNotes(notes.filter(n => n.id !== note.id));
      toast.success("Note deleted");
    }
  };

  const startChat = (bucket: NoteBucket) => {
    navigate(`/chat?bucket=${bucket.id}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 h-screen overflow-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="section-title mb-2 flex items-center gap-3">
            <Folder className="w-7 h-7 text-primary" />
            My Notes
          </h1>
          <p className="section-subtitle">Organize your study materials by subject</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Buckets Panel */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground text-sm">Subject Buckets</h2>
              <button
                onClick={() => setIsCreatingBucket(true)}
                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>

            {isCreatingBucket && (
              <div className="mb-4 p-4 rounded-xl bg-secondary/50 animate-fade-in">
                <input
                  type="text"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  placeholder="Bucket name"
                  className="input-field mb-2 text-sm"
                  autoFocus
                />
                <input
                  type="text"
                  value={newBucketDesc}
                  onChange={(e) => setNewBucketDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="input-field mb-3 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={createBucket} className="btn-primary text-xs py-2 flex-1">
                    Create
                  </button>
                  <button
                    onClick={() => setIsCreatingBucket(false)}
                    className="btn-secondary text-xs py-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {buckets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Create a bucket to start organizing your notes.
                </p>
              ) : (
                buckets.map((bucket) => (
                  <div
                    key={bucket.id}
                    className={cn(
                      "p-3 rounded-xl cursor-pointer transition-all group",
                      selectedBucket?.id === bucket.id
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-secondary/30 hover:bg-secondary/50 border border-transparent"
                    )}
                    onClick={() => setSelectedBucket(bucket)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{bucket.name}</p>
                        {bucket.description && (
                          <p className="text-xs text-muted-foreground truncate">{bucket.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startChat(bucket);
                          }}
                          className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                          title="Chat with notes"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBucket(bucket);
                          }}
                          className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notes Panel */}
          <div className="lg:col-span-2 glass-card p-5">
            {selectedBucket ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      {selectedBucket.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">{notes.length} note(s)</p>
                  </div>
                  <div className="flex gap-2">
                    <label className="btn-secondary text-xs py-2 px-3 flex items-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      {isUploading ? "..." : "Upload"}
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".txt,.md,.pdf,.doc,.docx"
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                    <button
                      onClick={() => startChat(selectedBucket)}
                      className="btn-secondary text-xs py-2 px-3 flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat
                    </button>
                    <button
                      onClick={() => setIsAddingNote(true)}
                      className="btn-primary text-xs py-2 px-3 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>

                {isAddingNote && (
                  <div className="mb-4 p-4 rounded-xl bg-secondary/50 animate-fade-in">
                    <input
                      type="text"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      placeholder="Note title"
                      className="input-field mb-2 text-sm"
                      autoFocus
                    />
                    <textarea
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Paste or type your notes here..."
                      className="input-field mb-3 min-h-[120px] resize-none text-sm"
                    />
                    <div className="flex gap-2">
                      <button onClick={addNote} className="btn-primary text-xs py-2 flex-1">
                        Save Note
                      </button>
                      <button
                        onClick={() => setIsAddingNote(false)}
                        className="btn-secondary text-xs py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {notes.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-sm">No notes in this bucket yet.</p>
                      <button
                        onClick={() => setIsAddingNote(true)}
                        className="btn-primary mt-4 text-xs"
                      >
                        Add your first note
                      </button>
                    </div>
                  ) : (
                    notes.map((note) => {
                      const needsProcessing = note.file_path && (
                        note.content.startsWith("[File:") ||
                        note.content.startsWith("[Processing:") ||
                        note.content.startsWith("[PDF Document:") ||
                        note.content.startsWith("[Document:")
                      );

                      const reprocessNote = async (e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (!note.file_path) return;

                        toast.info("Reprocessing document...");
                        try {
                          const res = await fetch('/api/reprocess', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filePath: note.file_path, noteId: note.id })
                          });
                          if (!res.ok) throw new Error("Reprocess failed");

                          toast.success("Document reprocessed!");
                          fetchNotes(selectedBucket!.id);
                        } catch (err) {
                          console.error(err);
                          toast.error("Failed to reprocess document");
                        }
                      };

                      return (
                        <div key={note.id} className="p-4 rounded-xl bg-secondary/30 group">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {note.file_path ? (
                                <File className="w-4 h-4 text-primary" />
                              ) : (
                                <FileText className="w-4 h-4 text-muted-foreground" />
                              )}
                              <h3 className="font-medium text-foreground text-sm">{note.title}</h3>
                              {needsProcessing && (
                                <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                                  Needs processing
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {note.file_path && (
                                <button
                                  onClick={reprocessNote}
                                  className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                                  title="Reprocess document"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNote(note)}
                                className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                            {needsProcessing ? "Click the refresh icon to extract content from this document." : note.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2 opacity-60">
                            {new Date(note.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
                  <Folder className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Select a bucket</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Choose a subject bucket from the left to view and manage your notes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotesPage;
