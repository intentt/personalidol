import { MD2CharacterAnimations } from "src/framework/types/MD2CharacterAnimations";

export type MD2CharacterConfig = {
  readonly animations: MD2CharacterAnimations;
  readonly baseUrl: string;
  readonly body: string;
  readonly skins: ReadonlyArray<string>;
  readonly weapons: [string, string];
};