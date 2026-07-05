import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { PagePanelProps } from './PdfPagePicker';

const PagePicker = lazy(() => import('./PdfPagePicker').then((m) => ({ default: m.PdfPagePicker })));

interface PanelEntry {
  component: LazyExoticComponent<ComponentType<PagePanelProps>>;
  optionKey: string;
  mode: PagePanelProps['mode'];
}

/**
 * Tool-specific panels shown inside ToolShell's ready phase. Lazy so heavy
 * dependencies (pdfjs) only load on tools that use them. The panel writes into
 * the tool's matching text option, keeping thumbnails and typed input in sync.
 */
export const toolPanels: Record<string, PanelEntry> = {
  'reorder-pdf': { component: PagePicker, optionKey: 'order', mode: 'reorder' },
  'extract-pdf': { component: PagePicker, optionKey: 'pages', mode: 'select' },
  'delete-pdf': { component: PagePicker, optionKey: 'pages', mode: 'select' },
  'rotate-pdf': { component: PagePicker, optionKey: 'pages', mode: 'select' },
  'crop-pdf': { component: PagePicker, optionKey: 'pages', mode: 'select' },
};
