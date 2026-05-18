'use client';

import { LoaderIcon } from 'lucide-react';
import { useRef, useState, useTransition } from 'react';

import { getLibraryTopicsPageAction } from '@/app/library/actions';
import { filterTopics, useLibraryFilters } from '@/app/library/library-filters';
import { TopicList } from '@/components/library/TopicsList';
import { WidgetTopicFilter } from '@/components/library/WidgetTopicFilter';
import Pagination, { type PaginationMode } from '@/components/Pagination';
import { useTranslation } from '@/hooks/use-translation';
import { PaginatedResult } from '@/types/pagination';
import { TopicOverview } from '@/types/schemas/topic-schema';

type Properties = {
  recentTopics: TopicOverview[];
  topicsPage: PaginatedResult<TopicOverview, 'Topic'>;
  paginationMode?: PaginationMode;
};

export default function LibraryContent({ recentTopics, topicsPage, paginationMode = 'buttons' }: Properties) {
  const { t } = useTranslation();
  const [pageTopics, setPageTopics] = useState(topicsPage.items);
  const [currentPage, setCurrentPage] = useState(topicsPage.page);
  const [totalPages, setTotalPages] = useState(topicsPage.totalPages);
  const [isPending, startTransition] = useTransition();
  const requestedPageReference = useRef<number | undefined>(undefined);
  const isScrollMode = paginationMode === 'scroll';
  const { filters, searchInputValue, setSearchInputValue, setWidgetFilter, setLevelFilter, hasActiveFilters } =
    useLibraryFilters();

  const filteredRecentTopics = filterTopics(recentTopics, filters);
  const filteredPageTopics = filterTopics(pageTopics, filters);
  const hasRecentTopics = filteredRecentTopics.length > 0;
  const topicsTitleCode = hasRecentTopics ? 'library.section.explore' : 'library.section.start';
  const recentTopicIds = recentTopics.map((topic) => topic.id);

  const requestPage = (page: number, mode: PaginationMode) => {
    if (page === currentPage || page < 1 || page > totalPages) return;
    if (requestedPageReference.current === page) return;

    requestedPageReference.current = page;

    startTransition(async () => {
      try {
        const data = await getLibraryTopicsPageAction(page, recentTopicIds);

        if ('error' in data) {
          return;
        }

        setPageTopics((previousTopics) => {
          if (mode === 'scroll') {
            return [...previousTopics, ...data.items];
          }

          return data.items;
        });
        setCurrentPage(data.page);
        setTotalPages(data.totalPages);
      } finally {
        requestedPageReference.current = undefined;
      }
    });
  };

  return (
    <main className="text-foreground py-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6">
        <section className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">{t('library.title')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('library.description')}</p>
        </section>

        <WidgetTopicFilter
          widgetFilter={filters.widgetFilter}
          levelFilter={filters.levelFilter}
          searchQuery={searchInputValue}
          onWidgetFilterChange={setWidgetFilter}
          onLevelFilterChange={setLevelFilter}
          onSearchQueryChange={setSearchInputValue}
        />
        {filteredRecentTopics.length > 0 && (
          <TopicList title={t('library.section.continue')} topics={recentTopics} displayProgressBar={true} />
        )}
        <section className="relative space-y-6">
          {filteredPageTopics.length > 0 && <TopicList title={t(topicsTitleCode)} topics={filteredPageTopics} />}
          {filteredRecentTopics.length === 0 && filteredPageTopics.length === 0 && (
            <div className="border-border bg-card rounded-2xl border border-dashed px-6 py-10 text-center">
              <p className="text-lg font-semibold">{t('library.empty.title')}</p>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                {hasActiveFilters ? t('library.empty.description.filtered') : t('library.empty.description.default')}
              </p>
            </div>
          )}
          {!isScrollMode && isPending && (
            <div className="bg-background/70 absolute inset-0 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
              <LoaderIcon className="text-muted-foreground size-6 animate-spin" aria-label="Loading topics" />
            </div>
          )}
        </section>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={requestPage}
          isLoading={isPending}
          mode={paginationMode}
          loadingLabel={t('library.loadingMore')}
        />
      </section>
    </main>
  );
}
