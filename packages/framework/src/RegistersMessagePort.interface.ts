export interface RegistersMessagePort {
  thread: "main" | "worker";

  registerMessagePort(messagePort: MessagePort): void;
}
