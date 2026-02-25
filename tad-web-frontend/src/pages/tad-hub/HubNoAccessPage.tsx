import { Link } from "react-router-dom"
import { ShieldX, ArrowLeft, Mail } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function HubNoAccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-6 py-12">
      <div className="w-full max-w-2xl">
        <Card className="p-8 md:p-10 border-destructive/30 bg-card shadow-lg">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
              <ShieldX className="h-8 w-8" />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold">No Access</h1>
              <p className="text-muted-foreground">
                Your Autodesk account is authenticated, but this email is not in the approved community list for TAD HUB.
              </p>
            </div>

            <div className="text-left rounded-lg border border-border bg-muted/30 p-4 space-y-3 text-sm">
              <p>
                If you are not part of this community, please contact the admin to purchase a monthly subscription.
              </p>
              <p>
                If you are already part of this community, please contact support to review your approved email list.
              </p>
              <a
                href="mailto:taller.arq.dgtl@gmail.com"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                taller.arq.dgtl@gmail.com
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link to="/hub/login">
                  Try Another Account
                </Link>
              </Button>
              <Button asChild>
                <Link to="/solutions">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Solutions
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
