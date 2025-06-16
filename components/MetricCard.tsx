import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react'
import { FC } from 'react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export interface MetricCardProps {
  title: string
  value: string | number
  description: string
  trend: {
    direction: 'up' | 'down'
    percentage: string
    label: string
  }
  footer: {
    summary: string
    details: string
  }
}

const MetricCard: FC<{ data: MetricCardProps }> = ({ data }) => {
  const TrendIcon =
    data.trend.direction === 'up' ? IconTrendingUp : IconTrendingDown

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{data.description}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {data.value}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">
            <TrendIcon />
            {data.trend.percentage}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {data.trend.label} <TrendIcon className="size-4" />
        </div>
        <div className="text-muted-foreground">{data.footer.details}</div>
      </CardFooter>
    </Card>
  )
}

export default MetricCard
