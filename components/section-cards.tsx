import MetricCard, { MetricCardProps } from '@/components/MetricCard'

// Sample data and usage
const sampleMetrics: MetricCardProps[] = [
  {
    title: 'Total Revenue',
    value: '$1,250.00',
    description: 'Total Revenue',
    trend: {
      direction: 'up',
      percentage: '+12.5%',
      label: 'Trending up this month',
    },
    footer: {
      summary: 'Trending up this month',
      details: 'Visitors for the last 6 months',
    },
  },
  {
    title: 'New Customers',
    value: '1,234',
    description: 'New Customers',
    trend: {
      direction: 'down',
      percentage: '-20%',
      label: 'Down 20% this period',
    },
    footer: {
      summary: 'Down 20% this period',
      details: 'Acquisition needs attention',
    },
  },
  {
    title: 'Active Accounts',
    value: '45,678',
    description: 'Active Accounts',
    trend: {
      direction: 'up',
      percentage: '+12.5%',
      label: 'Strong user retention',
    },
    footer: {
      summary: 'Strong user retention',
      details: 'Engagement exceed targets',
    },
  },
  {
    title: 'Growth Rate',
    value: '4.5%',
    description: 'Growth Rate',
    trend: {
      direction: 'up',
      percentage: '+4.5%',
      label: 'Steady performance increase',
    },
    footer: {
      summary: 'Steady performance increase',
      details: 'Meets growth projections',
    },
  },
]

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {sampleMetrics.map((card, index) => (
        <MetricCard key={index} data={card} />
      ))}
    </div>
  )
}
