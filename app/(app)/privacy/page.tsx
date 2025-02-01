import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'

export default function PrivacyPolicyPage() {
  const lastUpdated = new Date('2025-02-01')
  const contactEmail = 'privacy@thunderforms.com'
  // Currently commented out. consider including a valid address for full transparency, as required by some privacy laws like GDPR.
  // const companyAddress = '123 Tech Street, San Francisco, CA 94105'

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            Privacy Policy
          </CardTitle>
          <p className="text-xl text-muted-foreground">
            Last Updated: {format(lastUpdated, 'PPP')}
          </p>
        </CardHeader>
        <Separator className="my-6" />
        <div className="px-6 lg:px-8">
          <CardContent>
            <section className="mb-8">
              <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
                Introduction
              </h2>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                Thunder Forms (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
                &ldquo;us&rdquo;) values your privacy and is committed to
                protecting your personal information. This Privacy Policy
                explains our practices regarding the collection, use, and
                disclosure of your information through our services. By using
                Thunder Forms, you consent to the practices described in this
                policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
                1. Information Collection
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">
                    1.1 Personal Information
                  </h3>
                  <p className="leading-7 [&:not(:first-child)]:mt-6">
                    We collect information that you provide directly to us,
                    including:
                  </p>
                  <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                    <li>
                      Name and contact information (email address, phone number)
                    </li>
                    <li>Account credentials and profile information</li>
                    <li>Payment and billing information</li>
                    <li>Communication preferences and settings</li>
                    <li>Form submissions and responses</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">
                    1.2 Automatically Collected Information
                  </h3>
                  <p className="leading-7 [&:not(:first-child)]:mt-6">
                    When you use our services, we automatically collect:
                  </p>
                  <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                    <li>
                      Device information (IP address, browser type, operating
                      system)
                    </li>
                    <li>Usage data and analytics</li>
                    <li>Location information</li>
                    <li>Log data and performance metrics</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
                2. Use of Information
              </h2>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                We use collected information for the following purposes:
              </p>
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>Providing and maintaining our services</li>
                <li>Processing transactions and payments</li>
                <li>Improving user experience and service functionality</li>
                <li>Sending important notices and updates</li>
                <li>Detecting and preventing fraud or abuse</li>
                <li>Complying with legal obligations</li>
                <li>Analytics and service optimization</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
                3. Data Protection
              </h2>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                We implement appropriate technical and organizational measures
                to protect your personal information, including:
              </p>
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>End-to-end encryption for sensitive data</li>
                <li>Regular security assessments and audits</li>
                <li>Access controls and authentication measures</li>
                <li>Data backup and disaster recovery procedures</li>
                <li>Employee training on data protection</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
                4. Your Rights and Choices
              </h2>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                You have the following rights regarding your personal
                information:
              </p>
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>Access and review your personal information</li>
                <li>Request corrections or updates</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your information</li>
                <li>Export your data in a portable format</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
                5. International Data Transfers
              </h2>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                We may transfer your information to servers and service
                providers located outside your country. We ensure appropriate
                safeguards are in place to protect your information and comply
                with applicable data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
                6. Contact Information
              </h2>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                For questions or concerns about this Privacy Policy or our data
                practices, please contact us at:
              </p>
              <blockquote className="mt-6 border-l-2 pl-6 italic">
                <p>Email: {contactEmail}</p>
                {/* <p>Address: {companyAddress}</p> */}
              </blockquote>
            </section>

            <footer className="mt-12 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center leading-7">
                This Privacy Policy was last updated on{' '}
                {format(lastUpdated, 'PPP')}.
                <br />
                We reserve the right to modify this policy at any time. Changes
                will be effective immediately upon posting.
              </p>
            </footer>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}
