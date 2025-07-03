export class InternalServerError extends Error {
  constructor({ cause }) {
    super("Erro interno inesperado aconteceu.", { cause });
    this.name = "InternalServerError";
    this.action = "Contate o suporte informando o erro.";
    this.statusCode = 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}
