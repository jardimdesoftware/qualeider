"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { MonthlyReport } from "@/interfaces/report";
import { AnimalProductionSummary } from "@/interfaces/animal";
import { downloadCSV } from "@/utils/csvExport";

interface ReportExportButtonProps {
  animalProduction: AnimalProductionSummary[];
  monthlyReport: MonthlyReport | null;
}

function animalLabel(a: AnimalProductionSummary): string {
  if (a.tagNumber) return `#${a.tagNumber}${a.name ? ` - ${a.name}` : ""}`;
  return a.name || `Animal ID ${a.animalId}`;
}

export default function ReportExportButton({
  animalProduction,
  monthlyReport,
}: ReportExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  const generatePDF = async () => {
    setExporting(true);

    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;

      // Cabeçalho
      doc.setFontSize(20);
      doc.setTextColor(47, 158, 65); // #2f9e41
      doc.text("Relatório de Produção", pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 10;

      const currentDate = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${currentDate}`, pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 15;

      // Seção: Resumo Mensal
      if (monthlyReport) {
        doc.setFontSize(14);
        doc.setTextColor(47, 158, 65);
        doc.text(`Resumo Mensal - ${monthlyReport.month}`, 14, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);

        const metrics = [
          {
            label: "Produção Total",
            value: `${monthlyReport.totalProduction.toFixed(0)} Litros`,
          },
          {
            label: "Total de Animais",
            value: `${monthlyReport.totalAnimals} Animais`,
          },
          {
            label: "Total de Coletas",
            value: `${monthlyReport.totalCollections} Registros`,
          },
          {
            label: "Média por Animal",
            value: `${monthlyReport.avgPerAnimal.toFixed(1)} Litros`,
          },
        ];

        metrics.forEach((metric, index) => {
          const col = index % 2;
          const row = Math.floor(index / 2);
          const xPos = 14 + col * 95;
          const yPos = yPosition + row * 8;

          doc.setFont("helvetica", "bold");
          doc.text(`${metric.label}:`, xPos, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(metric.value, xPos + 50, yPos);
        });

        yPosition += Math.ceil(metrics.length / 2) * 8 + 12;
      }

      // Seção: Produção por Animal
      if (animalProduction && animalProduction.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(47, 158, 65);
        doc.text("Produção por Animal", 14, yPosition);
        yPosition += 5;

        const tableData = animalProduction.map((animal) => [
          animalLabel(animal),
          animal.collectionsCount.toString(),
          animal.totalProduction.toFixed(1),
          animal.avgProduction.toFixed(1),
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [["Animal", "Coletas", "Total (L)", "Média/Coleta (L)"]],
          body: tableData,
          theme: "grid",
          headStyles: {
            fillColor: [47, 158, 65], // #2f9e41
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
            0: { cellWidth: 70 },
            1: { cellWidth: 30, halign: "center" },
            2: { cellWidth: 35, halign: "right" },
            3: { cellWidth: 45, halign: "right" },
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
          { align: "center" },
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

  const generateCSV = () => {
    setExportingCsv(true);

    try {
      const currentDate = new Date().toLocaleDateString("pt-BR");
      const rows: string[][] = [
        ["Relatório de Produção"],
        [`Gerado em: ${currentDate}`],
        [],
      ];

      if (monthlyReport) {
        rows.push([`Resumo Mensal - ${monthlyReport.month}`]);
        rows.push([
          "Produção Total (L)",
          monthlyReport.totalProduction.toFixed(0),
        ]);
        rows.push(["Total de Animais", String(monthlyReport.totalAnimals)]);
        rows.push(["Total de Coletas", String(monthlyReport.totalCollections)]);
        rows.push([
          "Média por Animal (L)",
          monthlyReport.avgPerAnimal.toFixed(1),
        ]);
        rows.push([]);
      }

      if (animalProduction && animalProduction.length > 0) {
        rows.push(["Produção por Animal"]);
        rows.push(["Animal", "Coletas", "Total (L)", "Média/Coleta (L)"]);
        animalProduction.forEach((animal) => {
          rows.push([
            animalLabel(animal),
            animal.collectionsCount.toString(),
            animal.totalProduction.toFixed(1),
            animal.avgProduction.toFixed(1),
          ]);
        });
      }

      const fileName = `relatorio_${new Date().toISOString().split("T")[0]}.csv`;
      downloadCSV(fileName, rows);
    } catch (error) {
      console.error("Erro ao gerar CSV:", error);
      alert("Erro ao gerar CSV. Tente novamente.");
    } finally {
      setExportingCsv(false);
    }
  };

  const hasData = animalProduction && animalProduction.length > 0;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={generatePDF}
        disabled={exporting || !hasData}
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

      <button
        onClick={generateCSV}
        disabled={exportingCsv || !hasData}
        className="flex items-center gap-2 px-6 py-3 bg-[#d97706] text-white rounded-lg font-medium hover:bg-[#b85c00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
      >
        {exportingCsv ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Gerando CSV...
          </>
        ) : (
          <>
            <FileSpreadsheet className="w-5 h-5" />
            Exportar CSV
          </>
        )}
      </button>
    </div>
  );
}
