"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
}

export default function UpdateInfoModal({ onClose }: Props) {
  const [form, setForm] = useState({ name: "", team: "", work: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.team.trim() || !form.work.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/knowledge/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(data.message ?? `오류 ${res.status}`);
      }

      setStatus("success");
      setTimeout(onClose, 1200);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setStatus("error");
    }
  }

  const isValid = form.name.trim() && form.team.trim() && form.work.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            내 정보 현행화
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              이름
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="홍길동"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              팀
            </label>
            <input
              name="team"
              value={form.team}
              onChange={handleChange}
              placeholder="AI혁신팀"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              업무
            </label>
            <textarea
              name="work"
              value={form.work}
              onChange={handleChange}
              placeholder="AI 서비스 기획 및 개발"
              rows={3}
              className="w-full resize-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:text-zinc-100"
            />
          </div>
        </div>

        {status === "error" && (
          <p className="mt-3 text-xs text-red-500">{errorMsg}</p>
        )}
        {status === "success" && (
          <p className="mt-3 text-xs text-green-600">저장되었습니다!</p>
        )}

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || status === "loading" || status === "success"}
            className="flex-1 rounded-xl bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-100 dark:hover:bg-zinc-300 dark:text-black text-white px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-40"
          >
            {status === "loading" ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
