import { useState } from 'react';

export type AppView = 'table' | 'kanban' | 'analytics' | 'archived';

export function useViewRouter(initial: AppView = 'table') {
  const [view, setView] = useState<AppView>(initial);
  return { view, setView };
}
