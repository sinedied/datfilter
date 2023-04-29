const fs = require("fs");
const { XMLParser, XMLBuilder, XMLValidator } = require("fast-xml-parser");
const minimist = require("minimist");

const help = `Usage: datf <dat> [options]
Options:
  -u, --unique         Keep only parent roms
  -t, --txt <file>     Gamelist.txt file for filtering
  -o, --out <file>     Output file
`;
const xmlOptions = {
  ignoreAttributes: false,
  attributeNamePrefix : "@_",
  allowBooleanAttributes: true
};

function run(args) {
  const options = minimist(args, {
    string: ["txt", "out"],
    boolean: ["unique"],
    alias: {
      u: "unique",
      o: "out",
      t: "txt",
    },
  });

  if (options.help) {
    return console.log(help);
  }

  if (!options._[0]) {
    console.log("No DAT file specified");
    return console.log(help);
  }

  if (!options.out) {
    console.log("No output file specified");
    return console.log(help);
  }

  if (!options.txt) {
    console.log("No gamelist.txt file specified");
    return console.log(help);
  }

  const datFile = options._[0];
  filterDat(datFile, options.txt, options.out, options.unique);
  console.log(`Wrote ${options.out}`);
}

function filterDat(datFile, txtFile, outFile, unique = false) {
  const dat = loadXmlFile(datFile);
  const txt = loadTxtFile(txtFile, unique);
  const filteredDat = applyFilter(dat, txt);
  writeXmlFile(filteredDat, outFile);
}

function applyFilter(dat, txt) {
  const titles = new Set(txt);
  console.log(`${dat.datafile.game.length} games in dat file`);
  console.log(`${titles.size} games in txt file`);
  const games = dat.datafile.game.filter((game) => {
    return titles.has(game['@_name']);
  });
  dat.datafile.game = games;
  return dat;
}

function loadTxtFile(file, unique = false) {
  const txt = fs.readFileSync(file, "utf8");
  const lines = txt.split("\n");
  const roms = lines
    .map((line) => line.trim())
    .filter((line) => line && line.startsWith("|"))
    .map((line) => {
      const parts = line.split("|")
        .filter((part) => part)
        .map((part) => part.trim());
      return unique && parts[3] ? undefined : parts[0];
    })
    .filter((rom) => rom);

  return roms;
}

function loadXmlFile(file) {
  const xml = fs.readFileSync(file, "utf8");
  const parser = new XMLParser(xmlOptions);
  return parser.parse(xml);
}

function writeXmlFile(data, file) {
  const builder = new XMLBuilder(xmlOptions);
  const xmlContent = builder.build(data);
  fs.writeFileSync(file, xmlContent);
}

module.exports = run;
