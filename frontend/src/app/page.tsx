"use client";

import { BrandHeader, ActionButton, Divider, ContentCard } from "@/components/ui";
import { PageFooter } from "@/components/layout";

export default function Home() {
  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <ContentCard>
        <BrandHeader
          title="QualeiDer"
          subtitle="Controle de sua produção leiteira"
        />

        <div className="p-8 pb-6">
          <h2 className="text-brand-primary text-2xl font-bold text-center mb-8">
            O que deseja fazer?
          </h2>

          <ActionButton
            href="/login"
            variant="primary"
            title="ENTRAR"
            subtitle="Já tenho conta"
          />

          <Divider text="OU" />

          <ActionButton
            href="/createAccount"
            variant="secondary"
            title="CRIAR CONTA"
            subtitle="Sou novo aqui"
          />
        </div>

        <PageFooter />
      </ContentCard>
    </main>
  );
}
