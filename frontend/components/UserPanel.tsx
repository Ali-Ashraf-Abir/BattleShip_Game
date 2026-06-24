"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, ApiRequestError } from "@/lib/api";
import { useSessionUsers } from "@/lib/session";
import {
  Panel,
  Field,
  inputClass,
  PrimaryButton,
  CopyableId,
  ErrorText,
} from "@/components/ui";

export default function UserPanel() {
  const router = useRouter();
  const { users, addUser, clearUsers } = useSessionUsers();
  const [name, setName] = useState("Admiral");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (userId) {
      router.replace("/lobby");
    }
  }, [router]);
  async function handleCreate() {
    setLoading(true);
    setError(null);

    try {
      const user = await api.createUser({ name });

      addUser(user);

      localStorage.setItem("userId", user.id);
      localStorage.setItem("userName", user.displayName);

      router.push("/lobby");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Unexpected error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel title="Create player" step="01">
      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className={inputClass}
              placeholder="e.g. Nelson"
            />
          </Field>
        </div>
        <div className="flex items-end">
          <PrimaryButton onClick={handleCreate} loading={loading} disabled={!name.trim()}>
            Create
          </PrimaryButton>
        </div>
      </div>

      <ErrorText message={error} />


    </Panel>
  );
}
