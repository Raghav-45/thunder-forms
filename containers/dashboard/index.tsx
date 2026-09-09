'use client'

import { ChartAreaInteractive } from './components/chart-area-interactive'
import { SectionCards } from './components/section-cards'
import { FormTable } from './forms/components/form-table'
import { useForms } from './forms/hooks/use-forms'

export default function Dashboard() {
  const { forms, isLoading } = useForms()

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <FormTable data={forms} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
