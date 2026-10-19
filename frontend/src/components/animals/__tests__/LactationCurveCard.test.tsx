import { render, screen } from "@testing-library/react";
import LactationCurveCard from "../LactationCurveCard";

// O gráfico em si é do recharts (precisa de medidas de tela que o jsdom não
// tem); aqui se testa o que o cartão decide mostrar.
jest.mock("recharts", () => {
  const Passthrough = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart-part">{children}</div>
  );
  return {
    ResponsiveContainer: Passthrough,
    LineChart: Passthrough,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
  };
});

const history = [
  { collectionDate: "2026-08-05T00:00:00.000Z", quantity: 10 },
  { collectionDate: "2026-08-20T00:00:00.000Z", quantity: 22 },
];

describe("LactationCurveCard", () => {
  it("pede a data do parto quando a vaca não tem", () => {
    render(<LactationCurveCard calvingDate={null} history={history} />);

    expect(screen.getByText(/Informe a data do último parto/)).toBeInTheDocument();
    expect(screen.queryByTestId("chart-part")).not.toBeInTheDocument();
  });

  it("avisa quando não há coletas depois do parto", () => {
    render(
      <LactationCurveCard
        calvingDate="2026-09-01T00:00:00.000Z"
        history={history}
      />,
    );

    expect(screen.getByText(/Ainda não há coletas desta vaca/)).toBeInTheDocument();
  });

  it("mostra o pico, os dias com coleta e o número da cria", () => {
    render(
      <LactationCurveCard
        calvingDate="2026-08-01T00:00:00.000Z"
        lactationNumber={2}
        history={history}
      />,
    );

    expect(screen.getByText("22 L")).toBeInTheDocument();
    expect(screen.getByText("no dia 19")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // dias com coleta
    expect(screen.getByText(/2ª cria/)).toBeInTheDocument();
    expect(screen.getAllByTestId("chart-part").length).toBeGreaterThan(0);
  });
});
