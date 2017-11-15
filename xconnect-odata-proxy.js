
var xConnectHost = 'xp0.xconnect';
var proxyHost = 'localhost';
var proxyPort = '5060';
var keyFile = 'C:\\Program Files\\OpenSSL\\bin\\xconnect.key';
var clientCertFile = 'C:\\Program Files\\OpenSSL\\bin\\xconnectcert.pem';
var siteCertFile = 'C:\\Program Files\\OpenSSL\\bin\\bundle\\xp0CertSiteCopy.pem';

var xConnectUrl = 'https://' + xConnectHost;
var proxyUrl = 'http://' + proxyHost + ':' + proxyPort;

var http = require('http'),
    connect = require('connect'),
    httpProxy = require('http-proxy');
var replaceStream = require('string-replace-stream');
var app = connect();
var fs = require('fs');
var proxy = httpProxy.createProxyServer({});

app.use(function (req, res) {

    proxy.on('proxyRes', function (proxyRes, request, response) {
        if (proxyRes.headers) {

            var _end = response.end,
                chunks,
                _writeHead = response.writeHead;

            response.writeHead = function () {
                if (proxyRes.headers && proxyRes.headers['content-length'] && proxyRes.headers['content-type'] != 'application/xml') {

                    response.setHeader(
                        'content-length',
                        // Amend content length with URL changes
                        parseInt(proxyRes.headers['content-length'], 10) + calculateResponseLength()
                    );
                }

                response.removeHeader('connection');

                _writeHead.apply(this, arguments);
            };

            response.write = function (data) {
                if (chunks) {
                    chunks += data;
                } else {
                    chunks = data;
                }
            };

            response.end = function () {
                if (chunks && chunks.toString) {

                    var replacedText = modifyJson(chunks.toString());

                    _end.apply(response, [replacedText]);
                } else {
                    _end.apply(response, arguments);
                }
            };
        }
    });

    function calculateResponseLength() {
      
        // xConnect URL is bigger so return diff plus 1 for slash on the end
        if (xConnectUrl.length > proxyUrl.length) {

            return (xConnectUrl.length - proxyUrl.length) +1;
        }   // proxyUrlURL is bigger so return diff plus 1 for slash on the end
        else if(proxyUrl.length > xConnectUrl.length)
	{
		return (proxyUrl.length - xConnectUrl.length) +1;
	}

        //just return slash on the end
        return 1;
    }

    function modifyJson(str) {
      
        if (str.indexOf(xConnectUrl) > -1) {

            //make Power BI use the correct URL
            str = str.replace(xConnectUrl, proxyUrl);

            // fix for metadata '/'
            str = str.replace('$metadata', '$metadata/');
        }

        return str;
    }


    proxy.web(req, res, options, function (err) {

        var mystring = require('util').inspect(err);
        console.log(mystring);

        if (!res.headersSent) {
            res.statusCode = 502;
            res.end('bad gateway');
        }
    });
});


function getCABundle(Bundle) {
    var ca = [];
    chain = fs.readFileSync(Bundle, 'utf8');
    chain = chain.split("\n");
    cert = [];
    for (line in chain) {
        if (line.length > 0) {
            cert.push(chain[line]);
            if (chain[line].match(/-END CERTIFICATE-/)) {
                ca.push(cert.join("\n"));
                cert = [];
            }
        }
    }
    return ca;
}


var proxyServer = http.createServer(app)
{
    var options = {
        target: {
            host: xConnectHost,
            port: 443,
            protocol: 'https:',
            key: fs.readFileSync(keyFile, 'utf8'),
            cert: fs.readFileSync(clientCertFile, 'utf8'),
            requestCert: true,
            ca: getCABundle(siteCertFile)
        },
        changeOrigin: true
    };

};

console.log("listening on port " + proxyPort)
proxyServer.listen(proxyPort);