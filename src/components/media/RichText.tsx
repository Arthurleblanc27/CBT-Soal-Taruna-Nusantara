import { useEffect, useRef } from 'preact/hooks';

declare global {
  interface Window {
    renderMathInElement?: (el: HTMLElement, opts: Record<string, unknown>) => void;
    katex?: unknown;
  }
}

/**
 * Render teks dengan dukungan KaTeX ($...$ dan $$...$$).
 * Dipakai untuk stem soal, pilihan, dan pembahasan.
 */
export default function RichText({
  text,
  class: cls = '',
  as = 'div',
}: {
  text: string;
  class?: string;
  as?: 'div' | 'span' | 'p';
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.renderMathInElement) return;
    window.renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
      throwOnError: false,
      strict: false,
    });
  }, [text]);

  const Tag = as as any;
  return (
    <Tag ref={ref} class={cls} dangerouslySetInnerHTML={{ __html: escapeHtml(text) }} />
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}
