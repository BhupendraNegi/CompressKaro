import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { PagePanelProps } from './PdfPagePicker';

/**
 * Tool-specific panels shown inside ToolShell's ready phase. Lazy so heavy
 * dependencies (pdfjs) only load on tools that use them.
 */
export const toolPanels: Record<string, { component: LazyExoticComponent<ComponentType<PagePanelProps>>; optionKey: string }> = {
  'reorder-pdf': {
    component: lazy(() => import('./PdfPagePicker').then((m) => ({ default: m.PdfPagePicker }))),
    optionKey: 'order',
  },
};
