const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function soundscape(mode = async () => {}) {
  const players = [];
  const mod = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('lib/soundscape.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      module: mod,
      exports: mod.exports,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      console,
      require: (name) =>
        name === 'expo-audio'
          ? {
              setAudioModeAsync: mode,
              createAudioPlayer: () => {
                const p = {
                  plays: 0,
                  released: false,
                  play() {
                    this.plays++;
                  },
                  pause() {},
                  release() {
                    this.released = true;
                  },
                };
                players.push(p);
                return p;
              },
            }
          : name,
    },
  );
  return { api: mod.exports, players };
}
test('soundscape switches from recording to audible playback mode before playing', async () => {
  let mode;
  const { api, players } = soundscape(async (value) => {
    mode = value;
  });
  await api.playSoundscape('ocean');
  assert.equal(mode.allowsRecording, false);
  assert.equal(mode.playsInSilentMode, true);
  assert.equal(players[0].plays, 1);
  assert.equal(players[0].loop, true);
  await api.stopSoundscape();
  assert.equal(players[0].released, true);
});
test('leaving while audio mode loads prevents orphan playback', async () => {
  let release;
  const { api, players } = soundscape(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const pending = api.playSoundscape('ocean');
  await Promise.resolve();
  await api.stopSoundscape();
  release();
  await pending;
  assert.equal(players.length, 0);
});
test('pause during loading is respected, then resume starts playback', async () => {
  let release;
  const { api, players } = soundscape(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const pending = api.playSoundscape('rain');
  await Promise.resolve();
  api.pauseSoundscape();
  release();
  await pending;
  assert.equal(players[0].plays, 0);
  api.resumeSoundscape();
  assert.equal(players[0].plays, 1);
});
test('silence releases an existing player without creating another', async () => {
  const { api, players } = soundscape();
  await api.playSoundscape('ocean');
  await api.playSoundscape('silence');
  assert.equal(players.length, 1);
  assert.equal(players[0].released, true);
});
test('rapid sound changes create only the newest player', async () => {
  const { api, players } = soundscape();
  await Promise.all([api.playSoundscape('ocean'), api.playSoundscape('rain')]);
  assert.equal(players.length, 1);
});
