import jexl from "jexl";

import type { Evaluator as IEvaluator } from "./Evaluator.interface";
import type { EvaluatorContext } from "./EvaluatorContext.type";

export function Evaluator(context: EvaluatorContext = {}): IEvaluator {
  function evaluate<T>(expression: string): Promise<T> {
    return jexl.eval(expression, context);
  }

  function evaluateSync<T>(expression: string): T {
    try {
      return jexl.evalSync(expression, context);
    } catch (e) {
      throw new Error(`Error while parsing expression "${expression}": "${e.message}"`);
    }
  }

  return Object.freeze({
    evaluate: evaluate,
    evaluateSync: evaluateSync,
  });
}
