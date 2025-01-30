import {
  ArrowRight,
  Award,
  Building2,
  HeartHandshake,
  Leaf,
  Lightbulb,
  Trophy,
} from 'lucide-react'
import React from 'react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const data = [
  {
    icon: <Trophy />,
    // title: 'Industry Recognition',
    title: 'Hackathon Contribution',
    category: 'College Engagement',
    description:
      'Thunder Forms managed registrations at the Uncharted Hackathon by CSI INNOWAVE, with 5,000 participants.',
    link: '#',
  },
  {
    icon: <Award />,
    title: 'Excellence Award',
    category: 'Recognition',
    description: 'Best in Category Winner.',
    link: '#',
  },
  {
    icon: <Lightbulb />,
    title: 'Innovation Prize',
    category: 'Technology',
    description: 'Breakthrough Solution of the Year.',
    link: '#',
  },
  {
    icon: <HeartHandshake />,
    title: 'Customer Success',
    category: 'Service',
    description: 'Top-Rated Solution Provider.',
    link: '#',
  },
  {
    icon: <Building2 />,
    title: 'Global Leadership',
    category: 'Management',
    description: 'Executive Team of the Year.',
    link: '#',
  },
  {
    icon: <Leaf />,
    title: 'Sustainability Impact',
    category: 'Environmental',
    description: 'Green Initiative Excellence.',
    link: '#',
  },
]

export default function OurAchievements() {
  return (
    <div className="flex flex-col">
      <Separator />
      {data.map((item, index) => (
        <React.Fragment key={index}>
          <div className="grid items-center gap-4 px-4 py-5 md:grid-cols-4">
            <div className="order-2 flex items-center gap-4 md:order-none">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted">
                {item.icon}
              </span>
              <div className="flex flex-col gap-0.5 justify-center">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.category}</p>
              </div>
            </div>
            <p className="order-1 line-clamp-2 text-xl font-semibold md:order-none md:col-span-2">
              {item.description}
            </p>
            <Button variant="outline" asChild>
              <a
                className="order-3 ml-auto w-fit gap-2 md:order-none"
                href={item.link}
              >
                <span>Know more</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
          <Separator />
        </React.Fragment>
      ))}
    </div>
  )
}
