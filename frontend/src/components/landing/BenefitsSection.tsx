import { ClipboardList, TrendingUp, Smartphone } from "lucide-react";

export function BenefitsSection() {
  return (
    <section className="py-20 texture-paper">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-[#1e3a29] mb-4 brand-font">
              Tudo o que você precisa no campo
            </h2>
            <p className="text-lg text-slate-600">
              Esqueça o caderno e a caneta. Tenha o controle total da sua
              fazenda na palma da mão.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Benefício 1 */}
            <div className="bg-white p-8 rounded-xl shadow-lg border-b-4 border-[#d97706] hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-[#fff7ed] rounded-full flex items-center justify-center mb-6">
                <ClipboardList className="w-8 h-8 text-[#d97706]" />
              </div>
              <h3 className="text-xl font-bold text-[#1e3a29] mb-3 brand-font">
                Controle de Rebanho
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Cadastre cada animal com foto, histórico de saúde e genealogia.
                Saiba exatamente o que acontece no curral.
              </p>
            </div>

            {/* Benefício 2 */}
            <div className="bg-white p-8 rounded-xl shadow-lg border-b-4 border-[#1e3a29] hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden">
              <div className="w-16 h-16 bg-[#f0fdf4] rounded-full flex items-center justify-center mb-6 relative z-10">
                <TrendingUp className="w-8 h-8 text-[#15803d]" />
              </div>
              <h3 className="text-xl font-bold text-[#1e3a29] mb-3 brand-font relative z-10">
                Métricas de Produção
              </h3>
              <p className="text-slate-600 leading-relaxed relative z-10">
                Gráficos simples que mostram se a produção de leite subiu ou
                desceu. Identifique problemas antes que virem prejuízo.
              </p>
              {/* Detalhe decorativo */}
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#1e3a29] opacity-5 rounded-full"></div>
            </div>

            {/* Benefício 3 */}
            <div className="bg-white p-8 rounded-xl shadow-lg border-b-4 border-[#d97706] hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-[#fff7ed] rounded-full flex items-center justify-center mb-6">
                <Smartphone className="w-8 h-8 text-[#d97706]" />
              </div>
              <h3 className="text-xl font-bold text-[#1e3a29] mb-3 brand-font">
                Acesso em Qualquer Lugar
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Seja no computador do escritório ou no celular no meio do pasto.
                Seus dados estão sempre com você.
              </p>
            </div>
          </div>
        </div>
      </section>
  );
}
