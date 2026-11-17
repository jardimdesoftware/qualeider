import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { animalService } from "@/services/animalService";
import { breedService } from "@/services/breedService";
import { destinationService } from "@/services/destinationService";
import { animalSpeciesService } from "@/services/animalSpeciesService";
import { allowedEmailsService } from "@/services/allowedEmailsService";
import { collectionService } from "@/services/collectionService";
import { userService } from "@/services/userService";
import { authService } from "@/services/authService";
import { activityLogService } from "@/services/activityLogService";
import { apiBase } from "@/services/baseApi";
import * as animals from "../useAnimals";
import * as breeds from "../useBreeds";
import * as destinations from "../useDestinations";
import * as species from "../useAnimalSpecies";
import * as allowedEmails from "../useAllowedEmails";
import * as collections from "../useCollections";
import * as users from "../useUsers";
import * as auth from "../useAuth";
import { useActivityLogs } from "../useActivityLogs";
import { useUserDashboard } from "../useDashboard";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function mockAll(service: object) {
  for (const key of Object.keys(service)) {
    jest
      .spyOn(service as Record<string, () => Promise<string>>, key)
      .mockResolvedValue(`${key}-ok`);
  }
}

let client: QueryClient;
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function run<T>(hook: () => T) {
  return renderHook(hook, { wrapper }).result;
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  jest.spyOn(client, "invalidateQueries");
  [
    animalService,
    breedService,
    destinationService,
    animalSpeciesService,
    allowedEmailsService,
    collectionService,
    userService,
    authService,
    activityLogService,
  ].forEach(mockAll);
  jest.spyOn(apiBase, "get").mockResolvedValue({ data: [{ id: 1 }] });
});

afterEach(() => jest.restoreAllMocks());

async function mutate<T>(
  hook: () => { mutateAsync: (v: T) => Promise<unknown> },
  vars: T,
) {
  const result = run(hook);
  await act(() => result.current.mutateAsync(vars));
}

describe.each([
  [
    "raças",
    breeds.useBreeds,
    breeds.useCreateBreed,
    breeds.useUpdateBreed,
    breeds.useDeleteBreed,
    breedService,
  ],
  [
    "destinos",
    destinations.useDestinations,
    destinations.useCreateDestination,
    destinations.useUpdateDestination,
    destinations.useDeleteDestination,
    destinationService,
  ],
  [
    "espécies",
    species.useAnimalSpecies,
    species.useCreateAnimalSpecies,
    species.useUpdateAnimalSpecies,
    species.useDeleteAnimalSpecies,
    animalSpeciesService,
  ],
])("hooks de %s", (_, useList, useCreate, useUpdate, useDelete, service) => {
  it("lista e invalida o cache após criar, editar e excluir", async () => {
    const list = run(() => useList());
    await waitFor(() => expect(list.current.data).toBe("getAll-ok"));

    await mutate(() => useCreate(), { name: "Nova" } as never);
    expect(service.create).toHaveBeenCalledWith({ name: "Nova" });
    await mutate(() => useUpdate(), {
      id: 2,
      data: { name: "Outra" },
    } as never);
    expect(service.update).toHaveBeenCalledWith(2, { name: "Outra" });
    await mutate(() => useDelete(), 2 as never);
    expect(service.delete).toHaveBeenCalledWith(2);
    expect(client.invalidateQueries).toHaveBeenCalledTimes(3);
  });
});

describe("item único por id", () => {
  it("useBreed e useDestination buscam só com id", async () => {
    const breed = run(() => breeds.useBreed(4));
    await waitFor(() => expect(breed.current.data).toBe("getById-ok"));
    const destination = run(() => destinations.useDestination(5));
    await waitFor(() => expect(destination.current.data).toBe("getById-ok"));
    const none = run(() => breeds.useBreed(null));
    expect(none.current.fetchStatus).toBe("idle");
  });
});

describe("hooks de animais", () => {
  it("busca e altera animais", async () => {
    const list = run(() => animals.useUserAnimals(1));
    await waitFor(() => expect(list.current.data).toBe("getByUser-ok"));
    const one = run(() => animals.useAnimal(3));
    await waitFor(() => expect(one.current.data).toBe("getById-ok"));

    await mutate(() => animals.useCreateAnimal(), {
      data: { name: "Mimosa" } as never,
      userId: 1,
    });
    expect(animalService.create).toHaveBeenCalledWith({ name: "Mimosa" }, 1);
    await mutate(() => animals.useUpdateAnimal(), {
      id: 3,
      data: { name: "M" },
    });
    await mutate(() => animals.useDeleteAnimal(), 3);
    await mutate(() => animals.useInativarAnimal(), 3);
    expect(animalService.inativar).toHaveBeenCalledWith(3);
    expect(client.invalidateQueries).toHaveBeenCalledTimes(4);
  });
});

