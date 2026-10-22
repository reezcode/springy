/**
 * Content model for Springpath.
 *
 * Everything in this file must stay JSON-serialisable, because lesson data is
 * passed from Server Components to Client Components (e.g. exercises).
 * That is why regex checks are stored as strings instead of RegExp objects.
 */

export type Category = 'Fondasi' | 'Spring Boot' | 'Microservices' | 'Operasional' | 'Proyek akhir';

export type Tint = 'peach' | 'lavender' | 'mint' | 'blue' | 'yellow';

export type IconName =
  | 'coffee'
  | 'shapes'
  | 'leaf'
  | 'braces'
  | 'database'
  | 'shield'
  | 'network'
  | 'activity'
  | 'chart'
  | 'box'
  | 'layers'
  | 'rocket';

export type Source = {
  id: string;
  title: string;
  publisher: string;
  url: string;
};

/** A citation attached to a lesson. `note` explains what to read there. */
export type Reference = { source: string; note?: string };

export type ChoiceExercise = {
  kind: 'choice';
  id: string;
  prompt: string;
  /** When true, more than one option can be correct and all must be selected. */
  multiple?: boolean;
  options: { text: string; correct?: boolean; why?: string }[];
  explanation: string;
};

export type FillExercise = {
  kind: 'fill';
  id: string;
  prompt: string;
  /** Optional code/context shown above the input. Use `___` to mark the blank. */
  context?: string;
  /** Accepted answers. Compared case-insensitively with whitespace collapsed. */
  answers: string[];
  placeholder?: string;
  hint?: string;
  explanation: string;
};

export type CodeCheck = {
  label: string;
  /** JavaScript regex source, evaluated against code with comments stripped. */
  pattern: string;
  flags?: string;
  /** When true, the check passes only if the pattern is NOT found. */
  absent?: boolean;
  hint: string;
};

export type CodeExercise = {
  kind: 'code';
  id: string;
  prompt: string;
  language: 'java' | 'yaml' | 'dockerfile' | 'shell' | 'text';
  starter: string;
  /** Reference solution. Tests assert it passes every check and the starter does not. */
  solution: string;
  checks: CodeCheck[];
  explanation: string;
};

export type OrderExercise = {
  kind: 'order';
  id: string;
  prompt: string;
  /** Items in the CORRECT order. The UI shuffles them deterministically. */
  items: string[];
  explanation: string;
};

export type Exercise = ChoiceExercise | FillExercise | CodeExercise | OrderExercise;

/**
 * Lesson metadata and exercises. The prose body lives in
 * content/lessons/<module-slug>/<lesson-slug>.md and is read at build time
 * (see getLessonBody in content/index.ts).
 */
export type Lesson = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  objectives: string[];
  keyPoints: string[];
  practice: { task: string; proof: string };
  refs: Reference[];
  exercises: Exercise[];
};

export type Module = {
  id: string;
  slug: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  category: Category;
  hours: string;
  tint: Tint;
  icon: IconName;
  lessons: Lesson[];
};

/** Authoring shape: ids and numbers are derived in content/index.ts. */
export type LessonInput = Omit<Lesson, 'id'>;
export type ModuleInput = Omit<Module, 'id' | 'number' | 'lessons'> & { lessons: LessonInput[] };
