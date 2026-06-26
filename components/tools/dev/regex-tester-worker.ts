import { processRegexTester, type RegexTesterResult, type RegexTesterState } from "@/lib/tools/regex";

interface RegexTesterWorkerRequest {
  id: number;
  state: RegexTesterState;
}

interface RegexTesterWorkerResponse {
  id: number;
  result: RegexTesterResult;
}

self.addEventListener("message", (event: MessageEvent<RegexTesterWorkerRequest>) => {
  const { id, state } = event.data;
  const result = processRegexTester(state);

  self.postMessage({ id, result } satisfies RegexTesterWorkerResponse);
});

export {};
