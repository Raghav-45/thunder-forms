'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Icons } from '@/components/Icons'

interface CheckmarkProps {
  size?: number
  strokeWidth?: number
  color?: string
  className?: string
}

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        delay: i * 0.2,
        type: 'spring',
        duration: 1.5,
        bounce: 0.2,
        ease: 'easeInOut',
      },
      opacity: { delay: i * 0.2, duration: 0.2 },
    },
  }),
}

function Checkmark({
  size = 100,
  strokeWidth = 2,
  color = 'currentColor',
  className = '',
}: CheckmarkProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      initial="hidden"
      animate="visible"
      className={className}
    >
      <title>Animated Checkmark</title>
      <motion.circle
        cx="50"
        cy="50"
        r="40"
        stroke={color}
        variants={draw}
        custom={0}
        style={{
          strokeWidth,
          strokeLinecap: 'round',
          fill: 'transparent',
        }}
      />
      <motion.path
        d="M30 50L45 65L70 35"
        stroke={color}
        variants={draw}
        custom={1}
        style={{
          strokeWidth,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'transparent',
        }}
      />
    </motion.svg>
  )
}

export default function FormSubmissionPage() {
  return (
    <div className="flex flex-col min-h-svh bg-neutral-950">
      <div className="flex flex-col flex-1 p-6 md:p-10">
        <div className="flex items-center justify-center text-2xl font-medium text-white mb-8">
          <Icons.ThunderFormsLogo className="h-8 w-8 mr-2" />
          Thunder Forms
        </div>

        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-sm mx-auto p-6 min-h-[400px] flex flex-col justify-center bg-neutral-900 border-neutral-800 backdrop-blur-sm">
            <CardContent className="space-y-4 flex flex-col items-center justify-center">
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1],
                  scale: {
                    type: 'spring',
                    damping: 15,
                    stiffness: 200,
                  },
                }}
              >
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 blur-xl bg-emerald-500/10 rounded-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.2,
                      duration: 0.8,
                      ease: 'easeOut',
                    }}
                  />
                  <Checkmark
                    size={80}
                    strokeWidth={4}
                    color="rgb(16 185 129)"
                    className="relative z-10"
                  />
                </div>
              </motion.div>
              <motion.div
                className="space-y-4 text-center w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.2,
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <motion.h2
                  className="text-lg text-neutral-100 tracking-tighter font-semibold uppercase"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.4 }}
                >
                  Form Submitted
                </motion.h2>
                <motion.div
                  className="flex-1 bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50 backdrop-blur-md"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 1.2,
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm text-neutral-100">
                      Thank you for your submission! We've received your
                      request.
                    </p>
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
                    <p className="text-xs text-neutral-400">
                      You will receive a confirmation email shortly.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6, duration: 0.4 }}
                  className="pt-2"
                >
                  <Button
                    asChild
                    variant="outline"
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border-neutral-700 hover:border-neutral-600 transition-all"
                  >
                    <Link href="/">
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.8, duration: 0.4 }}
                        className="flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <title>Home</title>
                          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        Return to Homepage
                      </motion.span>
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
