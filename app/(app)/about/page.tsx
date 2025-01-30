import OurAchievements from '@/components/our-achievements'

export default function AboutPage() {
  return (
    <section className="py-32">
      <div className="container">
        <div className="mb-14">
          {/* <h1 className="mb-3 mt-1 text-balance text-3xl font-semibold md:text-4xl">
            Thunder Forms: Revolutionizing Form Creation
          </h1> */}
          <h1 className="mb-3 mt-1 text-balance text-3xl font-semibold md:text-4xl">
            Our Achievements & Recognition
          </h1>
          <p className="text-lg text-muted-foreground">
            Thunder Forms is your one-stop solution for building powerful and
            customizable forms effortlessly. Whether it’s <br /> for surveys,
            registrations, or ticket purchases, we’ve got you covered.
          </p>
        </div>

        <div className="w-full">
          <OurAchievements />
        </div>
      </div>
    </section>
  )
}
