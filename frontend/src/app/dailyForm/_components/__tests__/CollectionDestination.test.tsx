import { fireEvent, render, screen } from "@testing-library/react";
import { CollectionDestination } from "../CollectionDestination";

const destinations = [
  { id: 1, name: "Laticínio" },
  { id: 2, name: "Consumo" },
];

const renderIt = (overrides: Partial<Parameters<typeof CollectionDestination>[0]> = {}) => {
  const onSelect = jest.fn();
  render(
    <CollectionDestination
      totalMilk={42.5}
      milkedCows={3}
      destinations={destinations}
      isLoading={false}
      selectedId={null}
      onSelect={onSelect}
      {...overrides}
    />,
  );
  return { onSelect };
};

describe("CollectionDestination", () => {
  it("mostra o total de leite coletado e quantas vacas", () => {
    renderIt();

    expect(screen.getByText(/42\.5 L/)).toBeInTheDocument();
    expect(screen.getByText(/3 vacas/)).toBeInTheDocument();
  });

  it("usa o singular com uma vaca", () => {
    renderIt({ milkedCows: 1 });

    expect(screen.getByText(/1 vaca$/)).toBeInTheDocument();
  });

  it("lista os destinos e avisa a escolha", () => {
    const { onSelect } = renderIt();

    fireEvent.click(screen.getByRole("button", { name: "Consumo" }));

    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("marca o destino escolhido e desmarca ao clicar de novo", () => {
    const { onSelect } = renderIt({ selectedId: 1 });

    const chosen = screen.getByRole("button", { name: "Laticínio" });
    expect(chosen).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Consumo" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    fireEvent.click(chosen);
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("sem destinos cadastrados, avisa que a coleta segue sem destino", () => {
    renderIt({ destinations: [] });

    expect(screen.getByText(/Nenhum destino cadastrado/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("mostra carregando enquanto busca os destinos", () => {
    renderIt({ destinations: [], isLoading: true });

    expect(screen.getByText(/Carregando destinos/)).toBeInTheDocument();
    expect(screen.queryByText(/Nenhum destino cadastrado/)).not.toBeInTheDocument();
  });
});
