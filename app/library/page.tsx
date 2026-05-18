import LibraryContent from '@/app/library/library-content';
import { getTopicsOverview } from '@/data/trainer.api';

export default async function Page() {
  let recentTopics;
  let pageTopics;
  let recentTopicsError;
  let pageTopicsError;

  try {
    ({
      recentTopics,
      topicsPage: pageTopics,
      recentTopicsError,
      topicsPageError: pageTopicsError,
    } = await getTopicsOverview());

    if (recentTopicsError != undefined || pageTopicsError != undefined) {
      console.log(recentTopicsError);
      console.log(pageTopicsError);
    }
  } catch (error) {
    return <>Something went wrong while fetching topics. {`${error}`}</>;
  }

  if (pageTopics == undefined) {
    return <>Something went wrong while fetching topics.</>;
  }

  return (
    <LibraryContent recentTopics={recentTopics ?? []} topicsPage={pageTopics} paginationMode="scroll"></LibraryContent>
  );
}
