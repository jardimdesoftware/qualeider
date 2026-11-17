import "@testing-library/jest-dom";

// O jsdom não implementa performance.mark/measure, que o monitor de
// performance usa em toda requisição da API.
if (
  typeof window !== "undefined" &&
  typeof window.performance.mark !== "function"
) {
  Object.assign(window.performance, {
    mark: () => undefined,
    measure: () => undefined,
  });
}
