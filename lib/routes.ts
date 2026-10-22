/** URL builders shared by server and client code. Keep this file dependency-free. */

export function moduleHref(mod: { slug: string }) {
  return `/modules/${mod.slug}/`;
}

export function lessonHref(mod: { slug: string }, lesson: { slug: string }) {
  return `/modules/${mod.slug}/${lesson.slug}/`;
}
