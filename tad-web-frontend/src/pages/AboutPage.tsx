import { Link } from "react-router-dom"
import { ArrowRight, Users, Target, Lightbulb, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden w-full animate-in fade-in duration-500">
      {/*  Hero Section */}
      <section className="relative px-6 lg:px-8 py-24 md:py-32 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-1 gap-12 items-center">
          

          <div className="text-left">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
              About <span className="text-primary">Us</span>
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed">
              TAD HUB is a digital platform for architects and engineers, where you can find the best platform web complement 
              for autodesk construction cloud and  AI tools to improve your skills and boost your career and projects.
            </p>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Our mission is to provide high-quality content and resources to help professionals in the AEC industry to
              grow and succeed in their projects and careers.
            </p>

            <Button size="lg" className="shadow-lg" asChild>
              <Link to="/solutions">
                Explore Our Solutions <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-8">
          <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-l-primary">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
            <p className="text-muted-foreground leading-relaxed">
              To empower architects, engineers, and construction professionals with cutting-edge digital tools that
              streamline workflows, enhance collaboration, and drive innovation in the AEC industry.
            </p>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-all border-l-4 border-l-secondary">
            <div className="w-12 h-12 bg-secondary text-secondary-foreground rounded-lg flex items-center justify-center mb-4">
              <Lightbulb className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
            <p className="text-muted-foreground leading-relaxed">
              To become the leading digital hub for AEC professionals worldwide, setting the standard for BIM and VDC
              integration, education, and technological advancement in construction.
            </p>
          </Card>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The principles that guide everything we do at TAD HUB
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          <ValueCard
            icon={<Lightbulb className="h-5 w-5" />}
            title="Innovation"
            description="Constantly pushing boundaries to deliver cutting-edge solutions."
          />
          <ValueCard
            icon={<Users className="h-5 w-5" />}
            title="Collaboration"
            description="Building bridges between teams, disciplines, and technologies."
          />
          <ValueCard
            icon={<Award className="h-5 w-5" />}
            title="Excellence"
            description="Committed to delivering the highest quality in everything we do."
          />
          <ValueCard
            icon={<Target className="h-5 w-5" />}
            title="Impact"
            description="Focused on creating real value for our users and the industry."
          />
        </div>
      </section>

      {/* Team Stats */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard number="15+" label="Team Members" />
          <StatCard number="8+" label="Years Experience" />
          <StatCard number="20+" label="Countries Served" />
          <StatCard number="500+" label="Projects Supported" />
        </div>
      </section>
    </div>
  )
}

// Sub-components
function ValueCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center p-4">
      <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4 mx-auto">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{number}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}