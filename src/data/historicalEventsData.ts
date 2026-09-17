export interface HistoricalEvent {
  id: string;
  title: string;
  period: string;
  focus: string;
  setup: string;
  hindi: string;
  timeline: Array<{ label: string; detail: string }>;
  choices: Array<{ label: string; outcome: string; lesson: string; tone: 'GOOD' | 'CAUTION' | 'NEUTRAL' }>;
  takeaway: string;
}

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    id: 'covid-crash', title: 'COVID crash and recovery', period: '2020', focus: 'Panic, liquidity and recovery',
    setup: 'A global health shock closes economies, earnings visibility disappears, and broad indices fall sharply before policy support and reopening expectations change sentiment.',
    hindi: 'बाज़ार में घबराहट थी, लेकिन हर गिरावट स्थायी नुकसान नहीं होती। Cash, समय सीमा और diversification ने निर्णयों को अधिक सुरक्षित बनाया।',
    timeline: [{ label: 'Shock', detail: 'Uncertainty and forced selling rise together.' }, { label: 'Response', detail: 'Liquidity and policy support reduce immediate stress.' }, { label: 'Recovery', detail: 'Markets begin pricing the future before daily life feels normal.' }],
    choices: [
      { label: 'Sell everything immediately', outcome: 'You remove future downside, but may lock in losses and miss a fast recovery.', lesson: 'Panic decisions need a written rule and emergency-cash check.', tone: 'CAUTION' },
      { label: 'Rebalance gradually', outcome: 'You spread timing risk and keep allocations close to your plan.', lesson: 'A staged plan can be easier to follow than predicting the bottom.', tone: 'GOOD' },
      { label: 'Buy one “winner” aggressively', outcome: 'A correct theme can still create dangerous single-stock concentration.', lesson: 'A good story is not a substitute for position sizing.', tone: 'NEUTRAL' },
    ], takeaway: 'Survival, liquidity and diversification matter more than calling the exact bottom.',
  },
  {
    id: 'tech-rally', title: '2020–21 technology rally', period: '2020–21', focus: 'Narratives and valuation',
    setup: 'Digital adoption accelerates and technology earnings look resilient. Prices rise quickly, and investors start paying more for each rupee of earnings.',
    hindi: 'व्यवसाय अच्छा हो सकता है, लेकिन कीमत बहुत अधिक हो तो भविष्य के returns कमज़ोर हो सकते हैं।',
    timeline: [{ label: 'Adoption', detail: 'Remote work increases demand for digital services.' }, { label: 'Re-rating', detail: 'Valuation multiples expand alongside earnings.' }, { label: 'Reality check', detail: 'Higher rates later make distant profits less valuable.' }],
    choices: [
      { label: 'Buy after every rally', outcome: 'Momentum helps until valuation and expectations become fragile.', lesson: 'Track both business growth and the price paid.', tone: 'CAUTION' },
      { label: 'Cap sector allocation', outcome: 'You participate while limiting the damage from a reversal.', lesson: 'Allocation rules protect you from your strongest excitement.', tone: 'GOOD' },
    ], takeaway: 'Great companies can still be poor purchases when expectations are too high.',
  },
  {
    id: 'rates-banks', title: 'Interest-rate increases and banks', period: 'Rate cycle', focus: 'Margins, credit and deposits',
    setup: 'Policy rates rise. Banks may earn more on loans, but deposits become costlier and borrowers can face repayment stress.',
    hindi: 'Rate hike बैंकों के लिए केवल अच्छा या बुरा नहीं होता—loan yield, deposit cost और खराब ऋण, तीनों को देखना पड़ता है।',
    timeline: [{ label: 'Early hikes', detail: 'Loan yields may reset faster than deposit costs.' }, { label: 'Competition', detail: 'Banks raise deposit rates to retain funding.' }, { label: 'Late cycle', detail: 'Credit growth and asset quality become the focus.' }],
    choices: [{ label: 'Compare NIM and bad loans', outcome: 'You evaluate both earning power and credit risk.', lesson: 'One headline rate cannot explain every bank.', tone: 'GOOD' }, { label: 'Buy all banks equally', outcome: 'Funding quality and loan books differ widely.', lesson: 'Sector exposure does not remove company-specific risk.', tone: 'CAUTION' }],
    takeaway: 'Rate sensitivity depends on funding mix, loan repricing and asset quality.',
  },
  {
    id: 'inflation-fmcg', title: 'Inflation and consumer stocks', period: 'Inflation cycle', focus: 'Pricing power and margins',
    setup: 'Raw materials, packaging and transport become more expensive. Consumer companies decide how much cost to absorb and how much to pass to customers.',
    hindi: 'कंपनी कीमत बढ़ा सकती है, लेकिन ग्राहक कम खरीदें तो volume घट सकता है। Pricing power की वास्तविक परीक्षा यही है।',
    timeline: [{ label: 'Input shock', detail: 'Costs rise before selling prices change.' }, { label: 'Price action', detail: 'Brands take price increases or reduce pack size.' }, { label: 'Demand test', detail: 'Volumes reveal whether customers accepted the change.' }],
    choices: [{ label: 'Check volume plus margin', outcome: 'You distinguish genuine pricing power from temporary price hikes.', lesson: 'Revenue growth alone can hide weaker unit demand.', tone: 'GOOD' }, { label: 'Use only headline inflation', outcome: 'Company-specific inputs and rural demand may behave differently.', lesson: 'Connect macro data to the company’s actual cost basket.', tone: 'CAUTION' }],
    takeaway: 'Pricing power means protecting margins without permanently damaging demand.',
  },
  {
    id: 'sector-rotation', title: 'Sector rotation: IT, banks, energy and autos', period: 'Changing cycle', focus: 'Correlation and diversification',
    setup: 'Economic growth, rates, currency and commodity prices change. Leadership moves between sectors instead of the whole market moving together.',
    hindi: 'सभी sectors एक साथ एक दिशा में नहीं चलते। अलग आर्थिक कारण पोर्टफोलियो के उतार-चढ़ाव को कम कर सकते हैं।',
    timeline: [{ label: 'Growth improves', detail: 'Banks and autos can benefit from credit and demand.' }, { label: 'Currency changes', detail: 'Export-heavy IT may react differently from domestic sectors.' }, { label: 'Oil moves', detail: 'Energy producers and fuel-consuming businesses face opposite effects.' }],
    choices: [{ label: 'Diversify by economic driver', outcome: 'Your holdings are less dependent on one macro outcome.', lesson: 'Different names are not true diversification if they share the same driver.', tone: 'GOOD' }, { label: 'Chase last month’s winner', outcome: 'You may arrive after expectations are already priced in.', lesson: 'Rotation is easier to explain afterwards than predict beforehand.', tone: 'CAUTION' }],
    takeaway: 'Diversification works best when holdings respond differently to the same shock.',
  },
];
