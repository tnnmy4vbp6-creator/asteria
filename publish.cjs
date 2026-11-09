const { execFileSync } = require('node:child_process'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path');
const root = __dirname,
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'asteria-pages-'));
function git(args, cwd = root) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}
try {
  for (const file of [
    'test-core.cjs',
    'test-campaign.cjs',
    'test-mill.cjs',
    'test-shapes.cjs',
    'test-living-core.cjs',
    'build.cjs',
  ])
    execFileSync(process.execPath, [file], { cwd: root, stdio: 'inherit' });
  const remote = git(['remote', 'get-url', 'origin']);
  git(['clone', '--depth', '1', '--branch', 'gh-pages', remote, dir]);
  git(['rm', '-qr', '--ignore-unmatch', '--', '.'], dir);
  fs.cpSync(path.join(root, 'dist'), dir, {
    recursive: true,
    filter: (source) => path.basename(source) !== '.git',
  });
  git(['add', '--all'], dir);
  if (git(['status', '--porcelain'], dir)) {
    git(
      [
        '-c',
        'user.name=Astéria Release',
        '-c',
        'user.email=asteria@users.noreply.local',
        'commit',
        '-m',
        'Publish Astéria ' + require('./package.json').version,
      ],
      dir,
    );
    git(['push', 'origin', 'gh-pages'], dir);
  }
  console.log('Distribution à jour sur la branche gh-pages.');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
