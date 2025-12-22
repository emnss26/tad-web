import { useNavigate } from "react-router-dom"
import { Building, Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function SelectPlatformPage() {
  const navigate = useNavigate()

  const goToBim360 = () => navigate("/bim360projects")
  const goToAcc = () => navigate("/accprojects")

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in duration-500">
      
      <div className="text-center mb-12 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Select Your Platform
        </h1>
        <p className="text-xl text-muted-foreground">
          Choose where your projects are hosted to access the dashboard.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
        
        {/* BIM 360 Option */}
        <PlatformCard 
          title="BIM 360" 
          description="Classic generation management for construction projects."
          icon={<Building className="h-12 w-12 text-blue-500" />}
          onClick={goToBim360}
          colorClass="hover:border-blue-500/50 hover:bg-blue-500/5"
        />

        {/* ACC Option */}
        <PlatformCard 
          title="Autodesk Construction Cloud" 
          description="Next-generation unified platform (Build, Docs, Design)."
          icon={<Cloud className="h-12 w-12 text-blue-600" />}
          onClick={goToAcc}
          colorClass="hover:border-blue-600/50 hover:bg-blue-600/5"
        />

      </div>
    </div>
  )
}

// Componente de Tarjeta
interface PlatformCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    colorClass?: string;
}

function PlatformCard({ title, description, icon, onClick, colorClass }: PlatformCardProps) {
    return (
        <Card 
            onClick={onClick}
            className={`
                relative p-8 cursor-pointer transition-all duration-300 group
                border-2 border-border flex flex-col items-center text-center
                hover:shadow-xl hover:-translate-y-1
                ${colorClass}
            `}
        >
            <div className="mb-6 p-4 rounded-full bg-background border border-border shadow-sm group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            
            <h2 className="text-2xl font-bold mb-3">{title}</h2>
            <p className="text-muted-foreground mb-8">{description}</p>
            
            <Button className="mt-auto w-full md:w-auto min-w-[140px]">
                Access
            </Button>
        </Card>
    )
}