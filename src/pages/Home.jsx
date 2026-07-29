import ToolCard from '../components/ToolCard.jsx'

const TOOLS = [
  {
    to: '/team-trials',
    icon: '🏆',
    title: 'Team Trials Builder',
    description:
      'Log the stats and aptitudes of umas you’ve trained, then get help assigning them across Sprint, Mile, Medium, Long, and Dirt.',
  },
  {
    icon: '📈',
    title: 'Training Plan Helper',
    description: 'Plan out a training run stat-by-stat before you start. Not built yet.',
    comingSoon: true,
  },
  {
    to: '/support-cards',
    icon: '🃏',
    title: 'Support Card Tier List & Deck Builder',
    description:
      'Build a 6-card support deck and see a live, scored tier list of every support card for your chosen race distances, running styles, and training scenario.',
  },
]

export default function Home() {
  return (
    <div>
      <div className="page-heading">
        <span className="eyebrow">Uma Musume: Pretty Derby</span>
        <h1>Maya's Uma Tools</h1>
        <p className="subtitle">
          A small set of personal tools for keeping track of your trained umas and
          planning around them. Everything you enter is saved only in your own
          browser - nothing is sent anywhere.
        </p>
      </div>

      <div className="home-grid">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.title} {...tool} />
        ))}
      </div>
    </div>
  )
}
