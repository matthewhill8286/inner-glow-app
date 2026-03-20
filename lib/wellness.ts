export function calculateWellnessScore(data: any) {
  if (!data) {
    return {
      score: 0,
      breakdown: { mood: 0, sleep: 0, stress: 0, mindfulness: 0, consistency: 0 },
    };
  }
  const moodCheckIns = data.moodCheckIns || [];
  const journalEntries = data.journalEntries || [];
  const mindfulnessHistory = data.mindfulnessHistory || [];
  const sleepEntries = data.sleepEntries || [];

  const moodScore = moodCheckIns.length > 0 ? 85 : 0;
  const sleepScore = sleepEntries.length > 0 ? 75 : 0;
  const stressScore = 40;
  const mindfulnessScore = mindfulnessHistory.length > 0 ? 90 : 0;
  const consistencyScore = (moodCheckIns.length + journalEntries.length) * 10;

  console.log('scores', {
    mood: moodScore,
    sleep: sleepScore,
    stress: stressScore,
    mindfulness: mindfulnessScore,
    consistency: consistencyScore,
  });

  const total = Math.min(
    100,
    Math.round((moodScore + sleepScore + stressScore + mindfulnessScore + consistencyScore) / 5),
  );

  return {
    score: total,
    breakdown: {
      mood: moodScore,
      sleep: sleepScore,
      stress: stressScore,
      mindfulness: mindfulnessScore,
      consistency: consistencyScore,
    },
  };
}
