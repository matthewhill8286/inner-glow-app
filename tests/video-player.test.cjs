const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function player() {
  const states = [];
  let cursor = 0;
  let refCursor = 0;
  const refs = [];
  const commands = [];
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    useState: (initial) => {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [
        states[index],
        (next) => {
          states[index] = typeof next === 'function' ? next(states[index]) : next;
        },
      ];
    },
    useRef: (initial) => {
      const index = refCursor++;
      if (!refs[index])
        refs[index] = {
          current:
            index === 0
              ? {
                  playVideo: () => commands.push('play'),
                  pauseVideo: () => commands.push('pause'),
                }
              : initial,
        };
      return refs[index];
    },
    useEffect: () => {},
    useCallback: (fn) => fn,
  };
  const mocks = {
    react,
    'react-native': {
      View: 'View',
      Text: 'Text',
      Pressable: 'Pressable',
      Image: 'Image',
      ActivityIndicator: 'ActivityIndicator',
      useWindowDimensions: () => ({ width: 390 }),
    },
    'react-native-svg': { default: 'Svg' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0 }) },
    'expo-router': { router: {} },
    'react-i18next': { useTranslation: () => ({ t: (key) => key }) },
    'react-native-youtube-iframe': 'YoutubePlayer',
    '@/constants/theme': { palette: {} },
    '@/constants/typography': { Type: {} },
    '@/components/practices/PracticeParts': {
      usePracticeText: () => () => ({ title: 'Practice', tag: 'Body', level: 'All' }),
      EndEarlySheet: 'EndEarlySheet',
      CompleteModal: 'CompleteModal',
    },
    '@/hooks/useMindfulness': { useMindfulness: () => ({ addSession: async () => {} }) },
    '@/hooks/usePractices': { useDailyGoal: () => ({ today: 0, goal: 10 }) },
    '@/lib/practices': { mmss: () => '01:00' },
    '@/components/practices/VideoDetails': { thumbnailUrl: () => 'thumbnail' },
    '@/components/icons/Icon': { Icon: 'Icon' },
    '@/components/ui/IconButton': { IconButton: 'IconButton' },
  };
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('components/practices/VideoPlayer.tsx', 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    }).outputText,
    {
      module,
      exports: module.exports,
      require: (name) => mocks[name] || {},
    },
  );
  const render = () => {
    cursor = 0;
    refCursor = 0;
    const root = module.exports.VideoPlayer({
      practice: {
        id: 'test',
        category: 'relax-body',
        video: { seconds: 60, youtubeId: 'test' },
      },
    });
    const nodes = [];
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      nodes.push(node);
      node.children?.flat(Infinity).forEach(walk);
    };
    walk(root);
    return {
      video: nodes.find((n) => n.type === 'YoutubePlayer'),
      button: nodes.find((n) => n.type === 'Pressable'),
      icon: nodes.find((n) => n.type === 'Icon'),
      leave: nodes.find((n) => n.type === 'IconButton'),
      endSheet: nodes.find((n) => n.type === 'EndEarlySheet'),
      complete: nodes.find((n) => n.type === 'CompleteModal'),
    };
  };
  render.commands = commands;
  return render;
}

test('one tap pauses playing video and one tap resumes with a visible control', () => {
  const render = player();
  let screen = render();
  assert.equal(screen.button.props.disabled, true);
  screen.video.props.onReady();
  screen = render();
  assert.equal(screen.button.props.pointerEvents, 'none');
  screen.video.props.onChangeState('playing');
  screen = render();
  assert.equal(screen.button.props.pointerEvents, 'auto');
  assert.equal(screen.icon.props.name, 'line/pause');
  screen.button.props.onPress();
  screen = render();
  assert.equal(screen.video.props.play, false);
  assert.equal(screen.icon.props.name, 'line/play');
  screen.video.props.onChangeState('paused');
  screen = render();
  screen.button.props.onPress();
  screen = render();
  assert.equal(screen.video.props.play, true);
  assert.equal(screen.icon.props.name, 'line/pause');
});

test('leaving pauses the video and keeping the session resumes it', () => {
  const render = player();
  let screen = render();
  screen.video.props.onReady();
  screen.video.props.onChangeState('playing');
  screen = render();
  screen.leave.props.onPress();
  screen = render();
  assert.equal(screen.video.props.play, false);
  assert.equal(screen.endSheet.props.visible, true);
  screen.endSheet.props.onKeep();
  screen = render();
  assert.equal(screen.video.props.play, true);
  assert.equal(screen.endSheet.props.visible, false);
});

test('a player error disables playback and removes the failed iframe', () => {
  const render = player();
  let screen = render();
  screen.video.props.onReady();
  screen.video.props.onError();
  screen = render();
  assert.equal(screen.video, undefined);
  assert.equal(screen.button.props.disabled, true);
});

test('the end of a video stops playback and opens completion', () => {
  const render = player();
  let screen = render();
  screen.video.props.onReady();
  screen.video.props.onChangeState('playing');
  screen = render();
  screen.video.props.onChangeState('ended');
  screen = render();
  assert.equal(screen.video.props.play, false);
  assert.equal(screen.complete.props.visible, true);
});

test('a delayed playing event cannot undo the user pause request', () => {
  const render = player();
  let screen = render();
  screen.video.props.onReady();
  screen.video.props.onChangeState('playing');
  screen = render();
  screen.button.props.onPress();
  screen = render();
  screen.video.props.onChangeState('playing');
  screen = render();
  assert.equal(screen.video.props.play, false);
  assert.equal(screen.icon.props.name, 'line/play');
});

test('user taps send direct native iframe commands in addition to updating props', () => {
  const render = player();
  let screen = render();
  screen.video.props.onReady();
  screen.video.props.onChangeState('playing');
  screen = render();
  screen.button.props.onPress();
  assert.equal(render.commands.at(-1), 'pause');
  screen = render();
  screen.button.props.onPress();
  assert.equal(render.commands.at(-1), 'play');
});
