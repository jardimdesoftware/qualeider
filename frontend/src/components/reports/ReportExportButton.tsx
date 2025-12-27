"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { ProducerRanking, MonthlyReport } from "@/interfaces/report";

interface ReportExportButtonProps {
  ranking: ProducerRanking[];
  monthlyReport: MonthlyReport | null;
  associationName?: string;
}

export default function ReportExportButton({ 
  ranking, 
  monthlyReport,
  associationName = "Associação" 
}: ReportExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const generatePDF = async () => {
    setExporting(true);

    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable")
      ]);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;

      // Cabeçalho
      doc.setFontSize(20);
      doc.setTextColor(30, 58, 41); // #1e3a29
      doc.text("Relatório de Produção", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(associationName, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 6;

      const currentDate = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      doc.setFontSize(10);
      doc.text(`Gerado em: ${currentDate}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Seção: Resumo Mensal
      if (monthlyReport) {
        doc.setFontSize(14);
        doc.setTextColor(30, 58, 41);
        doc.text(`Resumo Mensal - ${monthlyReport.month}`, 14, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);

        const metrics = [
          { label: "Produção Total", value: `${monthlyReport.totalProduction.toFixed(0)} Litros` },
          { label: "Produtores Ativos", value: `${monthlyReport.totalProducers} Produtores` },
          { label: "Média por Produtor", value: `${monthlyReport.averagePerProducer.toFixed(1)} Litros` },
          { label: "Total de Animais", value: `${monthlyReport.totalAnimals} Animais` },
          { label: "Total de Coletas", value: `${monthlyReport.totalCollections} Registros` },
          { label: "Média por Animal", value: `${monthlyReport.avgPerAnimal.toFixed(1)} Litros` },
        ];

        metrics.forEach((metric, index) => {
          const col = index % 2;
          const row = Math.floor(index / 2);
          const xPos = 14 + (col * 95);
          const yPos = yPosition + (row * 8);

          doc.setFont("helvetica", "bold");
          doc.text(`${metric.label}:`, xPos, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(metric.value, xPos + 50, yPos);
        });

        yPosition += (Math.ceil(metrics.length / 2) * 8) + 12;
      }

      // Seção: Ranking de Produtores
      if (ranking && ranking.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(30, 58, 41);
        doc.text("Ranking de Produtores", 14, yPosition);
        yPosition += 5;

        // Preparar dados para a tabela
        const tableData = ranking.map((producer) => [
          `${producer.rank}º`,
          producer.name,
          producer.city && producer.state ? `${producer.city}, ${producer.state}` : "-",
          producer.animalsCount.toString(),
          producer.totalProduction.toFixed(1),
          producer.avgProductionPerDay.toFixed(1),
        ]);

        // Gerar tabela com autoTable
        autoTable(doc, {
          startY: yPosition,
          head: [["Pos.", "Produtor", "Localização", "Animais", "Total (L)", "Média/Dia (L)"]],
          body: tableData,
          theme: "grid",
          headStyles: {
            fillColor: [30, 58, 41], // #1e3a29
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
          },
          bodyStyles: {
            fontSize: 9,
            textColor: [50, 50, 50],
          },
          alternateRowStyles: {
            fillColor: [250, 250, 250],
          },
          columnStyles: {
            0: { cellWidth: 15, halign: "center" },
            1: { cellWidth: 50 },
            2: { cellWidth: 40 },
            3: { cellWidth: 20, halign: "center" },
            4: { cellWidth: 25, halign: "right" },
            5: { cellWidth: 30, halign: "right" },
          },
          didDrawCell: (data) => {
            // Destacar top 3
            if (data.section === "body" && data.column.index === 0) {
              const rank = parseInt(data.cell.text[0]);
              if (rank <= 3) {
                doc.setFillColor(255, 251, 235); // Amarelo claro
              }
            }
          },
        });
      }

      // Rodapé
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      // Salvar PDF
      const fileName = `relatorio_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={exporting || !ranking || ranking.length === 0}
      className="flex items-center gap-2 px-6 py-3 bg-[#d97706] text-white rounded-lg font-medium hover:bg-[#b85c00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
    >
      {exporting ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Gerando PDF...
        </>
      ) : (
        <>
          <FileDown className="w-5 h-5" />
          Exportar PDF
        </>
      )}
    </button>
  );
}
