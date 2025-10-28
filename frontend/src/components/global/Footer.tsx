interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className={`text-center text-gray-500 text-sm ${className}`}>
      <p>© {currentYear} IFPE - Campus Belo Jardim</p>
      <p>Todos os direitos reservados</p>
    </div>
  );
}
