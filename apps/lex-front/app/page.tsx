"use client";
import React, { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import StartChatCTA from "@/components/StartChatCTA";
import RegisterNudge from "@/components/RegisterNudge";
import AuthModal from "@/components/AuthModal";
import ChatExample from "@/components/ChatExample";

export default function Page() {
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <SiteHeader onOpenAuth={() => { setAuthTab("login"); setAuthOpen(true); }} />

      <main className="flex flex-1 flex-col md:flex-row items-start justify-center gap-12 px-8 py-16">
        <section className="flex-1 max-w-lg">
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Юридические ответы простыми словами
          </h1>
          <p className="text-gray-600 mb-8">
            Задайте вопрос — получите пошаговый план действий и ссылки на законы.
            Для частных лиц, предпринимателей и юристов. Без лишней воды.
          </p>
          <div className="mb-4">
            <StartChatCTA onOpenNudge={() => setNudgeOpen(true)} />
          </div>
          <p className="text-xs text-gray-500">
            Ответы формируются на базе принципов поисковых систем и встроенного ядра анализа.
          </p>
        </section>

        <aside className="flex-1 max-w-md">
          <ChatExample />
        </aside>
      </main>

      <SiteFooter />

      {/* Nudge */}
      <RegisterNudge
        open={nudgeOpen}
        onClose={() => setNudgeOpen(false)}
        onRegister={() => {
          setNudgeOpen(false);
          setAuthTab("register");
          setAuthOpen(true);
        }}
      />

      {/* Auth */}
      <AuthModal
        open={authOpen}
        tab={authTab}
        onClose={() => setAuthOpen(false)}
        onTabChange={setAuthTab}
      />
    </div>
  );
}
