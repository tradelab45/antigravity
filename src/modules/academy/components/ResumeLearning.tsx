import React from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { INITIAL_LESSONS } from '../data/lessonsData';
import { localizeLesson } from '../data/hindiLessons';
import { readResume } from '../utils/academyProgress';
import { useAccessibility } from '../../../context/AccessibilityContext';

export function ResumeLearning({ userId, onResume }: { userId?: string; onResume: () => void }) {
  const { settings } = useAccessibility();
  const resume = readResume(userId);
  const lesson = resume && INITIAL_LESSONS.find(item => item.id === resume.lessonId);
  if (!resume || !lesson) return null;
  const hindi = settings.learningLanguage === 'HINDI';
  const url = new URL(window.location.href);
  url.searchParams.set('view', 'academy');
  url.searchParams.set('lesson', resume.lessonId);
  url.searchParams.set('stage', resume.stage.id);
  return <section className="flex flex-wrap items-center justify-between gap-4 border-y border-emerald-200 py-4 dark:border-emerald-800" aria-label="Resume learning">
    <div className="min-w-0 flex-1"><p className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300"><BookOpen size={16} /> {hindi ? 'जहाँ छोड़ा था, वहीं से शुरू करें' : 'Resume learning'} · {hindi ? 'चरण' : 'Stage'} {resume.stageNumber}: {resume.stage.name}</p><h2 className="mt-1 break-words text-base font-bold">{localizeLesson(lesson, settings.learningLanguage).title}</h2></div>
    <a href={`${url.pathname}${url.search}`} onClick={event => { event.preventDefault(); window.history.replaceState({}, '', url); onResume(); }} className="flex shrink-0 items-center gap-2 rounded bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white">{hindi ? 'जारी रखें' : 'Continue'} <ArrowRight size={16} /></a>
  </section>;
}
