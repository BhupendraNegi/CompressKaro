import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { OptionValues } from '../../tools/types';

/** Every tool panel receives the first file and read/write access to the option values. */
export interface PanelBaseProps {
  file: File;
  values: OptionValues;
  onChange: (key: string, value: string | number) => void;
}

interface PanelEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: LazyExoticComponent<ComponentType<any>>;
  /** Extra static props for the component (e.g. picker mode/optionKey) */
  props?: Record<string, unknown>;
}

const PagePicker = lazy(() => import('./PdfPagePicker').then((m) => ({ default: m.PdfPagePicker })));
const SignPanel = lazy(() => import('./SignPanel').then((m) => ({ default: m.SignPanel })));
const AnnotatePanel = lazy(() => import('./AnnotatePanel').then((m) => ({ default: m.AnnotatePanel })));

/**
 * Tool-specific panels shown inside ToolShell's ready phase. Lazy so heavy
 * dependencies (pdfjs) only load on tools that use them.
 */
export const toolPanels: Record<string, PanelEntry> = {
  'reorder-pdf': { component: PagePicker, props: { optionKey: 'order', mode: 'reorder' } },
  'extract-pdf': { component: PagePicker, props: { optionKey: 'pages', mode: 'select' } },
  'delete-pdf': { component: PagePicker, props: { optionKey: 'pages', mode: 'select' } },
  'rotate-pdf': { component: PagePicker, props: { optionKey: 'pages', mode: 'select' } },
  'crop-pdf': { component: PagePicker, props: { optionKey: 'pages', mode: 'select' } },
  'sign-pdf': { component: SignPanel },
  'annotate-pdf': { component: AnnotatePanel },
};
