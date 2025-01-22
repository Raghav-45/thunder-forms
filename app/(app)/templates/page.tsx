import { TrendingUpIcon } from 'lucide-react'
import { Announcement } from '@/components/Announcement'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Icons } from '@/components/Icons'

const posts = [
  {
    id: 'template-1',
    title: 'Feedback Form Template',
    summary:
      'This template is designed to help you easily collect user feedback. Whether you’re gathering survey responses or customer reviews, this form can be fully customized with your own questions.',
    label: 'Customizable Questions',
    author: 'Thunder Forms Team',
    href: '#template-1',
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDXLuGqSfz6wXt0CQAYY6acmUhNB-66IVyLg&s',
    isNew: true,
  },
  {
    id: 'template-2',
    title: 'Event Registration Form',
    summary:
      'Organize events more effectively with this multi-step registration form. It allows users to select events, submit personal information, and add special requests, making it the perfect.',
    label: 'Multi-step Form',
    author: 'Thunder Forms Team',
    href: '#template-2',
    image: 'https://www.shadcnblocks.com/images/block/placeholder-dark-1.svg',
    isNew: false,
  },
  {
    id: 'template-3',
    title: 'Contact Us Form',
    summary:
      'Simplify communication with this user-friendly contact form template. Whether you’re providing customer support or just collecting inquiries, this form makes it easy for visitors to get in touch.',
    label: 'Easy to Use',
    author: 'Thunder Forms Team',
    href: '#template-3',
    image: 'https://www.shadcnblocks.com/images/block/placeholder-dark-1.svg',
    isNew: false,
  },
]

export default function TemplatesPage() {
  return (
    <section className="py-32">
      <div className="container">
        <div className="mb-14">
          <Announcement
            text="✨ New Feedback Template"
            href="#template-1"
            withoutIcon
          />

          <h1 className="flex mb-3 mt-1 text-balance text-3xl font-semibold md:text-4xl">
            Choose a Template{' '}
            <Icons.ThunderFormsLogo className="h-auto w-10 mx-3" />
          </h1>
          <p className="text-lg text-muted-foreground">
            Select a template and start creating your form instantly.
          </p>
        </div>
        <div className="w-full">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                id={post.id}
                href={post.href}
                className="flex flex-col text-clip rounded-xl border border-border transition-all overflow-hidden"
              >
                <div className="relative">
                  <Image
                    src={post.image}
                    alt={post.title}
                    className="aspect-video size-full object-cover object-center"
                    height={90}
                    width={160}
                  />
                  <div className="absolute top-0 right-0 px-2 py-1 z-100 flex justify-between text-xs">
                    {post.isNew && (
                      <Badge
                        variant={'destructive'}
                        className="text-white rounded-full bg-red-500 hover:bg-red-500/70"
                      >
                        <TrendingUpIcon className="size-4 mr-1" /> New
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="px-3 py-8 md:px-8 md:py-8 lg:px-6 lg:py-4">
                  <h3 className="mb-2 text-lg font-semibold md:mb-3 md:text-xl lg:mb-4">
                    {post.title}
                  </h3>
                  <p className="mb-4 text-muted-foreground">{post.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
