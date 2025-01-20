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
            customizable forms effortlessly. Whether it’s for surveys,
            registrations, or ticket purchases, we’ve got you covered.
          </p>
        </div>

        <div className="w-full">
          <OurAchievements />
        </div>
      </div>

      {/* <div className="container mt-16">
        <h2 className="mb-6 text-2xl font-semibold md:text-3xl">Why Choose Thunder Forms?</h2>
        <ul className="space-y-4 text-lg text-muted-foreground">
          <li>
            <strong>Drag-and-Drop Builder:</strong> Create forms seamlessly with our intuitive drag-and-drop interface.
          </li>
          <li>
            <strong>Advanced Features:</strong> Payment integration, prefill links, form expiration, and submission limits.
          </li>
          <li>
            <strong>Customizable Templates:</strong> Get started quickly with pre-made templates designed for all your needs.
          </li>
          <li>
            <strong>Secure Data Management:</strong> Your form data is safely stored in Firebase Firestore.
          </li>
          <li>
            <strong>Real-Time Preview:</strong> See your form come to life instantly as you build.
          </li>
        </ul>
      </div> */}
    </section>
  )
}
