const moment = require('moment'),
      chalk = require('chalk'),
      blessed = require('blessed'),
      contrib = require('blessed-contrib');
      // screen = blessed.screen();

module.exports = function (params, opts) {
  if (!params.until) {
    return console.log('Invalid opts.');
  }

  let { sampleStart, sampleEnd } = params;
  let [ sampleStartT, sampleStartSec ] = sampleStart.split('@');
  let [ sampleEndT, sampleEndSec ] = sampleEnd.split('@');

  sampleStartT = moment(sampleStartT, 'M/D/YY');
  sampleEndT = moment(sampleEndT, 'M/D/YY');
  let sampleDelta = sampleEndSec - sampleStartSec,
      sampleDays = sampleEndT.diff(sampleStartT, 'days');

  let perDayDelta = sampleDelta / sampleDays;
  let projectedDaysLeft = (params.until - sampleEndSec) / perDayDelta;
  let projectedDaysLeftAdjusted = projectedDaysLeft - moment().diff(sampleEndT, 'days');

  if (!opts.chart) {
    console.log(`--------------------------------------
Sample loaded:
Time between sample data is: ${sampleDays}d
${sampleStartSec}% => ${sampleEndSec}% --- Δ ${sampleDelta}%
--------------------------------------

Projecting time left, using sample end date as time left start...
`);

    console.log(chalk.bgWhite(chalk.black(`Time until ${params.until}% is: ${Math.round(projectedDaysLeft)}d (${sampleEndT.add(projectedDaysLeftAdjusted, 'days').format('M/D/YY')})`)));
  }

  let totalDays = projectedDaysLeft + sampleDays;
  let points = params.points && parseFloat(params.points) || 10;
  let dataPointPadding = totalDays / points;
  let data = { x: [], y: [] };

  for (let i = 0; i < points + 1; i++) {
    const overDays = dataPointPadding * i;
    data.x.push(sampleStartT.clone().add(overDays, 'days').format('M/D/YY'));
    data.y.push(parseFloat(sampleStartSec) + overDays * perDayDelta);
  }

  if (opts.chart) {
    const screen = blessed.screen();
    const line = contrib.line({
      style: {
        line: 'white',
        text: 'white',
        baseline: 'black'
      },
      xLabelPadding: 3,
      xPadding: 5,
      label: 'Projected Disk Utilization Chart'
    });

    screen.append(line);
    line.setData([data]);

    screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
    screen.render();
  }

  if (opts.outputCsv) {
    let value = [
      [ 'Date', 'Utilization' ],
      ...data.y.map((y, i) => [ data.x[i], y ])
    ];

    return {
      value,
      type: 'csv',
      writeTo: opts.outputCsv
    };
  }
};
