const BACKUP_APP = 'arabic-english-app';
const BACKUP_VERSION = 1;

export function downloadBackup(state) {
  const payload = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      completed: state.completed,
      xp: state.xp,
      streak: state.streak,
      lastStudy: state.lastStudy,
      profile: state.profile,
    },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `progress-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function parseBackup(text) {
  const parsed = JSON.parse(text);
  const data = parsed?.app === BACKUP_APP && parsed.version === BACKUP_VERSION ? parsed.data : null;
  if (!data || typeof data !== 'object') throw new Error('invalid backup');
  const { completed, xp, streak, lastStudy, profile } = data;
  const validCompleted =
    completed && typeof completed === 'object' && !Array.isArray(completed) && Object.values(completed).every(Number.isFinite);
  if (!validCompleted || !Number.isFinite(xp) || !Number.isFinite(streak) || typeof lastStudy !== 'string') {
    throw new Error('invalid backup');
  }
  if (!profile || typeof profile.name !== 'string') throw new Error('invalid backup');
  return {
    completed,
    xp,
    streak,
    lastStudy,
    profile: {
      name: profile.name.slice(0, 40) || 'متعلم',
      email: typeof profile.email === 'string' ? profile.email : '',
    },
  };
}
