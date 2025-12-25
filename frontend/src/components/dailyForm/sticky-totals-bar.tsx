import { Milk, Cat } from "lucide-react";

interface StickyTotalsBarProps {
  totalMilk: number;
  milkedCows: number;
  totalAnimals: number;
}

export default function StickyTotalsBar({
  totalMilk,
  milkedCows,
  totalAnimals,
}: StickyTotalsBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-gradient-to-r from-green-50 to-blue-50 border-b-2 border-green-200 shadow-md">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-white rounded-full p-2 shadow-sm">
              <Milk className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Total Coletado</p>
              <p className="text-2xl font-black text-blue-600">
                {totalMilk.toFixed(1)} L
              </p>
            </div>
          </div>
          
          <div className="h-10 w-px bg-gray-300"></div>
          
          <div className="flex items-center gap-2">
            <div className="bg-white rounded-full p-2 shadow-sm">
              <Cat className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Vacas Ordenhadas</p>
              <p className="text-2xl font-black text-green-600">
                {milkedCows} / {totalAnimals}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
