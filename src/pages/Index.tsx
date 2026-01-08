import { Plane, Phone, Mail, MapPin } from "lucide-react";
import ChatWidget from "@/components/ChatWidget";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Plane className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">Tata Airways</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Book</a>
            <a href="#" className="hover:text-foreground transition-colors">Manage</a>
            <a href="#" className="hover:text-foreground transition-colors">Experience</a>
            <a href="#" className="hover:text-foreground transition-colors">Help</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent/30 py-24 md:py-32">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="container relative z-10">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
                Fly Beyond Expectations
              </h1>
              <p className="mt-4 text-lg text-primary-foreground/80 max-w-lg">
                Experience world-class service and seamless travel with Tata Airways. 
                Our support team is here 24/7 to assist you.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button className="rounded-full bg-primary-foreground px-6 py-3 font-medium text-primary hover:bg-primary-foreground/90 transition-colors">
                  Book a Flight
                </button>
                <button className="rounded-full border border-primary-foreground/30 px-6 py-3 font-medium text-primary-foreground hover:bg-primary-foreground/10 transition-colors">
                  Check Flight Status
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-card">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <Plane className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">150+ Destinations</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Connect to major cities around the world
                </p>
              </div>
              <div className="text-center p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">24/7 Support</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Our team is always here to help you
                </p>
              </div>
              <div className="text-center p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Easy Booking</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Seamless booking experience online
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-background">
          <div className="container text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Need Assistance?
            </h2>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              Click the chat icon in the bottom right corner to connect with our support team instantly.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Tata Airways</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span>1-800-Tata</span>
              </div>
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>support@tata.com</span>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center text-xs text-muted-foreground">
            © 2026 Tata Airways. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default Index;
