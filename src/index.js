const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const uuid = require("uuid").v4;
const tmpDir = process.env.TEMP_DIR || require("os").tmpdir();
const phantomjs2 = require("phantomjs-prebuilt");
const converter = require("phantom-html-to-pdf")({
  phantomPath: phantomjs2.path,
  pathToPhantomScript: __dirname + '/page.js',
  tmpDir: tmpDir
});
const logger = require("./logger.js");

const env = process.env.ENV;
if (!env) {
  logger.error('Environment variable ENV is required');
  process.exit(1);
}

if (process.env.UDP_LOGGER_ENABLED == 'true') {
  let clientSocket = require('dgram').createSocket('udp4');
  let udpHost = process.env.UDP_LOGGER_HOST;
  let udpPort = parseInt(process.env.UDP_LOGGER_PORT);

  logger.onMessage(x => {
    let message = Buffer.from(`${x.message} #app:html-to-pdf-api #env:${env} #loglevel:${x.level}`);
    clientSocket.send(message, udpPort, udpHost);
  });
}

const app = express();
app.use(bodyParser.json());

app.use((req, res, next) => {
  logger.info(`Request: ${req.method} ${req.originalUrl}`);
  next();
  logger.info(`Response: ${req.method} ${req.originalUrl} ${res.statusCode}`);
});

app.get('/ping', (req,res) => { res.status(200).send(); })

app.post('/', (req, res) => {
  let converterArgs = req.body;

  if (!converterArgs) { res.status(400).send('POST body is required'); return; }
  if (!converterArgs.html) { res.status(400).send('POST body requires the html property'); return; }
  if (converterArgs.allowLocalFilesAccess) { res.status(400).send('allowLocalFilesAccess is not allowed'); return; }
  
  convertAndRespond(converterArgs, res);
});

app.get('/test', (req, res) => {
  let converterArgs = createTestArguments();

  convertAndRespond(converterArgs, res);
});

app.get('/test.html', (req,res) => {
  let html = createTestArguments().html;

  res.set('Content-Type', 'text/html');
  res.send(html);
});

app.get('/test.json', (req,res) => {
  let converterArgs = createTestArguments();
  
  res.set('Content-Type', 'application/json');
  res.send(converterArgs);
});

function createTestArguments() {
  return {
    html: fs.readFileSync(__dirname + '/test.html').toString(),
    paperSize: {
      height: '1in',
      width: '2in',
      margin: '0in'
    }
  };
}

function convertAndRespond(converterArgs, res) {
  converterArgs.tmpId = converterArgs.tmpId || uuid();
  converterArgs.applyPDFZoomFix = converterArgs.applyPDFZoomFix || true;
  converter(converterArgs, (err, pdf) => {
    if (!err) {
      res.setHeader("content-type", "application/pdf");
      let stream = pdf.stream.pipe(res);
      stream.on('finish', () => {
        let htmlTempFile = path.join(tmpDir, converterArgs.tmpId + 'html.html');
        let pdfTempFile = path.join(tmpDir, converterArgs.tmpId + '.pdf');
        
        fs.unlinkSync(htmlTempFile);
        fs.unlinkSync(pdfTempFile);
      });
    }
    else {
      logger.error(err);
      res.status(500).send(err);
    }
  });
}

process.on('SIGTERM', function () {
  logger.info('SIGTERM caught. Exiting.');
  process.exit(0);
});

let port = 3000;
app.listen(port);
logger.info('Listening on port ' + port);