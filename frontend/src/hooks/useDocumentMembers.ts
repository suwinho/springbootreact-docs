import { useState, useEffect } from "react";

export interface Member {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  isBanned: boolean;
}

export function useDocumentMembers(docId: string, token: string | null) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  async function fetchMembers() {
    setIsLoading(true);
    const res = await fetch(`/api/documents/${docId}/members`, { headers });
    if (res.ok) {
      const data = await res.json();
      setMembers(data);
    }
    setIsLoading(false);
  }

  async function inviteUser(email: string, role: string) {
    await fetch(`/api/documents/${docId}/share`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, role }),
    });
    fetchMembers();
  }

  async function changeRole(userId: string, role: string) {
    await fetch(`/api/documents/${docId}/members/${userId}/role`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ role }),
    });
    fetchMembers();
  }

  async function removeMember(userId: string) {
    await fetch(`/api/documents/${docId}/members/${userId}`, {
      method: "DELETE",
      headers,
    });
    fetchMembers();
  }

  async function banUser(userId: string) {
    await fetch(`/api/documents/${docId}/members/${userId}/ban`, {
      method: "POST",
      headers,
    });
    fetchMembers();
  }

  async function unbanUser(userId: string) {
    await fetch(`/api/documents/${docId}/members/${userId}/unban`, {
      method: "POST",
      headers,
    });
    fetchMembers();
  }

  useEffect(() => {
    if (docId && token) fetchMembers();
  }, [docId, token]);

  return { members, isLoading, fetchMembers, inviteUser, changeRole, removeMember, banUser, unbanUser };
}
