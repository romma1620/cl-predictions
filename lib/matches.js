export const roundOf16 = [
  { id: 'r16-1', home: 'Paris', away: 'Chelsea', side: 'left' },
  { id: 'r16-2', home: 'Galatasaray', away: 'Liverpool', side: 'left' },
  { id: 'r16-3', home: 'Real Madrid', away: 'Man City', side: 'left' },
  { id: 'r16-4', home: 'Atalanta', away: 'Bayern Munich', side: 'left' },
  { id: 'r16-5', home: 'Newcastle', away: 'Barcelona', side: 'right' },
  { id: 'r16-6', home: 'Atleti', away: 'Tottenham', side: 'right' },
  { id: 'r16-7', home: 'Bodø/Glimt', away: 'Sporting CP', side: 'right' },
  { id: 'r16-8', home: 'Leverkusen', away: 'Arsenal', side: 'right' }
];

export const quarterFinals = [
  { id: 'qf-1', from: ['r16-1', 'r16-2'], side: 'left' },
  { id: 'qf-2', from: ['r16-3', 'r16-4'], side: 'left' },
  { id: 'qf-3', from: ['r16-5', 'r16-6'], side: 'right' },
  { id: 'qf-4', from: ['r16-7', 'r16-8'], side: 'right' }
];

export const semiFinals = [
  { id: 'sf-1', from: ['qf-1', 'qf-2'] },
  { id: 'sf-2', from: ['qf-3', 'qf-4'] }
];

export const finalMatch = [{ id: 'final-1', from: ['sf-1', 'sf-2'] }];

export const knockoutRounds = [
  { key: 'r16', title: 'Round of 16', matches: roundOf16 },
  { key: 'qf', title: 'Quarter-finals', matches: quarterFinals },
  { key: 'sf', title: 'Semi-finals', matches: semiFinals },
  { key: 'final', title: 'Final Winner', matches: finalMatch }
];

export const knockoutMatchIds = knockoutRounds.flatMap((round) =>
  round.matches.map((match) => match.id)
);

export const teamLogos = {
  Tottenham: '/tottenham.png',
  'Sporting CP': '/sporting.png',
  'Real Madrid': '/real-madrid.png',
  Paris: '/paris.png',
  Newcastle: '/newcastle.png',
  'Man City': '/man-city.png',
  Liverpool: '/liverpool.png',
  Leverkusen: '/leverkusen.png',
  Galatasaray: '/galatasaray.png',
  Chelsea: '/chelsea.png',
  'Bodø/Glimt': '/bodo.png',
  'Bayern Munich': '/bayern.png',
  Barcelona: '/barcelona.png',
  Atleti: '/atleti.png',
  Atalanta: '/atalanta.png',
  Arsenal: '/arsenal.png'
};

export const avatars = Object.keys(teamLogos);
