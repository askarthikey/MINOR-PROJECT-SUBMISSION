'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import QuestionAdminList from './Questions/QuestionAdminList';
import TopicAdminList from './Topics/TopicAdminList';
import { TopicAdminList as WidgetAdminList } from './Widgets/WidgetAdminList';

enum AdminPanelTab {
  topics = 'topics',
  widgets = 'widgets',
  questions = 'questions',
}

export default function AdminPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParameters = useSearchParams();

  const getCurrentTab = () => {
    const tabParameter = searchParameters.get('tab');

    const validTab = Object.values(AdminPanelTab).find((tab) => tab === tabParameter);

    return validTab ?? AdminPanelTab.topics;
  };

  const currentTab = getCurrentTab();

  const handleTabChange = (value: string) => {
    const parameters = new URLSearchParams();
    parameters.set('tab', value);
    router.push(`${pathname}?${parameters.toString()}`);
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <div className="mx-auto w-full max-w-640 px-4 sm:px-6 lg:px-8">
        <TabsList variant="line" className="mx-auto mb-6 h-7 w-full justify-start border-b border-neutral-300 p-1">
          {Object.values(AdminPanelTab).map((tab) => (
            <TabsTrigger value={tab} key={tab} className="capitalize">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="mx-auto w-full max-w-480 px-4 sm:px-6 lg:px-8">
        <TabsContent value="topics">
          <TopicAdminList />
        </TabsContent>

        <TabsContent value="widgets">
          <WidgetAdminList />
        </TabsContent>

        <TabsContent value="questions">
          <QuestionAdminList />
        </TabsContent>
      </div>
    </Tabs>
  );
}
