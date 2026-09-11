export const STAGE_IDS = [
  "quarks",
  "nuclei",
  "atoms",
  "molecules",
  "stars",
  "galaxy",
  "sun",
  "planets",
] as const;

export type StageId = (typeof STAGE_IDS)[number];

export type Stage = {
  id: StageId;
  label: string;
  era: string;
  caption: string;
};

export const STAGES: readonly Stage[] = [
  {
    id: "quarks",
    label: "Quarks",
    era: "Heißes Plasma",
    caption:
      "Kurz nach dem Anfang ist alles heiß und dicht. Quarks und Gluonen bilden ein leuchtendes Plasma — noch keine Atome, nur Bewegung und Licht.",
  },
  {
    id: "nuclei",
    label: "Kerne",
    era: "Die ersten Minuten",
    caption:
      "Die Suppe kühlt ab. Protonen und Neutronen finden sich. Es entstehen die ersten leichten Kerne: vor allem Wasserstoff und Helium.",
  },
  {
    id: "atoms",
    label: "Atome",
    era: "Das All wird klar",
    caption:
      "Elektronen binden sich an die Kerne. Das Universum wird durchsichtig. Das Nachglühen sehen wir heute als Mikrowellenhintergrund.",
  },
  {
    id: "molecules",
    label: "Moleküle",
    era: "Gas und Staub",
    caption:
      "Gas sammelt sich in kalten Wolken. Atome werden zu Molekülen, Staub und Nebel nehmen Form an — der Rohstoff für Sterne.",
  },
  {
    id: "stars",
    label: "Erste Sterne",
    era: "Licht geht an",
    caption:
      "In den dichtesten Wolken stürzt Materie in sich zusammen. Die ersten Sterne zünden und durchbrechen die Dunkelheit.",
  },
  {
    id: "galaxy",
    label: "Milchstraße",
    era: "Unsere Galaxie",
    caption:
      "Milliarden Sterne ordnen sich zur Milchstraße. Unsere Galaxie steht schon, lange bevor die Sonne existiert.",
  },
  {
    id: "sun",
    label: "Sonne",
    era: "Ein Stern zündet",
    caption:
      "In einem Arm der Milchstraße verdichtet sich eine Gaswolke. Unsere Sonne zündet — ein ganz normaler Stern, unserer.",
  },
  {
    id: "planets",
    label: "Planeten",
    era: "Eine Scheibe wird Welt",
    caption:
      "Um die junge Sonne kreist eine Scheibe aus Staub und Gas. Klumpen wachsen, Bahnen klären sich — Planeten entstehen.",
  },
];

export const STAGE_COUNT = STAGES.length;
