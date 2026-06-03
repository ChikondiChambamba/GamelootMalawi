const newsItems = [
  {
    id: 'ea-fc26-worlds-game',
    title: 'EA SPORTS FC 26 headlines The World\'s Game news cycle',
    category: 'EA SPORTS FC',
    date: '2026-06-04',
    readTime: '4 min read',
    icon: 'fas fa-futbol',
    source: 'EA SPORTS FC News',
    sourceUrl: 'https://www.ea.com/games/ea-sports-fc/fc-26/news',
    summary: 'EA SPORTS FC 26 has fresh June updates around The World\'s Game, World Cup-season authenticity, Prime Heroes, Ultimate Team events, and football content drops.',
    tags: ['FC 26', 'EA Sports', 'Ultimate Team']
  },
  {
    id: 'playstation-state-of-play-june-2026',
    title: 'PlayStation State of Play adds fresh PS5 release dates',
    category: 'PlayStation',
    date: '2026-06-02',
    readTime: '5 min read',
    icon: 'fab fa-playstation',
    source: 'PlayStation Blog',
    sourceUrl: 'https://blog.playstation.com/2026/06/02/state-of-play-june-2026-all-announcements-trailers/',
    summary: 'Sony\'s June State of Play roundup includes PS5 dates and windows for Dune: Awakening, Tomb Raider: Legacy of Atlantis, The Lost Wild, and more upcoming titles.',
    tags: ['PS5', 'Release Dates', 'State of Play']
  },
  {
    id: 'ace-combat-8-release-date',
    title: 'Ace Combat 8 gets an October PS5 launch date',
    category: 'PS Games',
    date: '2026-06-02',
    readTime: '3 min read',
    icon: 'fas fa-plane',
    source: 'PlayStation Blog',
    sourceUrl: 'https://blog.playstation.com/2026/06/02/ace-combat-8-wings-of-theve-launches-globally-october-2-on-ps5/',
    summary: 'Ace Combat 8: Wings of Theve launches globally on PlayStation 5 on October 2, 2026, with Deluxe Edition early access starting September 28.',
    tags: ['PS5', 'Ace Combat', 'Preorder']
  },
  {
    id: 'onimusha-release-date-demo',
    title: 'Onimusha: Way of the Sword sets September PS5 date',
    category: 'PS Games',
    date: '2026-06-02',
    readTime: '3 min read',
    icon: 'fas fa-shield-halved',
    source: 'PlayStation Blog',
    sourceUrl: 'https://blog.playstation.com/2026/06/02/onimusha-way-of-the-sword-out-september-25-on-ps5-demo-out-today/',
    summary: 'Capcom announced Onimusha: Way of the Sword for PlayStation 5 on September 25, 2026, with a demo available now from the early story.',
    tags: ['PS5', 'Capcom', 'Demo']
  },
  {
    id: 'ea-sports-f1-25-season-pack',
    title: 'EA SPORTS F1 25 brings the 2026 season to the grid',
    category: 'EA SPORTS',
    date: '2026-06-03',
    readTime: '4 min read',
    icon: 'fas fa-car',
    source: 'EA SPORTS F1',
    sourceUrl: 'https://www.ea.com/en/games/f1/f1-25/news/f1-25-2026-season-pack-official-reveal',
    summary: 'EA SPORTS F1 25 adds a 2026 Season Pack and Season Edition with updated teams, drivers, cars, regulations, and new-era racing content.',
    tags: ['F1 25', 'EA Sports', 'Racing']
  },
  {
    id: 'ea-sports-ufc-6',
    title: 'EA SPORTS UFC 6 arrives June 19 on PS5 and Xbox',
    category: 'EA SPORTS',
    date: '2026-05-05',
    readTime: '3 min read',
    icon: 'fas fa-gamepad',
    source: 'Electronic Arts',
    sourceUrl: 'https://ir.ea.com/press-releases/press-release-details/2026/Fight-Your-Fight-EA-SPORTS-UFC-6-Arrives-June-19-Delivering-Next-Level-Fighter-Individuality-and-Gameplay-Depth/default.aspx',
    summary: 'EA unveiled UFC 6 with Alex Pereira and Max Holloway on the covers, launching June 19, 2026 for PlayStation 5 and Xbox Series X|S.',
    tags: ['UFC 6', 'EA Sports', 'PS5']
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
