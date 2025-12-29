import { DashboardLayout } from "@/components/DashboardLayout";
import { ExternalLink, BookOpen, Video, FileText, Code, Headphones, PenTool } from "lucide-react";

const resources = [
  {
    title: "Khan Academy",
    description: "Free courses on math, science, and more with interactive exercises.",
    url: "https://www.khanacademy.org",
    icon: Video,
    category: "Video Courses",
    color: "bg-green-500/10 text-green-600",
  },
  {
    title: "Coursera",
    description: "University-level courses from top institutions worldwide.",
    url: "https://www.coursera.org",
    icon: BookOpen,
    category: "Online Learning",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    title: "Anki",
    description: "Powerful flashcard app using spaced repetition for effective memorization.",
    url: "https://apps.ankiweb.net",
    icon: FileText,
    category: "Study Tools",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    title: "freeCodeCamp",
    description: "Learn to code for free with hands-on projects and certifications.",
    url: "https://www.freecodecamp.org",
    icon: Code,
    category: "Programming",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    title: "Notion",
    description: "All-in-one workspace for notes, tasks, wikis, and databases.",
    url: "https://www.notion.so",
    icon: PenTool,
    category: "Productivity",
    color: "bg-rose-500/10 text-rose-600",
  },
  {
    title: "Focus@Will",
    description: "Music scientifically optimized to boost concentration.",
    url: "https://www.focusatwill.com",
    icon: Headphones,
    category: "Focus",
    color: "bg-cyan-500/10 text-cyan-600",
  },
];

const ResourcesPage = () => {
  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="section-title mb-2">Resources</h1>
          <p className="section-subtitle">Curated learning tools to complement your studies</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {resources.map((resource, index) => (
            <a
              key={index}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-5 group hover:shadow-glass-hover transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${resource.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <resource.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {resource.title}
                    </h3>
                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                    {resource.description}
                  </p>
                  <span className="text-xs text-primary font-medium">{resource.category}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResourcesPage;
