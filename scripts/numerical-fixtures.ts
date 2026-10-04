import {
  regressionData,
  ols,
  classificationData,
  logistic,
  clusterData,
  kmeans,
} from "../src/lib/engine";
const regression = regressionData(17, 1.4);
const classification = classificationData(13, 1.3);
const clustering = clusterData(19);
console.log(
  JSON.stringify({
    regression: { points: regression, fit: ols(regression) },
    classification: {
      points: classification,
      fit: logistic(classification, 0.2),
      lambda: 0.2,
    },
    clustering: { points: clustering, history: kmeans(clustering, 3, 19) },
  }),
);
