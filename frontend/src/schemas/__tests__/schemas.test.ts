import {
  changePasswordSchema,
  cnpjRule,
  codeRule,
  cpfRule,
  forgotPasswordSchema,
  loginSchema,
  newPasswordSchema,
  phoneRule,
  registerSchema,
  resetPasswordSchema,
} from "../auth";
import { animalSchema } from "../animal";
import { dailyCollectionSchema } from "../collection";

const SENHA = "Senha@123";

function firstError(result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}) {
  return result.success ? undefined : result.error?.issues[0].message;
}

describe("schemas de autenticação", () => {
  it("login válido passa", () => {
    expect(
      loginSchema.safeParse({ email: "a@ifpe.edu.br", password: SENHA })
        .success,
    ).toBe(true);
  });

  it.each([
    ["curta", "Ab@1", "mínimo 8"],
    ["sem minúscula", "SENHA@123", "minúscula"],
    ["sem maiúscula", "senha@123", "maiúscula"],
    ["sem número", "Senha@abc", "número"],
    ["sem especial", "Senha1234", "especial"],
    ["longa demais", `Aa1@${"x".repeat(70)}`, "longa"],
  ])("senha %s é recusada", (_, password, expected) => {
    expect(
      firstError(loginSchema.safeParse({ email: "a@b.com", password })),
    ).toContain(expected);
  });

  it("email inválido ou vazio é recusado", () => {
    expect(firstError(forgotPasswordSchema.safeParse({ email: "" }))).toBe(
      "Email é obrigatório",
    );
    expect(firstError(forgotPasswordSchema.safeParse({ email: "x" }))).toBe(
      "Formato de email inválido",
    );
  });

  it("senhas diferentes não passam no cadastro, reset e nova senha", () => {
    const base = { password: SENHA, confirmPassword: "Outra@123" };
    expect(
      firstError(
        registerSchema.safeParse({
          ...base,
          name: "Ana Maria",
          email: "a@b.com",
        }),
      ),
    ).toBe("As senhas não conferem");
    expect(
      firstError(
        resetPasswordSchema.safeParse({
          ...base,
          email: "a@b.com",
          code: "123456",
        }),
      ),
    ).toBe("As senhas não conferem");
    expect(firstError(newPasswordSchema.safeParse(base))).toBe(
      "As senhas não conferem",
    );
    expect(
      newPasswordSchema.safeParse({ password: SENHA, confirmPassword: SENHA })
        .success,
    ).toBe(true);
  });

  it("trocar senha exige senha nova diferente da atual", () => {
    expect(
      firstError(
        changePasswordSchema.safeParse({
          currentPassword: SENHA,
          newPassword: SENHA,
          confirmPassword: SENHA,
        }),
      ),
    ).toBe("A nova senha deve ser diferente da atual");
    expect(
      changePasswordSchema.safeParse({
        currentPassword: SENHA,
        newPassword: "Nova@1234",
        confirmPassword: "Nova@1234",
      }).success,
    ).toBe(true);
  });

  it("regras de formato (código, CPF, CNPJ, telefone)", () => {
    expect(codeRule.safeParse("123456").success).toBe(true);
    expect(codeRule.safeParse("12a456").success).toBe(false);
    expect(cpfRule.safeParse("123.456.789-00").success).toBe(true);
    expect(cpfRule.safeParse("12345678900").success).toBe(false);
    expect(cnpjRule.safeParse("12.345.678/0001-90").success).toBe(true);
    expect(phoneRule.safeParse("(81) 99999-0000").success).toBe(true);
    expect(phoneRule.safeParse("81999990000").success).toBe(false);
  });
});

describe("schema de animal", () => {
  it("exige espécie e raça e limita a idade", () => {
    expect(
      animalSchema.safeParse({ animalSpeciesId: 1, breedId: 2, age: 4 })
        .success,
    ).toBe(true);
    expect(
      firstError(
        animalSchema.safeParse({ animalSpeciesId: 0, breedId: 2, age: 4 }),
      ),
    ).toBe("Selecione um tipo de animal");
    expect(
      firstError(
        animalSchema.safeParse({ animalSpeciesId: 1, breedId: 2, age: 31 }),
      ),
    ).toBe("Idade máxima é 30 anos");
  });
});

describe("schema da coleta diária", () => {
  const coleta = {
    collectionDate: "2026-11-17",
    quantity: 120,
    numAnimals: 10,
    numOrdens: 2,
    rationProvided: true,
    numLactation: 8,
    milkingPlace: "Curral",
    technicalAssistance: false,
  };

  it("aceita uma coleta com itens por vaca", () => {
    const result = dailyCollectionSchema.safeParse({
      ...coleta,
      destinationId: 3,
      items: [
        {
          animalId: 1,
          quantity: 12,
          cmtResult: "Normal",
          mugTestResult: "Negativo",
          milking: 1,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("recusa data vazia, local inválido e ordenha 3", () => {
    expect(
      firstError(
        dailyCollectionSchema.safeParse({ ...coleta, collectionDate: "" }),
      ),
    ).toBe("Data é obrigatória");
    expect(
      dailyCollectionSchema.safeParse({ ...coleta, milkingPlace: "Pasto" })
        .success,
    ).toBe(false);
    expect(
      dailyCollectionSchema.safeParse({
        ...coleta,
        items: [{ animalId: 1, quantity: 1, milking: 3 }],
      }).success,
    ).toBe(false);
  });
});
