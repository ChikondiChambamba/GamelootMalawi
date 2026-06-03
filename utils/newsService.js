const newsItems = [
  {
    id: 'ea-fc26-worlds-game',
    title: 'EA SPORTS FC 26 rolls out The World\'s Game update',
    category: 'EA SPORTS FC',
    date: '2026-06-03',
    readTime: '4 min read',
    icon: 'fas fa-futbol',
    source: 'EA SPORTS FC Pitch Notes',
    sourceUrl: 'https://www.ea.com/games/ea-sports-fc/fc-26/news/pitch-notes-fc26-the-worlds-game-update',
    summary: 'EA is bringing a new 48-team international tournament mode, 53 playable national teams, Festival of Football Ultimate Team content, and gameplay balance changes into FC 26.',
    tags: ['FC 26', 'World Cup', 'Ultimate Team']
  },
  {
    id: 'fifa-digital-football-strategy',
    title: 'FIFA expands its digital football and gaming strategy',
    category: 'FIFA Gaming',
    date: '2026-05-28',
    readTime: '3 min read',
    icon: 'fas fa-globe',
    source: 'FIFA.GG',
    sourceUrl: 'https://www.fifa.gg/news/fifa-unveils-updated-digital-football-strategy',
    summary: 'FIFA is widening its football gaming ecosystem through partnerships across Roblox, Epic Games, Konami, Sports Interactive, Gamefam, Mythical Games, and more ahead of the 2026 World Cup.',
    tags: ['FIFA', 'World Cup', 'Esports']
  },
  {
    id: 'summer-game-fest-2026',
    title: 'Summer Game Fest 2026 is set for major game reveals',
    category: 'Video Games',
    date: '2026-06-05',
    readTime: '2 min read',
    icon: 'fas fa-gamepad',
    source: 'Summer Game Fest',
    sourceUrl: 'https://www.summergamefest.com/',
    summary: 'The flagship showcase streams live from Los Angeles on June 5 with updates and announcements for upcoming video games across platforms.',
    tags: ['Gaming News', 'PlayStation', 'Xbox']
  },
  {
    id: 'uefa-echampions-league-2026',
    title: 'UEFA eChampions League brings elite FC Pro competition',
    category: 'UEFA Esports',
    date: '2026-05-27',
    readTime: '3 min read',
    icon: 'fas fa-trophy',
    source: 'UEFA',
    sourceUrl: 'https://www.uefa.com/uefachampionsleague/news/02a3-203690d64ada-e9d220969469-1000--echampions-league-2026-all-you-need-to-know/',
    summary: 'UEFA\'s 2026 eChampions League features top EA SPORTS FC players, qualification through FC Pro leagues including the ePremier League, and finals in Budapest.',
    tags: ['UEFA', 'ePremier League', 'FC Pro']
  },
  {
    id: 'football-games-world-cup-season',
    title: 'Football games enter a World Cup content season',
    category: 'Football Gaming',
    date: '2026-06-03',
    readTime: '3 min read',
    icon: 'fas fa-bolt',
    source: 'GameLootMalawi Roundup',
    sourceUrl: '/news',
    summary: 'World Cup momentum is shaping football game modes, esports schedules, Ultimate Team events, and digital fan experiences across console, PC, and mobile.',
    tags: ['EPL', 'UEFA', 'World Cup']
  }
];

function sortByNewest(items) {
  return [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getLatestNews(limit) {
  const sorted = sortByNewest(newsItems);
  return Number.isInteger(limit) ? sorted.slice(0, limit) : sorted;
}

function getNewsTopics() {
  return ['Video Games', 'EA SPORTS FC', 'FIFA', 'EPL', 'UEFA', 'World Cup', 'Esports'];
}

module.exports = {
  getLatestNews,
  getNewsTopics
};
