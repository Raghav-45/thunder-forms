'use client'

import { ChartBarInteractive } from './impressions-chart'
import {
  BrowserRadialChart,
  OSRadialChart,
  DeviceRadialChart,
} from './breakdown-charts'

export default function FormAnalyticsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <ChartBarInteractive />
          </div>

          {/* Visitor Analytics Section */}
          <div className="px-4 lg:px-6">
            <h2 className="text-2xl font-bold tracking-tight mb-6">
              Visitor Analytics
            </h2>

            {/* Top row - 3 equal columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <BrowserRadialChart />
              <OSRadialChart />
              <DeviceRadialChart />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
