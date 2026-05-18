import { ArrowDownNarrowWide, CircleHelp, FileCode2, LayoutGrid, Repeat2, Scale, TrendingUp } from 'lucide-react';

import { AllWidget, Widget } from '@/types/schemas/widget-schema';
import { WidgetType } from '@/types/widget';

const ICON_CLASSNAME = 'text-foreground h-9 w-9';

export function getWidgetIcon(type: Widget['type'] | AllWidget['type']) {
  switch (type) {
    case WidgetType.Quiz: {
      return <CircleHelp className={ICON_CLASSNAME} aria-hidden="true" />;
    }
    case WidgetType.CodeCompletion: {
      return <FileCode2 className={ICON_CLASSNAME} aria-hidden="true" />;
    }
    case WidgetType.TrueFalse: {
      return <Scale className={ICON_CLASSNAME} aria-hidden="true" />;
    }
    case WidgetType.FlipCard: {
      return <Repeat2 className={ICON_CLASSNAME} aria-hidden="true" />;
    }
    case WidgetType.BigONotation: {
      return <TrendingUp className={ICON_CLASSNAME} aria-hidden="true" />;
    }
    case WidgetType.CodeOrdering: {
      return <ArrowDownNarrowWide className={ICON_CLASSNAME} aria-hidden="true" />;
    }
    case 'all': {
      return <LayoutGrid className={ICON_CLASSNAME} aria-hidden="true" />;
    }
    default: {
      return <CircleHelp className={ICON_CLASSNAME} aria-hidden="true" />;
    }
  }
}
