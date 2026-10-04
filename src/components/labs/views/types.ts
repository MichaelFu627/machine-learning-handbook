import type { Locale } from "@/lib/catalog";
import type { Point, gradient } from "@/lib/engine";
import type { Settings, RemoteResult } from "../state";
export type LabView = {
  visual?: React.ReactNode;
  metrics?: React.ReactNode;
  detail?: React.ReactNode;
};
export type ViewContext = {
  slug: string;
  locale: Locale;
  settings: Settings;
  points: Point[];
  local: unknown;
  remote: RemoteResult | null;
  gd: ReturnType<typeof gradient>;
  currentStep: number;
  residuals: boolean;
  setResiduals: (v: boolean) => void;
  move: (i: number, p: Point) => void;
};
