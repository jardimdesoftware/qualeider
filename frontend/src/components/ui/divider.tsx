interface DividerProps {
  text?: string;
}

export default function Divider({ text = "OU" }: DividerProps) {
  return (
    <div className="flex items-center justify-center my-6">
      <div className="border-t border-gray-300 flex-grow"></div>
      <span className="mx-4 text-gray-400 font-medium">{text}</span>
      <div className="border-t border-gray-300 flex-grow"></div>
    </div>
  );
}
