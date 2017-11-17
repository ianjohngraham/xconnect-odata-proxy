# xconnect-odata-proxy
A simple node.js proxy to access xConnect's oData API in Sitecore 9

The oData API in xConnect requires client certificate authentication. 
This becomes an issue if you want external systems that dont support client cert authentication to use the tool. 
The proxy handles the authentication for you by loading in data from .key and .pem files.

## Creating your key and certs

* Download OpenSSL - https://www.openssl.org/source/
* Find you client certificate in IIS under Server Certificates and export it to a .pfx file.
* Run the following commands in Open SSL:

    openssl pkcs12 -in YourClientCert.pfx -nocerts -out key.pem -nodes
    openssl pkcs12 -in YourClientCert.pfx -nokeys -out cert.pem
    openssl rsa -in key.pem -out server.key

* Find the certificate used for the TLS communication on your xConnect site (not the client certificate).
   Export it to a .pfx file.

* Run the following command in OpenSSL on the .pfx file:
  
  openssl pkcs12 -in YourSiteCert.pfx -nokeys -out sitecert.pem

  This certificate is required to allow Node.js to use TLS.
  If you dont supply this you'll get the error: "Unable to verify first certificate"

# Configuring

Change the variables at the top of the script accordingly:

```
var xConnectHost = 'xp0.xconnect'; - the host name of your xConnect instance
var proxyHost = 'localhost'; - the host anem of your proxy server
var proxyPort = '5060'; - the port you want it to run on
var keyFile = 'server.key'; - The key file you created
var clientCertFile = 'cert.pem'; - The client cert
var siteCertFile = 'sitecert.pem'; - The site's certificate

```


# Running the proxy

* Clone this repo to your local machine .
* Open a Node.js command prompt and cd to the repo directory
* Install the modules
```
  node npm-install 
```
* Run the script

``` 
    node xconect-odata-proxy 
```
* Test your oData API: http://yourhost:port/oData/

# Troubleshooting

* If you get the error "unable to verify first certificate" then theres something wrong with your site certifcate.
* Make sure your certificates are in the Trusted Root Authorities store on the local computer.
* If all else fails you may have this issue with IIS not trusting your certificates. 
  https://stackoverflow.com/questions/27232340/iis-8-5-mutual-certificates-authentication-fails-with-error-403-16
  In which case you may need to add a ClientAuthTrustMode registry setting.











