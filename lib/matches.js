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
  Tottenham: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
  'Sporting CP': 'https://upload.wikimedia.org/wikipedia/en/3/32/Sporting_Clube_de_Portugal_%28Logo%29.svg',
  'Real Madrid': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  Paris: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  Newcastle: 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg',
  'Man City': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  Liverpool: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  Leverkusen: 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
  Galatasaray: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Galatasaray_Sports_Club_Logo.svg',
  Chelsea: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  'Bodø/Glimt': 'https://upload.wikimedia.org/wikipedia/en/5/57/FK_Bod%C3%B8_Glimt_logo.svg',
  'Bayern Munich': 'https://upload.wikimedia.org/wikipedia/commons/1/1f/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
  Barcelona: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  Atleti: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
  Atalanta: 'https://upload.wikimedia.org/wikipedia/en/6/66/AtalantaBC.svg',
  Arsenal: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg'
};

export const avatars = Object.keys(teamLogos);
