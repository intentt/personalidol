export interface Evaluator {
  evaluate<T>(expression: string): Promise<T>;

  evaluateSync<T>(expression: string): T;
}
