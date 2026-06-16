import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ThemeToggle from "@/components/ThemeToggle";
import Calculator from "@/pages/Calculator";
import Quiz from "@/pages/Quiz";
import NotFound from "@/pages/not-found";
import { Triangle, HelpCircle } from "lucide-react";

const queryClient = new QueryClient();

function NavTabs() {
  const [location] = useLocation();
  const tabs = [
    { href: "/", label: "Calculadora", icon: Triangle },
    { href: "/quiz", label: "Ejercicios", icon: HelpCircle },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex items-center gap-1">
        <Link
          href="/"
          className="flex items-center gap-2 pr-4 mr-1 py-3 font-bold tracking-tight text-foreground"
          data-testid="brand"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground">
            <Triangle className="w-4 h-4" fill="currentColor" />
          </span>
          <span className="hidden sm:inline">TriAngular</span>
        </Link>
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              ].join(" ")}
              data-testid={`tab-${label.toLowerCase()}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <NavTabs />
      <Switch>
        <Route path="/" component={Calculator} />
        <Route path="/quiz" component={Quiz} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
