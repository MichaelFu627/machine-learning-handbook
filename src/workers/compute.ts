import { compute } from "../lib/engine";
self.onmessage = ({ data }) => {
  try {
    self.postMessage({
      id: data.id,
      result: compute(data.algorithm, data.points, data.params),
    });
  } catch (error) {
    self.postMessage({
      id: data.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
