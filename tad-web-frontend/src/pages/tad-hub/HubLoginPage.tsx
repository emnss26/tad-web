import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Building2, ShieldCheck, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Importar variables de entorno
const backendUrl = import.meta.env.VITE_API_BACKEND_BASE_URL || "http://localhost:8080";
const clientId = import.meta.env.VITE_CLIENT_ID;

export default function HubLoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  // Lógica de Login (Three-Legged Auth)
  const handleAutodeskLogin = () => {
    setIsLoading(true);

    // 1. Configuración de OAuth
    const options = {
      client_id: clientId,
      redirect_uri: `${backendUrl}/api/auth/three-legged`, 
      scope: "data:read data:write data:create account:read bucket:read", // Scopes necesarios
      response_type: "code",
    };

    // 2. Construir URL de Autodesk
    const url = `https://developer.api.autodesk.com/authentication/v2/authorize?response_type=${options.response_type}&client_id=${options.client_id}&redirect_uri=${encodeURIComponent(options.redirect_uri)}&scope=${encodeURIComponent(options.scope)}`;

    // 3. Redirigir al usuario
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground animate-in fade-in duration-500">
      
      {/* Botón Volver */}
      <div className="p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/solutions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Solutions
          </Link>
        </Button>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 text-primary rounded-3xl mb-6 shadow-sm">
              <Building2 className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-bold mb-4">TAD HUB | APS Viewer</h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Connect your Autodesk account to visualize models, manage issues, and automate workflows directly in your browser.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <FeatureItem 
              icon={<ShieldCheck className="w-5 h-5 text-green-500" />}
              title="Secure Access"
              desc="We use official Autodesk OAuth. Your credentials remain safe."
            />
            <FeatureItem 
              icon={<Zap className="w-5 h-5 text-amber-500" />}
              title="Real-Time Data"
              desc="Access live data from your ACC and BIM 360 projects."
            />
          </div>

          <Card className="p-8 shadow-xl border-primary/20 bg-card">
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Ready to get started?</h3>
                <p className="text-sm text-muted-foreground">
                  You will be redirected to Autodesk to authorize access.
                </p>
              </div>

              <Button 
                size="lg" 
                className="w-full h-14 text-lg font-medium shadow-lg hover:shadow-primary/25 transition-all"
                onClick={handleAutodeskLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    Connecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <img src="/autodesk-logo-white.svg" alt="" className="w-5 h-5" onError={(e) => e.currentTarget.style.display = 'none'} /> 
                    Sign in with Autodesk
                  </span>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground mt-4">
                By connecting, you agree to TAD HUB's Terms of Service and Privacy Policy.
              </p>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}

// Componente auxiliar para características
function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl border border-border bg-background/50">
      <div className="mt-1">{icon}</div>
      <div>
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      </div>
    </div>
  )
}