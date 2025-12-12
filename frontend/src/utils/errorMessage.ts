import { AxiosError } from "axios";

export function getFriendlyErrorMessage(error: unknown): string {
  if (!error) return "Ocorreu um erro inesperado.";

  // Erros do Axios (Respostas da API)
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as any;

    // Mensagem específica enviada pelo backend (se existir)
    if (data?.message) {
      // Se for array de mensagens (ex: validação class-validator), pega a primeira
      if (Array.isArray(data.message)) {
        return data.message[0];
      }
      return data.message;
    }

    // Erros de Conexão / Rede
    if (error.code === "ERR_NETWORK") {
      return "Não foi possível conectar ao servidor. Verifique sua conexão com a internet ou tente novamente mais tarde.";
    }

    // Mapeamento por Status Code
    switch (status) {
      case 400:
        return "Dados inválidos. Verifique as informações preenchidas.";
      case 401:
        return "Email ou senha incorretos. Tente novamente.";
      case 403:
        return "Você não tem permissão para realizar esta ação.";
      case 404:
        return "Recurso não encontrado no servidor.";
      case 429:
        return "Muitas tentativas. Aguarde um momento e tente novamente.";
      case 500:
        return "Erro interno no servidor. Nossa equipe já foi notificada.";
      default:
        return "Ocorreu um erro na comunicação com o servidor.";
    }
  }

  // Erro genérico do JS
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocorreu um erro inesperado. Tente novamente.";
}

function isAxiosError(error: any): error is AxiosError {
  return error.isAxiosError === true;
}