describe("hooks de coletas", () => {
  it("lista as coletas do usuário pela API com o token", async () => {
    localStorage.setItem("authToken", "tok");
    const list = run(() => collections.useUserCollections(7));
    await waitFor(() => expect(list.current.data).toEqual([{ id: 1 }]));
    expect(apiBase.get).toHaveBeenCalledWith("/daily-collections/user/7", {
      headers: { Authorization: "Bearer tok" },
    });
  });

  it("cria, edita, exclui e mostra o histórico", async () => {
    await mutate(() => collections.useCreateCollection(), {
      data: { quantity: 1 },
      userId: 7,
    });
    await mutate(() => collections.useUpdateCollection(7), {
      id: 2,
      data: { quantity: 2 },
    });
    await mutate(() => collections.useDeleteCollection(7), 2);
    await mutate(() => collections.useUpdateCollection(null), {
      id: 2,
      data: {},
    });
    await mutate(() => collections.useDeleteCollection(null), 2);
    expect(collectionService.remove).toHaveBeenCalledWith(2);
    expect(client.invalidateQueries).toHaveBeenCalledTimes(3);

    const history = run(() => collections.useAnimalCollectionHistory(9));
    await waitFor(() =>
      expect(history.current.data).toBe("getHistoryByAnimal-ok"),
    );
  });
});

describe("hooks de usuários, e-mails, atividade e painel", () => {
  it("usuários", async () => {
    const list = run(() => users.useUsers({ role: "VAQUEIRO" }));
    await waitFor(() => expect(list.current.data).toBe("findAll-ok"));
    expect(userService.findAll).toHaveBeenCalledWith({ role: "VAQUEIRO" });
    const off = run(() => users.useUsers({ enabled: false }));
    expect(off.current.fetchStatus).toBe("idle");
    const one = run(() => users.useUser(2));
    await waitFor(() => expect(one.current.data).toBe("getById-ok"));
    await mutate(() => users.useUpdateUser(), { id: 2, data: { name: "Ana" } });
    expect(client.invalidateQueries).toHaveBeenCalledTimes(2);
  });

  it("e-mails liberados", async () => {
    const list = run(() => allowedEmails.useAllowedEmails());
    await waitFor(() => expect(list.current.data).toBe("findAll-ok"));
    await mutate(() => allowedEmails.useCreateAllowedEmail(), "a@ifpe.edu.br");
    await mutate(() => allowedEmails.useRemoveAllowedEmail(), 1);
    expect(allowedEmailsService.remove).toHaveBeenCalledWith(1);
  });

  it("histórico de atividade", async () => {
    const logs = run(() => useActivityLogs(3, 2, 10));
    await waitFor(() => expect(logs.current.data).toBe("findByUser-ok"));
    expect(activityLogService.findByUser).toHaveBeenCalledWith({
      userId: 3,
      page: 2,
      limit: 10,
    });
  });

  it("painel junta animais e coletas", async () => {
    const dashboard = run(() => useUserDashboard(1));
    await waitFor(() => expect(dashboard.current.isLoading).toBe(false));
    expect(dashboard.current.animals).toBe("getByUser-ok");
    expect(dashboard.current.collections).toEqual([{ id: 1 }]);
  });
});

describe("hooks de autenticação", () => {
  it("login invalida o usuário e vai para o painel", async () => {
    await mutate(() => auth.useLogin(), {
      email: "a@ifpe.edu.br",
      password: "x",
    });
    expect(client.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["user"],
    });
    expect(push).toHaveBeenCalledWith("/dashboardUser");
  });

  it("recuperação de senha", async () => {
    await mutate(() => auth.useForgotPassword(), "a@b.com");
    await mutate(() => auth.useVerifyResetCode(), {
      email: "a@b.com",
      code: "123456",
    });
    await mutate(() => auth.useResetPassword(), {
      email: "a@b.com",
      code: "123456",
      password: "N",
    });
    expect(authService.resetPassword).toHaveBeenCalledWith(
      "a@b.com",
      "123456",
      "N",
    );
  });
});
