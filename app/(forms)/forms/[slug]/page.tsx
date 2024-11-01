import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  //   return <div>My Post: {slug}</div>
  return (
    <div className="md:container space-y-6 p-10 pb-16">
      <div className="space-y-0.5 md:space-y-1">
        <h2 className="text-2xl md:text-5xl font-bold tracking-tight">
          Report an issue
        </h2>
        <p className="text-muted-foreground">
          What area are you having problems with?
        </p>
      </div>
      <div className="">
        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="area">Area</Label>
              <Select defaultValue="billing">
                <SelectTrigger id="area">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="deployments">Deployments</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="security-level">Security Level</Label>
              <Select defaultValue="2">
                <SelectTrigger id="security-level" className="truncate">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Severity 1 (Highest)</SelectItem>
                  <SelectItem value="2">Severity 2</SelectItem>
                  <SelectItem value="3">Severity 3</SelectItem>
                  <SelectItem value="4">Severity 4 (Lowest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="I need help with..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Please include all information relevant to your issue."
            />
          </div>
        </div>
        <div className="justify-between space-x-2 mt-8">
          <Button variant="ghost">Cancel</Button>
          <Button>Submit</Button>
        </div>
      </div>
    </div>
  )
}
