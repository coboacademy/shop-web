'use strict';
const config = {"requestId":"7b1fc92b0e764ff5958468411fa92c43","cliEntryPath":"D:\\GIT\\github\\users\\coboacademy\\shop-web\\.tsupgrader\\runtime-validation\\node_modules\\@playwright\\cli\\playwright-cli.js","recorderNodePath":null,"electronNodePreloadPath":"D:\\GIT\\github\\users\\coboacademy\\shop-web\\.tsupgrader\\runtime-validation\\recording-requests\\artifacts\\7b1fc92b0e764ff5958468411fa92c43\\electron-node-preload.cjs","workingDirectory":"D:\\GIT\\github\\users\\coboacademy\\shop-web\\.tsupgrader\\runtime-validation","packageDirectory":"D:\\GIT\\github\\users\\coboacademy\\shop-web","sessionName":"jsts-homepage-shop-now-7b1fc92b","devServerUrl":"http://localhost:3001","capturePath":"D:\\GIT\\github\\users\\coboacademy\\shop-web\\.tsupgrader\\runtime-validation\\recording-requests\\artifacts\\7b1fc92b0e764ff5958468411fa92c43\\capture.json","lockPath":"D:\\GIT\\github\\users\\coboacademy\\shop-web\\.tsupgrader\\runtime-validation\\recording-requests\\artifacts\\7b1fc92b0e764ff5958468411fa92c43\\capture.lock","browserChannel":"msedge","playwrightBrowsersPath":null,"headed":true,"promotionCommand":"c:\\Users\\Lenovo\\.vscode\\extensions\\vscjava.migrate-java-to-azure-1.25.26102601-win32-x64\\node_modules\\@microsoft\\jsts-upgrade-assistant-win32-x64\\bin\\Updates.exe","promotionArguments":[]};
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

function sanitizedEnvironment(overrides = {}) {
  const env = { ...process.env, ...overrides };
  delete env.SYSTEM_ACCESSTOKEN;
  return env;
}

// Playwright requires Node 20+, but this driver is launched with whatever `node`
// the agent's shell resolves -- which, in some environments, is an older Node
// (16/18) that Playwright refuses to run under. When the host supplied a modern
// Node (config.recorderNodePath) and the current Node is too old, relaunch this
// exact script under that Node so Playwright runs on a supported runtime. The
// guard against execPath equality prevents an infinite relaunch loop, and
// ELECTRON_RUN_AS_NODE lets an Electron-based host binary run as Node (it is
// ignored by a standalone Node).
const currentNodeMajor = parseInt(process.versions.node.split('.')[0], 10);
if (
  config.recorderNodePath &&
  config.recorderNodePath !== process.execPath &&
  (Number.isNaN(currentNodeMajor) || currentNodeMajor < 20)
) {
  const relaunch = spawnSync(
    config.recorderNodePath,
    [__filename, ...process.argv.slice(2)],
    {
      stdio: 'inherit',
      env: sanitizedEnvironment({ ELECTRON_RUN_AS_NODE: '1' }),
    },
  );
  if (relaunch.error) {
    process.stderr.write(
      `Recorder error: could not relaunch under ${config.recorderNodePath}: ${relaunch.error.message}\n`,
    );
    process.exit(1);
  }
  process.exit(relaunch.status === null ? 1 : relaunch.status);
}

const interactionCommands = new Set([
  'click',
  'dblclick',
  'fill',
  'hover',
  'press',
  'select',
  'check',
  'uncheck',
]);
const inspectionCommands = new Set([
  'snapshot',
  'locator',
  'read-text',
  'read-value',
]);
const assertionCommands = new Set([
  'assert-text',
  'assert-value',
  'assert-count',
  'assert-checked',
  'assert-visible',
]);
const refPattern = /^(?:f\d+)?e\d+$/;

const legalCommands = [
  'open',
  'cancel',
  ...inspectionCommands,
  ...interactionCommands,
  ...assertionCommands,
];

function printUsage() {
  process.stdout.write(
    JSON.stringify({
      status: 'usage',
      requestId: config.requestId,
      commands: legalCommands,
      groups: {
        lifecycle: ['open', 'cancel'],
        interaction: [...interactionCommands],
        assertion: [...assertionCommands],
        inspection: [...inspectionCommands],
      },
    }) + '\n',
  );
}

function fail(message, exitCode = 2) {
  process.stderr.write(`Recorder error: ${message}\n`);
  process.exit(exitCode);
}

