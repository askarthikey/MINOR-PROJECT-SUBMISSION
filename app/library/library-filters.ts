'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDeferredValue, useEffect, useState } from 'react';

import { LevelFilter, toLevelFilter, TopicOverview } from '@/types/schemas/topic-schema';
import { toWidgetFilter, WidgetFilter } from '@/types/widget';

const SEARCH_DEBOUNCE_MS = 300;

export type LibraryFilters = {
  widgetFilter: WidgetFilter;
  levelFilter: LevelFilter;
  searchQuery: string;
};

export function useLibraryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParameters = useSearchParams();

  const widgetFilter = toWidgetFilter(searchParameters.get('widgetType') ?? undefined) ?? 'all';
  const levelFilter = toLevelFilter(searchParameters.get('level') ?? undefined) ?? 'all';
  const searchQuery = searchParameters.get('q') ?? '';
  const [searchInputValue, setSearchInputValue] = useState(searchQuery);
  const deferredSearchQuery = useDeferredValue(searchInputValue);

  useEffect(() => {
    setSearchInputValue(searchQuery);
  }, [searchQuery]);

  const updateSearchParameters = (updates: {
    widgetFilter?: WidgetFilter;
    levelFilter?: LevelFilter;
    searchQuery?: string;
  }) => {
    const nextSearchParameters = new URLSearchParams(searchParameters.toString());

    if (updates.widgetFilter !== undefined) {
      if (updates.widgetFilter === 'all') {
        nextSearchParameters.delete('widgetType');
      } else {
        nextSearchParameters.set('widgetType', updates.widgetFilter);
      }
    }

    if (updates.levelFilter !== undefined) {
      if (updates.levelFilter === 'all') {
        nextSearchParameters.delete('level');
      } else {
        nextSearchParameters.set('level', updates.levelFilter);
      }
    }

    if (updates.searchQuery !== undefined) {
      const normalizedQuery = updates.searchQuery.trim();

      if (normalizedQuery.length === 0) {
        nextSearchParameters.delete('q');
      } else {
        nextSearchParameters.set('q', normalizedQuery);
      }
    }

    const query = nextSearchParameters.toString();
    router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  useEffect(() => {
    if (searchInputValue === searchQuery) return;

    const timeoutId = globalThis.setTimeout(() => {
      updateSearchParameters({ searchQuery: searchInputValue });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [searchInputValue, searchQuery]);

  return {
    filters: {
      widgetFilter,
      levelFilter,
      searchQuery: deferredSearchQuery,
    },
    searchInputValue,
    setSearchInputValue,
    setWidgetFilter: (value: WidgetFilter) => updateSearchParameters({ widgetFilter: value }),
    setLevelFilter: (value: LevelFilter) => updateSearchParameters({ levelFilter: value }),
    hasActiveFilters: widgetFilter !== 'all' || levelFilter !== 'all' || deferredSearchQuery.trim().length > 0,
  };
}

export function filterTopics(topics: TopicOverview[], filters: LibraryFilters) {
  return topics.filter((topic) => topicMatchesLibraryFilters(topic, filters));
}

export function topicMatchesLibraryFilters(topic: TopicOverview, filters: LibraryFilters) {
  const normalizedQuery = filters.searchQuery.trim().toLocaleLowerCase();

  if (!topicMatchesWidgetFilter(topic, filters.widgetFilter)) {
    return false;
  }

  if (filters.levelFilter !== 'all' && topic.level !== filters.levelFilter) {
    return false;
  }

  if (normalizedQuery.length === 0) {
    return true;
  }

  return Object.values(topic.name).some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
}

function topicMatchesWidgetFilter(topic: TopicOverview, filter: WidgetFilter) {
  if (filter === 'all') return true;

  return topic.widgets.some((widget) => widget.type === filter);
}
