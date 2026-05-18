import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function WidgetListSkeleton() {
  const skeletonItems = Array.from({ length: 5 }, (_, index) => index);

  return (
    <>
      <section className="space-y-2 pb-6">
        <h1 className="text-muted-foreground/50 text-2xl font-semibold tracking-tight blur-[3px] select-none">
          Lorem ipsum dolor sit amet
        </h1>
      </section>
      <section className="pt-10">
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skeletonItems.map((item) => (
            <li key={item} className="overflow-visible">
              <Card className="group hover:ring-primary/40 hover:ring-offset-background border-secondary/50 flex cursor-pointer flex-row items-center gap-4 px-4 py-2 transition-all duration-300 ease-out hover:shadow-lg hover:ring-2 hover:ring-offset-2">
                <Skeleton className="bg-muted/60 h-17 w-24 rounded-xl" />

                <CardHeader className="w-full px-0 py-2">
                  <CardTitle className="group-hover:text-primary text-lg font-semibold tracking-tight transition-colors">
                    <p className="text-muted-foreground/60 text-xs blur-[3px] select-none">Lorem ipsum</p>
                  </CardTitle>

                  <CardDescription className="line-clamp-2 min-h-10 text-sm">
                    <p className="text-muted-foreground/60 text-xs blur-[3px] select-none">
                      Lorem ipsum dolor sit amet consectetur adipiscing elit
                    </p>
                    <p className="text-muted-foreground/60 w-4/5 text-xs blur-[3px] select-none">
                      sed do eiusmod tempor incididunt ut labore
                    </p>
                  </CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
