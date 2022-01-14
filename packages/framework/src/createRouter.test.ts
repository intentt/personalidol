import { MessageChannel } from "worker_threads";

import { createRouter } from "./createRouter";

test("attaches router to the message channel", function (done) {
  const messageChannel = new MessageChannel();
  const messageRouter = createRouter({
    test(foo: string) {
      expect(foo).toBe("bar");
      done();
    },
  });

  // @ts-ignore .onmessage do exists on MessagePort
  messageChannel.port1.onmessage = messageRouter;
  messageChannel.port2.postMessage({
    test: "bar",
  });
});

test("fails when event is not defined", function (done) {
  const messageChannel = new MessageChannel();
  const messageRouter = createRouter({});

  // @ts-ignore .onmessage do exists on MessagePort
  messageChannel.port1.onmessage = messageRouter;
  messageChannel.port2.postMessage({
    test: "bar",
  });
});
