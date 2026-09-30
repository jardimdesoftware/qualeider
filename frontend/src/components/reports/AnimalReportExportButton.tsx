"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { Animal } from "@/interfaces/animal";
import { AnimalCollectionHistoryItem } from "@/interfaces/daily-collection";
import { downloadCSV } from "@/utils/csvExport";

interface AnimalReportExportButtonProps {
  animal: Animal;
  history: AnimalCollectionHistoryItem[];
}

function animalLabel(a: Animal): string {
  if (a.tagNumber) return `#${a.tagNumber}${a.name ? ` - ${a.name}` : ""}`;
  return a.name || `Animal ID ${a.id}`;
}

function fileSlug(a: Animal): string {
  return String(a.tagNumber ?? a.id);
}

export default function AnimalReportExportButton({
  animal,
  history,
}: AnimalReportExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  const totalLiters = history.reduce((sum, h) => sum + h.quantity, 0);
  const averagePerCollection =
    history.length > 0 ? totalLiters / history.length : 0;

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
      doc.text("Relatório de Ordenhas", pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 10;

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(animalLabel(animal), pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 6;

      const especieRaca = [
        animal.animalSpecies?.name ?? animal.animalType,
        animal.breed,
      ]
        .filter(Boolean)
        .join(" — ");
      if (especieRaca) {
        doc.setFontSize(10);
        doc.text(especieRaca, pageWidth / 2, yPosition, { align: "center" });
        yPosition += 6;
      }

      const currentDate = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      doc.setFontSize(10);
      doc.text(`Gerado em: ${currentDate}`, pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 15;

      // Resumo
      doc.setFontSize(14);
      doc.setTextColor(47, 158, 65);
      doc.text("Resumo", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      const metrics = [
        { label: "Total de Litros", value: `${totalLiters.toFixed(1)} L` },
        { label: "Nº de Coletas", value: `${history.length}` },
        {
          label: "Média por Coleta",
          value: `${averagePerCollection.toFixed(1)} L`,
        },
      ];

      metrics.forEach((metric, index) => {
        const yPos = yPosition + index * 7;
        doc.setFont("helvetica", "bold");
        doc.text(`${metric.label}:`, 14, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(metric.value, 70, yPos);
      });
      yPosition += metrics.length * 7 + 10;

      // Histórico de coletas
      if (history.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(47, 158, 65);
        doc.text("Histórico de Coletas", 14, yPosition);
        yPosition += 5;

        const tableData = history.map((item) => [
          new Date(item.collectionDate).toLocaleDateString("pt-BR", {
            timeZone: "UTC",
          }),
          item.quantity.toFixed(1),
          item.cmtResult ?? "-",
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [["Data", "Quantidade (L)", "CMT"]],
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

      const fileName = `relatorio_animal_${fileSlug(animal)}_${new Date().toISOString().split("T")[0]}.pdf`;
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
        ["Relatório de Ordenhas", animalLabel(animal)],
        [`Gerado em: ${currentDate}`],
        [],
        ["Total de Litros", totalLiters.toFixed(1)],
        ["Nº de Coletas", String(history.length)],
        ["Média por Coleta (L)", averagePerCollection.toFixed(1)],
        [],
        ["Data", "Quantidade (L)", "CMT"],
      ];

      history.forEach((item) => {
        rows.push([
          new Date(item.collectionDate).toLocaleDateString("pt-BR", {
            timeZone: "UTC",
          }),
          item.quantity.toFixed(1),
          item.cmtResult ?? "-",
        ]);
      });

      const fileName = `relatorio_animal_${fileSlug(animal)}_${new Date().toISOString().split("T")[0]}.csv`;
      downloadCSV(fileName, rows);
    } catch (error) {
      console.error("Erro ao gerar CSV:", error);
      alert("Erro ao gerar CSV. Tente novamente.");
    } finally {
      setExportingCsv(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={generatePDF}
        disabled={exporting || history.length === 0}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d97706] text-white rounded-lg text-xs font-medium hover:bg-[#b85c00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileDown className="w-3.5 h-3.5" />
        )}
        PDF
      </button>

      <button
        onClick={generateCSV}
        disabled={exportingCsv || history.length === 0}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d97706] text-white rounded-lg text-xs font-medium hover:bg-[#b85c00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exportingCsv ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5" />
        )}
        CSV
      </button>
    </div>
  );
}