function runCli(args) {
  const env = sanitizedEnvironment({
    PLAYWRIGHT_HTML_OPEN: 'never',
  });
  if (process.versions.electron) {
    const preloadOption = `--require=${JSON.stringify(config.electronNodePreloadPath)}`;
    env.NODE_OPTIONS = env.NODE_OPTIONS
      ? `${env.NODE_OPTIONS} ${preloadOption}`
      : preloadOption;
  }
  if (config.playwrightBrowsersPath)
    env.PLAYWRIGHT_BROWSERS_PATH = config.playwrightBrowsersPath;
  else
    delete env.PLAYWRIGHT_BROWSERS_PATH;

  const result = spawnSync(
    process.execPath,
    [config.cliEntryPath, `-s=${config.sessionName}`, ...args],
    {
      cwd: config.workingDirectory,
      env,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  if (result.error)
    fail(result.error.message);
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function emit(result) {
  if (result.stdout)
    process.stdout.write(result.stdout);
  if (result.stderr)
    process.stderr.write(result.stderr);
}

function runRequired(args) {
  const result = runCli(args);
  if (result.exitCode !== 0) {
    emit(result);
    process.exit(result.exitCode);
  }
  return result.stdout;
}

function readCapture() {
  const capture = JSON.parse(fs.readFileSync(config.capturePath, 'utf8'));
  if (
    capture.version !== 1 ||
    capture.requestId !== config.requestId ||
    !Array.isArray(capture.actions) ||
    !(capture.assertion === null || typeof capture.assertion === 'string') ||
    !Number.isInteger(capture.replayFailures) ||
    capture.replayFailures < 0 ||
    capture.replayFailures > 2
  ) {
    fail('capture state failed its integrity checks');
  }
  return capture;
}

function updateCapture(update) {
  let lock;
  try {
    lock = fs.openSync(config.lockPath, 'wx');
  } catch {
    fail('another recorder command is still updating this request');
  }

  const releaseLock = () => {
    if (lock === undefined)
      return;
    fs.closeSync(lock);
    lock = undefined;
    fs.rmSync(config.lockPath, { force: true });
  };
  process.once('exit', releaseLock);
  try {
    const capture = readCapture();
    update(capture);
    fs.writeFileSync(config.capturePath, JSON.stringify(capture), 'utf8');
  } finally {
    process.removeListener('exit', releaseLock);
    releaseLock();
  }
}

function extractGeneratedCode(output) {
  const match = output.match(
    /(?:^|\r?\n)### Ran Playwright code\s*\r?\n```(?:js|typescript)?\r?\n([\s\S]*?)\r?\n```/,
  );
  if (!match)
    fail('Playwright did not emit TypeScript for this interaction');
  const code = match[1].trim();
  if (!code || code.length > 16384)
    fail('Playwright emitted an invalid interaction');
  return code;
}

function appendAction(code, requireNavigation) {
  const keyboardPress = code.match(
    /^(?:\/\/ Press [^\r\n]+\r?\n)?(await page\.keyboard\.press\([^;\r\n]*\);)$/,
  );
  if (!requireNavigation && keyboardPress)
    code = keyboardPress[1];

  updateCapture(capture => {
    if (capture.assertion !== null)
      fail('the final assertion was already recorded');
    if (requireNavigation && capture.actions.length !== 0)
      fail('the prepared browser may be opened only once');
    if (!requireNavigation && capture.actions.length === 0)
      fail('open the prepared browser before interacting with it');
    if (capture.actions.length >= 50)
      fail('the recording exceeds the 50-action limit');
    if (requireNavigation) {
      if (!code.startsWith('await page.goto('))
        fail('Playwright did not emit the prepared navigation');
    } else if (
      !keyboardPress &&
      !/^await page(?:\.[A-Za-z_$][\w$]*\([^;\r\n]*\))+\.(?:click|dblclick|fill|hover|press|selectOption|check|uncheck)\([^;\r\n]*\);$/.test(code)
    ) {
      fail('Playwright emitted an unsupported interaction');
    }
    capture.actions.push(code);
  });
}

function requireRef(value) {
  if (!refPattern.test(value ?? ''))
    fail('an element reference from the latest snapshot is required');
  return value;
}

function rawValue(args) {
  return runRequired([...args, '--raw']).trim();
}

function decodedRawValue(args, expectedType) {
  const raw = rawValue(args);
  if (expectedType === 'string' && !raw.startsWith('"'))
    return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function generatedLocator(ref) {
  const locator = rawValue(['generate-locator', requireRef(ref)]);
  if (
    !locator ||
    locator.length > 8192 ||
    /[\r\n;]/.test(locator) ||
    !/^(?:page\.)?(?:getByRole|getByText|getByLabel|getByPlaceholder|getByAltText|getByTitle|getByTestId|frameLocator|locator)\(/.test(locator)
  )
    fail('Playwright emitted an invalid locator');
  return locator.startsWith('page.') ? locator : `page.${locator}`;
}

function observedValue(kind, locator) {
  switch (kind) {
    case 'assert-text': {
      const text = decodedRawValue([
        'run-code',
        `async page => await ${locator}.textContent()`,
      ], 'string');
      if (text !== null && typeof text !== 'string')
        fail('Playwright did not return locator text');
      return (text ?? '').replace(/\s+/g, ' ').trim();
    }
    case 'assert-value': {
      const value = decodedRawValue([
        'run-code',
        `async page => await ${locator}.inputValue()`,
      ], 'string');
      if (typeof value !== 'string')
        fail('Playwright did not return a locator value');
      return value;
    }
    case 'assert-count': {
      const count = decodedRawValue([
        'run-code',
        `async page => await ${locator}.count()`,
      ]);
      if (!Number.isSafeInteger(count) || count < 0)
        fail('Playwright did not return a locator count');
      return count;
    }
    case 'assert-checked': {
      const checked = decodedRawValue([
        'run-code',
        `async page => await ${locator}.isChecked()`,
      ]);
      if (typeof checked !== 'boolean')
        fail('Playwright did not return a checked state');
      return checked;
    }
    case 'assert-visible': {
      const visible = decodedRawValue([
        'run-code',
        `async page => await ${locator}.isVisible()`,
      ]);
      if (typeof visible !== 'boolean')
        fail('Playwright did not return a visibility state');
      return visible;
    }
    default:
      fail('unsupported assertion command');
  }
}

function assertionCode(kind, locator, value) {
  switch (kind) {
    case 'assert-text':
      if (!value)
        fail('the selected element has no stable text');
      return `await expect(${locator}).toHaveText(${JSON.stringify(value)});`;
    case 'assert-value':
      return `await expect(${locator}).toHaveValue(${JSON.stringify(value)});`;
    case 'assert-count':
      return `await expect(${locator}).toHaveCount(${value});`;
    case 'assert-checked':
      return `await expect(${locator}).${value ? 'toBeChecked' : 'not.toBeChecked'}();`;
    case 'assert-visible':
      if (!value)
        fail('the selected element is not visible');
      return `await expect(${locator}).toBeVisible();`;
    default:
      fail('unsupported assertion command');
  }
}

function recordAssertion(kind, ref) {
  requireRef(ref);
  const locator = generatedLocator(ref);
  const value = observedValue(kind, locator);
  const assertion = assertionCode(kind, locator, value);
  updateCapture(capture => {
    if (capture.actions.length < 2)
      fail('record at least one meaningful interaction before the assertion');
    if (capture.assertion !== null)
      fail('only one final assertion may be recorded');
    capture.assertion = assertion;
  });
  promoteRecording(false);
}

function promoteRecording(discard) {
  const result = spawnSync(
    config.promotionCommand,
    [
      ...config.promotionArguments,
      '--directory',
      config.packageDirectory,
      discard ? '--discard-browser-recording' : '--promote-browser-recording',
      config.requestId,
    ],
    {
      cwd: config.workingDirectory,
      env: sanitizedEnvironment(),
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  if (result.error)
    fail(result.error.message);
  emit({
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  });
  process.exit(result.status ?? 1);
}

const args = process.argv.slice(2);
const command = args[0];
if (!command || command === 'help' || command === '--help' || command === '-h') {
  printUsage();
  process.exit(0);
}

if (command === 'cancel') {
  if (args.length !== 1)
    fail('cancel does not accept arguments');
  promoteRecording(true);
}

if (command === 'open') {
  if (args.length !== 1)
    fail('open does not accept a URL or browser override');
  const openArgs = ['open'];
  if (config.browserChannel)
    openArgs.push(`--browser=${config.browserChannel}`);
  else if (config.playwrightBrowsersPath)
    openArgs.push('--browser=chromium');
  if (config.headed)
    openArgs.push('--headed');
  openArgs.push(config.devServerUrl);
  const result = runCli(openArgs);
  if (result.exitCode === 0)
    appendAction(extractGeneratedCode(result.stdout), true);
  emit(result);
  process.exit(result.exitCode);
}

if (assertionCommands.has(command)) {
  if (args.length !== 2)
    fail(`${command} requires exactly one element reference`);
  recordAssertion(command, args[1]);
  process.exit(0);
}

if (command === 'locator') {
  if (args.length !== 2)
    fail('locator requires exactly one element reference');
  process.stdout.write(`${generatedLocator(args[1])}\n`);
  process.exit(0);
}

if (command === 'read-text' || command === 'read-value') {
  if (args.length !== 2)
    fail(`${command} requires exactly one element reference`);
  const locator = generatedLocator(args[1]);
  const value = observedValue(
    command === 'read-text' ? 'assert-text' : 'assert-value',
    locator,
  );
  process.stdout.write(`${value}\n`);
  process.exit(0);
}

if (command === 'snapshot') {
  if (args.length > 2)
    fail('snapshot accepts at most one element reference');
  if (args.length === 2)
    requireRef(args[1]);
  const result = runCli(args);
  emit(result);
  process.exit(result.exitCode);
}

if (interactionCommands.has(command)) {
  if (args.length < 2)
    fail(`${command} is missing its required arguments`);
  if (command !== 'press')
    requireRef(args[1]);
  const result = runCli(args);
  if (result.exitCode === 0)
    appendAction(extractGeneratedCode(result.stdout), false);
  emit(result);
  process.exit(result.exitCode);
}

if (inspectionCommands.has(command))
  fail(`invalid ${command} arguments`);

fail(
  `unsupported recorder command '${command}'. Allowed commands: ${legalCommands.join(', ')}. Run without arguments for usage.`,
);
