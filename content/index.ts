import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Category, Lesson, Module, ModuleInput } from './types.ts';
import { lessonHref } from '../lib/routes.ts';
import javaOop from './modules/01-java-oop.ts';
import solid from './modules/02-solid.ts';
import springBoot from './modules/03-spring-boot.ts';
import restApi from './modules/04-rest-api.ts';
import data from './modules/05-data.ts';
import testingSecurity from './modules/06-testing-security.ts';
import boundaries from './modules/07-boundaries.ts';
import resilience from './modules/08-resilience.ts';
import observability from './modules/09-observability.ts';
import containers from './modules/10-containers.ts';
import openshift from './modules/11-openshift.ts';
import capstone from './modules/12-capstone.ts';

export { sources, getSource } from './sources.ts';
export { lessonHref, moduleHref } from '../lib/routes.ts';
export type * from './types.ts';

const inputs: ModuleInput[] = [
  javaOop,
  solid,
  springBoot,
  restApi,
  data,
  testingSecurity,
  boundaries,
  resilience,
  observability,
  containers,
  openshift,
  capstone,
];

/**
 * Lesson ids (`m1-1`) are stable storage keys and must not change when titles
 * or slugs are edited, otherwise saved progress would be orphaned.
 */
export const modules: Module[] = inputs.map((m, i) => ({
  ...m,
  id: `m${i + 1}`,
  number: i + 1,
  lessons: m.lessons.map((l, j) => ({ ...l, id: `m${i + 1}-${j + 1}` })),
}));

export const lessons: Lesson[] = modules.flatMap((m) => m.lessons);

export const categories: Category[] = ['Fondasi', 'Spring Boot', 'Microservices', 'Operasional', 'Proyek akhir'];

export function getModule(slug: string): Module | undefined {
  return modules.find((m) => m.slug === slug);
}

export function getLesson(moduleSlug: string, lessonSlug: string) {
  const mod = getModule(moduleSlug);
  const lesson = mod?.lessons.find((l) => l.slug === lessonSlug);
  return mod && lesson ? { module: mod, lesson } : undefined;
}

export function findLessonById(id: string) {
  for (const mod of modules) {
    const lesson = mod.lessons.find((l) => l.id === id);
    if (lesson) return { module: mod, lesson };
  }
  return undefined;
}

/**
 * Lesson prose, read from disk at build time. Server-only: never import this
 * module from a Client Component.
 */
export function getLessonBody(mod: Pick<Module, 'slug'>, lesson: Pick<Lesson, 'slug'>) {
  return readFileSync(join(process.cwd(), 'content', 'lessons', mod.slug, `${lesson.slug}.md`), 'utf8');
}

/** Previous and next lesson across module boundaries, in curriculum order. */
export function getNeighbours(lessonId: string) {
  const index = lessons.findIndex((l) => l.id === lessonId);
  const pick = (i: number) => (i >= 0 && i < lessons.length ? findLessonById(lessons[i].id) : undefined);
  return { prev: pick(index - 1), next: pick(index + 1) };
}

/** Small, serialisable index for client-side search. */
export function buildSearchIndex() {
  return modules.flatMap((m) => [
    { kind: 'module' as const, title: m.title, context: `Modul ${m.number} · ${m.category}`, text: `${m.subtitle} ${m.description}`, href: `/modules/${m.slug}/` },
    ...m.lessons.map((l) => ({
      kind: 'lesson' as const,
      title: l.title,
      context: `Modul ${m.number} · ${m.title}`,
      text: `${l.summary} ${l.keyPoints.join(' ')}`,
      href: lessonHref(m, l),
    })),
  ]);
}

export type SearchEntry = ReturnType<typeof buildSearchIndex>[number];

/** Ids only: enough for client components to compute progress without shipping lesson bodies. */
export function getModuleRefs() {
  return modules.map((m) => ({ id: m.id, lessons: m.lessons.map((l) => ({ id: l.id, exerciseIds: l.exercises.map((e) => e.id) })) }));
}

/** Lightweight module + lesson summaries for client widgets (dashboard, sidebar). */
export function getOutline() {
  return modules.map((m) => ({
    id: m.id,
    slug: m.slug,
    number: m.number,
    title: m.title,
    subtitle: m.subtitle,
    category: m.category,
    hours: m.hours,
    tint: m.tint,
    icon: m.icon,
    lessons: m.lessons.map((l) => ({ id: l.id, slug: l.slug, title: l.title, minutes: l.minutes, exerciseIds: l.exercises.map((e) => e.id) })),
  }));
}

export type Outline = ReturnType<typeof getOutline>;
export type OutlineModule = Outline[number];
