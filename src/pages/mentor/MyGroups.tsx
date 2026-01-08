import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, Trash2, UserPlus, Loader2, ArrowUpCircle, Copy, Upload, Download, Pencil, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { supabase, supabaseUrl, supabaseKey } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import * as XLSX from "xlsx";
import { useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const generateJoinCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

interface Group {
  id: string;
  name: string;
  semester: string;
  description: string;
  join_code?: string; // <--- Add this
  members_count?: number;
}

export default function MyGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [newMemberEmails, setNewMemberEmails] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  // Edit Group State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editName, setEditName] = useState("");
  const [editSem, setEditSem] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<{
    success: number;
    failed: { row: number; reason: string; group?: string }[];
    emailSent: string[];
    emailFailed: { email: string; reason: string }[];
  } | null>(null);

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`*, group_members (count)`)
        .eq('created_by', user.id)
        .order('semester', { ascending: true });

      if (error) throw error;

      const formattedGroups = data.map((g: any) => ({
        ...g,
        members_count: g.group_members?.[0]?.count || 0
      }));

      setGroups(formattedGroups);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedGroupId || !newMemberEmails) return;
    setAddingMember(true);
    try {
      const emails = newMemberEmails.split(',').map(e => e.trim().toLowerCase()).filter(e => e.length > 0);
      if (emails.length === 0) { setAddingMember(false); return; }

      // Ensure users exist (optional guard)
      const { data: existingUsers, error: checkError } = await supabase.from('profiles').select('email').in('email', emails);
      if (checkError) throw checkError;
      const foundEmails = existingUsers?.map(u => u.email) || [];
      const missingEmails = emails.filter(e => !foundEmails.includes(e));
      if (missingEmails.length > 0) { toast.error(`Not registered: ${missingEmails.join(', ')}`); setAddingMember(false); return; }

      // Fetch join code for this group
      const { data: grp, error: grpErr } = await supabase.from('groups').select('name, join_code').eq('id', selectedGroupId).single();
      if (grpErr || !grp?.join_code) { toast.error('Join code not found for group'); setAddingMember(false); return; }

      // Send join code emails instead of adding directly
      const functionUrl = `${supabaseUrl}/functions/v1/send-join-code`;
      const sent: string[] = [];
      const failed: string[] = [];
      for (const email of emails) {
        try {
          const resp = await fetch(functionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
            body: JSON.stringify({ email, joinCode: grp.join_code, groupName: grp.name })
          });
          if (resp.ok) sent.push(email); else failed.push(email);
        } catch {
          failed.push(email);
        }
      }

      if (sent.length) toast.success(`Invites sent to: ${sent.join(', ')}`);
      if (failed.length) toast.error(`Failed to invite: ${failed.join(', ')}`);

      setIsAddMemberOpen(false);
      setNewMemberEmails('');
    } catch (error) {
      toast.error('Failed to invite students');
    } finally {
      setAddingMember(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Are you sure? This will delete everything.")) return;
    try {
      const { error } = await supabase.from('groups').delete().eq('id', id);
      if (error) throw error;
      toast.success("Group deleted");
      fetchGroups();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete group");
    }
  };


  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setEditName(group.name);
    setEditSem(group.semester);
    setEditDesc(group.description);
    setIsEditOpen(true);
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !editName || !editSem) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase.from('groups').update({
        name: editName,
        semester: editSem,
        description: editDesc
      }).eq('id', editingGroup.id);

      if (error) throw error;
      toast.success("Group updated!");
      setIsEditOpen(false);
      fetchGroups();
    } catch (err: any) {
      toast.error("Failed to update group");
    } finally {
      setSavingEdit(false);
    }
  };

  const handlePromoteGroup = async (group: Group) => {
    const currentSemNum = parseInt(group.semester.replace(/\D/g, ''));
    if (isNaN(currentSemNum)) { toast.error("Cannot auto-promote."); return; }
    if (currentSemNum >= 8) { toast.error("Max semester reached."); return; }
    const nextSemStr = `Sem ${currentSemNum + 1}`;
    if (!confirm(`Promote to ${nextSemStr}?`)) return;
    try {
      const { error } = await supabase.from('groups').update({ semester: nextSemStr }).eq('id', group.id);
      if (error) throw error;
      toast.success(`Promoted to ${nextSemStr}!`);
      fetchGroups();
    } catch (error) { toast.error("Failed to promote"); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        group_name: "AI Project Team",
        semester: "Sem 5",
        leader_email: "leader1@college.ac.in",
        description: "Optional description"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Groups");
    XLSX.writeFile(wb, "group-upload-template.xlsx");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSummary(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (rows.length === 0) {
        toast.error("The uploaded sheet is empty.");
        setUploading(false);
        return;
      }

      const results: {
        success: number;
        failed: { row: number; reason: string; group?: string }[];
        emailSent: string[];
        emailFailed: { email: string; reason: string }[];
      } = { success: 0, failed: [], emailSent: [], emailFailed: [] };

      for (let idx = 0; idx < rows.length; idx++) {
        const row = rows[idx];
        const rowNumber = idx + 2; // considering header row

        const groupName = (row.group_name || "").toString().trim();
        const semester = (row.semester || "").toString().trim();
        const description = (row.description || "").toString().trim();

        const leader = (row.leader_email || "").toString().trim().toLowerCase();

        if (!groupName || !semester || !leader) {
          results.failed.push({ row: rowNumber, reason: "Missing group_name, semester, or leader_email" });
          continue;
        }

        const uniqueEmails = [leader];

        // Check registration
        const { data: existingUsers, error: checkError } = await supabase
          .from('profiles')
          .select('email')
          .in('email', uniqueEmails);

        if (checkError) {
          results.failed.push({ row: rowNumber, reason: "Lookup failed" });
          continue;
        }

        const found = existingUsers?.map(u => u.email) || [];
        const missing = uniqueEmails.filter(e => !found.includes(e));
        if (missing.length > 0) {
          results.failed.push({ row: rowNumber, reason: `Not registered: ${missing.join(', ')}`, group: groupName });
          continue;
        }

        // Check if group name exists
        const { data: duplicateGroup } = await supabase.from('groups').select('id').eq('name', groupName).maybeSingle();
        if (duplicateGroup) {
          results.failed.push({ row: rowNumber, reason: `Group '${groupName}' already exists` });
          continue;
        }

        // Check if student is already in a group
        const { data: existingMember } = await supabase.from('group_members').select('group_id').eq('student_email', leader).maybeSingle();
        if (existingMember) {
          results.failed.push({ row: rowNumber, reason: `Student ${leader} is already in a group` });
          continue;
        }

        // Create group
        const joinCode = generateJoinCode();

        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .insert({
            name: groupName,
            semester,
            description,
            created_by: user?.id,
            join_code: joinCode
          })
          .select()
          .single();

        if (groupError || !groupData) {
          results.failed.push({ row: rowNumber, reason: "Failed to create group", group: groupName });
          continue;
        }

        // Do NOT auto-add members; require join code

        // Best-effort: email join code to the leader
        try {
          const functionUrl = `${supabaseUrl}/functions/v1/send-join-code`;
          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ email: leader, joinCode, groupName })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Email send error:', errorText);
            results.emailFailed.push({ email: leader, reason: `HTTP ${response.status}: ${errorText}` });
          } else {
            const result = await response.json();
            if (result?.error) {
              console.error('Email function returned error:', result.error);
              results.emailFailed.push({ email: leader, reason: result.error });
            } else {
              console.log('Email sent successfully to:', leader);
              results.emailSent.push(leader);
            }
          }
        } catch (err: any) {
          console.error('send-join-code exception:', err);
          results.emailFailed.push({ email: leader, reason: err?.message || "Network error" });
        }

        results.success += 1;
      }

      setUploadSummary(results);

      if (results.success > 0) {
        fetchGroups();
        toast.success(`Uploaded ${results.success} group(s)`);
      }

      if (results.failed.length > 0) {
        toast.error(`${results.failed.length} row(s) had issues`);
      }

    } catch (err) {
      console.error(err);
      toast.error("Failed to process file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold">My Groups</h1><p className="text-muted-foreground">Manage your student project groups</p></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" /> Template
            </Button>
            <Button variant="outline" onClick={handleUploadClick} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload Excel
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleUploadFile}
            />
            <Button onClick={() => setIsCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create Group</Button>
          </div>
        </div>

        {uploadSummary && (
          <Card className="border-dashed">
            <CardHeader><CardTitle>Upload Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary">Success: {uploadSummary.success}</Badge>
                <Badge variant="outline" className={uploadSummary.failed.length ? "text-destructive border-destructive" : ""}>
                  Failed: {uploadSummary.failed.length}
                </Badge>
                <Badge variant="outline">Emails sent: {uploadSummary.emailSent.length}</Badge>
                <Badge variant="outline" className={uploadSummary.emailFailed.length ? "text-destructive border-destructive" : ""}>
                  Email failed: {uploadSummary.emailFailed.length}
                </Badge>
              </div>
              {uploadSummary.failed.length > 0 && (
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {uploadSummary.failed.map((f, idx) => (
                    <li key={`${f.row}-${idx}`}>
                      Row {f.row}{f.group ? ` (${f.group})` : ""}: {f.reason}
                    </li>
                  ))}
                </ul>
              )}
              {uploadSummary.emailFailed.length > 0 && (
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {uploadSummary.emailFailed.map((f, idx) => (
                    <li key={`${f.email}-${idx}`}>Email to {f.email}: {f.reason}</li>
                  ))}
                </ul>
              )}
              {uploadSummary.emailSent.length > 0 && (
                <p className="text-sm text-muted-foreground">Emails sent to: {uploadSummary.emailSent.join(', ')}</p>
              )}
            </CardContent>
          </Card>
        )}

        <CreateGroupModal open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={fetchGroups} />

        {loading ? <div className="text-center p-10">Loading groups...</div> : groups.length === 0 ? (
          <div className="text-center p-10 border rounded-lg bg-muted/20">
            <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No groups created yet</h3>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => {
              const semNum = parseInt(group.semester.replace(/\D/g, '')) || 0;
              return (
                <Card key={group.id} className="relative group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle>{group.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 opacity-0 group-hover:opacity-100" onClick={() => openEditModal(group)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                        {semNum > 0 && semNum < 8 && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 opacity-0 group-hover:opacity-100" onClick={() => handlePromoteGroup(group)} title="Promote"><ArrowUpCircle className="h-4 w-4" /></Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleDeleteGroup(group.id)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <Badge variant="secondary" className="w-fit">{group.semester}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">{group.description || "No description."}</p>

                    {/* JOIN CODE DISPLAY */}
                    <div className="mb-4 p-2 bg-muted/40 rounded border flex justify-between items-center cursor-pointer hover:bg-muted/60" onClick={() => copyCode(group.join_code || "")} title="Click to Copy">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Join Code</div>
                      <div className="text-lg font-mono font-bold tracking-widest text-primary">{group.join_code || "------"}</div>
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /> <span>{group.members_count} Students</span></div>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedGroupId(group.id); setIsAddMemberOpen(true); }}><UserPlus className="h-4 w-4 mr-2" /> Invite</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite Students</DialogTitle><DialogDescription>Enter email addresses; they’ll receive the join code.</DialogDescription></DialogHeader>
            <div className="py-4"><Label>Student Emails</Label><Textarea placeholder="student1@mail.com" value={newMemberEmails} onChange={(e) => setNewMemberEmails(e.target.value)} /></div>
            <DialogFooter><Button onClick={handleAddMember} disabled={addingMember}>{addingMember ? <Loader2 className="animate-spin" /> : "Send Invites"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Group Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
              <DialogDescription>Update the group's name, semester, or description.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="ename">Group Name</Label>
                <Input id="ename" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="esem">Semester</Label>
                <Select value={editSem} onValueChange={setEditSem}>
                  <SelectTrigger><SelectValue placeholder="Select Semester" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sem 3">Semester 3</SelectItem>
                    <SelectItem value="Sem 4">Semester 4</SelectItem>
                    <SelectItem value="Sem 5">Semester 5</SelectItem>
                    <SelectItem value="Sem 6">Semester 6</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edesc">Description</Label>
                <Input id="edesc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateGroup} disabled={savingEdit}>
                {savingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}