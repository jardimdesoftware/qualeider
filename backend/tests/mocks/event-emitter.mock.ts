import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Mock do EventEmitter2 para testes unitários
 * Permite verificar se eventos foram emitidos com os payloads corretos
 */
export const createMockEventEmitter = (): jest.Mocked<EventEmitter2> => {
  return {
    emit: jest.fn(),
    emitAsync: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    listeners: jest.fn(),
    listenerCount: jest.fn(),
    eventNames: jest.fn(),
    setMaxListeners: jest.fn(),
    getMaxListeners: jest.fn(),
    prependListener: jest.fn(),
    prependOnceListener: jest.fn(),
    rawListeners: jest.fn(),
    addListener: jest.fn(),
  } as any;
};

/**
 * Helper para verificar se um evento específico foi emitido
 * @param eventEmitterMock - Mock do EventEmitter2
 * @param eventName - Nome do evento esperado
 * @param payload - Payload esperado (opcional)
 */
export const expectEventEmitted = (
  eventEmitterMock: jest.Mocked<EventEmitter2>,
  eventName: string,
  payload?: any,
): void => {
  expect(eventEmitterMock.emit).toHaveBeenCalled();

  const calls = (eventEmitterMock.emit as jest.Mock).mock.calls;
  const eventCall = calls.find((call) => call[0] === eventName);

  expect(eventCall).toBeDefined();

  if (payload !== undefined) {
    expect(eventCall[1]).toMatchObject(payload);
  }
};

/**
 * Helper para verificar quantas vezes um evento foi emitido
 */
export const getEventEmitCount = (
  eventEmitterMock: jest.Mocked<EventEmitter2>,
  eventName: string,
): number => {
  const calls = (eventEmitterMock.emit as jest.Mock).mock.calls;
  return calls.filter((call) => call[0] === eventName).length;
};

/**
 * Helper para resetar o mock do EventEmitter
 */
export const resetEventEmitterMock = (
  eventEmitterMock: jest.Mocked<EventEmitter2>,
): void => {
  (eventEmitterMock.emit as jest.Mock).mockReset();
  (eventEmitterMock.emitAsync as jest.Mock).mockReset();
};
