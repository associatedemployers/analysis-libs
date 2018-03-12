const cli = require('commander'),
      chalk = require('chalk'),
      fs = require('fs');

let parseOutput = {
  csv (val) {
    return val.map(v => v.join(',')).join('\n');
  }
};

cli.version(require('./package.json').version);

cli
  .command('analysis <project> <module>')
  .option('-p, --parameters [q]', 'Module parameters')
  .option('-o, --outputCsv [writeTo]', 'Write to CSV output')
  .option('-c, --chart', 'Output Chart')
  .action((project, mod, cmd) => {
    console.log(chalk.dim(`Running ${project} ${mod}`));

    let module;
    const resolveFrom = `./${project}/${mod}`;

    try {
      module = require(resolveFrom);
    } catch (e) {
      return console.error(chalk.red(new Error(`Failed to load module: "${resolveFrom}"`)));
    }

    const params = (cmd.parameters || '').split('&').reduce((_opts, segment) => {
      let s = segment.split('=').map(decodeURIComponent);
      _opts[s[0]] = s[1];
      return _opts;
    }, {});

    let output = module(params, cmd);

    if (output) {
      fs.writeFileSync(output.writeTo, parseOutput[output.type](output.value));
    }
  });

cli.parse(process.argv);
