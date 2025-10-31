interface WelcomeInfoProps {
  className?: string;
}

export default function WelcomeInfo({ className = "" }: WelcomeInfoProps) {
  return (
    <div className={`text-white space-y-2 text-sm ${className}`}>
      <p>A solução completa para o gerenciamento da sua produção leiteira.</p>
      <p>
        No QualeiDer, você pode cadastrar seus animais e monitorar a produção
        diária de leite de forma simples e organizada.
      </p>
    </div>
  );
}
