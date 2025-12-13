import Link from "next/link";

export function CTASection() {
  return (
    <section className="bg-[#1e3a29] py-20 text-white relative overflow-hidden">
      {/* Elementos de Fundo */}
      <div
        className="absolute top-0 left-0 w-full h-full opacity-10"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      ></div>

      <div className="container mx-auto px-6 text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-black mb-6 brand-font">
          Pronto para modernizar sua produção?
        </h2>
        <p className="text-xl text-[#fceeb5] mb-10 max-w-2xl mx-auto">
          Junte-se a centenas de produtores que já estão economizando tempo e
          aumentando a lucratividade com o QualeiDer.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link
            href="/createAccount"
            className="bg-[#d97706] hover:bg-[#b45309] text-white font-bold py-5 px-10 rounded-lg text-xl shadow-2xl transition-transform hover:scale-105"
          >
            CRIAR MINHA CONTA GRÁTIS
          </Link>
        </div>
        <p className="mt-4 text-sm opacity-60">
          Não é necessário cartão de crédito.
        </p>
      </div>
    </section>
  );
}
