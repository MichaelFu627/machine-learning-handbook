import type { ViewContext, LabView } from "./types";
import { regressionView } from "./regression";
import { logisticView } from "./logistic";
import { clusteringView } from "./clustering";
import { gradientView } from "./gradient";
import { regularizationView } from "./regularization";
import { classifierView } from "./classifier";
import { mixtureView } from "./mixture";
import { samplingView } from "./sampling";
export function getLabView(context: ViewContext): LabView {
  const renderer: Record<string, (c: ViewContext) => LabView> = {
    "linear-regression": regressionView,
    "logistic-regression": logisticView,
    "k-means": clusteringView,
    "gradient-descent": gradientView,
    regularization: regularizationView,
    "naive-bayes": classifierView,
    svm: classifierView,
    "decision-trees": classifierView,
    bagging: classifierView,
    "random-forests": classifierView,
    "expectation-maximization": mixtureView,
    mcmc: samplingView,
  };
  return renderer[context.slug]?.(context) ?? {};
}
