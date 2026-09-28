import { useState, useEffect, useCallback, useMemo } from 'react';
import { getApplicationsApi } from '../api';
import type { Application } from '../types';

export function useApplications(authenticated: boolean | null) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    try {
      const data = await getApplicationsApi();
      setApplications(data);
    } catch {
      // ignore network errors silently — user sees empty list
    } finally {
      setLoading(false);
    }
  }, [authenticated]);

  useEffect(() => {
    reload();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        reload();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [reload]);

  const filteredApplications = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return applications;
    return applications.filter(
      (app) =>
        app.company_name?.toLowerCase().includes(q) ||
        app.position_title?.toLowerCase().includes(q) ||
        app.notes?.toLowerCase().includes(q),
    );
  }, [applications, search]);

  return {
    applications: filteredApplications,
    rawCount: applications.length,
    search,
    setSearch,
    loading,
    reload,
  };
}
