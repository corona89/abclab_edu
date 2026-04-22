"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  onDeleted?: () => void;
}

export default function DeleteInfoModal({ onClose, onDeleted }: Props) {
  const [deleteName, setDeleteName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleDelete() {
    if (!deleteName.trim()) {
      setErrorMsg("삭제할 담당자 이름을 입력해주세요.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/knowledge/segments?name=${encodeURIComponent(deleteName.trim())}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(data.message ?? `오류 ${res.status}`);
      }

      setStatus("success");
      setTimeout(() => {
        onDeleted?.();
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "삭제에 실패했습니다.");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            담당자 삭제
          </h2>
          <button
            onClick={() => {
              onClose();
              setDeleteName("");
              setStatus("idle");
              setErrorMsg("");
            }}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              삭제할 담당자 이름
            </label>
            <input
              value={deleteName}
              onChange={(e) => setDeleteName(e.target.value)}
              placeholder="홍길동"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:text-zinc-100"
              onKeyDown={(e) => {
                if (e.key === "Enter" && status !== "loading") {
                  handleDelete();
                }
              }}
              autoFocus
            />
            <p className="mt-1 text-xs text-zinc-400">
              입력한 이름과 일치하는 세그먼트가 삭제됩니다.
            </p>
          </div>
        </div>

        {status === "error" && (
          <p className="mt-3 text-xs text-red-500">{errorMsg}</p>
        )}
        {status === "success" && (
          <p className="mt-3 text-xs text-green-600">삭제되었습니다!</p>
        )}

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => {
              onClose();
              setDeleteName("");
              setStatus("idle");
              setErrorMsg("");
            }}
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleDelete}
            disabled={status === "loading" || status === "success"}
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-40"
          >
            {status === "loading" ? "삭제 중…" : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}
