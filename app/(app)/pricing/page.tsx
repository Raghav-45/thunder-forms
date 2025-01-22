'use client'

import { ArrowRight, CircleCheck } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Icons } from '@/components/Icons'

const plans = [
  {
    id: 'basic',
    name: 'Powerful',
    description: 'Ideal for individuals and small projects',
    monthlyPrice: 499,
    annualPrice: 4990,
    features: [
      { text: 'Create up to 10 forms', included: true },
      { text: '500 submissions per month', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Standard templates', included: true },
      { text: 'Custom branding', included: false },
      { text: 'Integration with APIs', included: false },
      { text: 'Advanced analytics', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Alpha',
    description: 'Best for businesses and professionals',
    monthlyPrice: 999,
    annualPrice: 9990,
    features: [
      { text: 'Create unlimited forms', included: true },
      { text: '10,000 submissions per month', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Custom branding', included: true },
      { text: 'Integration with APIs', included: true },
      { text: 'Zapier integration', included: true },
      { text: 'Custom domains', included: false },
      { text: '24/7 priority support', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Sigma',
    description: 'All-in-one for enterprises',
    monthlyPrice: 1999,
    annualPrice: 19990,
    features: [
      { text: 'All Pro features', included: true },
      { text: 'Unlimited submissions', included: true },
      { text: 'Custom domains', included: true },
      { text: 'Team collaboration tools', included: true },
      { text: 'Enhanced data security', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Priority feature requests', included: true },
      { text: '24/7 premium support', included: true },
    ],
  },
]

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false)
  return (
    <section className="py-32">
      <div className="container">
        <div className="flex flex-col items-center text-center">
          <h3 className="flex mb-3 max-w-3xl text-2xl font-semibold md:mb-4 md:text-4xl lg:mb-6 items-center">
            Choose Your
            <Icons.ThunderFormsLogo className="h-auto w-10 mx-3" />
            Thunder Forms
          </h3>
          <p className="mb-8 max-w-3xl text-muted-foreground lg:text-lg">
            Scalable plans designed to grow with your needs.
          </p>
        </div>
        <div className="w-full">
          <div className="flex justify-center flex-col items-stretch gap-6 md:flex-row mb-12">
            <div className="flex items-center gap-3 text-lg">
              Monthly
              {/* <Switch
            onCheckedChange={() => setIsYearly(!isYearly)}
            checked={isYearly}
            className="bg-red-500"
          /> */}
              <Switch
                onCheckedChange={() => setIsYearly(!isYearly)}
                checked={isYearly}
                className="bg-gradient-to-br from-[#ffd700] to-[#ffa500] data-[state=checked]:bg-gradient-to-br 
             data-[state=checked]:from-[#ffa500] data-[state=checked]:to-[#ff8c00] border-2 
             border-[#d4af37] rounded-full relative"
              >
                <div
                  className="absolute left-0 top-0 h-5 w-5 rounded-full bg-black translate-x-0
               transition-transform duration-200 data-[state=checked]:translate-x-6"
                />
              </Switch>
              Annual
              <Badge
                variant="outline"
                className="rounded-full bg-gradient-to-br from-[#ffd700] to-[#ffa500] text-black font-semibold mt-0.5"
              >
                Save 20%
              </Badge>
            </div>
          </div>
          <div className="flex justify-center flex-col items-stretch gap-6 md:flex-row">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  'flex w-80 flex-col justify-between text-left',
                  plan.id === 'pro' &&
                    'bg-gradient-to-bl from-[#33333360] via-[#44444440] to-[#111111] relative border-yellow-200/30 border'
                )}
              >
                {plan.id === 'pro' && (
                  <div className="absolute justify-center -top-[1px] w-full flex">
                    <Badge
                      variant="outline"
                      className="w-auto -translate-y-1/2 rounded-full bg-gradient-to-br from-[#ffd700] to-[#ffa500] text-black font-semibold text-md mt-0.5"
                    >
                      Save 20%
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                  <span className="text-4xl font-bold">
                    ₹
                    {isYearly
                      ? Math.floor(plan.annualPrice / 12)
                      : plan.monthlyPrice}
                  </span>
                  <p className="text-muted-foreground">
                    Billed ₹
                    {isYearly
                      ? Math.floor(plan.annualPrice / 12)
                      : plan.monthlyPrice}{' '}
                    {isYearly ? 'annually' : 'monthly'}
                  </p>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-6" />
                  <ul className="space-y-4">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className={`flex items-center gap-2 ${
                          feature.included ? '' : 'text-muted-foreground'
                        }`}
                      >
                        {feature.included ? (
                          <CircleCheck className="size-4" />
                        ) : (
                          <CircleCheck className="size-4 opacity-50" />
                        )}
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto">
                  <Button className="w-full rounded-xl bg-gradient-to-br from-[#ffd700] to-[#ffa500] font-bold">
                    Get Started
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="flex justify-center flex-col items-stretch gap-6 md:flex-row mt-8 text-sm">
            🔒 30-day money-back guarantee • No questions asked
          </div>
        </div>
      </div>
    </section>
  )
}
