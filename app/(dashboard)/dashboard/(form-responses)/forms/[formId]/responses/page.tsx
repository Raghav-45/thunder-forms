'use client'

import FormResponseViewerCard from '@/components/FormResponseViewerCard'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'


export default function FormResponsesPage() {
  // const { formId } = useParams()

  // if (isLoading) {
  //   return <Loading />
  // }

  return (
    <Tabs defaultValue="all" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">
            Active <Badge variant="secondary">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft <Badge variant="secondary">2</Badge>
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived <Badge variant="secondary">5</Badge>
          </TabsTrigger>
        </TabsList>
      </div>
      <div className="grid grid-cols-10 grid-rows-1 px-4 lg:px-6 gap-6">
        <div className="h-full w-full flex-1 col-span-7">
          <TabsContent value="all" className="flex flex-col">
            <div className="aspect-video w-full flex-1 rounded-lg border border-dashed">all</div>
          </TabsContent>
          <TabsContent value="active" className="flex flex-col">
            <div className="aspect-video w-full flex-1 rounded-lg border border-dashed">active</div>
          </TabsContent>
          <TabsContent value="draft" className="flex flex-col">
            <div className="aspect-video w-full flex-1 rounded-lg border border-dashed">draft</div>
          </TabsContent>
          <TabsContent value="archived" className="flex flex-col">
            <div className="aspect-video w-full flex-1 rounded-lg border border-dashed">archived</div>
          </TabsContent>
        </div>
        <div className="h-full w-full flex-1 col-span-3">
          <FormResponseViewerCard />
        </div>
      </div>
    </Tabs>
  )
}