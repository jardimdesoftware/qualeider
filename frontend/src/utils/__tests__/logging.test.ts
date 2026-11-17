import * as Sentry from "@sentry/nextjs";

jest.mock("@sentry/nextjs", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

const env = process.env as Record<string, string | undefined>;
const ORIGINAL_ENV = env.NODE_ENV;

/** Carrega os módulos de novo com o NODE_ENV pedido (o logger lê o env ao ser criado). */
async function load(nodeEnv: string) {
  env.NODE_ENV = nodeEnv;
  let modules!: {
    logger: typeof import("../logger").logger;
    performanceMonitor: typeof import("../performance").performanceMonitor;
    usePerformance: typeof import("../performance").usePerformance;
    sentry: typeof import("@/lib/sentry");
  };
  await jest.isolateModulesAsync(async () => {
    const [{ logger }, performance, sentry] = await Promise.all([
      import("../logger"),
      import("../performance"),
      import("@/lib/sentry"),
    ]);
    modules = {
      logger,
      performanceMonitor: performance.performanceMonitor,
      usePerformance: performance.usePerformance,
      sentry,
    };
  });
  return modules;
}

afterEach(() => {
  env.NODE_ENV = ORIGINAL_ENV;
  jest.clearAllMocks();
  delete (window as unknown as { gtag?: unknown }).gtag;
});

describe("logger em produção", () => {
  it("manda avisos e erros para o Sentry", async () => {
    const { logger } = await load("production");
    logger.warn("cuidado", { route: "/x" });
    logger.error("quebrou", new Error("boom"));
    logger.error("falha sem Error", "texto");
    logger.info("info");
    logger.debug("debug");
    logger.time("t");
    logger.timeEnd("t");

    expect(Sentry.captureMessage).toHaveBeenCalledWith("cuidado", {
      level: "warning",
      extra: { route: "/x" },
    });
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), {
      extra: { message: "quebrou" },
    });
    expect(Sentry.captureMessage).toHaveBeenCalledWith("falha sem Error", {
      level: "error",
      extra: { error: "texto" },
    });
    expect(Sentry.addBreadcrumb).toHaveBeenCalled();
  });

  it("trackAction envia o evento para o gtag quando existe", async () => {
    const gtag = jest.fn();
    (window as unknown as { gtag: unknown }).gtag = gtag;
    const { logger } = await load("production");
    logger.trackAction("salvou_coleta", { userId: 1 });
    expect(gtag).toHaveBeenCalledWith("event", "salvou_coleta", { userId: 1 });
  });
});

describe("logger em desenvolvimento", () => {
  it("escreve no console e não chama o Sentry", async () => {
    const spies = (
      ["log", "warn", "error", "debug", "time", "timeEnd"] as const
    ).map((m) => jest.spyOn(console, m).mockImplementation(() => {}));
    const { logger } = await load("development");
    logger.info("i");
    logger.warn("w");
    logger.error("e", new Error("x"));
    logger.debug("d", { a: 1 });
    logger.time("t");
    logger.timeEnd("t");

    for (const spy of spies) expect(spy).toHaveBeenCalled();
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
    spies.forEach((s) => s.mockRestore());
  });
});

describe("performanceMonitor", () => {
  it("mede o tempo entre mark e measure", async () => {
    jest.useFakeTimers().setSystemTime(1000);
    const { performanceMonitor } = await load("test");
    performanceMonitor.mark("req");
    jest.setSystemTime(1250);
    expect(performanceMonitor.measure("req")).toBe(250);
    expect(performanceMonitor.measure("req")).toBeNull();
    jest.useRealTimers();
  });

  it("usePerformance usa o nome do componente", async () => {
    const { usePerformance } = await load("test");
    const { mark, measure } = usePerformance("Tabela");
    mark();
    expect(measure()).toEqual(expect.any(Number));
  });

  it.each([
    ["LCP", 2000, "good"],
    ["LCP", 3000, "needs-improvement"],
    ["LCP", 5000, "poor"],
    ["CLS", 0.05, "good"],
  ])("Web Vital %s=%d é %s", async (name, value, rating) => {
    const gtag = jest.fn();
    (window as unknown as { gtag: unknown }).gtag = gtag;
    const { performanceMonitor, logger } = await load("test");
    const info = jest.spyOn(logger, "info");
    performanceMonitor.reportWebVitals({
      id: "v1",
      name,
      label: "web-vital",
      value,
    });
    expect(info).toHaveBeenCalledWith(
      `Web Vital: ${name}`,
      expect.objectContaining({ rating }),
    );
    expect(gtag).toHaveBeenCalledWith(
      "event",
      name,
      expect.objectContaining({ event_category: "Web Vitals" }),
    );
  });

  it("reportMetric registra e envia ao gtag", async () => {
    const gtag = jest.fn();
    (window as unknown as { gtag: unknown }).gtag = gtag;
    const { performanceMonitor } = await load("test");
    performanceMonitor.reportMetric({
      name: "linhas",
      value: 3,
      unit: "count",
    });
    expect(gtag).toHaveBeenCalledWith("event", "performance_metric", {
      metric_name: "linhas",
      value: 3,
      metric_unit: "count",
    });
  });
});

describe("lib/sentry", () => {
  it("só inicia em produção com DSN e limpa dados sensíveis", async () => {
    env.NEXT_PUBLIC_SENTRY_DSN = "https://k@o1.ingest.sentry.io/1";
    const { sentry } = await load("production");
    sentry.initSentry();
    const options = (Sentry.init as jest.Mock).mock.calls[0][0];
    expect(options.dsn).toBe("https://k@o1.ingest.sentry.io/1");

    const event = {
      environment: "production",
      request: { cookies: "c", headers: { a: "1" } },
    };
    expect(options.beforeSend(event)).toEqual({
      environment: "production",
      request: {},
    });
    expect(options.beforeSend({ environment: "development" })).toBeNull();
    delete env.NEXT_PUBLIC_SENTRY_DSN;
  });

  it("fora de produção não inicia nem captura", async () => {
    const { sentry } = await load("test");
    sentry.initSentry();
    sentry.captureException(new Error("x"));
    sentry.captureMessage("m");
    expect(Sentry.init).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("setUserContext define e limpa o usuário", async () => {
    const { sentry } = await load("test");
    sentry.setUserContext(5, "a@ifpe.edu.br");
    expect(Sentry.setUser).toHaveBeenCalledWith({
      id: "5",
      email: "a@ifpe.edu.br",
    });
    sentry.setUserContext(null);
    expect(Sentry.setUser).toHaveBeenCalledWith(null);
  });
});
