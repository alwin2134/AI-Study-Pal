import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, BookOpen, Brain, FileText, Lightbulb, Trophy, MessageSquare } from "lucide-react";

const features = [
  { icon: BookOpen, title: "Study Plans", description: "AI-generated weekly schedules tailored to your goals" },
  { icon: Brain, title: "Practice Quizzes", description: "Test your knowledge with adaptive MCQ practice" },
  { icon: FileText, title: "Text Summarizer", description: "Condense lengthy notes into key takeaways" },
  { icon: Lightbulb, title: "Study Tips", description: "Evidence-based strategies to boost learning" },
  { icon: Trophy, title: "Feedback", description: "Personalized motivation based on performance" },
  { icon: MessageSquare, title: "Ask Notes", description: "Get answers from your uploaded materials" },
];

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="glass-navbar fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">AI Study Pal</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/auth" className="nav-link">Sign In</Link>
              <Link to="/auth?mode=signup" className="btn-primary text-sm py-2">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 text-accent-foreground text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>AI-powered study assistant</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight mb-6">
              Your intelligent, calm
              <br />
              <span className="text-primary">study companion</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
              Plan smarter, practice efficiently, and stay motivated with AI that understands how you learn.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?mode=signup" className="btn-primary inline-flex items-center gap-2 group">
                Start Learning Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/auth" className="btn-secondary inline-flex items-center gap-2">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <h2 className="section-title text-center mb-4">Everything you need to study better</h2>
          <p className="section-subtitle text-center mb-12">
            Powerful AI tools designed to help you learn more effectively
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card p-6 hover:shadow-glass-hover transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-2xl">
          <div className="glass-card p-10 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Ready to transform your study routine?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of students using AI to learn smarter, not harder.
            </p>
            <Link to="/auth?mode=signup" className="btn-primary inline-flex items-center gap-2 group">
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/30">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AI Study Pal. Made for learners everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
